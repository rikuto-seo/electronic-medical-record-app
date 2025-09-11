import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname の代わりの定義（ESM対応）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ファイルパス設定
const elementPartsPath = path.resolve(__dirname, '../src/data/elementParts.json');
const isaRelationPath = path.resolve(__dirname, '../src/data/isa_inclusion_relation_list.txt');
const outputPath = path.resolve(__dirname, '../src/data/elementParts_with_parents.json');

// JSON読み込み
const elementPartsRaw = fs.readFileSync(elementPartsPath, 'utf-8');
const elementParts = JSON.parse(elementPartsRaw) as Record<string, {
  conceptId: string;
  name: string;
  parentName?: string | string[];
}>;

// TSV読み込み
const isaRaw = fs.readFileSync(isaRelationPath, 'utf-8');
const isaLines = isaRaw.trim().split('\n');

// 親子関係データ作成（1行目はヘッダーなので除外）
const isaData = isaLines.slice(1).map(line => {
  const [parentId, parentName, childId, childName] = line.split('\t');
  return { parentId, parentName, childId, childName };
});

// childId をキーに親名配列を作る
const childIdToParents = new Map<string, string[]>();
for (const { childId, parentName } of isaData) {
  if (!childIdToParents.has(childId)) {
    childIdToParents.set(childId, []);
  }
  const parents = childIdToParents.get(childId)!;
  if (!parents.includes(parentName)) {
    parents.push(parentName);
  }
}

// elementParts に parentName を追加
for (const key in elementParts) {
  const item = elementParts[key];
  const parents = childIdToParents.get(item.conceptId);
  if (parents && parents.length > 0) {
    item.parentName = parents.length === 1 ? parents[0] : parents;
  }
}

// 書き出し
fs.writeFileSync(outputPath, JSON.stringify(elementParts, null, 2), 'utf-8');

console.log(`Done! Updated elementParts saved to ${outputPath}`);
