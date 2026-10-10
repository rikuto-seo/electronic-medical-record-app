import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === GLBファイル一覧取得 ===
const glbDir = path.resolve(__dirname, '../../../public/models/bp3d/glb');
const glbFiles = fs.readdirSync(glbDir)
  .filter(f => f.endsWith('.glb'))
  .map(f => f.replace('.glb', ''));

// === JSONファイル ===
const jsonPaths = [
  '../../data/sorted_elementParts_skeletal.json',
  '../../data/sorted_elementParts_muscular.json',
  '../../data/sorted_elementParts_nervous.json',
  '../../data/sorted_elementParts_circulatory_artery.json',
  '../../data/sorted_elementParts_circulatory_vein.json',
  '../../data/sorted_elementParts_respiratory.json',
  '../../data/sorted_elementParts_digestive.json',
  '../../data/sorted_elementParts_urinary.json',
  '../../data/sorted_elementParts_reproductive.json',
  '../../data/sorted_elementParts_immune.json',
  '../../data/sorted_elementParts_integumentary.json',
  '../../data/sorted_elementParts_sensory.json',
  '../../data/sorted_elementParts_misc.json'
];

const registered = new Set();
jsonPaths.forEach(relPath => {
  const absPath = path.join(__dirname, relPath);
  const json = JSON.parse(fs.readFileSync(absPath, 'utf8'));
  Object.keys(json).forEach(k => registered.add(k));
});

// === 差分 ===
const missing = glbFiles.filter(f => !registered.has(f));

// === ファイル出力 ===
const outPath = path.join(__dirname, 'missing_glb_list.txt');
const content = [
  `未登録 GLB ファイル一覧（合計 ${missing.length} 件）`,
  '====================================',
  ...missing
].join('\n');

fs.writeFileSync(outPath, content, 'utf8');
console.log(`✅ 完了: ${outPath} に出力しました`);
