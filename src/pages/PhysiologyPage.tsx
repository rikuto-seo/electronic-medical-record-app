// src/pages/PhysiologyPage.tsx
import React from "react";
import PhysiologyLayout from "../components/physiology/PhysiologyLayout";

const PhysiologyPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h1 style={{ margin: '1rem 0' }}>生理学ページ</h1>
      <PhysiologyLayout />
    </div>
  );
};

export default PhysiologyPage;
