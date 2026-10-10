import React from "react";
import { test, expect, jest, beforeEach } from "@jest/globals";
import type { Mock as JestMock } from "jest-mock";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import LoginPage from "./LoginPage";
jest.mock("../firebase", () => ({ auth: {} }));
jest.mock("firebase/auth", () => {
  const { jest } = require("@jest/globals");
  return { signInWithEmailAndPassword: jest.fn() };
});
const login = signInWithEmailAndPassword as unknown as JestMock<any, any[]>;
const Destination = () => {
  const location = useLocation();
  return (
    <p>
      {location.pathname}
      {location.search}
    </p>
  );
};
const app = (pathname: string, search = "") => (
  <MemoryRouter
    initialEntries={[
      { pathname: "/login", state: { from: { pathname, search } } },
    ]}
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Destination />} />
    </Routes>
  </MemoryRouter>
);
beforeEach(() => {
  login.mockReset();
});
test("ログイン中は二重送信せず、患者カードのURLに戻る", async () => {
  let finish: (value: unknown) => void = () => {};
  login.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(app("/patients/by-number/000001", "?tab=chart"));
  fireEvent.change(screen.getByLabelText("メールアドレス:"), {
    target: { value: "staff@example.com" },
  });
  fireEvent.change(screen.getByLabelText("パスワード:"), {
    target: { value: "fictional-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "ログイン" }));
  expect(
    (screen.getByRole("button", { name: "ログイン中…" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  expect(login).toHaveBeenCalledTimes(1);
  finish({});
  expect(
    await screen.findByText("/patients/by-number/000001?tab=chart"),
  ).toBeTruthy();
});
test("外部への遷移先は使わず、失敗時は再入力できる", async () => {
  login
    .mockRejectedValueOnce(new Error("接続を確認してください"))
    .mockResolvedValueOnce({});
  render(app("//outside.example"));
  fireEvent.change(screen.getByLabelText("メールアドレス:"), {
    target: { value: "staff@example.com" },
  });
  fireEvent.change(screen.getByLabelText("パスワード:"), {
    target: { value: "fictional-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "ログイン" }));
  expect((await screen.findByRole("alert")).textContent).toContain("接続");
  await waitFor(() =>
    expect(
      (screen.getByRole("button", { name: "ログイン" }) as HTMLButtonElement)
        .disabled,
    ).toBe(false),
  );
  fireEvent.click(screen.getByRole("button", { name: "ログイン" }));
  expect(await screen.findByText("/reservations")).toBeTruthy();
});
