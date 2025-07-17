import React, { useContext, useState } from 'react';
import { PatientContext } from '../components/PatientContext';
import { useNavigate, Link } from 'react-router-dom';
import PatientForm from '../components/patient-form/PatientForm';
import QRCodeModal from '../components/QRCodeModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faList, faQrcode, faIdCard } from '@fortawesome/free-solid-svg-icons';

const formatDateJP = (dateStr: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const PatientList: React.FC = () => {
  const context = useContext(PatientContext);
  if (!context) throw new Error('PatientContext must be used within a PatientProvider');

  const { patients } = context;
  const navigate = useNavigate();

  const [searchName, setSearchName] = useState('');
  const [filterGender, setFilterGender] = useState('すべて');
  const [qrPatient, setQrPatient] = useState<{ id: string; name: string } | null>(null);

  const handleRowClick = (id: string) => {
    navigate(`/patients/${id}`);
  };

  // フィルター処理（名前部分一致 + 性別）
  const filteredPatients = patients.filter((patient) => {
    const matchName = patient.name.toLowerCase().includes(searchName.toLowerCase());
    const matchGender = filterGender === 'すべて' || patient.gender === filterGender;
    return matchName && matchGender;
  });

  return (
    <div>
      <h2>
        <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: '0.5em', color: '#4A90E2' }} />
        新規患者
      </h2>

      <PatientForm />
      <br />

      <h2>
        <FontAwesomeIcon icon={faList} style={{ marginRight: '0.5em', color: '#4A90E2' }} />
        患者一覧
      </h2>

      {/* 検索フォーム */}
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="searchName">患者名で検索: </label>
        <input
          id="searchName"
          type="text"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          placeholder="名前の一部を入力"
        />
      </div>

      {/* 性別フィルター */}
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="filterGender">性別で絞り込み: </label>
        <select
          id="filterGender"
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
        >
          <option value="すべて">すべて</option>
          <option value="男性">男性</option>
          <option value="女性">女性</option>
          <option value="その他">その他</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>氏名</th>
            <th>年齢</th>
            <th>性別</th>
            <th>初診日</th>
            <th>QRコード</th>
            <th>会員カード</th> {/* 追加 */}
          </tr>
        </thead>
        <tbody>
          {filteredPatients.map((patient) => (
            <tr
              key={patient.id}
              onClick={() => handleRowClick(patient.id)}
              style={{ cursor: 'pointer' }}
            >
              <td>
                <Link
                  to={`/patients/${patient.id}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {patient.name}
                </Link>
              </td>
              <td>{patient.age}</td>
              <td>{patient.gender}</td>
              <td>{formatDateJP(patient.firstVisitDate)}</td>
              <td>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setQrPatient({ id: patient.id, name: patient.name });
                  }}
                  aria-label={`${patient.name}のQRコードを表示`}
                >
                  <FontAwesomeIcon icon={faQrcode} />
                </button>
              </td>
              <td>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/patients/${patient.id}/card`);
                  }}
                  aria-label={`${patient.name}の会員カードを表示`}
                  style={{ cursor: 'pointer' }}
                >
                  <FontAwesomeIcon icon={faIdCard} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* QRコードモーダル */}
      {qrPatient && (
        <QRCodeModal
          patientId={qrPatient.id}
          patientName={qrPatient.name}
          onClose={() => setQrPatient(null)}
        />
      )}
    </div>
  );
};

export default PatientList;
