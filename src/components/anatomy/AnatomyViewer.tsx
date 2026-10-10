import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { Canvas } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import Model from "./Model";
import ModelBoundary from "./ModelBoundary";
import AnatomyCanvasBoundary from "./AnatomyCanvasBoundary";
import CameraController, { CameraRequest } from "./CameraController";
import {
  anatomyParts,
  partsById,
  systemColors,
  orderedRegions,
  matchesPart,
  presets,
  PresetId,
  Side,
  DisplayMode,
  presetIds,
  displayedIds,
  partOpacity,
} from "./anatomyCatalog";
import { assetBox, ViewDirection } from "./anatomyScene";
import { initialQueue, modelQueueReducer } from "./modelQueue";
import { noteFor } from "./anatomyNotes";
import { missingNerves, matchesMissingNerve } from "./nerveCoverage";
import "./anatomy.css";

const STORAGE_KEY = "clinic-anatomy-view-v1";
const unavailableNerves = missingNerves(anatomyParts);
const allRegions = orderedRegions(anatomyParts);
interface SavedView {
  selected: string[];
  focused: string[];
  mode: DisplayMode;
  opacity: number;
  colors: Record<string, string>;
  systems: Record<string, string>;
}
function readView(): SavedView | null {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (
      !value ||
      !Array.isArray(value.selected) ||
      !Array.isArray(value.focused)
    )
      return null;
    const selected = [
      ...new Set<string>(
        value.selected.filter(
          (id: unknown) => typeof id === "string" && partsById[id]?.asset,
        ),
      ),
    ];
    if (!selected.length) return null;
    const focused = [
      ...new Set<string>(
        value.focused.filter(
          (id: unknown) => typeof id === "string" && selected.includes(id),
        ),
      ),
    ];
    const colors = Object.fromEntries(
      Object.entries(value.colors || {}).filter(
        ([id, color]) =>
          partsById[id] &&
          typeof color === "string" &&
          /^#[0-9a-f]{6}$/i.test(color),
      ),
    );
    const systems = Object.fromEntries(
      Object.entries(value.systems || {}).filter(
        ([id, color]) =>
          systemColors[id] &&
          typeof color === "string" &&
          /^#[0-9a-f]{6}$/i.test(color),
      ),
    );
    return {
      selected,
      focused,
      colors: colors as Record<string, string>,
      systems: { ...systemColors, ...systems } as Record<string, string>,
      mode: ["normal", "context", "isolate"].includes(value.mode)
        ? value.mode
        : "context",
      opacity:
        typeof value.opacity === "number" && Number.isFinite(value.opacity)
          ? Math.max(0.05, Math.min(0.8, value.opacity))
          : 0.2,
    };
  } catch {
    return null;
  }
}
const SelectionCheckbox: React.FC<{
  label: string;
  ids: string[];
  selected: string[];
  onToggle: (ids: string[]) => void;
}> = ({ label, ids, selected, onToggle }) => {
  const ref = useRef<HTMLInputElement>(null);
  const count = ids.filter((id) => selected.includes(id)).length;
  useEffect(() => {
    if (ref.current)
      ref.current.indeterminate = count > 0 && count < ids.length;
  }, [count, ids.length]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      disabled={!ids.length}
      checked={!!ids.length && count === ids.length}
      onChange={() => onToggle(ids)}
    />
  );
};
function unionBox(ids: string[]) {
  const box = new THREE.Box3();
  ids.forEach((id) => {
    const bounds = partsById[id]?.asset?.bounds;
    if (bounds) box.union(assetBox(bounds));
  });
  return box.isEmpty() ? null : box;
}
const viewNames: [ViewDirection, string][] = [
  ["front", "正面"],
  ["back", "背面"],
  ["right", "患者の右側"],
  ["left", "患者の左側"],
  ["top", "上面"],
];
const AnatomyViewer: React.FC = () => {
  const [saved] = useState(readView);
  const [selected, setSelected] = useState<string[]>(
    () => saved?.selected || presetIds("shoulder", "both"),
  );
  const [focused, setFocused] = useState<string[]>(() => saved?.focused || []);
  const [mode, setMode] = useState<DisplayMode>(saved?.mode || "context");
  const [opacity, setOpacity] = useState(saved?.opacity ?? 0.2);
  const [colors, setColors] = useState<Record<string, string>>(
    saved?.colors || {},
  );
  const [systemColorMap, setSystemColorMap] = useState(
    saved?.systems || systemColors,
  );
  const [side, setSide] = useState<Side>("both");
  const [preset, setPreset] = useState<PresetId>("shoulder");
  const [search, setSearch] = useState("");
  const [systemFilter, setSystemFilter] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [regionSearches, setRegionSearches] = useState<Record<string, string>>(
    {},
  );
  const [detailId, setDetailId] = useState<string | null>(
    saved?.focused[0] || null,
  );
  const [labels, setLabels] = useState(true);
  const [pickContext, setPickContext] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "骨格系:上肢": true,
    "筋系:上肢": true,
  });
  const [message, setMessage] = useState("");
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [camera, setCamera] = useState<CameraRequest>({
    sequence: 0,
    scope: "all",
    view: "front",
  });
  const visible = useMemo(
    () => displayedIds(selected, focused, mode),
    [selected, focused, mode],
  );
  const [queue, dispatch] = useReducer(
    modelQueueReducer,
    visible,
    initialQueue,
  );
  useEffect(() => {
    dispatch({ type: "select", ids: visible });
  }, [visible]);
  const loaded = useCallback(
    (id: string) => dispatch({ type: "loaded", id }),
    [],
  );
  const failed = useCallback(
    (id: string) => dispatch({ type: "failed", id }),
    [],
  );
  const selectPart = useCallback((id: string, additive: boolean) => {
    if (!partsById[id]?.asset) return;
    setSelected((previous) =>
      previous.includes(id) ? previous : [...previous, id],
    );
    setFocused((previous) =>
      additive
        ? previous.includes(id)
          ? previous.filter((item) => item !== id)
          : [...previous, id]
        : [id],
    );
    setDetailId(id);
  }, []);
  const box = useMemo(() => unionBox(visible), [visible]);
  const focusBox = useMemo(
    () => unionBox(focused.filter((id) => visible.includes(id))),
    [focused, visible],
  );
  const filtered = useMemo(
    () =>
      anatomyParts.filter(
        (part) =>
          matchesPart(part, search, side) &&
          (!systemFilter || part.system === systemFilter) &&
          (!regionFilter || part.region === regionFilter),
      ),
    [search, side, systemFilter, regionFilter],
  );
  const missingResults = useMemo(
    () =>
      !systemFilter || systemFilter === "神経系"
        ? unavailableNerves.filter((part) =>
            matchesMissingNerve(part, search, side, regionFilter),
          )
        : [],
    [systemFilter, search, side, regionFilter],
  );
  const grouped = useMemo(
    () =>
      Object.keys(systemColors)
        .map((system) => ({
          system,
          parts: filtered.filter((part) => part.system === system),
        }))
        .filter((group) => group.parts.length),
    [filtered],
  );
  const toggleDisplay = (ids: string[]) => {
    const valid = ids.filter((id) => partsById[id]?.asset);
    const remove = valid.every((id) => selected.includes(id));
    setSelected((previous) =>
      remove
        ? previous.filter((id) => !valid.includes(id))
        : [...new Set([...previous, ...valid])],
    );
    if (remove) {
      setFocused((previous) => previous.filter((id) => !valid.includes(id)));
      if (detailId && valid.includes(detailId)) setDetailId(null);
    }
  };
  const applyPreset = () => {
    setSelected(presetIds(preset, side));
    setFocused([]);
    setDetailId(null);
    setMode("context");
    setMessage("");
    setCamera((previous) => ({
      sequence: previous.sequence + 1,
      scope: "all",
      view: "front",
    }));
  };
  const frame = (scope: "all" | "focus", view?: ViewDirection) =>
    setCamera((previous) => ({ sequence: previous.sequence + 1, scope, view }));
  const retry = (ids: string[]) => {
    ids.forEach((id) =>
      useGLTF.clear(`/models/bp3d/glb/${encodeURIComponent(id)}.glb`),
    );
    setAttempts((previous) => ({
      ...previous,
      ...Object.fromEntries(ids.map((id) => [id, (previous[id] || 0) + 1])),
    }));
    dispatch({ type: "retry", ids });
  };
  const saveView = () => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selected,
          focused,
          mode,
          opacity,
          colors,
          systems: systemColorMap,
        }),
      );
      setMessage("このブラウザーに表示設定を保存しました。");
    } catch {
      setMessage("表示設定を保存できませんでした。");
    }
  };
  const reset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* session still works */
    }
    setSelected(presetIds("shoulder", "both"));
    setFocused([]);
    setDetailId(null);
    setMode("context");
    setOpacity(0.2);
    setColors({});
    setSystemColorMap(systemColors);
    setSearch("");
    setSystemFilter("");
    setRegionFilter("");
    setRegionSearches({});
    setSide("both");
    setPreset("shoulder");
    setMessage("初期表示に戻しました。");
    frame("all", "front");
  };
  const settled = visible.filter((id) => queue.statuses[id]).length;
  const failures = visible.filter((id) => queue.statuses[id] === "failed");
  const info = detailId ? partsById[detailId] : null;
  const note = info ? noteFor(info.englishName) : undefined;
  return (
    <div className="anatomy-tool">
      <section className="anatomy-preset-bar" aria-label="領域プリセット">
        <label>
          見る領域
          <select
            value={preset}
            onChange={(event) => setPreset(event.target.value as PresetId)}
          >
            {presets.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          左右
          <select
            value={side}
            onChange={(event) => setSide(event.target.value as Side)}
          >
            <option value="both">両側</option>
            <option value="right">患者の右</option>
            <option value="left">患者の左</option>
          </select>
        </label>
        <button type="button" onClick={applyPreset}>
          領域を表示
        </button>
        <button
          type="button"
          className="record-secondary"
          onClick={saveView}
          disabled={!selected.length}
        >
          表示設定を保存
        </button>
        <button type="button" className="record-secondary" onClick={reset}>
          初期表示に戻す
        </button>
      </section>
      {message && (
        <p role="status" className="patient-help">
          {message}
        </p>
      )}
      <section className="anatomy-search-bar" aria-label="部位を検索して選択">
        <label className="anatomy-search">
          部位を探す
          <input
            type="search"
            aria-label="解剖部位を検索"
            placeholder="例：正中神経・棘上筋・膝 / 英語・FMA ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label>
          系統
          <select
            aria-label="検索する系統"
            value={systemFilter}
            onChange={(event) => setSystemFilter(event.target.value)}
          >
            <option value="">すべての系統</option>
            {Object.keys(systemColors).map((system) => (
              <option key={system} value={system}>
                {system}
              </option>
            ))}
          </select>
        </label>
        <label>
          領域
          <select
            aria-label="検索する領域"
            value={regionFilter}
            onChange={(event) => setRegionFilter(event.target.value)}
          >
            <option value="">すべての領域</option>
            {allRegions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="record-secondary"
          onClick={() => {
            setSearch("");
            setSystemFilter("");
            setRegionFilter("");
            setRegionSearches({});
            setSide("both");
          }}
        >
          検索条件をクリア
        </button>
        <p className="anatomy-help">
          検索結果は部位一覧に表示されます。チェックで表示、◎で注目。左右は上の「左右」で絞れます。
        </p>
      </section>
      {(systemFilter === "神経系" ||
        (!!search.trim() && !!missingResults.length)) && (
        <section className="anatomy-coverage" aria-label="神経モデルの収録状況">
          <strong>神経系には未収録の部位があります</strong>
          <p>
            下肢の主要な末梢神経と右上肢の一部は、このモデルデータに含まれていません。未収録の部位は3D表示できません。
          </p>
          {!!missingResults.length && (
            <details open={!!search.trim()}>
              <summary>
                検索条件に合う未収録部位：{missingResults.length}件
              </summary>
              <ul>
                {missingResults.map((part) => (
                  <li key={part.english}>
                    {part.name}
                    <span>3Dモデル未収録</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>
      )}
      <div className="anatomy-workspace">
        <aside className="anatomy-controls" aria-label="部位の表示と注目">
          <h2 className="anatomy-list-title">部位を選ぶ</h2>
          <p className="anatomy-help">
            チェックで表示、◎で注目。左右は患者基準です。
          </p>
          <div className="anatomy-list-actions">
            <span>収録済み {filtered.length}件</span>
            <button
              type="button"
              className="record-secondary"
              onClick={() => {
                setSelected([]);
                setFocused([]);
                setDetailId(null);
              }}
            >
              表示をクリア
            </button>
          </div>
          {!filtered.length && (
            <p>
              {missingResults.length
                ? "この条件で表示できる収録済みの部位はありません。未収録部位は上の案内をご確認ください。"
                : "該当する部位はありません。検索語・領域・系統・左右を変えてください。"}
            </p>
          )}
          {grouped.map(({ system, parts }) => {
            const ids = parts
              .filter((part) =>
                matchesPart(
                  part,
                  regionSearches[`${system}:${part.region}`] || "",
                  side,
                ),
              )
              .filter((part) => part.asset)
              .map((part) => part.id);
            return (
              <section key={system} className="anatomy-system">
                <div className="anatomy-system-heading">
                  <SelectionCheckbox
                    label={`${system}の検索結果をまとめて表示`}
                    ids={ids}
                    selected={selected}
                    onToggle={toggleDisplay}
                  />
                  <strong>{system}</strong>
                  <input
                    type="color"
                    aria-label={`${system}の色`}
                    value={systemColorMap[system]}
                    onChange={(event) =>
                      setSystemColorMap((previous) => ({
                        ...previous,
                        [system]: event.target.value,
                      }))
                    }
                  />
                </div>
                {system === "神経系" && (
                  <p className="anatomy-help">
                    現在の収録データは頭部・左上肢が中心です。下肢の主要神経と右上肢の一部は未収録です。
                  </p>
                )}
                {orderedRegions(parts).map((region) => {
                  const regionParts = parts
                    .filter((part) => part.region === region)
                    .sort(
                      (a, b) =>
                        (a.order || 0) - (b.order || 0) ||
                        a.japaneseName.localeCompare(b.japaneseName, "ja"),
                    );
                  const groupKey = `${system}:${region}`;
                  const regionSearch = regionSearches[groupKey] || "";
                  const children = regionParts.filter((part) =>
                    matchesPart(part, regionSearch, side),
                  );
                  const childIds = children
                    .filter((part) => part.asset)
                    .map((part) => part.id);
                  const open =
                    !!search.trim() || !!regionFilter || !!openGroups[groupKey];
                  return (
                    <details
                      key={region}
                      open={open}
                      onToggle={(event) => {
                        const next = event.currentTarget.open;
                        if (!search.trim() && !regionFilter)
                          setOpenGroups((previous) =>
                            previous[groupKey] === next
                              ? previous
                              : { ...previous, [groupKey]: next },
                          );
                      }}
                    >
                      <summary>
                        <span>{region}</span>
                        <small>
                          {children.length} / {regionParts.length}件
                        </small>
                      </summary>
                      {open && (
                        <div className="anatomy-region-parts">
                          <label className="anatomy-region-search">
                            {region}の部位を探す
                            <input
                              type="search"
                              aria-label={`${system}・${region}の部位を検索`}
                              placeholder="この領域の中で検索"
                              value={regionSearch}
                              onChange={(event) =>
                                setRegionSearches((previous) => ({
                                  ...previous,
                                  [groupKey]: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label className="anatomy-select-region">
                            <SelectionCheckbox
                              label={`${system}・${region}の検索結果をまとめて表示`}
                              ids={childIds}
                              selected={selected}
                              onToggle={toggleDisplay}
                            />
                            この領域をまとめて表示
                          </label>
                          {!children.length && (
                            <p className="anatomy-help">
                              この領域に一致する部位はありません。
                            </p>
                          )}
                          {children.map((part) => (
                            <div
                              key={part.id}
                              className={`anatomy-part-row${focused.includes(part.id) ? " is-focused" : ""}`}
                            >
                              <label
                                title={`${part.japaneseName} / ${part.englishName}`}
                              >
                                <input
                                  type="checkbox"
                                  aria-label={`${part.japaneseName}を表示 ${part.id}`}
                                  disabled={!part.asset}
                                  checked={selected.includes(part.id)}
                                  onChange={() => toggleDisplay([part.id])}
                                />
                                <span>
                                  {part.japaneseName}
                                  {!part.asset && <small>モデル未登録</small>}
                                </span>
                              </label>
                              <button
                                type="button"
                                className="anatomy-focus-button"
                                aria-label={`${part.japaneseName}に注目 ${part.id}`}
                                aria-pressed={focused.includes(part.id)}
                                disabled={!part.asset}
                                title="注目部位に追加・解除"
                                onClick={() => selectPart(part.id, true)}
                              >
                                ◎
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </details>
                  );
                })}
              </section>
            );
          })}
        </aside>
        <div className="anatomy-main">
          <section className="anatomy-view-controls" aria-label="3D表示の操作">
            <div className="anatomy-actions" aria-label="表示方法">
              <button
                type="button"
                aria-pressed={mode === "normal"}
                onClick={() => setMode("normal")}
              >
                通常表示
              </button>
              <button
                type="button"
                aria-pressed={mode === "context"}
                onClick={() => setMode("context")}
              >
                周囲を半透明
              </button>
              <button
                type="button"
                aria-pressed={mode === "isolate"}
                disabled={!focused.length}
                onClick={() => setMode("isolate")}
              >
                注目部位のみ表示
              </button>
            </div>
            {mode === "context" && (
              <div className="anatomy-transparency">
                <label>
                  周囲の濃さ：{Math.round(opacity * 100)}%
                  <input
                    type="range"
                    aria-label="周囲の不透明度"
                    min="5"
                    max="80"
                    step="5"
                    value={Math.round(opacity * 100)}
                    onChange={(event) =>
                      setOpacity(Number(event.target.value) / 100)
                    }
                  />
                </label>
                <small>低いほど透けます。注目部位の濃さは変わりません。</small>
                <label>
                  <input
                    type="checkbox"
                    checked={pickContext}
                    onChange={(event) => setPickContext(event.target.checked)}
                  />
                  半透明の部位もクリック選択
                </label>
              </div>
            )}
            <div className="anatomy-actions">
              <button
                type="button"
                className="record-secondary"
                disabled={!visible.length}
                onClick={() => frame("all")}
              >
                表示全体に合わせる
              </button>
              <button
                type="button"
                className="record-secondary"
                disabled={!focused.length}
                onClick={() => frame("focus")}
              >
                注目部位に寄る
              </button>
              {viewNames.map(([view, label]) => (
                <button
                  type="button"
                  className="record-secondary"
                  key={view}
                  disabled={!visible.length}
                  onClick={() => frame("all", view)}
                >
                  {label}
                </button>
              ))}
              <label>
                <input
                  type="checkbox"
                  checked={labels}
                  onChange={(event) => setLabels(event.target.checked)}
                />
                部位名ラベル
              </label>
            </div>
          </section>
          <div className="anatomy-canvas-wrap" aria-label="3D解剖ビュー">
            <AnatomyCanvasBoundary onRetry={() => retry(visible)}>
              <Canvas
                frameloop="demand"
                dpr={[1, 1.5]}
                gl={{ antialias: true }}
                camera={{ position: [0, 1, 3], fov: 45, near: 0.001, far: 100 }}
                fallback={
                  <p role="alert">
                    3D表示を利用できません。WebGL対応のブラウザーで開いてください。
                  </p>
                }
              >
                <color attach="background" args={["#eef3f5"]} />
                <ambientLight intensity={1.1} />
                <directionalLight position={[2, 4, 5]} intensity={2} />
                <directionalLight position={[-3, 2, -4]} intensity={1} />
                {queue.admitted
                  .filter((id) => visible.includes(id))
                  .map((id) => {
                    const url = `/models/bp3d/glb/${encodeURIComponent(id)}.glb`;
                    const alpha = partOpacity(id, focused, mode, opacity);
                    return (
                      <ModelBoundary
                        key={id}
                        id={id}
                        url={url}
                        attempt={attempts[id] || 0}
                        onFailed={failed}
                      >
                        <Model
                          id={id}
                          url={url}
                          color={
                            colors[id] || systemColorMap[partsById[id].system]
                          }
                          opacity={alpha}
                          focused={focused.includes(id)}
                          pickable={alpha === 1 || pickContext}
                          onLoaded={loaded}
                          onSelect={selectPart}
                        />
                      </ModelBoundary>
                    );
                  })}
                {labels &&
                  focused
                    .filter(
                      (id) =>
                        visible.includes(id) && queue.statuses[id] === "loaded",
                    )
                    .map((id) => {
                      const bounds = assetBox(partsById[id].asset!.bounds),
                        center = bounds.getCenter(new THREE.Vector3());
                      return (
                        <Html
                          key={`label-${id}`}
                          position={[center.x, bounds.max.y + 0.015, center.z]}
                          center
                          style={{ pointerEvents: "none" }}
                        >
                          <span className="anatomy-label">
                            {partsById[id].japaneseName}
                          </span>
                        </Html>
                      );
                    })}
                <CameraController
                  box={box}
                  focusBox={focusBox}
                  request={camera}
                />
              </Canvas>
            </AnatomyCanvasBoundary>
            {!visible.length && (
              <div className="anatomy-empty">
                <strong>表示する部位を選んでください</strong>
                <p>上の領域プリセット、または左の一覧から選べます。</p>
                <button type="button" onClick={applyPreset}>
                  選択した領域を表示
                </button>
              </div>
            )}
            <div className="anatomy-progress" role="status">
              表示 {visible.length}部位 / 読込済み {settled - failures.length}
              部位
              {settled < visible.length
                ? ` / 読込中 ${visible.length - settled}部位`
                : ""}
              {failures.length ? ` / 読込失敗 ${failures.length}部位` : ""}
            </div>
          </div>
          <p className="anatomy-help">
            ドラッグ：回転 ／ 右ドラッグ：移動 ／
            ホイール：拡大・縮小。クリックで注目、Shift＋クリックで複数選択。半透明表示は、表示中の注目部位以外を透かします。
          </p>
          {!!failures.length && (
            <section className="anatomy-load-errors" role="alert">
              <strong>
                一部の部位を読み込めませんでした。他の部位は表示を続けます。
              </strong>
              <button
                type="button"
                className="record-secondary"
                onClick={() => retry(failures)}
              >
                失敗した部位を再読込
              </button>
              <ul>
                {failures.slice(0, 10).map((id) => (
                  <li key={id}>{partsById[id].japaneseName}</li>
                ))}
              </ul>
            </section>
          )}
          <section className="anatomy-focus-list" aria-label="注目している部位">
            <h2>
              注目部位 <small>{focused.length}件</small>
            </h2>
            {!focused.length ? (
              <p className="anatomy-help">
                一覧の◎、または3D上の部位を選ぶと、周囲を半透明にして確認できます。
              </p>
            ) : (
              <div className="anatomy-actions">
                {focused.map((id) => (
                  <div className="anatomy-focus-chip" key={id}>
                    <button type="button" onClick={() => setDetailId(id)}>
                      {partsById[id].japaneseName}
                    </button>
                    <button
                      type="button"
                      className="record-secondary"
                      aria-label={`${partsById[id].japaneseName}の注目を解除`}
                      onClick={() =>
                        setFocused((previous) =>
                          previous.filter((item) => item !== id),
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="record-secondary"
                  onClick={() => {
                    setFocused([]);
                    setDetailId(null);
                  }}
                >
                  注目をすべて解除
                </button>
              </div>
            )}
          </section>
          {info && (
            <section className="anatomy-info" aria-label="選択した部位の情報">
              <div className="anatomy-info-heading">
                <div>
                  <h2>{info.japaneseName}</h2>
                  <p>{info.englishName}</p>
                </div>
                <button
                  type="button"
                  className="record-secondary"
                  aria-label="部位の説明を閉じる"
                  onClick={() => setDetailId(null)}
                >
                  閉じる
                </button>
              </div>
              <dl>
                <div>
                  <dt>系統</dt>
                  <dd>{info.system}</dd>
                </div>
                <div>
                  <dt>領域</dt>
                  <dd>{info.region}</dd>
                </div>
                <div>
                  <dt>解剖ID</dt>
                  <dd>{info.conceptId}</dd>
                </div>
              </dl>
              <p>
                {note?.description ||
                  info.description ||
                  "この部位の詳しい説明はまだ登録されていません。名称・分類と3D上の位置を確認できます。"}
              </p>
              <div className="anatomy-actions">
                <label>
                  この部位の色
                  <input
                    type="color"
                    aria-label={`${info.japaneseName}の色`}
                    value={colors[info.id] || systemColorMap[info.system]}
                    onChange={(event) =>
                      setColors((previous) => ({
                        ...previous,
                        [info.id]: event.target.value,
                      }))
                    }
                  />
                </label>
                {(note?.referenceUrl || info.referenceUrl) && (
                  <a
                    href={note?.referenceUrl || info.referenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    解剖情報の出典
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
      <footer className="anatomy-credit">
        BodyParts3D © ライフサイエンス統合データベースセンター licensed under
        CC表示 4.0
        国際。表示時に座標変換、配色・日本語名称の修正を行っています。
        <a
          href="https://dbarchive.biosciencedbc.jp/jp/bodyparts3d/lic.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          モデル・名称の出典
        </a>
      </footer>
    </div>
  );
};
export default AnatomyViewer;
