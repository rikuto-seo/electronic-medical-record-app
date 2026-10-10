import React from "react";
import { beforeEach, test, expect, jest } from "@jest/globals";
import type { Mock as JestMock } from "jest-mock";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { subscribePatientReservations } from "../../utils/reservationService";
import PatientVisitHistory from "./PatientVisitHistory";
type Mock = JestMock<any, any[]>;
jest.mock("../../utils/reservationService", () => {
  const { jest } = require("@jest/globals");
  return { subscribePatientReservations: jest.fn() };
});
const record = {
  id: "record-1",
  reservationId: "res1",
  date: "2026-10-10T01:00:00Z",
  chiefComplaint: "この回の肩痛",
  currentCondition: "挙上時痛",
  treatmentPlan: "再評価",
  notes: "",
};
const payment = {
  id: "pay1",
  kind: "payment",
  amount: 5000,
  paidAt: "2026-10-10T01:30:00Z",
  method: "cash",
  note: "入金メモ",
};
const visit = {
  id: "res1",
  patientId: "p1",
  date: new Date("2026-10-10T01:00:00Z"),
  duration: 30,
  type: "再診",
  memo: "",
  status: "completed",
  feeAmount: 5000,
  payments: [
    payment,
    { ...payment, id: "refund1", kind: "refund", amount: 1000 },
  ],
};
const cancelled = {
  ...visit,
  id: "res2",
  status: "cancelled",
  cancellationReason: "体調不良",
  payments: [],
  date: new Date("2026-10-11T01:00:00Z"),
};
let success: (data: any[]) => void;
let fail: () => void;
beforeEach(() => {
  (subscribePatientReservations as unknown as Mock).mockImplementation(
    (_id, callback, onError) => {
      success = callback;
      fail = onError;
      callback([visit, cancelled]);
      return () => {};
    },
  );
});
const open = () =>
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <PatientVisitHistory
        patientId="p1"
        records={[
          record,
          {
            ...record,
            id: "legacy",
            reservationId: undefined,
            chiefComplaint: "以前の腰痛",
          },
        ]}
        onEdit={() => {}}
      />
    </MemoryRouter>,
  );
test("来院・キャンセル、各回のカルテ、支払い明細と入金・返金・差引を確認できる", () => {
  open();
  const totals = screen.getByRole("region", { name: "患者の来院・支払い集計" });
  expect(within(totals).getByText("5,000 円")).toBeTruthy();
  expect(within(totals).getByText("1,000 円")).toBeTruthy();
  expect(within(totals).getByText("4,000 円")).toBeTruthy();
  expect(screen.getByText("キャンセル理由：体調不良")).toBeTruthy();
  expect(screen.getAllByText("この回の肩痛").length).toBeGreaterThan(0);
  expect(screen.getAllByText("以前の腰痛").length).toBeGreaterThan(0);
  expect(screen.getAllByText("入金メモ").length).toBeGreaterThan(0);
  expect(
    screen
      .getAllByRole("link", { name: "予約・支払いを開く" })[0]
      .getAttribute("href"),
  ).toContain("reservationId=res1");
});
test("再予約に戻した後も過去のキャンセルを表示する", () => {
  open();
  act(() =>
    success([
      {
        ...visit,
        status: "booked",
        statusHistory: [
          {
            status: "cancelled",
            reservationDate: visit.date.toISOString(),
            type: "再診",
            staffName: "",
            cancellationReason: "発熱",
          },
        ],
      },
    ]),
  );
  expect(screen.getByText("キャンセル履歴あり")).toBeTruthy();
  expect(screen.getByText("理由：発熱")).toBeTruthy();
});
test("取得失敗を0円に見せず、再取得した履歴で更新する", () => {
  open();
  act(() => fail());
  expect(screen.getByRole("alert").textContent).toContain("取得できません");
  expect(
    screen.queryByRole("region", { name: "患者の来院・支払い集計" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "履歴を再読み込み" }));
  expect(subscribePatientReservations).toHaveBeenCalledTimes(2);
});
