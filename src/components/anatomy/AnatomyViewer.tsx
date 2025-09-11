import React, { useState, Suspense, useEffect, useRef, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import Model from './Model';

// --- JSON 読み込みと majorCategory 自動付与 ---
import skeletalPartsRaw from '../../data/elementParts_skeletal.json';
import muscularPartsRaw from '../../data/elementParts_muscular.json';
import nervousPartsRaw from '../../data/elementParts_nervous.json';
import circulatoryPartsRaw from '../../data/elementParts_circulatory.json';
import respiratoryPartsRaw from '../../data/elementParts_respiratory.json';
import digestivePartsRaw from '../../data/elementParts_digestive.json';
import urinaryPartsRaw from '../../data/elementParts_urinary.json';
import reproductivePartsRaw from '../../data/elementParts_reproductive.json';
import immunePartsRaw from '../../data/elementParts_immune.json';
import integumentaryPartsRaw from '../../data/elementParts_integumentary.json';
import sensoryPartsRaw from '../../data/elementParts_sensory.json';
import miscPartsRaw from '../../data/elementParts_misc.json';

type ElementPartsType = {
  [key: string]: {
    conceptId: string;
    name: string;
    parentName?: string | string[];
    majorCategory?: string;
    middleCategory?: string;
    region?: '頭頚部' | '胸部' | '腹部' | '背部' | '上肢' | '下肢';
    // 必要なら説明や画像URLなどをJSONに追加して取り出せるようにしておく
    description?: string;
    imageUrl?: string;
    referenceUrl?: string;
  };
};

const addMajorCategory = (raw: any, major: string) =>
  Object.fromEntries(Object.entries(raw).map(([id, part]: [string, any]) => [id, { ...part, majorCategory: major }]));

const elementParts = {
  ...addMajorCategory(skeletalPartsRaw, '骨格系'),
  ...addMajorCategory(muscularPartsRaw, '筋系'),
  ...addMajorCategory(nervousPartsRaw, '神経系'),
  ...addMajorCategory(circulatoryPartsRaw, '循環器系'),
  ...addMajorCategory(respiratoryPartsRaw, '呼吸器系'),
  ...addMajorCategory(digestivePartsRaw, '消化器系'),
  ...addMajorCategory(urinaryPartsRaw, '泌尿器系'),
  ...addMajorCategory(reproductivePartsRaw, '生殖器系'),
  ...addMajorCategory(immunePartsRaw, '免疫系'),
  ...addMajorCategory(integumentaryPartsRaw, '皮膚系'),
  ...addMajorCategory(sensoryPartsRaw, '感覚器系'),
  ...addMajorCategory(miscPartsRaw, '内分泌系'),
} as ElementPartsType;

// --- 並び順とデフォルト色 ---
const majorSystemOrder = [
  '骨格系', '筋系', '神経系', '循環器系', '呼吸器系',
  '消化器系', '泌尿器系', '生殖器系', '免疫系',
  '皮膚系', '感覚器系', '内分泌系', '未分類'
];
const middleSystemOrder = ['頭頚部', '胸部', '腹部', '背部', '上肢', '下肢', '未分類'];
const defaultMiddleSystemColors: { [key: string]: string } = {
  頭頚部: '#f28e2b',
  胸部: '#4e79a7',
  腹部: '#e15759',
  背部: '#76b7b2',
  上肢: '#59a14f',
  下肢: '#edc948',
  未分類: '#aaaaaa',
};

// --- 分類関数 ---
const classifyMajorSystem = (part: { majorCategory?: string }) => part.majorCategory || '未分類';
const classifyMiddleSystem = (part: { region?: string }) => part.region || '未分類';

// --- Accordion コンポーネント --- 
const AccordionGroup: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (<details style={{ marginBottom: 8 }}> <summary style={{ cursor: 'pointer', fontWeight: 600, padding: '6px 8px' }}>{title}</summary> <div style={{ padding: '6px 8px' }}>{children}</div> </details>);
// --- 大分類チェックボックス --- 
const MajorGroupCheckbox: React.FC<{
  majorName: string; allIds: string[];
  selectedIds: string[]; parentColor: string; onToggleMajor: (ids: string[], majorName: string) => void; onChangeMajorColor: (majorName: string, color: string) => void; children?:
  React.ReactNode;
}> = ({ majorName, allIds, selectedIds, parentColor, onToggleMajor, onChangeMajorColor, children }) => {
  const allSelected = allIds.every(id => selectedIds.includes(id));
  const someSelected = allIds.some(id => selectedIds.includes(id)); return (<details style={{ marginBottom: 12 }}> <summary style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}> <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = !allSelected && someSelected; }} onChange={() => onToggleMajor(allIds, majorName)} />
    <span style={{ fontWeight: 700 }}>{majorName}</span> <input type="color" value={parentColor} onChange={e => onChangeMajorColor(majorName, e.target.value)} /> </summary> <div style={{ paddingLeft: 16 }}>{children}</div> </details>);
};
// --- 中分類（親） + 子リスト --- 
const ParentGroupCheckbox: React.FC<{
  parentName: string; childIds: string[]; selectedIds: string[]; onToggleParent: (childIds: string[]) => void; onToggleChild: (id: string) => void; onChangeChildColor: (id: string, color: string) => void; onChangeParentColor: (parentName: string, color: string) => void;
  elementParts: ElementPartsType;
  colorMap: { [id: string]: string };
  parentColorMap: { [key: string]: string };
}> = ({ parentName, childIds, selectedIds, onToggleParent, onToggleChild, onChangeChildColor, onChangeParentColor, elementParts, colorMap, parentColorMap }) => {
  const allSelected = childIds.every(id => selectedIds.includes(id)); const someSelected = childIds.some(id => selectedIds.includes(id)); const parentColor = parentColorMap[parentName] || '#aaaaaa';
  return (<div style={{ borderBottom: '1px solid #eee', paddingBottom: 6, marginBottom: 6 }}> <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input type="checkbox" checked={allSelected} ref={el => { if (el) el.indeterminate = !allSelected && someSelected; }} onChange={() => onToggleParent(childIds)} /> <span>{parentName} <small style={{ color: '#666', marginLeft: 8 }}>({childIds.length})</small>
      </span> </label> <input type="color" value={parentColor} onChange={e => onChangeParentColor(parentName, e.target.value)} />
  </div>
    <div style={{ marginTop: 8, paddingLeft: 18 }}> {childIds.map(id => (<div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}> <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}> <input type="checkbox" checked={selectedIds.includes(id)} onChange={() => onToggleChild(id)} />
      <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{elementParts[id]?.name || id}</span> </label> <input type="color" value={colorMap[id] || parentColor} onChange={e => onChangeChildColor(id, e.target.value)} disabled={!selectedIds.includes(id)} /> </div>))}
    </div>
  </div>
  );
};
// --- カメラコントローラ ---
const CameraController: React.FC<{ box: THREE.Box3 | null }> = ({ box }) => {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const autoTargetedRef = useRef(false);

  // controls の start イベントでユーザー操作を把握したい場合はここに追加可能
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => { /* ユーザー操作をトラッキングするならここ */ };
    controls.addEventListener?.('start', onStart);
    return () => controls.removeEventListener?.('start', onStart);
  }, []);

  // ボックスが来たらターゲットだけ合わせる（カメラ位置は触らない）
  useEffect(() => {
    if (!box || autoTargetedRef.current || !controlsRef.current) return;
    const center = new THREE.Vector3();
    box.getCenter(center);
    controlsRef.current.target.copy(center);
    if (camera instanceof THREE.PerspectiveCamera) camera.updateProjectionMatrix();
    autoTargetedRef.current = true;
  }, [box, camera]);

  // ズーム制限：寄れる最小距離を極小に、引くのはほぼ無制限
  useEffect(() => {
    if (!controlsRef.current) return;
    // 寄れる下限は常に非常に小さくする（内部で 0 にすると問題が出るため小さい正値）
    controlsRef.current.minDistance = 0.001;
    // 引くのはほぼ無制限
    controlsRef.current.maxDistance = 1e6;
    // 滑らかさ
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.08;
  }, [box]);

  return (
    <OrbitControls
      ref={controlsRef}
      args={[camera, gl.domElement]}
      enablePan
      enableZoom
      enableRotate
      zoomToCursor
    />
  );
};

