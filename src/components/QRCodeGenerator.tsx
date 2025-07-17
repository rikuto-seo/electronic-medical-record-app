// components/QRCodeGenerator.tsx
import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';

type Props = {
    patientId: string;
};

const QRCodeGenerator: React.FC<Props> = ({ patientId }) => {
    const url = `${window.location.origin}/patients/${patientId}`;

    return (
        <div>
            <p>このQRコードを読み取ると患者詳細ページにアクセスできます:</p>
            <QRCodeCanvas value={url} size={200} />
            <p>{url}</p>
        </div>
    );
};

export default QRCodeGenerator;
