// Explicit, reviewed English-to-Japanese corrections, never fuzzy model matching.
// Sources and rejected metadata are recorded in docs/anatomy-data-corrections.json.
const fs = require("fs");
const path = require("path");
const root = path.resolve(__dirname, "..");
const source =
  "https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/isa_parts_list.txt";
const terms = {
  "common tendinous ring": "総腱輪",
  "pterygomandibular raphe": "翼突下顎縫線",
  "pharyngeal raphe": "咽頭縫線",
  platysma: "広頸筋",
  "rectus capitis anterior": "前頭直筋",
  "rectus capitis posterior major": "大後頭直筋",
  "rectus capitis posterior minor": "小後頭直筋",
  "rectus capitis lateralis": "外側頭直筋",
  "longissimus capitis": "頭最長筋",
  "longissimus cervicis": "頸最長筋",
  "longissimus thoracis": "胸最長筋",
  "iliocostalis cervicis": "頸腸肋筋",
  stylohyoid: "茎突舌骨筋",
  "serratus posterior superior": "上後鋸筋",
  "abductor pollicis brevis": "短母指外転筋",
  "vastus intermedius": "中間広筋",
  "flexor accessorius": "足底方形筋",
  "adductor brevis": "短内転筋",
  "adductor longus": "長内転筋",
  "adductor magnus": "大内転筋",
  "adductor minimus": "小内転筋",
  iliococcygeus: "腸骨尾骨筋",
  "long plantar ligament": "長足底靱帯",
  "corniculate cartilage": "小角軟骨",
  hamate: "有鈎骨",
  capitate: "有頭骨",
  trapezoid: "小菱形骨",
  trapezium: "大菱形骨",
  "hip bone": "寛骨",
  "bony part of left hip bone": "左寛骨の骨部",
  "intermediate cuneiform": "中間楔状骨",
  "lateral cuneiform": "外側楔状骨",
  "medial cuneiform": "内側楔状骨",
  "frontal nerve": "前頭神経",
  "infratrochlear nerve": "滑車下神経",
  "supratrochlear nerve": "滑車上神経",
  "lacrimal nerve": "涙腺神経",
  "nasociliary nerve": "鼻毛様体神経",
  "anterior ethmoidal nerve": "前篩骨神経",
  "posterior ethmoidal nerve": "後篩骨神経",
  "supra-orbital nerve": "眼窩上神経",
  habenula: "手綱",
  "postcentral gyrus": "中心後回",
  "precentral gyrus": "中心前回",
  "commissure of fornix": "脳弓交連",
  "tuber cinereum": "灰白隆起",
  "interventricular foramen": "室間孔",
  "stria medullaris of thalamus": "視床髄条",
  "stria terminalis": "分界条",
  "ciliary corona": "毛様体冠",
  "optic chiasm": "視交叉",
  "deep artery of arm": "上腕深動脈",
  "profunda brachii artery": "上腕深動脈",
  "deep femoral vein": "大腿深静脈",
  "profunda femoris vein": "大腿深静脈",
  "superior ulnar collateral artery": "上尺側側副動脈",
  "inferior ulnar collateral artery": "下尺側側副動脈",
  "radial recurrent artery": "橈側反回動脈",
  "anterior ulnar recurrent artery": "前尺側反回動脈",
  "posterior ulnar recurrent artery": "後尺側反回動脈",
  "recurrent interosseous artery": "反回骨間動脈",
  "radialis indicis artery": "示指橈側動脈",
  "descending genicular artery": "下行膝動脈",
  "inferior lateral genicular artery": "外側下膝動脈",
  "inferior medial genicular artery": "内側下膝動脈",
  "anterior tibial recurrent artery": "前脛骨反回動脈",
  "anterior tibial recurrent branch": "前脛骨反回動脈",
  "median antebrachial vein": "前腕正中皮静脈",
  "basilic vein": "尺側皮静脈",
  "superficial epigastric vein": "浅腹壁静脈",
  "splenial artery": "背側脳梁枝",
  "temporal polar artery": "側頭極動脈",
  "urethral corpus cavernosum": "尿道海綿体",
  "corpus spongiosum of penis": "尿道海綿体",
};
const report = {
  source,
  additionalSources: [
    "https://www.med.kobe-u.ac.jp/anato1/education/files_assets/2017_Osteoguide_%2032r.pdf",
    "https://jams.med.or.jp/glossary_committee/doc/2021material_s1.pdf",
  ],
  corrections: [],
  rejectedEntries: [],
};
for (const file of fs
  .readdirSync(path.join(root, "src/data"))
  .filter((file) => /^sorted_elementParts_.*\.json$/.test(file))) {
  const destination = path.join(root, "src/data", file);
  const original = JSON.parse(fs.readFileSync(destination, "utf8"));
  let changed = false;
  for (const [id, part] of Object.entries(original)) {
    if (
      !fs.existsSync(path.join(root, "public/models/bp3d/glb", `${id}.glb`))
    ) {
      report.rejectedEntries.push({
        file,
        id,
        original: part,
        reason:
          "No exact matching GLB. Duplicate or inconsistent model identity; never substitute a different FMA/FJ.",
      });
      delete original[id];
      changed = true;
      continue;
    }
    const identity = id.match(/_(FMA\d+)_(.+)$/);
    if (!identity || identity[1] !== part.conceptId)
      throw new Error(`Model identity mismatch: ${id}`);
    const english = identity[2];
    const key = english.toLowerCase();
    const side = key.match(/^(left|right) /)?.[1];
    let japanese =
      terms[key] ||
      (side && terms[key.replace(/^(left|right) /, "")]
        ? (side === "left" ? "左" : "右") +
          terms[key.replace(/^(left|right) /, "")]
        : "");
    if (!japanese) {
      japanese = part.name
        .split("(")[0]
        .trim()
        .replace(/頚/g, "頸")
        .replace(/靭/g, "靱");
      if (/hallucis/.test(key)) japanese = japanese.replace(/母指/g, "母趾");
      if (/longus colli/.test(key))
        japanese = japanese.replace(/頭長筋/g, "頸長筋");
      if (/spinal part of.*deltoid/.test(key))
        japanese = japanese.replace(/脊部/g, "肩甲棘部");
      if (/bony part of .*hip bone/.test(key))
        japanese = (key.includes("left") ? "左" : "右") + "寛骨の骨部";
    }
    const name = `${japanese}(${english})`;
    if (name !== part.name) {
      report.corrections.push({ id, oldName: part.name, newName: name });
      part.name = name;
      changed = true;
    }
    if (part.region === "頚部") {
      part.region = "頸部";
      changed = true;
    }
  }
  if (changed)
    fs.writeFileSync(destination, JSON.stringify(original, null, 4) + "\n");
}
// Keep the first migration record when a second run has no name/identity changes.
if (report.corrections.length || report.rejectedEntries.length) {
  const destination = path.join(root, "docs/anatomy-data-corrections.json");
  if (fs.existsSync(destination)) {
    const previous = JSON.parse(fs.readFileSync(destination, "utf8"));
    const corrections = new Map(
      (previous.corrections || []).map((item) => [item.id, item]),
    );
    report.corrections.forEach((item) =>
      corrections.set(item.id, {
        ...item,
        oldName: corrections.get(item.id)?.oldName || item.oldName,
      }),
    );
    const rejected = new Map(
      (previous.rejectedEntries || []).map((item) => [item.id, item]),
    );
    report.rejectedEntries.forEach((item) => rejected.set(item.id, item));
    report.corrections = [...corrections.values()];
    report.rejectedEntries = [...rejected.values()];
  }
  fs.writeFileSync(destination, JSON.stringify(report, null, 2) + "\n");
}
console.log(
  `Corrected ${report.corrections.length} labels; quarantined ${report.rejectedEntries.length} invalid entries`,
);
