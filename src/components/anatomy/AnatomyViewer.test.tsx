import React from "react";
import { test, expect, jest, beforeEach } from "@jest/globals";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AnatomyViewer from "./AnatomyViewer";
jest.mock("@react-three/fiber", () => {
  const React = require("react");
  return {
    Canvas: ({ children }: any) => (
      <div data-testid="mock-canvas">
        {React.Children.toArray(children).filter(
          (child: any) =>
            React.isValidElement(child) && typeof child.type !== "string",
        )}
      </div>
    ),
  };
});
jest.mock("@react-three/drei", () => {
  const { jest } = require("@jest/globals");
  return {
    Html: ({ children }: any) => <div>{children}</div>,
    useGLTF: { clear: jest.fn() },
  };
});
jest.mock("./CameraController", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("./Model", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: any) => {
      React.useEffect(
        () => props.onLoaded(props.id),
        [props.id, props.onLoaded],
      );
      return (
        <span
          data-testid="displayed-model"
          data-id={props.id}
          data-opacity={props.opacity}
          data-color={props.color}
        />
      );
    },
  };
});
beforeEach(() => localStorage.clear());
test("検索から選んだ範囲だけ一括表示し、周囲を消さずに透かして元に戻す", async () => {
  render(<AnatomyViewer />);
  fireEvent.click(screen.getByRole("button", { name: "表示をクリア" }));
  fireEvent.change(screen.getByRole("searchbox", { name: "解剖部位を検索" }), {
    target: { value: "棘上筋" },
  });
  fireEvent.click(
    screen.getByRole("checkbox", { name: "筋系の検索結果をまとめて表示" }),
  );
  await waitFor(() =>
    expect(screen.getAllByTestId("displayed-model")).toHaveLength(2),
  );
  fireEvent.click(screen.getByRole("button", { name: /^右棘上筋に注目 / }));
  const models = screen.getAllByTestId("displayed-model");
  expect(
    models.map((model) => model.getAttribute("data-opacity")).sort(),
  ).toEqual(["0.2", "1"]);
  fireEvent.change(screen.getByRole("slider", { name: "周囲の不透明度" }), {
    target: { value: "10" },
  });
  expect(
    screen
      .getAllByTestId("displayed-model")
      .map((model) => model.getAttribute("data-opacity"))
      .sort(),
  ).toEqual(["0.1", "1"]);
  fireEvent.click(screen.getByRole("button", { name: "通常表示" }));
  expect(
    screen
      .getAllByTestId("displayed-model")
      .every((model) => model.getAttribute("data-opacity") === "1"),
  ).toBe(true);
});
test("注目部位を複数指定でき、表示設定と系統色を保存・復帰できる", async () => {
  const view = render(<AnatomyViewer />);
  fireEvent.click(screen.getByRole("button", { name: "表示をクリア" }));
  fireEvent.change(screen.getByRole("searchbox", { name: "解剖部位を検索" }), {
    target: { value: "棘上筋" },
  });
  fireEvent.click(screen.getByRole("button", { name: /^右棘上筋に注目 / }));
  fireEvent.click(screen.getByRole("button", { name: /^左棘上筋に注目 / }));
  await waitFor(() =>
    expect(screen.getAllByTestId("displayed-model")).toHaveLength(2),
  );
  expect(
    screen
      .getAllByTestId("displayed-model")
      .every((model) => model.getAttribute("data-opacity") === "1"),
  ).toBe(true);
  fireEvent.change(screen.getByLabelText("筋系の色"), {
    target: { value: "#112233" },
  });
  fireEvent.click(screen.getByRole("button", { name: "表示設定を保存" }));
  view.unmount();
  render(<AnatomyViewer />);
  await waitFor(() =>
    expect(screen.getAllByTestId("displayed-model")).toHaveLength(2),
  );
  expect(
    screen
      .getAllByTestId("displayed-model")
      .every((model) => model.getAttribute("data-color") === "#112233"),
  ).toBe(true);
  fireEvent.change(screen.getByLabelText("筋系の色"), {
    target: { value: "#445566" },
  });
  expect(
    screen
      .getAllByTestId("displayed-model")
      .every((model) => model.getAttribute("data-color") === "#445566"),
  ).toBe(true);
});

test("各領域の検索と親チェックは絞った部位だけを選び、他の領域を混ぜない", async () => {
  render(<AnatomyViewer />);
  fireEvent.click(screen.getByRole("button", { name: "表示をクリア" }));
  fireEvent.change(screen.getByRole("combobox", { name: "検索する系統" }), {
    target: { value: "筋系" },
  });
  fireEvent.change(screen.getByRole("combobox", { name: "検索する領域" }), {
    target: { value: "上肢" },
  });
  fireEvent.change(
    screen.getByRole("searchbox", { name: "筋系・上肢の部位を検索" }),
    { target: { value: "棘上筋" } },
  );
  expect(
    screen.queryByRole("checkbox", { name: /^右棘下筋を表示 / }),
  ).toBeNull();
  fireEvent.click(
    screen.getByRole("checkbox", { name: "筋系の検索結果をまとめて表示" }),
  );
  await waitFor(() =>
    expect(screen.getAllByTestId("displayed-model")).toHaveLength(2),
  );
  expect(
    screen
      .getAllByTestId("displayed-model")
      .every((model) =>
        model.getAttribute("data-id")!.endsWith("supraspinatus"),
      ),
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "検索条件をクリア" }));
  expect(
    (
      screen.getByRole("searchbox", {
        name: "筋系・上肢の部位を検索",
      }) as HTMLInputElement
    ).value,
  ).toBe("");
  expect(
    screen.getByRole("checkbox", { name: /^右棘下筋を表示 / }),
  ).toBeTruthy();
});

test("未収録神経の検索では、空の検索結果とモデル不足を区別し、存在する神経は選べる", async () => {
  render(<AnatomyViewer />);
  fireEvent.click(screen.getByRole("button", { name: "表示をクリア" }));
  fireEvent.change(screen.getByRole("searchbox", { name: "解剖部位を検索" }), {
    target: { value: "坐骨神経" },
  });
  expect(screen.getByText("左坐骨神経")).toBeTruthy();
  expect(screen.getByText("右坐骨神経")).toBeTruthy();
  expect(
    screen.queryAllByRole("checkbox", { name: /坐骨神経を表示/ }),
  ).toHaveLength(0);
  expect(screen.queryAllByTestId("displayed-model")).toHaveLength(0);
  fireEvent.change(screen.getByRole("searchbox", { name: "解剖部位を検索" }), {
    target: { value: "正中神経" },
  });
  expect(screen.getByText("右正中神経")).toBeTruthy();
  const left = screen.getAllByRole("checkbox", {
    name: /^左正中神経を表示 /,
  })[0];
  fireEvent.click(left);
  await waitFor(() =>
    expect(screen.getAllByTestId("displayed-model")).toHaveLength(1),
  );
  expect(
    screen.getAllByTestId("displayed-model")[0].getAttribute("data-id"),
  ).toContain("Left median nerve");
});
