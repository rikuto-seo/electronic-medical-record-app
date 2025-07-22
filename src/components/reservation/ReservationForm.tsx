// src/components/reservation/ReservationForm.tsx

import React, { useState } from 'react';
import PatientSearch from './PatientSearch';
import { addReservation } from '../../utils/reservationService';
import { Patient } from '../../types/PatientData';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faListAlt } from '@fortawesome/free-solid-svg-icons';

const ReservationForm: React.FC = () => {
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [date, setDate] = useState<Date | null>(new Date());
    const [duration, setDuration] = useState<number>(30);
    const [type, setType] = useState('');
    const [memo, setMemo] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!selectedPatient || !date || !type) {
            alert('患者、日時、施術内容は必須です');
            return;
        }

        setLoading(true);
        try {
            await addReservation({
                patientId: selectedPatient.id,
                date,
                duration,
                type,
                memo,
            });
            alert('予約を登録しました');
            setSelectedPatient(null);
            setDate(new Date());
            setDuration(30);
            setType('');
            setMemo('');
        } catch (error) {
            console.error('予約の保存に失敗しました', error);
            alert('保存に失敗しました');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h2 style={{ display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon icon={faCalendarPlus} style={{ marginRight: '0.5em', color: '#1D3557' }} />
                新規予約
            </h2>


            <div>
                <label>患者選択</label>
                <PatientSearch onSelect={setSelectedPatient} />
            </div>

            <div>
                <label>予約日時</label>
                <DatePicker
                    selected={date}
                    onChange={(d) => d && setDate(d)}
                    showTimeSelect
                    dateFormat="yyyy/MM/dd HH:mm"
                    className="input"
                />
            </div>

            <div>
                <label>施術時間（分）</label>
                <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="input"
                    min={1}
                />
            </div>

            <div>
                <label>施術内容</label>
                <textarea
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="input"
                    rows={3}
                />
            </div>

            <div>
                <label>メモ</label>
                <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="input"
                    rows={3}
                />
            </div>

            <button onClick={handleSubmit} disabled={loading}>
                {loading ? '保存中...' : '予約を保存'}
            </button>
        </div>
    );
};

export default ReservationForm;
