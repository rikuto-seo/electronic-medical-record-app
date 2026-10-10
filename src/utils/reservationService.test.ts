import { beforeEach, describe, test, expect, jest } from "@jest/globals";
import type { Mock as JestMock } from "jest-mock";
type Mock = JestMock<any, any[]>;
import {
  doc,
  getDocFromServer,
  getDocsFromServer,
  runTransaction,
} from "firebase/firestore";
import {
  addReservation,
  updateReservation,
  decodeReservation,
  saveReservationSettings,
} from "./reservationService";
import { parseClinicDateTime } from "./reservationUtils";
jest.mock("../firebase", () => ({
  db: {},
  auth: { currentUser: { uid: "staff-user" } },
}));
jest.mock("firebase/firestore", () => {
  const { jest } = require("@jest/globals");
  return {
    collection: jest.fn(() => ({})),
    doc: jest.fn(() => ({ id: "new-id" })),
    getDoc: jest.fn(),
    getDocFromServer: jest.fn(),
    getDocs: jest.fn(),
    getDocsFromServer: jest.fn(),
    onSnapshot: jest.fn(),
    orderBy: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    runTransaction: jest.fn(),
    Timestamp: {
      now: () => ({ timestamp: "now" }),
      fromDate: (date: Date) => ({ toDate: () => date }),
    },
  };
});
const mockRevision = getDocFromServer as unknown as Mock;
const mockReservations = getDocsFromServer as unknown as Mock;
const mockRunTransaction = runTransaction as unknown as Mock;
const transaction = { get: jest.fn(), set: jest.fn(), update: jest.fn() };
const data = {
  patientId: "patient-1",
  date: parseClinicDateTime("2026-10-09T10:00"),
  duration: 30,
  type: "再診",
  memo: "",
  staffId: "staff-1",
  bedId: "bed-1",
};
const document = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  data: () => ({ ...data, date: { toDate: () => data.date }, ...extra }),
});
beforeEach(() => {
  jest.clearAllMocks();
  (doc as unknown as Mock).mockReturnValue({ id: "new-id" });
  mockRevision.mockResolvedValue({ data: () => ({ revision: 0 }) });
  mockReservations.mockResolvedValue({ docs: [] });
  (transaction.get as Mock).mockResolvedValue({
    data: () => ({ revision: 0 }),
  });
  mockRunTransaction.mockImplementation(
    async (
      _db: unknown,
      callback: (value: typeof transaction) => Promise<void>,
    ) => callback(transaction),
  );
});
describe("予約保存", () => {
  test("キャンセル後に予約へ戻してもキャンセル理由と支払いを履歴に残す", async () => {
    const payment = {
      id: "pay1",
      kind: "payment",
      amount: 3000,
      paidAt: "2026-10-09T01:00:00Z",
      method: "cash",
      note: "",
      createdAt: "now",
      createdBy: "staff",
    };
    const cancelled = {
      status: "cancelled",
      reservationDate: data.date.toISOString(),
      type: "再診",
      staffName: "",
      cancellationReason: "体調不良",
      at: "2026-10-09T02:00:00Z",
    };
    mockReservations.mockResolvedValue({
      docs: [
        document("existing", {
          status: "cancelled",
          cancellationReason: "体調不良",
          statusHistory: [cancelled],
          payments: [payment],
        }),
      ],
    });
    await updateReservation("existing", {
      status: "booked",
      cancellationReason: "",
    });
    const saved = transaction.update.mock.calls[0][1] as any;
    expect(saved.statusHistory[0]).toEqual(cancelled);
    expect(saved.statusHistory[1].status).toBe("booked");
    expect(saved.payments).toEqual([payment]);
  });
  test("他患者への付け替え・保存済み支払いの改変を拒否する", async () => {
    const payment = {
      id: "pay1",
      kind: "payment",
      amount: 3000,
      paidAt: "2026-10-09T01:00:00Z",
      method: "cash",
      note: "",
    };
    mockReservations.mockResolvedValue({
      docs: [document("existing", { payments: [payment] })],
    });
    await expect(
      updateReservation("existing", { patientId: "someone-else" }),
    ).rejects.toThrow("患者は変更");
    await expect(
      updateReservation("existing", { payments: [] }),
    ).rejects.toThrow("変更・削除");
    expect(transaction.update).not.toHaveBeenCalled();
  });
  test("新規予約の登録再送が同じIDなら予約・支払いを再作成しない", async () => {
    mockReservations.mockResolvedValue({ docs: [document("stable-id")] });
    await expect(addReservation(data, "stable-id")).resolves.toBe("stable-id");
    expect(transaction.set).not.toHaveBeenCalled();
  });
  test("同じ予約IDを別患者が使っていたら登録成功と扱わない", async () => {
    mockReservations.mockResolvedValue({
      docs: [document("stable-id", { patientId: "someone-else" })],
    });
    await expect(addReservation(data, "stable-id")).rejects.toThrow("別の患者");
    expect(transaction.set).not.toHaveBeenCalled();
  });
  test("予約とrevisionを同一トランザクションで保存する", async () => {
    await expect(addReservation(data)).resolves.toBe("new-id");
    expect(transaction.set).toHaveBeenCalledTimes(2);
    expect(transaction.set.mock.calls[0][1]).toMatchObject({
      status: "booked",
      checkedIn: false,
      updatedBy: "staff-user",
    });
  });
  test("重複する予約は書き込まない", async () => {
    mockReservations.mockResolvedValue({ docs: [document("existing")] });
    await expect(addReservation(data)).rejects.toThrow("重複");
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });
  test("同時更新を検出したら再取得して重複を再判定する", async () => {
    mockReservations
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [document("other-staff-booking")] });
    (transaction.get as Mock).mockResolvedValue({
      data: () => ({ revision: 1 }),
    });
    await expect(addReservation(data)).rejects.toThrow("重複");
    expect(mockReservations).toHaveBeenCalledTimes(2);
    expect(transaction.set).not.toHaveBeenCalled();
  });
  test("更新された予約を古い編集画面から上書きしない", async () => {
    mockReservations.mockResolvedValue({
      docs: [
        document("existing", {
          updatedAt: { toDate: () => new Date("2026-10-09T02:00:00Z") },
        }),
      ],
    });
    await expect(
      updateReservation(
        "existing",
        { duration: 45 },
        new Date("2026-10-09T01:00:00Z"),
      ),
    ).rejects.toThrow("他のスタッフ");
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });
  test("来院状態更新は旧checkedInも同期する", async () => {
    mockReservations.mockResolvedValue({ docs: [document("existing")] });
    await updateReservation("existing", { status: "completed" });
    expect(transaction.update.mock.calls[0][1]).toMatchObject({
      status: "completed",
      checkedIn: true,
    });
  });
  test("キャンセル後も予約を削除せずcheckedInを解除する", async () => {
    mockReservations.mockResolvedValue({
      docs: [document("existing", { checkedIn: true })],
    });
    await updateReservation("existing", { status: "cancelled" });
    expect(transaction.update.mock.calls[0][1]).toMatchObject({
      status: "cancelled",
      checkedIn: false,
    });
  });
  test("設定の同時編集も上書きを防ぐ", async () => {
    (transaction.get as Mock).mockResolvedValue({
      data: () => ({ revision: 2 }),
    });
    await expect(
      saveReservationSettings({ revision: 1, staff: [], beds: [], menus: [] }),
    ).rejects.toThrow("他のスタッフ");
    expect(transaction.set).not.toHaveBeenCalled();
  });
  test("旧予約の新しい項目に初期値を与える", () => {
    expect(
      decodeReservation(
        "existing",
        document("existing", { checkedIn: true }).data(),
      ),
    ).toMatchObject({
      id: "existing",
      status: "checked_in",
      staffName: "",
      bedName: "",
      cancellationReason: "",
    });
  });
});
