// src/components/layout/AppLayout.tsx
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import './layout.css';

// 患者関連ページ
import NewPatientPage from '../../pages/NewPatientPage';
import PatientListPage from '../../pages/PatientListPage';
import PatientDetail from '../../pages/PatientDetail';
import ReservationPage from '../../pages/ReservationPage';
import PrintPage from '../../pages/PrintPage';
import PatientCardPage from '../../pages/PatientCardPage';
import PatientQRCodePage from '../../pages/PatientQRCodePage';
import PatientByNumberPage from '../../pages/PatientByNumberPage';
import ReservationCalendar from '../../components/reservation/ReservationCalendar';

// 学問ページ
import PathologyPage from '../../pages/PathologyPage';
import OrientalMedicinePage from '../../pages/OrientalMedicinePage';
import ClinicalMedicinePage from '../../pages/ClinicalMedicinePage';

import PhysiologyPage from '../../pages/PhysiologyPage';

const AnatomyPage = React.lazy(() => import('../../pages/AnatomyPage'));

const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header toggleSidebar={toggleSidebar} />

      {/* オーバーレイ：サイドバー開時のみ表示しクリックで閉じる */}
      {isSidebarOpen && (
        <div
          className="overlay active"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        {/* ここを修正 → flexを効かせる */}
        <main className="app-main" style={{ flex: 1, minHeight: 0 }}>
          <Routes>
            {/* 患者関連 */}
            <Route path="/patients/new" element={<NewPatientPage />} />
            <Route path="/patients" element={<PatientListPage />} />
            <Route path="/patients/by-number/:patientNumber" element={<PatientByNumberPage />} />
            <Route path="/patients/:id" element={<PatientDetail />} />
            <Route path="/reservations" element={<ReservationPage />} />
            <Route path="/calendar" element={<ReservationCalendar />} />
            <Route path="/patients/:patientId/records/:recordId/print" element={<PrintPage />} />
            <Route path="/patients/:patientId/records/print" element={<PrintPage />} />
            <Route path="/patients/:patientId/summary/print" element={<PrintPage mode="summary" />} />
            <Route path="/print/:patientId/:recordIds" element={<PrintPage />} />
            <Route path="/patients/:id/card" element={<PatientCardPage />} />
            <Route path="/patients/:id/qr" element={<PatientQRCodePage />} />

            {/* 学問ページ */}
            <Route path="/anatomy" element={<React.Suspense fallback={<p role="status">3D解剖を読み込み中…</p>}><AnatomyPage /></React.Suspense>} />
            <Route path="/pathology/*" element={<PathologyPage />} />
            <Route path="/oriental-medicine" element={<OrientalMedicinePage />} />
            <Route path="/clinical-medicine" element={<ClinicalMedicinePage />} />

            {/* 生理学ページ */}
            <Route path="/physiology/*" element={<PhysiologyPage />} />

            {/* それ以外のパスは患者一覧へリダイレクト */}
            <Route path="*" element={<Navigate to="/patients" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
