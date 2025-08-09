// scripts/convertIsaToJson.js
const fs = require('fs');
const path = require('path');

const inputPath = path.resolve(__dirname, '../data/isa_element_parts.txt');
const outputPath = path.resolve(__dirname, '../src/data/elementParts.json');

function convert() {
  const text = fs.readFileSync(inputPath, 'utf-8');
  const lines = text.trim().split('\n');
  const dataLines = lines.slice(1); // ヘッダー行除去

  const result = {};
  dataLines.forEach(line => {
    const [conceptId, name, elementFileId] = line.split('\t');
    result[elementFileId] = { conceptId, name };
  });

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`JSON file created at ${outputPath}`);
}

convert();
