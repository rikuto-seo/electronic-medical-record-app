import React from "react";
import { beforeEach, test, expect, jest } from "@jest/globals";
import type { Mock as JestMock } from "jest-mock";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { usePatientContext } from "../hooks/usePatientContext";
import { getReservationById } from "../utils/reservationService";
import PatientDetail from "./PatientDetail";
type Mock = JestMock<any, any[]>;
jest.mock("../hooks/usePatientContext", () => {
  const { jest } = require("@jest/globals");
  return { usePatientContext: jest.fn() };
});
jest.mock("uuid", () => ({ v4: () => "record-id" }));
jest.mock("../utils/reservationService", () => {
  const { jest } = require("@jest/globals");
  return {
    getReservationById: jest.fn(),
    subscribePatientReservations: (id: any, callback: any) => {
      callback([]);
      return () => {};
    },
  };
});
jest.mock("firebase/storage", () => ({
  getStorage: () => ({}),
  ref: () => ({}),
  uploadBytes: () => Promise.resolve(),
  getDownloadURL: () => Promise.resolve(""),
}));
jest.mock("../components/record/MedicalRecordForm", () => ({
  __esModule: true,
  default: () => <p>カルテ入力欄</p>,
}));
jest.mock("../components/record/MedicalRecordList", () => ({
  __esModule: true,
  default: () => <p>カルテ一覧</p>,
}));
const patient = {
  id: "p1",
  name: "テスト患者",
  gender: "男性",
  birthDate: "1990-01-01",
  age: 36,
  firstVisitDate: "2026-10-09",
  address: "保存済み住所",
  records: [],
};
const save = jest.fn();
const context = (patients = [patient]) => ({
  patients,
  patientsLoading: false,
  patientsError: "",
  updatePatient: save,
  addMedicalRecord: jest.fn(),
});
beforeEach(() => {
  (save as Mock).mockResolvedValue(undefined);
  (usePatientContext as unknown as Mock).mockReturnValue(context());
  (getReservationById as unknown as Mock).mockResolvedValue(null);
});
const app = (path = "/patients/p1") => (
  <MemoryRouter
    initialEntries={[path]}
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <Routes>
      <Route path="/patients/:id" element={<PatientDetail />} />
    </Routes>
  </MemoryRouter>
);
test("最初は来院履歴を開き、カルテ入力と患者情報は別タブで確認できる", async () => {
  render(app());
  expect(
    (await screen.findByRole("tab", { name: "来院・カルテ履歴" })).getAttribute(
      "aria-selected",
    ),
  ).toBe("true");
  expect(
    screen
      .getByText("カルテ入力欄")
      .closest("[role=tabpanel]")!
      .hasAttribute("hidden"),
  ).toBe(true);
  expect(
    screen
      .getByLabelText("住所")
      .closest("[role=tabpanel]")!
      .hasAttribute("hidden"),
  ).toBe(true);
  expect(screen.getByRole("button", { name: "カルテ入力へ" })).toBeTruthy();
});
test("予約から開くと予約日時・メニュー・担当を表示し、不一致なら入力を止める", async () => {
  (getReservationById as unknown as Mock).mockResolvedValue({
    id: "res1",
    patientId: "p1",
    date: new Date("2026-10-10T01:00:00Z"),
    type: "鍼灸",
    staffName: "担当A",
  });
  const view = render(app("/patients/p1?tab=chart&reservationId=res1"));
  expect(
    await screen.findByText(/予約: 2026\/10\/10 10:00.*鍼灸.*担当A/),
  ).toBeTruthy();
  view.unmount();
  (getReservationById as unknown as Mock).mockResolvedValue({
    patientId: "other",
  });
  render(app("/patients/p1?reservationId=res2"));
  expect((await screen.findByRole("alert")).textContent).toContain(
    "一致しません",
  );
  expect(screen.queryByText("カルテ入力欄")).toBeNull();
});
test("編集した住所を保存し、成功を知らせる", async () => {
  render(app());
  fireEvent.click(await screen.findByRole("tab", { name: "患者情報" }));
  fireEvent.change(screen.getByLabelText("住所"), {
    target: { value: "更新した住所" },
  });
  fireEvent.click(screen.getByRole("button", { name: "患者情報を保存" }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ address: "更新した住所" }),
    ),
  );
  expect(await screen.findByText("患者情報を保存しました。")).toBeTruthy();
});
test("患者一覧の再取得で編集中の患者情報を消さない", async () => {
  const view = render(app());
  fireEvent.click(await screen.findByRole("tab", { name: "患者情報" }));
  fireEvent.change(screen.getByLabelText("住所"), {
    target: { value: "編集中の住所" },
  });
  (usePatientContext as unknown as Mock).mockReturnValue(
    context([{ ...patient, name: "他スタッフが更新" }]),
  );
  view.rerender(app());
  expect((screen.getByLabelText("住所") as HTMLInputElement).value).toBe(
    "編集中の住所",
  );
});

test("編集中でも削除ロックを反映し、完了後は入力内容を残して解除する", async () => {
  const view = render(app());
  fireEvent.click(await screen.findByRole("tab", { name: "患者情報" }));
  fireEvent.change(screen.getByLabelText("住所"), { target: { value: "編集中の住所" } });
  (usePatientContext as unknown as Mock).mockReturnValue(context([{ ...patient, deletionOperation: "record:r1" } as typeof patient]));
  view.rerender(app());
  expect((screen.getByRole("button", { name: "患者情報を保存" }) as HTMLButtonElement).disabled).toBe(true);
  (usePatientContext as unknown as Mock).mockReturnValue(context());
  view.rerender(app());
  expect((screen.getByRole("button", { name: "患者情報を保存" }) as HTMLButtonElement).disabled).toBe(false);
  expect((screen.getByLabelText("住所") as HTMLInputElement).value).toBe("編集中の住所");
});
