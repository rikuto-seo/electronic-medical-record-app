import { test, expect } from "@jest/globals";
import inventory from "../../data/anatomyModelManifest.json";
import {
  anatomyParts,
  partsById,
  orderedRegions,
  matchesPart,
  presetIds,
  partOpacity,
  displayedIds,
  presets,
} from "./anatomyCatalog";
test("公開部位は実ファイルとFMA IDに完全一致し、有限な境界を持つ", () => {
  expect(anatomyParts.length).toBe(Object.keys(inventory).length);
  expect(new Set(anatomyParts.map((part) => part.id)).size).toBe(
    anatomyParts.length,
  );
  for (const part of anatomyParts) {
    expect(part.id).toContain(`_${part.conceptId}_`);
    expect(part.asset?.bounds).toHaveLength(6);
    expect(part.asset!.bounds.every(Number.isFinite)).toBe(true);
    expect(part.asset!.bounds[4]).toBeLessThan(2);
    for (let axis = 0; axis < 3; axis++)
      expect(part.asset!.bounds[axis]).toBeLessThanOrEqual(
        part.asset!.bounds[axis + 3],
      );
  }
});
test("別の骨や筋に化けていた訳を修正し、英語原名も維持する", () => {
  const find = (english: string) =>
    anatomyParts.filter((part) => part.englishName === english);
  expect(
    find("Right hamate").every((part) => part.japaneseName === "右有鈎骨"),
  ).toBe(true);
  expect(
    find("Right capitate").every((part) => part.japaneseName === "右有頭骨"),
  ).toBe(true);
  expect(find("Right iliocostalis cervicis")[0].japaneseName).toBe(
    "右頸腸肋筋",
  );
  expect(find("Right longissimus capitis")[0].japaneseName).toBe("右頭最長筋");
  expect(find("Right postcentral gyrus")[0].japaneseName).toBe("右中心後回");
  expect(find("Right precentral gyrus")[0].japaneseName).toBe("右中心前回");
});
test("骨盤部や未知の領域を固定分類から漏らさず、検索は英語・ID・頚の表記にも対応する", () => {
  expect(orderedRegions(anatomyParts)).toContain("骨盤部");
  const part = anatomyParts.find(
    (part) => part.englishName === "Right longissimus cervicis",
  )!;
  expect(matchesPart(part, "頚最長筋", "right")).toBe(true);
  expect(matchesPart(part, "longissimus cervicis", "both")).toBe(true);
  expect(matchesPart(part, part.conceptId, "both")).toBe(true);
  expect(matchesPart(part, "頸最長筋", "left")).toBe(false);
  expect(orderedRegions([{ ...part, region: "新しい領域" }])).toContain(
    "新しい領域",
  );
});
test("全プリセットが実在部位を選び、患者の右を選ぶと左の部位を混ぜない", () => {
  for (const preset of presets) {
    const ids = presetIds(preset.id, "right");
    expect(ids.length).toBeGreaterThan(0);
    expect(
      ids.every((id) => partsById[id].asset && partsById[id].side !== "left"),
    ).toBe(true);
  }
});
test("周囲を半透明にしても選択済みの部位を消さず、注目部位は不透明を保つ", () => {
  const selected = ["focus", "context"];
  expect(displayedIds(selected, ["focus"], "context")).toEqual(selected);
  expect(partOpacity("focus", ["focus"], "context", 0.2)).toBe(1);
  expect(partOpacity("context", ["focus"], "context", 0.2)).toBe(0.2);
  expect(partOpacity("context", ["focus"], "context", 0)).toBe(0.05);
  expect(partOpacity("context", [], "context", 0.2)).toBe(1);
  expect(displayedIds(selected, ["focus"], "isolate")).toEqual(["focus"]);
  expect(displayedIds(selected, [], "isolate")).toEqual(selected);
});
