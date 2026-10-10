// src/components/Pathology/PathologyLayout.tsx
import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import PathologySidebar from "./PathologySidebar";
import PathologyMDXPage from "./PathologyMDXPage";

const PathologyLayout: React.FC = () => {
  return (
    <div className="learning-workspace">
      {/* 中央 */}
      <div className="learning-content">
        <Suspense
          fallback={<div style={{ padding: "2rem" }}>読み込み中...</div>}
        >
          <Routes>
            <Route index element={<PathologyMDXPage />} />

            <Route path="*" element={<Navigate to="/pathology" replace />} />
          </Routes>
        </Suspense>
      </div>

      {/* サイドバー */}
      <aside className="learning-navigation">
        <PathologySidebar />
      </aside>
    </div>
  );
};

export default PathologyLayout;
