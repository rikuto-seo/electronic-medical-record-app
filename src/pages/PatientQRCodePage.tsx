// src/pages/PatientQRCodePage.tsx
import React, { useContext } from 'react';
import { useParams } from 'react-router-dom';
import { PatientContext } from '../components/PatientContext';
import ClinicCard from '../components/ClinicCard'; // 先ほどのQRコード会員カード表示コンポーネント

const PatientQRCodePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const context = useContext(PatientContext);
  if (!context) throw new Error('PatientContext must be used within a PatientProvider');

  const patient = context.patients.find((p) => p.id === id);

  if (!patient) return <p>患者が見つかりません。</p>;

  return (
    <div>
      <h1>患者QRコードページ</h1>
      <ClinicCard
        name={patient.name}
        birthday={patient.birthDate} // birthDateが正しい
        patientId={patient.id}
      />
    </div>
  );
};

export default PatientQRCodePage;
