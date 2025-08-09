import React, { useState, Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import rawElementParts from '../../data/elementParts.json';

type ElementPartsType = {
  [key: string]: {
    conceptId: string;
    name: string;
  };
};

const elementParts = rawElementParts as ElementPartsType;

const Model: React.FC<{ url: string; onLoaded?: (box: THREE.Box3) => void }> = ({ url, onLoaded }) => {
  const { scene } = useGLTF(url);

  // バウンディングボックスを取得して中心を原点に移動
  const box = new THREE.Box3().setFromObject(scene);
  const center = new THREE.Vector3();
  box.getCenter(center);

  scene.position.x += (scene.position.x - center.x);
  scene.position.y += (scene.position.y - center.y);
  scene.position.z += (scene.position.z - center.z);

  // スケール調整
  const size = new THREE.Vector3();
  box.getSize(size);
  const maxSize = Math.max(size.x, size.y, size.z);
  const scale = 2 / maxSize;
  scene.scale.set(scale, scale, scale);

  // マテリアルを統一（見やすく）
  scene.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      const mesh = child as THREE.Mesh;
      mesh.material = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
  });

  // 親コンポーネントにバウンディングボックスを通知
  useEffect(() => {
    if (onLoaded) {
      // スケールを考慮したバウンディングボックスを再計算
      const scaledBox = box.clone();
      scaledBox.min.multiplyScalar(scale);
      scaledBox.max.multiplyScalar(scale);
      onLoaded(scaledBox);
    }
  }, [box, scale, onLoaded]);

  return <primitive object={scene} dispose={null} />;
};

const CameraController: React.FC<{ box: THREE.Box3 | null }> = ({ box }) => {
  const { camera, gl } = useThree();

  useEffect(() => {
    if (!box) return;

    const center = new THREE.Vector3();
    box.getCenter(center);
    camera.position.set(center.x, center.y, center.z);

    const size = new THREE.Vector3();
    box.getSize(size);

    // カメラ距離をバウンディングボックスの最大辺の3倍に設定
    const maxSize = Math.max(size.x, size.y, size.z);
    camera.position.set(center.x + maxSize * 3, center.y + maxSize * 3, center.z + maxSize * 3);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  }, [box, camera]);

  return <OrbitControls args={[camera, gl.domElement]} />;
};

const AnatomyViewer: React.FC = () => {
  const keys = Object.keys(elementParts);
  const [selectedId, setSelectedId] = useState<string>(keys[0]);
  const [modelBox, setModelBox] = useState<THREE.Box3 | null>(null);

  const modelUrl = `/models/bp3d/glb/${selectedId}.glb`;

  return (
    <div>
      <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
        {keys.map(id => (
          <option key={id} value={id}>
            {elementParts[id].name}
          </option>
        ))}
      </select>

      <h2>{elementParts[selectedId].name}</h2>

      <div style={{ width: '100%', height: '600px', border: '1px solid red' }}>
        <Canvas
          style={{ background: '#f0f0f0' }}
          camera={{ position: [5, 5, 5], fov: 50, near: 0.1, far: 1000 }}
          gl={{ preserveDrawingBuffer: true }}
        >

          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <Suspense fallback={<Html center>Loading model...</Html>}>
            <Model url={modelUrl} onLoaded={setModelBox} />
          </Suspense>
          <CameraController box={modelBox} />
        </Canvas>
      </div>
    </div>
  );
};

export default AnatomyViewer;
