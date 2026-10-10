// Inspect repository assets only; no patient data, rendering or network access.
const fs = require("fs"),
  path = require("path");
const root = path.resolve(__dirname, "..");
const groups = [
  "skeletal",
  "muscular",
  "nervous",
  "circulatory_artery",
  "circulatory_vein",
  "respiratory",
  "digestive",
  "urinary",
  "reproductive",
  "immune",
  "integumentary",
  "sensory",
  "misc",
];
const regions = new Set([
  "頭部",
  "頸部",
  "胸部",
  "腹部",
  "背部",
  "骨盤部",
  "上肢",
  "下肢",
  "未分類",
]);
const parts = new Map(),
  duplicates = [],
  categories = [];
const assets = path.join(root, "public/models/bp3d/glb");
for (const group of groups) {
  const file = `sorted_elementParts_${group}.json`,
    data = JSON.parse(
      fs.readFileSync(path.join(root, "src/data", file), "utf8"),
    );
  categories.push({ group, count: Object.keys(data).length });
  for (const [id, part] of Object.entries(data)) {
    if (parts.has(id))
      duplicates.push({
        id,
        previous: parts.get(id).group,
        replacement: group,
      });
    parts.set(id, { ...part, group });
  }
}
const missing = [],
  hidden = [],
  emptyName = [],
  withDescription = [],
  withImage = [],
  withReference = [],
  malformed = [];
let totalBytes = 0,
  totalTriangles = 0;
const sizes = [];
for (const [id, part] of parts) {
  const file = path.join(assets, `${id}.glb`);
  if (!fs.existsSync(file))
    missing.push({ id, name: part.name, group: part.group });
  if (!regions.has(part.region || "未分類"))
    hidden.push({ id, name: part.name, region: part.region });
  if (!part.name) emptyName.push(id);
  if (part.description) withDescription.push(id);
  if (part.imageUrl) withImage.push(id);
  if (part.referenceUrl) withReference.push(id);
}
const assetNames = fs
  .readdirSync(assets)
  .filter((file) => file.endsWith(".glb"));
for (const filename of assetNames) {
  const file = path.join(assets, filename),
    bytes = fs.statSync(file).size;
  totalBytes += bytes;
  let descriptor;
  try {
    const fd = fs.openSync(file, "r");
    try {
      const header = Buffer.alloc(20);
      fs.readSync(fd, header, 0, 20, 0);
      if (
        header.toString("ascii", 0, 4) !== "glTF" ||
        header.readUInt32LE(4) !== 2 ||
        header.readUInt32LE(8) !== bytes ||
        header.readUInt32LE(16) !== 0x4e4f534a
      )
        throw new Error("Invalid GLB header");
      const json = Buffer.alloc(header.readUInt32LE(12));
      fs.readSync(fd, json, 0, json.length, 20);
      descriptor = JSON.parse(json.toString("utf8"));
    } finally {
      fs.closeSync(fd);
    }
    let triangles = 0;
    for (const mesh of descriptor.meshes ?? [])
      for (const primitive of mesh.primitives ?? []) {
        if ((primitive.mode ?? 4) === 4) {
          const accessor =
            descriptor.accessors?.[
              primitive.indices ?? primitive.attributes?.POSITION
            ];
          triangles += Math.floor((accessor?.count ?? 0) / 3);
        }
      }
    totalTriangles += triangles;
    sizes.push({
      file: filename,
      bytes,
      triangles,
      meshCount: descriptor.meshes?.length ?? 0,
    });
  } catch (error) {
    malformed.push({ file: filename, error: error.message });
  }
}
const modelOnly = assetNames.filter(
  (filename) => !parts.has(filename.slice(0, -4)),
);
const nerves = [...parts.entries()].filter(
  ([, part]) => part.group === "nervous",
);
const nerveRegions = {};
const nerveSides = { left: 0, right: 0, bilateralOrUnspecified: 0 };
const availableNerves = new Set();
for (const [id, part] of nerves) {
  nerveRegions[part.region] = (nerveRegions[part.region] || 0) + 1;
  const english = id.match(/_FMA\d+_(.+)$/)[1].toLowerCase();
  const left = /\bleft\b/.test(english),
    right = /\bright\b/.test(english);
  nerveSides[
    left === right ? "bilateralOrUnspecified" : left ? "left" : "right"
  ]++;
  if (fs.existsSync(path.join(assets, `${id}.glb`)))
    availableNerves.add(english.replace(/^trunk of /, ""));
}
const targets = require("../src/data/anatomyNerveTargets.json");
const missingMajorNerves = targets.flatMap((target) =>
  ["left", "right"].flatMap((side) =>
    [target.english, ...target.aliases].some((term) =>
      availableNerves.has(`${side} ${term}`),
    )
      ? []
      : [
          {
            name: `${side === "left" ? "左" : "右"}${target.name}`,
            english: `${side} ${target.english}`,
            region: target.region,
            side,
          },
        ],
  ),
);
let officialComparison;
const manifestArg = process.argv.indexOf("--manifest");
if (manifestArg >= 0) {
  const manifest = fs.readFileSync(
    path.resolve(process.argv[manifestArg + 1]),
    "utf8",
  );
  if (!/^# Data Version\s+4\.3\s*$/m.test(manifest))
    throw new Error("Expected the official version 4.3 FMA2Obj.txt");
  const officialIds = new Set(manifest.match(/FJ\d+M?/g));
  const localIds = new Set(assetNames.map((name) => name.split("_")[0]));
  officialComparison = {
    source:
      "https://lifesciencedb.jp/bp3d/get-info.cgi?version=4.3&cmd=concept-objfiles-list",
    version: "4.3",
    sha256: require("crypto")
      .createHash("sha256")
      .update(manifest)
      .digest("hex"),
    officialCount: officialIds.size,
    missingFileIds: [...officialIds].filter((id) => !localIds.has(id)),
    extraFileIds: [...localIds].filter((id) => !officialIds.has(id)),
  };
}
const report = {
  checkedAt: new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()),
  metadataCount: parts.size,
  modelCount: assetNames.length,
  totalBytes,
  totalTriangles,
  categories,
  nerveCoverage: {
    modelCount: nerves.length,
    regions: nerveRegions,
    sides: nerveSides,
    missingMajorNerves,
    note: "Checked major nerve targets only; counts are model components, not unique complete nerves.",
  },
  officialComparison,
  duplicateIds: duplicates,
  missingModels: missing,
  unlistedModels: modelOnly,
  hiddenByRegion: [], // The viewer derives regions from data; none are omitted.
  regionsWithoutPreferredOrder: hidden,
  emptyNames: emptyName,
  descriptionCount: withDescription.length,
  imageCount: withImage.length,
  referenceCount: withReference.length,
  invalidGlbs: malformed,
  largestModels: sizes.sort((a, b) => b.bytes - a.bytes).slice(0, 12),
};
fs.writeFileSync(
  path.join(root, "docs/anatomy-audit.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      parts: parts.size,
      models: assetNames.length,
      missing: missing.length,
      unlisted: modelOnly.length,
      hidden: 0,
      duplicates: duplicates.length,
      descriptions: withDescription.length,
      images: withImage.length,
      references: withReference.length,
      invalidGlbs: malformed.length,
      totalMiB: Math.round(totalBytes / 1048576),
      totalTriangles,
    },
    null,
    2,
  ),
);
