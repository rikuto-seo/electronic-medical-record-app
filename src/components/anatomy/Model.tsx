import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ModelProps {
  url: string;
  color?: THREE.ColorRepresentation;
  onLoaded?: (box: THREE.Box3) => void;
  onPointerDown?: (e: any) => void;
  onClick?: (e: any) => void;
}

const Model: React.FC<ModelProps> = ({ url, color = 0xaaaaaa, onLoaded, onPointerDown, onClick }) => {
  const { scene } = useGLTF(url);

  // モデル読み込み時にバウンディングボックスを通知
  useEffect(() => {
    if (onLoaded && scene) {
      const box = new THREE.Box3().setFromObject(scene);
      onLoaded(box);
    }
  }, [onLoaded, scene]);

  // 色・マテリアル設定
  useEffect(() => {
    if (!scene) return;
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.material = new THREE.MeshStandardMaterial({ color });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [scene, color]);

  // 👇 ここでイベントを渡すのが重要
  return (
    <primitive
      object={scene}
      dispose={null}
      onPointerDown={onPointerDown}
      onClick={onClick}
    />
  );
};

export default Model;
