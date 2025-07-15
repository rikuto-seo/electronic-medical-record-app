//src/pages/PatientList.tsx
import React, { useContext } from 'react';
import { PatientContext } from '../components/PatientContext';
import { useNavigate, Link } from 'react-router-dom';
import PatientForm from '../components/patient-form/PatientForm';

const formatDateJP = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const PatientList: React.FC = () => {
  const context = useContext(PatientContext);
  if (!context) throw new Error('PatientContext must be used within a PatientProvider');

  const { patients, addPatient } = context;
  const navigate = useNavigate();

  const handleRowClick = (id: string) => {
    navigate(`/patients/${id}`);
  };

  return (
    <div>
      <h2>患者一覧</h2>

      {/* 患者追加フォームも表示 */}
      <PatientForm onSubmit={addPatient} />

      <table>
        <thead>
          <tr>
            <th>氏名</th>
            <th>年齢</th>
            <th>性別</th>
            <th>初診日</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr
              key={patient.id}
              onClick={() => handleRowClick(patient.id)}
            >
              <td>
                <Link
                  to={`/patients/${patient.id}`}
                  onClick={e => e.stopPropagation()}
                >
                  {patient.name}
                </Link>
              </td>
              <td>{patient.age}</td>
              <td>{patient.gender}</td>
              <td>{formatDateJP(patient.firstVisitDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PatientList;
