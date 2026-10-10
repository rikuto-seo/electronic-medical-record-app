import { test, expect } from "@jest/globals";
import { anatomyParts, presetIds, partsById } from "./anatomyCatalog";
import { missingNerves, matchesMissingNerve } from "./nerveCoverage";

test("未収録の右上肢・下肢と、収録済みの左上肢を区別する", () => {
  const gaps = missingNerves(anatomyParts);
  expect(gaps.some((part) => part.name === "右正中神経")).toBe(true);
  expect(gaps.some((part) => part.name === "左正中神経")).toBe(false);
  expect(gaps.some((part) => part.name === "左坐骨神経")).toBe(true);
  expect(gaps.some((part) => part.name === "右坐骨神経")).toBe(true);
  const left = anatomyParts.find(
    (part) => part.englishName === "Left median nerve",
  )!;
  const right = { ...left, englishName: "Right median nerve" };
  expect(
    missingNerves([...anatomyParts, right]).some(
      (part) => part.name === "右正中神経",
    ),
  ).toBe(false);
  expect(
    missingNerves([...anatomyParts, { ...right, asset: undefined }]).some(
      (part) => part.name === "右正中神経",
    ),
  ).toBe(true);
  const sciatic = gaps.find((part) => part.name === "右坐骨神経")!;
  expect(matchesMissingNerve(sciatic, "坐骨", "right", "下肢")).toBe(true);
  expect(matchesMissingNerve(sciatic, "sciatic", "left", "下肢")).toBe(false);
});

test("肩プリセットに実在する腕神経叢の各構成部を含め、馬尾を背部に分類する", () => {
  const plexus = anatomyParts.filter((part) =>
    /brachial nerve plexus/i.test(part.englishName),
  );
  expect(plexus).toHaveLength(6);
  const selected = presetIds("shoulder", "left");
  expect(plexus.every((part) => selected.includes(part.id))).toBe(true);
  expect(partsById["FJ4425_BP48446_FMA52590_Cauda equina"].region).toBe("背部");
});
