import React, { useLayoutEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { ThreeEvent, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  createDisplayScene,
  retainModel,
  updateAnatomyMaterial,
} from "./anatomyScene";

interface ModelProps {
  id: string;
  url: string;
  color: THREE.ColorRepresentation;
  opacity: number;
  focused: boolean;
  pickable: boolean;
  onLoaded: (id: string) => void;
  onSelect: (id: string, additive: boolean) => void;
}

const Model: React.FC<ModelProps> = ({
  id,
  url,
  color,
  opacity,
  focused,
  pickable,
  onLoaded,
  onSelect,
}) => {
  const { scene } = useGLTF(url);
  const invalidate = useThree((state) => state.invalidate);
  const display = useMemo(() => createDisplayScene(scene), [scene]);
  const material = useRef<THREE.MeshStandardMaterial>();
  useLayoutEffect(() => {
    const release = retainModel(url, scene);
    const owned = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      metalness: 0,
    });
    material.current = owned;
    display.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = owned;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
    onLoaded(id);
    return () => {
      material.current = undefined;
      owned.dispose();
      release();
    };
  }, [display, scene, id, url, onLoaded]);
  useLayoutEffect(() => {
    if (material.current)
      updateAnatomyMaterial(material.current, color, opacity, focused);
    invalidate();
  }, [display, color, opacity, focused, invalidate]);
  const click = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 4 || event.button !== 0) return;
    event.stopPropagation();
    onSelect(id, event.shiftKey || event.ctrlKey || event.metaKey);
  };
  return (
    <primitive
      object={display}
      dispose={null}
      onClick={pickable ? click : undefined}
    />
  );
};

export default React.memo(Model);
