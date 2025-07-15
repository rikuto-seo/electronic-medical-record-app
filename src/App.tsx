// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import PatientList from './pages/PatientList';
import { PatientProvider } from './components/PatientContext';
import PrintPage from './pages/PrintPage';
import PatientDetail from './pages/PatientDetail';


const App: React.FC = () => {
  return (
    <PatientProvider>
      <Router>
        <div style={{ display: 'flex' }}>
          <Sidebar />
          <main style={{ padding: '1rem', flex: 1 }}>
            <Routes>
              <Route path="/patients" element={<PatientList />} />
              <Route path="/patients/:id" element={<PatientDetail />} />
              <Route path="/patients/:patientId/records/:recordId/print" element={<PrintPage />} /> {/* 追加 */}
              <Route path="/print/:patientId/:recordIds" element={<PrintPage />} />
              <Route path="*" element={<Navigate to="/patients" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </PatientProvider>
  );
};

export default App;
