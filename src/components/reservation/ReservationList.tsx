// src/components/reservation/ReservationList.tsx

import React, { useEffect, useState } from 'react';
import { getReservations } from '../../utils/reservationService';
import { markAsCheckedIn } from '../../utils/reservationService'; // 追加
import { Reservation } from '../../types/reservation';
import { getPatientNameById } from '../../utils/patientService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faListAlt, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const ReservationList: React.FC = () => {
    const [reservations, setReservations] = useState<(Reservation & { patientName?: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReservations = async () => {
            setLoading(true);
            try {
                const data = await getReservations();

                const reservationsWithNames = await Promise.all(
                    data.map(async (r) => {
                        const name = await getPatientNameById(r.patientId);
                        return { ...r, patientName: name };
                    })
                );

                setReservations(reservationsWithNames);
            } catch (error) {
                console.error('予約の取得エラー:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReservations();
    }, []);

    const handleCheckIn = async (id: string) => {
        if (!window.confirm('本当に来院済みにしますか？')) {
            return;
        }
        try {
            await markAsCheckedIn(id);
            setReservations((prev) =>
                prev.map((r) => (r.id === id ? { ...r, checkedIn: true } : r))
            );
        } catch (error) {
            alert('来院済みの更新に失敗しました');
            console.error(error);
        }
    };


    if (loading) return <p>読み込み中...</p>;
    if (reservations.length === 0) return <p>予約はありません。</p>;

    return (
        <div className="container">
            <h2 style={{ display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faListAlt} style={{ marginRight: '0.5em', color: '#1D3557' }} />
                予約一覧
            </h2>

            <table>
                <thead>
                    <tr>
                        <th>予約日時</th>
                        <th>施術内容</th>
                        <th>患者名</th>
                        <th>メモ</th>
                        <th>来院済み</th> {/* 追加 */}
                    </tr>
                </thead>
                <tbody>
                    {reservations.map((r) => (
                        <tr key={r.id}>
                            <td>{r.date.toLocaleString()}</td>
                            <td>{r.type}</td>
                            <td>{r.patientName}</td>
                            <td>{r.memo}</td>
                            <td>
                                {r.checkedIn ? (
                                    <span style={{ color: 'green', fontWeight: 'bold' }}>
                                        <FontAwesomeIcon icon={faCheckCircle} /> 来院済み
                                    </span>
                                ) : (
                                    <button onClick={() => handleCheckIn(r.id!)} style={{ cursor: 'pointer' }}>
                                        来院済みにする
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReservationList;
