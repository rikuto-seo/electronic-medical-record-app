import { test, expect } from "@jest/globals";
import {
  initialQueue,
  modelQueueReducer,
  MODEL_CONCURRENCY,
} from "./modelQueue";
test("大きな一括選択でも未完了の読込を8件以内に抑え、失敗しても次を読む", () => {
  const ids = Array.from({ length: 30 }, (_, i) => `part-${i}`);
  let queue = initialQueue(ids);
  expect(queue.admitted).toHaveLength(MODEL_CONCURRENCY);
  for (const id of ids) {
    expect(queue.admitted).toContain(id);
    queue = modelQueueReducer(queue, {
      type: id === "part-0" ? "failed" : "loaded",
      id,
    });
    expect(
      queue.admitted.filter((id) => !queue.statuses[id]).length,
    ).toBeLessThanOrEqual(MODEL_CONCURRENCY);
  }
  expect(queue.admitted).toHaveLength(ids.length);
});
test("選択を外した部位への遅い通知を無視し、再試行も読込上限に従う", () => {
  let queue = initialQueue(Array.from({ length: 20 }, (_, i) => String(i)));
  queue = modelQueueReducer(queue, { type: "failed", id: "0" });
  queue = modelQueueReducer(queue, { type: "retry", ids: ["0"] });
  expect(
    queue.admitted.filter((id) => !queue.statuses[id]).length,
  ).toBeLessThanOrEqual(8);
  queue = modelQueueReducer(queue, { type: "select", ids: ["new"] });
  expect(modelQueueReducer(queue, { type: "loaded", id: "0" })).toBe(queue);
  expect(queue).toEqual({ wanted: ["new"], admitted: ["new"], statuses: {} });
});
