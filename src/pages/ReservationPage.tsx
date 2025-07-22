// src/pages/ReservationPage.tsx
import React, { useState, useEffect } from 'react';
import ReservationForm from '../components/reservation/ReservationForm';
import ReservationList from '../components/reservation/ReservationList';
import { Reservation } from '../types/reservation';

const ReservationPage: React.FC = () => {
  // 予約データは ReservationList 内でフェッチしているのでここではstate管理は不要かも
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1rem' }}>
      <h1>予約管理</h1>
      <ReservationForm />
      <hr />
      <ReservationList />
    </div>
  );
};

export default ReservationPage;
