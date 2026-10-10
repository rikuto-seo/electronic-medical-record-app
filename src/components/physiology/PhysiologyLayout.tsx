// src/components/physiology/PhysiologyLayout.tsx
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PhysiologySidebar from "./PhysiologySidebar";

const Red = (props: any) => (
  <span style={{ color: "#e63946", fontWeight: "bold" }}>{props.children}</span>
);

const components = { Red };

// 🔹 require.context で自動取得
const requireMDX = require.context("./physiology-mdx", true, /\.mdx$/);

const mdxModules: { [key: string]: React.ComponentType<any> } = {};
requireMDX.keys().forEach((key) => {
  mdxModules[key] = requireMDX(key).default;
});

const PhysiologyLayout: React.FC = () => {
  return (
    <div className="learning-workspace">
      {/* 中央 */}
      <div className="learning-content">
        <Suspense
          fallback={<div style={{ padding: "2rem" }}>読み込み中...</div>}
        >
          <Routes>
            <Route
              path="/"
              element={
                <div style={{ fontSize: "1.5rem", color: "#333" }}>
                  生理学ページへようこそ
                </div>
              }
            />

            {Object.entries(mdxModules).map(([filePath, Component]) => {
              // ./part1/chapter1/A.mdx -> part1/chapter1/A
              const routePath = filePath
                .replace("./", "")
                .replace(/\.mdx$/, "");
              return (
                <Route
                  key={routePath}
                  path={routePath}
                  element={<Component components={components} />}
                />
              );
            })}

            <Route path="*" element={<Navigate to="/physiology" replace />} />
          </Routes>
        </Suspense>
      </div>

      {/* サイドバー */}
      <aside className="learning-navigation">
        <PhysiologySidebar />
      </aside>
    </div>
  );
};

export default PhysiologyLayout;
