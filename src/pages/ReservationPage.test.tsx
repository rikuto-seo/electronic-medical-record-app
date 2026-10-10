import React from "react";
import {
  beforeAll,
  beforeEach,
  describe,
  test,
  expect,
  jest,
} from "@jest/globals";
import type { Mock as JestMock } from "jest-mock";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ReservationPage from "./ReservationPage";
import { usePatientContext } from "../hooks/usePatientContext";
import {
  addReservation,
  updateReservation,
  subscribeReservations,
  subscribeReservationSettings,
} from "../utils/reservationService";
import { Reservation, ReservationSettings } from "../types/reservation";
import { parseClinicDateTime } from "../utils/reservationUtils";

type Mock = JestMock<any, any[]>;
jest.mock("../hooks/usePatientContext", () => {
  const { jest } = require("@jest/globals");
  return { usePatientContext: jest.fn() };
});
jest.mock("../utils/reservationService", () => {
  const { jest } = require("@jest/globals");
  return {
    subscribeReservations: jest.fn(),
    subscribeReservationSettings: jest.fn(),
    addReservation: jest.fn(),
    updateReservation: jest.fn(),
    saveReservationSettings: jest.fn(),
  };
});
const patients = [
  {
    id: "p1",
    name: "テスト患者",
    nameKana: "テストカンジャ",
    birthDate: "1990-01-01",
    phoneNumber: "09012345678",
    gender: "男性",
    age: 36,
    firstVisitDate: "2026-10-09",
  },
];
const settings: ReservationSettings = {
  staff: [{ id: "s1", name: "担当A", active: true }],
  beds: [{ id: "b1", name: "ベッド1", active: true }],
  menus: [{ id: "followup", name: "再診", active: true, duration: 30 }],
};
const booking: Reservation = {
  id: "r1",
  patientId: "p1",
  date: parseClinicDateTime("2026-10-09T10:00"),
  duration: 30,
  type: "再診",
  menuId: "followup",
  memo: "受付メモ",
  staffId: "s1",
  bedId: "b1",
  status: "booked",
};
beforeAll(() => {
  // jsdomにはnative dialog APIがないため、開閉のみ補う。
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
beforeEach(() => {
  (usePatientContext as unknown as Mock).mockReturnValue({
    patients,
    patientsLoading: false,
    patientsError: "",
    reloadPatients: jest.fn(),
  });
  (subscribeReservations as unknown as Mock).mockImplementation(
    (callback: (data: Reservation[]) => void) => {
      callback([booking]);
      return () => {};
    },
  );
  (subscribeReservationSettings as unknown as Mock).mockImplementation(
    (callback: (data: ReservationSettings) => void) => {
      callback(settings);
      return () => {};
    },
  );
  (addReservation as unknown as Mock).mockResolvedValue("r2");
  (updateReservation as unknown as Mock).mockResolvedValue(undefined);
});
const openPage = () =>
  render(
    <MemoryRouter
      initialEntries={["/reservations?date=2026-10-09"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ReservationPage />
    </MemoryRouter>,
  );
describe("受付の予約操作", () => {
  test("予約の請求額と入金・返金明細を保存し、保存済み明細は取り消せない", async () => {
    const savedPayment = {
      id: "pay1",
      kind: "payment" as const,
      amount: 5000,
      paidAt: "2026-10-09T01:00:00Z",
      method: "cash" as const,
      note: "",
    };
    (subscribeReservations as unknown as Mock).mockImplementation(
      (callback: any) => {
        callback([{ ...booking, payments: [savedPayment], feeAmount: 5000 }]);
        return () => {};
      },
    );
    openPage();
    fireEvent.click(screen.getByRole("button", { name: "予約・支払い" }));
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog)
        .getByRole("link", { name: "カルテ入力を開く" })
        .getAttribute("href"),
    ).toContain("reservationId=r1");
    expect(within(dialog).queryByRole("combobox", { name: "患者" })).toBeNull();
    expect(
      within(dialog).queryByRole("button", { name: "追加を取り消す" }),
    ).toBeNull();
    fireEvent.change(within(dialog).getByLabelText("請求額（円）"), {
      target: { value: "4000" },
    });
    fireEvent.change(within(dialog).getByLabelText("支払い区分"), {
      target: { value: "refund" },
    });
    fireEvent.change(within(dialog).getByLabelText("入金・返金額（円）"), {
      target: { value: "1000" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "明細に追加" }));
    fireEvent.click(within(dialog).getByRole("button", { name: "変更を保存" }));
    await waitFor(() =>
      expect(updateReservation).toHaveBeenCalledWith(
        "r1",
        expect.objectContaining({
          feeAmount: 4000,
          payments: expect.arrayContaining([
            savedPayment,
            expect.objectContaining({ kind: "refund", amount: 1000 }),
          ]),
        }),
        null,
      ),
    );
  });
  test("未追加の支払いを保存せず、過剰返金は明細に追加しない", async () => {
    openPage();
    fireEvent.click(screen.getByRole("button", { name: "予約・支払い" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByLabelText("入金・返金額（円）"), {
      target: { value: "1000" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "変更を保存" }));
    expect(
      await within(dialog).findByText(
        "入力中の支払いを「明細に追加」してから予約を保存してください。",
      ),
    ).toBeTruthy();
    expect(updateReservation).not.toHaveBeenCalled();
    fireEvent.change(within(dialog).getByLabelText("支払い区分"), {
      target: { value: "refund" },
    });
    fireEvent.click(within(dialog).getByRole("button", { name: "明細に追加" }));
    expect(
      await within(dialog).findByText(
        "返金額は、この予約の入金額を超えられません。",
      ),
    ).toBeTruthy();
  });
  test("次回予約には前回の支払い・キャンセル履歴を引き継がない", () => {
    (subscribeReservations as unknown as Mock).mockImplementation(
      (callback: any) => {
        callback([
          {
            ...booking,
            payments: [
              {
                id: "pay1",
                kind: "payment",
                amount: 5000,
                paidAt: "2026-10-09T01:00:00Z",
                method: "cash",
                note: "",
              },
            ],
          },
        ]);
        return () => {};
      },
    );
    openPage();
    fireEvent.click(screen.getByRole("button", { name: "次回予約" }));
    expect(
      within(screen.getByRole("dialog")).queryByText("保存済み"),
    ).toBeNull();
  });
  test("患者履歴の予約IDから対象予約の支払い画面を直接開く", async () => {
    render(
      <MemoryRouter
        initialEntries={["/reservations?date=2026-10-09&reservationId=r1"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <ReservationPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByLabelText("請求額（円）")).toBeTruthy();
  });
  test("モーダル内で患者を検索して選択できる", async () => {
    openPage();
    fireEvent.click(screen.getByRole("button", { name: "新規予約" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByRole("combobox", { name: "患者" }), {
      target: { value: "テスト" },
    });
    const option = await within(dialog).findByRole("option", {
      name: /テスト患者/,
    });
    fireEvent.click(option);
    expect(
      (
        within(dialog).getByRole("combobox", {
          name: "患者",
        }) as HTMLInputElement
      ).value,
    ).toBe("テスト患者");
  });
  test("来院操作を保存し、完了を伝える", async () => {
    openPage();
    fireEvent.click(screen.getByRole("button", { name: "来院" }));
    await waitFor(() =>
      expect(updateReservation).toHaveBeenCalledWith(
        "r1",
        { status: "checked_in" },
        null,
      ),
    );
    expect(
      await screen.findByText("テスト患者さんを「来院」に更新しました。"),
    ).toBeTruthy();
  });
  test("次回予約は患者・担当・時間を引き継ぎ、別の予約として作成する", async () => {
    openPage();
    fireEvent.click(screen.getByRole("button", { name: "次回予約" }));
    const dialog = screen.getByRole("dialog");
    expect(
      (within(dialog).getByLabelText("予約日時") as HTMLInputElement).value,
    ).toBe("2026-10-16T10:00");
    fireEvent.click(within(dialog).getByRole("button", { name: "予約を登録" }));
    await waitFor(() =>
      expect(addReservation).toHaveBeenCalledWith(
        expect.objectContaining({
          patientId: "p1",
          staffId: "s1",
          bedId: "b1",
          status: "booked",
          date: parseClinicDateTime("2026-10-16T10:00"),
        }),
        expect.any(String),
      ),
    );
    expect(updateReservation).not.toHaveBeenCalled();
  });
  test("患者選択をクリアしたら以前の患者に予約を保存しない", async () => {
    openPage();
    fireEvent.click(screen.getByRole("button", { name: "次回予約" }));
    const dialog = screen.getByRole("dialog");
    fireEvent.change(within(dialog).getByRole("combobox", { name: "患者" }), {
      target: { value: "" },
    });
    fireEvent.submit(
      within(dialog)
        .getByRole("button", { name: "予約を登録" })
        .closest("form")!,
    );
    expect(
      await within(dialog).findByText("登録済みの患者を選択してください。"),
    ).toBeTruthy();
    expect(addReservation).not.toHaveBeenCalled();
  });
  test("電話番号でも予約を絞り込める", () => {
    openPage();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "090-1234-5678" },
    });
    expect(screen.getByText("テスト患者")).toBeTruthy();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "該当なし" },
    });
    expect(screen.getByText("条件に合う予約はありません")).toBeTruthy();
  });
});