// --- AnatomyViewer ---
const AnatomyViewer: React.FC = () => {
  const keys = useMemo(() => Object.keys(elementParts), []);
  const classifiedParts = useMemo(() => keys.map(id => {
    const part = elementParts[id];
    return { id, ...part, majorSystem: classifyMajorSystem(part), middleSystem: classifyMiddleSystem(part) };
  }), [keys]);

  const groupedBySystem = useMemo(() => {
    const map: { [major: string]: { [middle: string]: string[] } } = {};
    for (const part of classifiedParts) {
      const major = part.majorSystem;
      const middle = part.middleSystem;
      if (!map[major]) map[major] = {};
      if (!map[major][middle]) map[major][middle] = [];
      map[major][middle].push(part.id);
    }
    return map;
  }, [classifiedParts]);

  const [parentColorMap, setParentColorMap] = useState<{ [key: string]: string }>(() => {
    const map: { [key: string]: string } = {};
    for (const maj of majorSystemOrder) map[maj] = '#cccccc';
    for (const mid of middleSystemOrder) map[mid] = defaultMiddleSystemColors[mid];
    return map;
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [colorMap, setColorMap] = useState<{ [id: string]: string }>({});
  const [modelBoxes, setModelBoxes] = useState<{ [id: string]: THREE.Box3 }>({});
  const [selectedPart, setSelectedPart] = useState<string | null>(null); // 追加：タップで詳細表示

  const handleModelLoaded = (box: THREE.Box3, id: string) =>
    setModelBoxes(prev => prev[id] ? prev : { ...prev, [id]: box });

  const mergedBox = useMemo(() => {
    const boxes = selectedIds.map(id => modelBoxes[id]).filter(Boolean) as THREE.Box3[];
    if (!boxes.length) return null;
    // union を使うので新しい Box3 を初期値にして合成
    return boxes.reduce((acc, b) => acc.union(b), new THREE.Box3());
  }, [selectedIds, modelBoxes]);

  const toggleParentSelection = (childIds: string[], parentName: string) => {
    const allSelected = childIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !childIds.includes(id)));
      setColorMap(prev => { const updated = { ...prev }; childIds.forEach(id => delete updated[id]); return updated; });
    } else {
      const idsToAdd = childIds.filter(id => !selectedIds.includes(id));
      setSelectedIds(prev => [...prev, ...idsToAdd]);
      const parentColor = parentColorMap[parentName] || '#aaaaaa';
      setColorMap(prev => ({ ...prev, ...Object.fromEntries(idsToAdd.map(id => [id, parentColor])) }));
    }
  };

  const toggleChildSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id));
      setColorMap(prev => { const u = { ...prev }; delete u[id]; return u; });
    } else {
      setSelectedIds(prev => [...prev, id]);
      setColorMap(prev => ({ ...prev, [id]: '#aaaaaa' }));
    }
  };

  const changeChildColor = (id: string, color: string) => setColorMap(prev => ({ ...prev, [id]: color }));

  const changeParentColor = (parentName: string, color: string) => {
    setParentColorMap(prev => {
      const old = prev[parentName];
      const next = { ...prev, [parentName]: color };
      // 子の colorMap 更新
      const childIds = Object.values(groupedBySystem)
        .flatMap(m => Object.entries(m))
        .filter(([k]) => k === parentName || `${Object.keys(groupedBySystem).find(maj => groupedBySystem[maj][parentName])}-${parentName}` === parentName)
        .flatMap(([_, ids]) => ids);

      setColorMap(prevColors => {
        const updated = { ...prevColors };
        childIds.forEach(id => {
          if (!selectedIds.includes(id)) return;
          if (!prevColors[id] || prevColors[id] === old) updated[id] = color;
        });
        return updated;
      });
      return next;
    });
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', position: 'relative' }}>
      {/* 左：選択UI */}
      <div style={{ zIndex: 2, overflowY: 'auto', maxHeight: '600px', width: '340px', userSelect: 'none' }}>
        {majorSystemOrder.filter(m => groupedBySystem[m]).map(major => {
          const middleGroups = groupedBySystem[major];
          const allIds = Object.values(middleGroups).flat();
          return (
            <div key={major}>
              {/* 既存の MajorGroupCheckbox コンポーネントをここへ差し替えてください */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={allIds.every(id => selectedIds.includes(id))}
                    onChange={() => toggleParentSelection(allIds, major)}
                  />
                  <strong>{major}</strong>
                  <input type="color" value={parentColorMap[major] || '#cccccc'} onChange={e => changeParentColor(major, e.target.value)} />
                </div>
                <div style={{ paddingLeft: 12 }}>
                  {middleSystemOrder.filter(mid => middleGroups[mid]).map(middle => (
                    <details key={middle} style={{ marginTop: 8 }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{middle}</summary>
                      <div style={{ paddingLeft: 8 }}>
                        {middleGroups[middle].map(id => (
                          <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 6 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <input type="checkbox" checked={selectedIds.includes(id)} onChange={() => toggleChildSelection(id)} />
                              <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {elementParts[id]?.name || id}
                              </span>
                            </label>
                            <input type="color" value={colorMap[id] || parentColorMap[major] || '#aaaaaa'} onChange={e => changeChildColor(id, e.target.value)} disabled={!selectedIds.includes(id)} />
                          </div>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 中央：3Dビュー */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div style={{ width: '100%', height: '1000px', border: '1px solid #ddd' }}>
          <Canvas
            shadows
            style={{ background: '#f7f7f7', width: '100%', height: '100%' }}
            camera={{ position: [5, 5, 5], fov: 50, near: 0.1, far: 1e7 }}
            onPointerMissed={() => setSelectedPart(null)} // 背景タップで選択解除
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
            <Suspense fallback={<Html center>Loading models...</Html>}>
              {selectedIds.map(id => (
                <Model
                  key={id}
                  url={`/models/bp3d/glb/${encodeURIComponent(id)}.glb`}
                  color={new THREE.Color(colorMap[id] || '#aaaaaa')}
                  onLoaded={(box: THREE.Box3) => handleModelLoaded(box, id)}
                  // Model 側が onPointerDown/onClick を受け取る実装であることを想定します
                  onPointerDown={(e: any) => { e.stopPropagation(); setSelectedPart(id); }}
                />
              ))}
            </Suspense>
            <CameraController box={mergedBox} />
          </Canvas>
        </div>
      </div>

      {/* 右：情報パネル */}
      <aside style={{
        width: '360px',
        maxHeight: '1000px',
        overflowY: 'auto',
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)'
      }}>
        {selectedPart ? (
          (() => {
            const info = elementParts[selectedPart];
            if (!info) return <div>情報が見つかりません。</div>;
            return (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <h2 style={{ margin: 0 }}>{info.name}</h2>
                  <button onClick={() => setSelectedPart(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>✕</button>
                </div>

                <p style={{ marginTop: 8 }}><strong>コンセプトID:</strong> {info.conceptId}</p>
                <p><strong>大分類:</strong> {info.majorCategory || '未分類'}</p>
                <p><strong>中分類:</strong> {info.middleCategory || '未分類'}</p>
                <p><strong>領域:</strong> {info.region || '未分類'}</p>

                <p><strong>親構造:</strong><br />
                  {Array.isArray(info.parentName) ? info.parentName.join(', ') : (info.parentName || 'なし')}
                </p>

                <hr />

                <section>
                  <h3 style={{ marginTop: 0 }}>説明</h3>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{info.description || 'この部位の説明がありません。JSON に description を追加してください。'}</p>
                </section>

                <section>
                  <h3>関連リソース</h3>
                  {info.imageUrl && <img src={info.imageUrl} alt={info.name} style={{ width: '100%', borderRadius: 6, marginBottom: 8 }} />}
                  {info.referenceUrl && <p><a href={info.referenceUrl} target="_blank" rel="noreferrer">参考リンクを開く</a></p>}
                  {/* 拡張: 外部論文リンクや英語名などをここに追加 */}
                </section>

                <section>
                  <h3>操作メモ</h3>
                  <ul style={{ marginTop: 4 }}>
                    <li>タップでこのパネルを開閉できます。</li>
                    <li>ドラッグで回転、ピンチ／スクロールでズーム。</li>
                  </ul>
                </section>
              </div>
            );
          })()
        ) : (
          <div>
            <h3 style={{ marginTop: 0 }}>部位をタップしてください</h3>
            <p>右パネルに詳細が表示されます。選択を解除するには背景をタップするか、右上の✕を押してください。</p>
          </div>
        )}
      </aside>
    </div>
  );
};

export default AnatomyViewer;
