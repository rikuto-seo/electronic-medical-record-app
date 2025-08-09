// src/components/layout/AppLayout.tsx
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header'; // ハンバーガーメニューを含むHeaderコンポーネント想定
import NewPatientPage from '../../pages/NewPatientPage';
import PatientListPage from '../../pages/PatientListPage';
import PatientDetail from '../../pages/PatientDetail';
import ReservationPage from '../../pages/ReservationPage';
import PrintPage from '../../pages/PrintPage';
import PatientCardPage from '../../pages/PatientCardPage';
import PatientQRCodePage from '../../pages/PatientQRCodePage';
import ReservationCalendar from '../../components/reservation/ReservationCalendar'; // ← 追加
import AnatomyPage from '../../pages/AnatomyPage';
import PhysiologyPage from '../../pages/PhysiologyPage';
import PathologyPage from '../../pages/PathologyPage';
import OrientalMedicinePage from '../../pages/OrientalMedicinePage';
import ClinicalMedicinePage from '../../pages/ClinicalMedicinePage';

const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header toggleSidebar={toggleSidebar} />

      {/* オーバーレイ：サイドバー開時のみ表示しクリックで閉じる */}
      {isSidebarOpen && (
        <div
          className="overlay active"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <main style={{ flex: 1, padding: '1rem' }}>
          <Routes>
            <Route path="/patients/new" element={<NewPatientPage />} />
            <Route path="/patients" element={<PatientListPage />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/reservations" element={<ReservationPage />} />
            <Route path="/calendar" element={<ReservationCalendar />} />
            <Route path="/patients/:patientId/records/:recordId/print" element={<PrintPage />} />
            <Route path="/print/:patientId/:recordIds" element={<PrintPage />} />
            <Route path="/patients/:id/card" element={<PatientCardPage />} />
            <Route path="/patients/:id/qr" element={<PatientQRCodePage />} />
            <Route path="*" element={<Navigate to="/patients" replace />} />

            <Route path="/anatomy" element={<AnatomyPage />} />
            <Route path="/physiology" element={<PhysiologyPage />} />
            <Route path="/pathology" element={<PathologyPage />} />
            <Route path="/oriental-medicine" element={<OrientalMedicinePage />} />
            <Route path="/clinical-medicine" element={<ClinicalMedicinePage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};


export default AppLayout;
