// pages/PatientCardPage.tsx
import React, { useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PatientContext } from '../components/PatientContext';
import ClinicCard from '../components/ClinicCard';

const PatientCardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const context = useContext(PatientContext);
  const navigate = useNavigate();
  if (!context) return null;

  const patient = context.patients.find((p) => p.id === id);
  if (!patient) return <p>患者が見つかりません</p>;

  return (
    <div>
      <h2 className="no-print">会員カードの表示・印刷</h2>

      <button
        className="no-print"
        onClick={() => window.print()}
        style={{ marginTop: '1rem' }}
      >
        印刷する
      </button>

      <div id="print-area">
        <ClinicCard
          name={patient.name}
          birthday={patient.birthDate}
          patientId={patient.id}
        />
      </div>
      
      <button
        className="no-print"
        onClick={() => navigate(-1)}
        style={{ marginBottom: '1rem' }}
      >
        戻る
      </button>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 91mm;
            height: 55mm;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
        }
      `}</style>
    </div>
  );
};

export default PatientCardPage;
