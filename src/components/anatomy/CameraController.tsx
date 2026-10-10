import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { OrbitControls as Controls } from "three-stdlib";
import * as THREE from "three";
import { fitCamera, viewDirections, ViewDirection } from "./anatomyScene";
export interface CameraRequest {
  sequence: number;
  scope: "all" | "focus";
  view?: ViewDirection;
}
interface Props {
  box: THREE.Box3 | null;
  focusBox: THREE.Box3 | null;
  request: CameraRequest;
}
const CameraController: React.FC<Props> = ({ box, focusBox, request }) => {
  const { camera, size, invalidate } = useThree();
  const controls = useRef<Controls>(null);
  const lastRequest = useRef(-1);
  const targetBox = request.scope === "focus" ? focusBox || box : box;
  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || !controls.current)
      return;
    if (!targetBox) return;
    camera.aspect = size.width / Math.max(size.height, 1);
    const isNew = lastRequest.current !== request.sequence;
    const direction =
      isNew && request.view
        ? viewDirections[request.view]
        : camera.position.clone().sub(controls.current.target).normalize();
    if (direction.lengthSq() === 0) direction.copy(viewDirections.front);
    camera.up.set(0, 1, 0);
    if (Math.abs(direction.dot(camera.up)) > 0.99) camera.up.set(0, 0, -1);
    const fit = fitCamera(camera, targetBox, direction);
    if (!fit) return;
    controls.current.target.copy(fit.target);
    controls.current.minDistance = fit.minDistance;
    controls.current.maxDistance = fit.maxDistance;
    controls.current.update();
    invalidate();
    lastRequest.current = request.sequence;
  }, [targetBox, request, camera, size.width, size.height, invalidate]);
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan
      enableZoom
      enableRotate
      enableDamping
      zoomToCursor
    />
  );
};
export default CameraController;
