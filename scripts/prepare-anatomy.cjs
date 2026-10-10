// Build a local asset inventory. BodyParts3D coordinates are mm, Z-up.
const fs = require("fs");
const path = require("path");
const THREE = require("three");
const root = path.resolve(__dirname, "..");
const folder = path.join(root, "public/models/bp3d/glb");
const manifest = {};
for (const file of fs
  .readdirSync(folder)
  .filter((file) => file.endsWith(".glb"))
  .sort()) {
  const bytes = fs.readFileSync(path.join(folder, file));
  if (
    bytes.toString("ascii", 0, 4) !== "glTF" ||
    bytes.readUInt32LE(4) !== 2 ||
    bytes.readUInt32LE(8) !== bytes.length ||
    bytes.readUInt32LE(16) !== 0x4e4f534a
  )
    throw new Error(`Invalid GLB: ${file}`);
  const gltf = JSON.parse(
    bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString("utf8"),
  );
  const box = new THREE.Box3();
  const display = new THREE.Matrix4()
    .makeRotationX(-Math.PI / 2)
    .scale(new THREE.Vector3(0.001, 0.001, 0.001));
  const visit = (index, parent) => {
    const node = gltf.nodes[index];
    const matrix = node.matrix
      ? new THREE.Matrix4().fromArray(node.matrix)
      : new THREE.Matrix4().compose(
          new THREE.Vector3().fromArray(node.translation || [0, 0, 0]),
          new THREE.Quaternion().fromArray(node.rotation || [0, 0, 0, 1]),
          new THREE.Vector3().fromArray(node.scale || [1, 1, 1]),
        );
    matrix.premultiply(parent);
    for (const primitive of gltf.meshes?.[node.mesh]?.primitives || []) {
      const positions = gltf.accessors[primitive.attributes.POSITION];
      if (!positions.min || !positions.max)
        throw new Error(`Missing position bounds: ${file}`);
      box.union(
        new THREE.Box3(
          new THREE.Vector3().fromArray(positions.min),
          new THREE.Vector3().fromArray(positions.max),
        ).applyMatrix4(matrix),
      );
    }
    for (const child of node.children || []) visit(child, matrix);
  };
  for (const node of gltf.scenes[gltf.scene || 0].nodes || [])
    visit(node, display);
  if (box.isEmpty()) throw new Error(`Empty GLB: ${file}`);
  manifest[file.slice(0, -4)] = {
    bytes: bytes.length,
    bounds: [...box.min.toArray(), ...box.max.toArray()].map(
      (value) => Math.round(value * 1e6) / 1e6,
    ),
  };
}
const destination = path.join(root, "src/data/anatomyModelManifest.json");
const output = JSON.stringify(manifest) + "\n";
if (
  !fs.existsSync(destination) ||
  fs.readFileSync(destination, "utf8") !== output
)
  fs.writeFileSync(destination, output);
console.log(`Anatomy inventory: ${Object.keys(manifest).length} verified GLBs`);
