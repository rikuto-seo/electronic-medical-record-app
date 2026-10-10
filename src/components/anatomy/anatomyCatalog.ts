import skeletal from "../../data/sorted_elementParts_skeletal.json";
import muscular from "../../data/sorted_elementParts_muscular.json";
import nervous from "../../data/sorted_elementParts_nervous.json";
import arteries from "../../data/sorted_elementParts_circulatory_artery.json";
import veins from "../../data/sorted_elementParts_circulatory_vein.json";
import respiratory from "../../data/sorted_elementParts_respiratory.json";
import digestive from "../../data/sorted_elementParts_digestive.json";
import urinary from "../../data/sorted_elementParts_urinary.json";
import reproductive from "../../data/sorted_elementParts_reproductive.json";
import immune from "../../data/sorted_elementParts_immune.json";
import skin from "../../data/sorted_elementParts_integumentary.json";
import sensory from "../../data/sorted_elementParts_sensory.json";
import endocrine from "../../data/sorted_elementParts_misc.json";
import inventory from "../../data/anatomyModelManifest.json";

export type Side = "both" | "left" | "right";
export type DisplayMode = "normal" | "context" | "isolate";
export interface ModelAsset {
  bytes: number;
  bounds: number[];
}
interface RawPart {
  conceptId: string;
  name: string;
  parentName?: string | string[];
  middleCategory?: string;
  region?: string;
  order?: number;
  description?: string;
  referenceUrl?: string;
}
export interface AnatomyPart extends RawPart {
  id: string;
  japaneseName: string;
  englishName: string;
  system: string;
  region: string;
  side: Side;
  asset?: ModelAsset;
}
export const systemColors: Record<string, string> = {
  骨格系: "#eadfc6",
  筋系: "#bd5963",
  神経系: "#e4bd45",
  動脈: "#d64049",
  静脈: "#4276c2",
  呼吸器系: "#71bbc8",
  消化器系: "#cd82af",
  泌尿器系: "#d1a572",
  生殖器系: "#ae82b8",
  免疫系: "#83aa6e",
  皮膚系: "#e4bd9b",
  感覚器系: "#81b4a6",
  内分泌系: "#e1a756",
};
const sources: [Record<string, RawPart>, string][] = [
  [skeletal, "骨格系"],
  [muscular, "筋系"],
  [nervous, "神経系"],
  [arteries, "動脈"],
  [veins, "静脈"],
  [respiratory, "呼吸器系"],
  [digestive, "消化器系"],
  [urinary, "泌尿器系"],
  [reproductive, "生殖器系"],
  [immune, "免疫系"],
  [skin, "皮膚系"],
  [sensory, "感覚器系"],
  [endocrine, "内分泌系"],
];
const models: Record<string, ModelAsset> = inventory;
export const anatomyParts: AnatomyPart[] = sources.flatMap(([raw, system]) =>
  Object.entries(raw).map(([id, part]) => {
    const englishName = id.match(/_FMA\d+_(.+)$/)?.[1] || part.name;
    const left = /\bleft\b/i.test(englishName),
      right = /\bright\b/i.test(englishName);
    return {
      ...part,
      id,
      japaneseName: part.name.split("(")[0].trim(),
      englishName,
      system,
      region: (part.region || "未分類").replace(/頚/g, "頸"),
      side: left === right ? "both" : left ? "left" : "right",
      asset: models[id],
    };
  }),
);
export const partsById: Record<string, AnatomyPart> = Object.fromEntries(
  anatomyParts.map((part) => [part.id, part]),
);
export const regionOrder = [
  "頭部",
  "頸部",
  "胸部",
  "腹部",
  "背部",
  "骨盤部",
  "上肢",
  "下肢",
  "未分類",
];
export const orderedRegions = (parts: AnatomyPart[]) =>
  [...new Set(parts.map((part) => part.region))].sort(
    (a, b) =>
      (regionOrder.indexOf(a) < 0 ? 99 : regionOrder.indexOf(a)) -
        (regionOrder.indexOf(b) < 0 ? 99 : regionOrder.indexOf(b)) ||
      a.localeCompare(b, "ja"),
  );
export const matchesPart = (part: AnatomyPart, search: string, side: Side) =>
  (side === "both" || part.side === "both" || part.side === side) &&
  search
    .trim()
    .toLocaleLowerCase()
    .replace(/頚/g, "頸")
    .split(/\s+/)
    .every((word) =>
      `${part.japaneseName} ${part.englishName} ${part.id} ${part.conceptId} ${part.region}`
        .toLocaleLowerCase()
        .includes(word),
    );
export const presets = [
  {
    id: "shoulder",
    name: "肩周囲",
    pattern:
      /clavicle|scapula$|humerus$|deltoid|supraspinatus|infraspinatus|subscapularis$|teres (minor|major)|brachial (?:nerve )?plexus|suprascapular nerve|axillary nerve/,
  },
  {
    id: "neck",
    name: "頸部",
    pattern:
      /cervical vertebra|atlas$|axis$|sternocleidomastoid|scalenus|longus colli|longus capitis|rectus capitis|obliquus capitis|splenius|longissimus (capitis|cervicis)|iliocostalis cervicis|cervical plexus/,
  },
  {
    id: "lumbar",
    name: "腰・骨盤",
    pattern:
      /lumbar vertebra|sacrum$|hip bone|psoas|quadratus lumborum|iliocostalis lumborum|lumbar rotator|lumbar plexus/,
  },
  {
    id: "hip",
    name: "股関節周囲",
    pattern:
      /hip bone|sacrum$|femur$|gluteus|psoas|iliacus|piriformis|obturator (internus|externus)|gemellus|quadratus femoris/,
  },
  {
    id: "knee",
    name: "膝周囲",
    pattern:
      /femur$|tibia$|fibula$|patella$|meniscus|cruciate ligament|collateral ligament of.*knee|rectus femoris|vastus|popliteus|semitendinosus|semimembranosus|biceps femoris/,
  },
  { id: "skeleton", name: "全身骨格", pattern: null },
] as const;
export type PresetId = (typeof presets)[number]["id"];
export const presetIds = (preset: PresetId, side: Side): string[] => {
  const definition = presets.find((item) => item.id === preset)!;
  return anatomyParts
    .filter(
      (part) =>
        part.asset &&
        matchesPart(part, "", side) &&
        (preset === "skeleton"
          ? part.system === "骨格系"
          : ["骨格系", "筋系", "神経系"].includes(part.system) &&
            definition.pattern!.test(part.englishName.toLowerCase())),
    )
    .map((part) => part.id);
};
export const displayedIds = (
  selected: string[],
  focused: string[],
  mode: DisplayMode,
) =>
  mode === "isolate" && focused.length
    ? selected.filter((id) => focused.includes(id))
    : selected;
export const partOpacity = (
  id: string,
  focused: string[],
  mode: DisplayMode,
  contextOpacity: number,
) =>
  mode === "context" && focused.length && !focused.includes(id)
    ? Math.max(0.05, Math.min(0.8, contextOpacity))
    : 1;
