import fs from 'fs';
import path from 'path';

// 入力ファイル
const missingListPath = 'C:/Users/Teikyo/Desktop/my-all-directory/application-directory/Electronic-medical-record-app/src/components/anatomy/missing_glb_list.txt';
const isaRelationPath = 'C:/Users/Teikyo/Desktop/my-all-directory/application-directory/Electronic-medical-record-app/src/data/isa_inclusion_relation_list.txt';

// 出力ディレクトリ
const outputDir = 'C:/Users/Teikyo/Desktop/my-all-directory/application-directory/Electronic-medical-record-app/src/data';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// missing_glb_list.txt を読み込む
const missingFiles = fs.readFileSync(missingListPath, 'utf-8')
                       .split(/\r?\n/)
                       .filter(l => l.trim().length > 0);

// isa_inclusion_relation_list.txt を読み込む
const isaLines = fs.readFileSync(isaRelationPath, 'utf-8')
                   .split(/\r?\n/)
                   .filter(l => l.trim().length > 0);

// childId → parentName マップ作成
const childToParentMap = {};
isaLines.slice(1).forEach(line => { // 1行目はヘッダー
  const [parentId, parentName, childId] = line.split(/\t/);
  if (childId && parentName) {
    childToParentMap[childId] = parentName;
  }
});

const elementParts = {};

// missingFiles だけ処理
missingFiles.forEach((filePath) => {
  const basename = path.basename(filePath, '.glb');
  const parts = basename.split('_');

  if (parts.length < 4) {
    console.warn(`ファイル名形式が想定外です: ${basename}`);
    return;
  }

  const conceptId = parts[2]; // 'FMAxxxxx'
  const name = parts.slice(3).join('_');

  const parentName = childToParentMap[conceptId] || "";

  elementParts[basename] = {
    conceptId,
    name,
    parentName,
    majorCategory: "",
    middleCategory: "",
    region: "",
    order: 0
  };
});

// JSON 出力
const outputPath = path.join(outputDir, 'missing_elementParts.json');
fs.writeFileSync(outputPath, JSON.stringify(elementParts, null, 2), 'utf-8');

console.log(`✅ missing_elementParts.json を出力しました: ${outputPath}`);
