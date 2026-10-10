import fs from 'fs';
import path from 'path';
import readline from 'readline';

// ======== ファイルパスの定義 ========
const baseDir = "C:/Users/Teikyo/Desktop/my-all-directory/application-directory/Electronic-medical-record-app/src";
const missingGlbPath = path.join(baseDir, "components/anatomy/missing_glb_list.txt");
const inclusionPath  = path.join(baseDir, "data/isa_inclusion_relation_list.txt");
const partsPath      = path.join(baseDir, "data/isa_parts_list_e.txt");

// ======== ヘルパー関数 ========
function parseTSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').trim();
  const lines = content.split(/\r?\n/);
  const header = lines.shift().split(/\t/);
  return lines.map(line => {
    const cols = line.split(/\t/);
    const obj = {};
    header.forEach((h, i) => obj[h.trim()] = cols[i] ? cols[i].trim() : "");
    return obj;
  });
}

// ======== データ読み込み ========
const inclusionData = parseTSV(inclusionPath);   // parent id, parent name, child id, child name
const partsData     = parseTSV(partsPath);       // concept id, representation id, en
const missingFiles  = fs.readFileSync(missingGlbPath, 'utf8')
                          .split(/\r?\n/)
                          .filter(l => l.trim().length > 0);

// representation id → concept id 変換マップ
const repToConcept = {};
for (const row of partsData) {
  repToConcept[row["representation id"]] = {
    conceptId: row["concept id"],
    englishName: row["en"]
  };
}

// child id → parent name 変換マップ
const childToParent = {};
for (const row of inclusionData) {
  childToParent[row["child id"]] = row["parent name"];
}

// ======== 雛形データ作成 ========
const output = {};

missingFiles.forEach(fileName => {
  // 例: "FJ1228_BP50206_FMA45097_Sesamoid bone of right foot.glb"
  const base = path.basename(fileName, ".glb");
  // BPコード抽出
  const bpMatch = base.match(/(BP\d{4,})/);
  const repId = bpMatch ? bpMatch[1] : null;

  let conceptId = "";
  let englishName = base;
  let parentName = "";

  if (repId && repToConcept[repId]) {
    conceptId = repToConcept[repId].conceptId;
    englishName = repToConcept[repId].englishName;

    if (childToParent[conceptId]) {
      parentName = childToParent[conceptId];
    }
  }

  output[base] = {
    conceptId: conceptId || "UNKNOWN",
    name: `(${englishName})`,    // 日本語名は後から補足
    parentName: parentName || "",
    majorCategory: "",
    middleCategory: "",
    region: "",
    order: 0
  };
});

// ======== 結果保存 ========
const outPath = path.join(path.dirname(missingGlbPath), "missing_glb_filled_template.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, 4), "utf8");
console.log(`✅ JSON雛形を出力しました: ${outPath}`);
