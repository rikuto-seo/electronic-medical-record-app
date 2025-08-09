// src/components/reservation/ReservationCalendar.tsx

import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getReservations } from '../../utils/reservationService';
import { getPatientNameById } from '../../utils/patientService';
import { Reservation } from '../../types/reservation';
import './ReservationCalendar.css';

// ✅ 自前で Value 型を定義
type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

type ReservationWithName = Reservation & { patientName?: string };

const ReservationCalendar: React.FC = () => {
    const [reservations, setReservations] = useState<ReservationWithName[]>([]);
    const [selectedDate, setSelectedDate] = useState<Value>(new Date());

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const data = await getReservations();
                const withNames = await Promise.all(
                    data.map(async (r) => {
                        const name = await getPatientNameById(r.patientId);
                        return { ...r, patientName: name };
                    })
                );
                setReservations(withNames);
            } catch (error) {
                console.error('予約データ取得エラー:', error);
            }
        };
        fetchReservations();
    }, []);

    const handleDateChange = (value: Value) => {
        setSelectedDate(value);
    };

    const getDateFromValue = (value: Value): Date | null => {
        if (value instanceof Date) return value;
        if (Array.isArray(value) && value[0] instanceof Date) return value[0];
        return null;
    };

    const getReservationsByDate = (date: Date) => {
        const target = date.toDateString();
        return reservations.filter((r) => new Date(r.date).toDateString() === target);
    };

    const tileContent = ({ date }: { date: Date }) => {
        const todaysReservations = getReservationsByDate(date);
        if (todaysReservations.length > 0) {
            return <div className="dot" />;
        }
        return null;
    };

    const actualDate = getDateFromValue(selectedDate);

    return (
        <div className="container">
            <h2>📅 カレンダー</h2>

            {/* カレンダーの表示領域だけを固定アスペクト比にする */}
            <div className="calendar-wrapper">
                <Calendar
                    onChange={handleDateChange}
                    value={selectedDate}
                    tileContent={tileContent}
                    selectRange={false}
                />
            </div>

            {/* 予約内容はカレンダーの下に通常表示 */}
            {actualDate && (
                <div style={{ marginTop: '1em' }}>
                    <h3>{actualDate.toLocaleDateString()}の予約</h3>
                    <ul>
                        {getReservationsByDate(actualDate).map((r) => (
                            <li key={r.id}>
                                {new Date(r.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {r.patientName}（{r.type}）
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );

};

export default ReservationCalendar;
