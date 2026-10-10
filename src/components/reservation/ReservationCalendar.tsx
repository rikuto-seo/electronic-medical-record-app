import React from 'react';
import { Navigate } from 'react-router-dom';

// 旧カレンダーURLも共通の予約表へ接続する。
const ReservationCalendar: React.FC = () => <Navigate to="/reservations?view=week" replace />;
export default ReservationCalendar;
