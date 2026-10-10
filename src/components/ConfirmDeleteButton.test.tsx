import React from "react";
import { test, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ConfirmDeleteButton from "./ConfirmDeleteButton";
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
test("確認を開くだけでは削除せず、取り消せる", () => {
  const remove = jest.fn(async () => {});
  render(
    <ConfirmDeleteButton
      target="検証患者 / 000001"
      description="全カルテも削除します。"
      onDelete={remove}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "完全削除" }));
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(screen.getByText("検証患者 / 000001")).toBeTruthy();
  expect(remove).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "削除しない" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(remove).not.toHaveBeenCalled();
});
test("確認後に一度だけ実行し、エラー時は完了表示せず再試行できる", async () => {
  let reject: (reason: Error) => void = () => {};
  const remove = jest.fn(
    () =>
      new Promise<void>((_resolve, fail) => {
        reject = fail;
      }),
  );
  const done = jest.fn();
  render(
    <ConfirmDeleteButton
      target="検証入金 / 5,000円"
      description="明細だけ削除します。"
      onDelete={remove}
      onDeleted={done}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "完全削除" }));
  fireEvent.click(screen.getByRole("button", { name: "完全に削除する" }));
  expect(remove).toHaveBeenCalledTimes(1);
  expect(
    (screen.getByRole("button", { name: "削除しない" }) as HTMLButtonElement)
      .disabled,
  ).toBe(true);
  reject(new Error("サーバーに接続できません"));
  expect((await screen.findByRole("alert")).textContent).toContain("接続");
  expect(done).not.toHaveBeenCalled();
  remove.mockImplementation(async () => {});
  fireEvent.click(screen.getByRole("button", { name: "完全に削除する" }));
  await waitFor(() => expect(done).toHaveBeenCalledTimes(1));
  expect(remove).toHaveBeenCalledTimes(2);
  expect(screen.queryByRole("dialog")).toBeNull();
});
