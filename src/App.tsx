import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import PatientList from './pages/PatientList';
import { PatientProvider } from './components/PatientContext';
import PrintPage from './pages/PrintPage';
import PatientDetail from './pages/PatientDetail';
import LoginPage from './pages/LoginPage';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import PatientCardPage from './pages/PatientCardPage';
import PatientQRCodePage from './pages/PatientQRCodePage';

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthenticated(!!user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <p>読み込み中...</p>;

  return authenticated ? <>{children}</> : <Navigate to="/login" replace state={{ from: location }} />;
};

const AppLayout: React.FC = () => (
  <div style={{ display: 'flex' }}>
    <Sidebar />
    <main style={{ padding: '1rem', flex: 1 }}>
      <Routes>
        <Route path="/patients" element={<PatientList />} />
        <Route path="/patients/:id" element={<PatientDetail />} />
        <Route path="/patients/:patientId/records/:recordId/print" element={<PrintPage />} />
        <Route path="/print/:patientId/:recordIds" element={<PrintPage />} />
        <Route path="*" element={<Navigate to="/patients" replace />} />
        <Route path="/patients/:id/card" element={<PatientCardPage />} />
        <Route path="/patients/:id/qr" element={<PatientQRCodePage />} />
      </Routes>
    </main>
  </div>
);

const App: React.FC = () => {
  return (
    <PatientProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </PatientProvider>
  );
};

export default App;
