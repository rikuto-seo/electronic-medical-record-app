// scripts/splitElementParts.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// __dirname 相当を作る
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 元ファイル（src/data 配下にある）
const sourceFile = path.resolve(
  __dirname,
  "../src/data/elementParts_with_parents_classified.json"
);

// 出力先ディレクトリ（src/data に出す）
const outputDir = path.resolve(__dirname, "../src/data");

// majorCategory とファイル名のマッピング
const categoryMap = {
  "Skeletal system": "elementParts_skeletal.json",
  "Muscular system": "elementParts_muscular.json",
  "Nervous system": "elementParts_nervous.json",
  "Circulatory system": "elementParts_circulatory.json",
  "Respiratory system": "elementParts_respiratory.json",
  "Digestive system": "elementParts_digestive.json",
  "Urinary system": "elementParts_urinary.json",
  "Reproductive system": "elementParts_reproductive.json",
  "Immune system": "elementParts_immune.json",
  "Integumentary system": "elementParts_integumentary.json",
  "Sensory system": "elementParts_sensory.json",
  "Miscellaneous": "elementParts_misc.json",
};

// 元データをロード
const rawData = JSON.parse(fs.readFileSync(sourceFile, "utf-8"));

// 各カテゴリのオブジェクトを初期化
const outputData = {};
for (const fileName of Object.values(categoryMap)) {
  outputData[fileName] = {};
}

// 振り分け処理
for (const [key, value] of Object.entries(rawData)) {
  const category = value.majorCategory;
  const fileName = categoryMap[category] || "elementParts_misc.json";
  outputData[fileName][key] = value;
}

// 書き出し
for (const [fileName, data] of Object.entries(outputData)) {
  const outPath = path.join(outputDir, fileName);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`✅ ${fileName} に ${Object.keys(data).length} 件を書き出しました`);
}
