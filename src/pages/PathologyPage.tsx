// src/pages/PathologyPage.tsx
import React from "react";
import PathologyLayout from "../components/pathology/PathologyLayout";

const PathologyPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h1 style={{ margin: '1rem 0' }}>病理学ページ</h1>
      <PathologyLayout />
    </div>
  );
};

export default PathologyPage;
