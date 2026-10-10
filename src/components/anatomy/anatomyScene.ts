import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
export type ViewDirection = "front" | "back" | "left" | "right" | "top";
export const viewDirections: Record<ViewDirection, THREE.Vector3> = {
  front: new THREE.Vector3(0, 0, 1),
  back: new THREE.Vector3(0, 0, -1),
  left: new THREE.Vector3(1, 0, 0),
  right: new THREE.Vector3(-1, 0, 0),
  top: new THREE.Vector3(0, 1, 0),
};
export const assetBox = (bounds: number[]) =>
  new THREE.Box3(
    new THREE.Vector3(...(bounds.slice(0, 3) as [number, number, number])),
    new THREE.Vector3(...(bounds.slice(3, 6) as [number, number, number])),
  );
export function fitCamera(
  camera: THREE.PerspectiveCamera,
  box: THREE.Box3,
  direction: THREE.Vector3,
) {
  if (box.isEmpty()) return null;
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const radius = Math.max(sphere.radius, 0.001);
  const vertical = THREE.MathUtils.degToRad(camera.fov);
  const horizontal =
    2 * Math.atan(Math.tan(vertical / 2) * Math.max(camera.aspect, 0.01));
  const distance =
    (radius / Math.sin(Math.min(vertical, horizontal) / 2)) * 1.15;
  const maxDistance = distance * 10;
  camera.position
    .copy(sphere.center)
    .addScaledVector(direction.clone().normalize(), distance);
  camera.near = Math.max(radius * 0.001, 0.00001);
  camera.far = maxDistance + radius * 30;
  camera.lookAt(sphere.center);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return {
    target: sphere.center,
    minDistance: radius * 0.03,
    maxDistance,
  };
}
export function createDisplayScene(source: THREE.Group): THREE.Group {
  const root = new THREE.Group();
  root.rotation.x = -Math.PI / 2;
  root.scale.setScalar(0.001);
  root.add(source.clone(true));
  root.updateMatrixWorld(true);
  return root;
}
export function updateAnatomyMaterial(
  material: THREE.MeshStandardMaterial,
  color: THREE.ColorRepresentation,
  opacity: number,
  focused: boolean,
) {
  const transparent = opacity < 1;
  if (material.transparent !== transparent) material.needsUpdate = true;
  material.color.set(color);
  material.opacity = opacity;
  material.transparent = transparent;
  material.depthWrite = !transparent;
  material.emissive.set(focused ? "#284c58" : "#000000");
  material.emissiveIntensity = focused ? 0.25 : 0;
}
const resources = new Map<
  string,
  { scene: THREE.Group; users: number; timer?: ReturnType<typeof setTimeout> }
>();
// Deferred release survives StrictMode's cleanup/remount cycle.
export function retainModel(url: string, scene: THREE.Group) {
  let resource = resources.get(url);
  if (!resource || resource.scene !== scene) {
    resource = { scene, users: 0 };
    resources.set(url, resource);
  }
  if (resource.timer) clearTimeout(resource.timer);
  resource.users++;
  const current = resource;
  return () => {
    current.users--;
    current.timer = setTimeout(() => {
      if (current.users) return;
      const geometries = new Set<THREE.BufferGeometry>(),
        materials = new Set<THREE.Material>();
      current.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          geometries.add(mesh.geometry);
          (Array.isArray(mesh.material)
            ? mesh.material
            : [mesh.material]
          ).forEach((material) => materials.add(material));
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      if (resources.get(url) === current) {
        useGLTF.clear(url);
        resources.delete(url);
      }
    }, 0);
  };
}
