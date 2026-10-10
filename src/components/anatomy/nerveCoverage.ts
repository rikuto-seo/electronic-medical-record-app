import { AnatomyPart, Side } from "./anatomyCatalog";
import targets from "../../data/anatomyNerveTargets.json";

// A checked list of commonly sought nerves, not a claim of exhaustive coverage.
export interface MissingNerve {
  name: string;
  english: string;
  aliases: string[];
  region: string;
  side: "left" | "right";
}
export function missingNerves(parts: AnatomyPart[]): MissingNerve[] {
  const available = new Set(
    parts
      .filter((part) => part.system === "神経系" && part.asset)
      .map((part) => part.englishName.toLowerCase().replace(/^trunk of /, "")),
  );
  return targets.flatMap((target) =>
    (["left", "right"] as const).flatMap((side) => {
      const terms = [target.english, ...(target.aliases || [])];
      return terms.some((term) => available.has(`${side} ${term}`))
        ? []
        : [
            {
              name: `${side === "left" ? "左" : "右"}${target.name}`,
              english: `${side} ${target.english}`,
              aliases: terms.map((term) => `${side} ${term}`),
              region: target.region,
              side,
            },
          ];
    }),
  );
}
export function matchesMissingNerve(
  part: MissingNerve,
  search: string,
  side: Side,
  region: string,
) {
  return (
    (side === "both" || part.side === side) &&
    (!region || part.region === region) &&
    search
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .every((word) =>
        `${part.name} ${part.english} ${part.aliases.join(" ")} ${part.region}`
          .toLowerCase()
          .includes(word),
      )
  );
}
