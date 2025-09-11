const fs = require('fs');
const path = require('path');

// Windows絶対パスを文字列として直接指定（バックスラッシュはエスケープ）
const dirPath = 'C:\\Users\\Teikyo\\Desktop\\my-all-directory\\application-directory\\Electronic-medical-record-app\\public\\models\\bp3d\\glb';

const outputDir = 'C:\\Users\\Teikyo\\Desktop\\my-all-directory\\application-directory\\Electronic-medical-record-app\\src\\data';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.glb'));

const elementParts = {};

files.forEach((filename) => {
  const basename = path.basename(filename, '.glb');
  const parts = basename.split('_');

  if (parts.length < 4) {
    console.warn(`ファイル名形式が想定外です: ${filename}`);
    return;
  }

  const conceptId = parts[2]; // 'FMAxxxxx'
  const name = parts.slice(3).join('_');

  elementParts[basename] = {
    conceptId,
    name,
  };
});

const outputPath = path.join(outputDir, 'elementParts.json');

fs.writeFileSync(outputPath, JSON.stringify(elementParts, null, 2), 'utf-8');

console.log(`elementParts.json を出力しました: ${outputPath}`);
