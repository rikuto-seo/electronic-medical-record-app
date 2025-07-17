import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const ClinicCard: React.FC<{ name: string; birthday: string; patientId: string }> = ({
    name,
    birthday,
    patientId,
}) => {
    const patientUrl = `${window.location.origin}/patients/${patientId}`;

    return (
        <div
            style={{
                width: '91mm',
                height: '55mm',
                padding: '12px 16px',
                boxSizing: 'border-box',
                border: '1px solid #333',
                borderRadius: '8px',
                fontFamily: "'Yu Gothic', 'Noto Sans JP', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                color: '#222',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                backgroundColor: '#fff',
                boxShadow: '0 0 8px rgba(0,0,0,0.1)',
            }}
        >
            {/* ヘッダー */}
            <div>
                <h2 style={{ margin: '0 0 6px 0', fontSize: '1.3rem', fontWeight: '700', letterSpacing: '0.05em',color:'black' }}>
                    {name} 様
                </h2>
                <p style={{ margin: '2px 0', fontSize: '0.7rem' }}>生年月日：{birthday}</p>
                <p style={{ margin: '2px 0', fontSize: '0.7rem' }}>会員ID：{patientId}</p>
            </div>

            <hr style={{ borderColor: '#ccc', margin: '8px 0', width: '50%', marginLeft: '0', borderTopWidth: '1px' }} />

            {/* 治療院情報とQRコード横並び */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <div style={{ fontSize: '0.8rem', lineHeight: 1.3, color: '#444', flex: 1 }}>
                    <p style={{ margin: '2px 0' }}>治療院：〇〇治療院</p>
                    <p style={{ margin: '2px 0' }}>院長：〇〇 〇〇</p>
                    <p style={{ margin: '2px 0' }}>電話：000-0000-0000</p>
                    <p style={{ margin: '2px 0' }}>住所：東京都〇〇区〇〇1-2-3</p>
                </div>
                <div style={{ marginLeft: '16px' }}>
                    <QRCodeCanvas value={patientUrl} size={60} />
                </div>
            </div>
        </div>

    );
};

export default ClinicCard;
