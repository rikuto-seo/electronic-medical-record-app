import { test, expect, jest, afterEach } from "@jest/globals";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import {
  fitCamera,
  viewDirections,
  createDisplayScene,
  updateAnatomyMaterial,
  retainModel,
} from "./anatomyScene";
jest.mock("@react-three/drei", () => {
  const { jest } = require("@jest/globals");
  return { useGLTF: { clear: jest.fn() } };
});
afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});
test("縦長・横長画面で全方向から全ての角を画面内とクリップ範囲へ収める", () => {
  const box = new THREE.Box3(
    new THREE.Vector3(-0.3, -0.08, -0.05),
    new THREE.Vector3(0.3, 1.7, 0.25),
  );
  for (const aspect of [0.4, 1, 2.3])
    for (const direction of Object.values(viewDirections)) {
      const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
      if (direction.y) camera.up.set(0, 0, -1);
      const fit = fitCamera(camera, box, direction);
      expect(fit).not.toBeNull();
      expect(camera.far).toBeGreaterThan(
        fit!.maxDistance + box.getBoundingSphere(new THREE.Sphere()).radius,
      );
      for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
          for (const z of [box.min.z, box.max.z]) {
            const projected = new THREE.Vector3(x, y, z).project(camera);
            expect(Math.abs(projected.x)).toBeLessThan(1);
            expect(Math.abs(projected.y)).toBeLessThan(1);
            expect(Math.abs(projected.z)).toBeLessThan(1);
          }
    }
});
test("Z-up・ミリ単位のモデルを立位のメートル単位へ変換し、原本は変えない", () => {
  const source = new THREE.Group();
  const geometry = new THREE.BufferGeometry().setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [100, -200, 1600, 120, -200, 1600, 100, -180, 1620],
      3,
    ),
  );
  source.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial()));
  const display = createDisplayScene(source);
  const box = new THREE.Box3().setFromObject(display);
  expect(box.min.x).toBeCloseTo(0.1);
  expect(box.min.y).toBeCloseTo(1.6);
  expect(box.min.z).toBeCloseTo(0.18);
  expect(source.rotation.x).toBe(0);
  expect(source.scale.x).toBe(1);
});
test("半透明の深度書込を止め、同じ材質を再利用して不透明へ戻せる", () => {
  const material = new THREE.MeshStandardMaterial();
  updateAnatomyMaterial(material, "#ff0000", 0.2, false);
  expect(material.transparent).toBe(true);
  expect(material.depthWrite).toBe(false);
  expect(material.opacity).toBe(0.2);
  updateAnatomyMaterial(material, "#ffffff", 1, true);
  expect(material.transparent).toBe(false);
  expect(material.depthWrite).toBe(true);
  expect(material.opacity).toBe(1);
  expect(material.color.getHexString()).toBe("ffffff");
});
test("StrictMode再マウントや共有モデル利用中は資源を解放せず、最後に一度だけ解放する", () => {
  jest.useFakeTimers();
  const scene = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial(),
  );
  scene.add(mesh);
  const geometry = jest.spyOn(mesh.geometry, "dispose");
  const first = retainModel("/test.glb", scene);
  first();
  const second = retainModel("/test.glb", scene),
    third = retainModel("/test.glb", scene);
  jest.runAllTimers();
  expect(geometry).not.toHaveBeenCalled();
  second();
  jest.runAllTimers();
  expect(geometry).not.toHaveBeenCalled();
  third();
  jest.runAllTimers();
  expect(geometry).toHaveBeenCalledTimes(1);
  expect(useGLTF.clear).toHaveBeenCalledWith("/test.glb");
});
test("再読込した同じURLの新モデルを、旧モデルの遅延解放で破棄しない", () => {
  jest.useFakeTimers();
  const old = new THREE.Group(),
    latest = new THREE.Group();
  const oldMesh = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshStandardMaterial(),
    ),
    newMesh = new THREE.Mesh(
      new THREE.BoxGeometry(),
      new THREE.MeshStandardMaterial(),
    );
  old.add(oldMesh);
  latest.add(newMesh);
  const oldDispose = jest.spyOn(oldMesh.geometry, "dispose"),
    latestDispose = jest.spyOn(newMesh.geometry, "dispose");
  retainModel("/reload.glb", old)();
  const release = retainModel("/reload.glb", latest);
  jest.runAllTimers();
  expect(oldDispose).toHaveBeenCalledTimes(1);
  expect(latestDispose).not.toHaveBeenCalled();
  expect(useGLTF.clear).not.toHaveBeenCalled();
  release();
  jest.runAllTimers();
  expect(latestDispose).toHaveBeenCalledTimes(1);
  expect(useGLTF.clear).toHaveBeenCalledWith("/reload.glb");
});
