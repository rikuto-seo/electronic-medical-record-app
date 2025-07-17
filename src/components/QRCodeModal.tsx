// src/components/QRCodeModal.tsx
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

type Props = {
  patientId: string;
  patientName: string;
  onClose: () => void;
};

const QRCodeModal: React.FC<Props> = ({ patientId, patientName, onClose }) => {
  const url = `${window.location.origin}/patients/${patientId}`;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          textAlign: 'center',
          minWidth: 300,
        }}
      >
        <h3>{patientName}さんのQRコード</h3>
        <QRCodeCanvas value={url} size={200} />
        <p style={{ marginTop: '1rem', wordBreak: 'break-all' }}>{url}</p>
        <button onClick={onClose} style={{ marginTop: '1rem' }}>
          閉じる
        </button>
      </div>
    </div>
  );
};

export default QRCodeModal;
