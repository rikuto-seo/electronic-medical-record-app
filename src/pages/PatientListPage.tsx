// src/pages/PatientListPage.tsx
import React, { useContext, useState, useEffect } from 'react';
import { PatientContext } from '../components/PatientContext';
import { getReservations } from '../utils/reservationService';
import { Reservation } from '../types/reservation';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faIdCard } from '@fortawesome/free-solid-svg-icons';

const formatDateJP = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

const PatientListPage: React.FC = () => {
    const context = useContext(PatientContext);
    if (!context) throw new Error('PatientContext must be used within a PatientProvider');

    const { patients } = context;
    const navigate = useNavigate();

    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loadingReservations, setLoadingReservations] = useState(true);

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const data = await getReservations();
                setReservations(data);
            } catch (e) {
                console.error('予約情報取得エラー:', e);
            } finally {
                setLoadingReservations(false);
            }
        };
        fetchReservations();
    }, []);

    if (loadingReservations) return <p>予約情報を読み込み中...</p>;

    // 患者ごとに予約が1件でもあるかチェック
    const patientsWithReservation = patients.map((patient) => {
        const hasReservation = reservations.some(
            (r) =>
                r.patientId === patient.id &&
                r.date >= new Date() &&
                r.checkedIn !== true  // 来院済みは予約なしとみなす
        );
        return { ...patient, hasReservation };
    });


    return (
        <div>
            <h2>
                <FontAwesomeIcon icon={faList} style={{ marginRight: '0.5em', color: '#4A90E2' }} />
                患者一覧
            </h2>

            <table>
                <thead>
                    <tr>
                        <th>氏名</th>
                        <th>年齢</th>
                        <th>性別</th>
                        <th>初診日</th>
                        <th>予約</th>
                        <th>会員カード</th>
                    </tr>
                </thead>
                <tbody>
                    {patientsWithReservation.map((patient) => (
                        <tr
                            key={patient.id}
                            onClick={() => navigate(`/patients/${patient.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <td>
                                <Link to={`/patients/${patient.id}`} onClick={(e) => e.stopPropagation()}>
                                    {patient.name}
                                </Link>
                            </td>
                            <td>{patient.age}</td>
                            <td>{patient.gender}</td>
                            <td>{formatDateJP(patient.firstVisitDate)}</td>
                            <td>
                                {patient.hasReservation ? (
                                    <span style={{ color: 'green', fontWeight: 'bold' }}>あり</span>
                                ) : (
                                    <span style={{ color: 'gray' }}>なし</span>
                                )}
                            </td>
                            <td>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/patients/${patient.id}/card`);
                                    }}
                                    aria-label={`${patient.name}の会員カードを表示`}
                                >
                                    <FontAwesomeIcon icon={faIdCard} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default PatientListPage;
