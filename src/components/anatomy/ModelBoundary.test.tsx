import React from "react";
import { test, expect, jest, afterEach } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { useGLTF } from "@react-three/drei";
import ModelBoundary from "./ModelBoundary";
jest.mock("@react-three/drei", () => {
  const { jest } = require("@jest/globals");
  return { useGLTF: { clear: jest.fn() } };
});
afterEach(() => {
  jest.restoreAllMocks();
});
test("単体の読込エラーを閉じ込め、再試行時に失敗したキャッシュだけを破棄する", () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  let shouldFail = true;
  const Child = () => {
    if (shouldFail) throw new Error("simulated missing model");
    return <p>再読込した部位</p>;
  };
  const onFailed = jest.fn();
  const app = (attempt: number) => (
    <>
      <p>他の部位</p>
      <ModelBoundary
        id="failed-part"
        url="/failed.glb"
        attempt={attempt}
        onFailed={onFailed}
      >
        <Child />
      </ModelBoundary>
    </>
  );
  const view = render(app(0));
  expect(screen.getByText("他の部位")).toBeTruthy();
  expect(onFailed).toHaveBeenCalledWith("failed-part");
  shouldFail = false;
  view.rerender(app(1));
  expect(screen.getByText("再読込した部位")).toBeTruthy();
  expect(useGLTF.clear).toHaveBeenCalledWith("/failed.glb");
});
