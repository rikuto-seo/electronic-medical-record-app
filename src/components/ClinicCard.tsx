import React from "react";
import { QRCodeSVG } from "qrcode.react";
import "./clinicCard.css";
type Props = { name: string; patientNumber: string; clinicName?: string };
const ClinicCard: React.FC<Props> = ({ name, patientNumber, clinicName }) => {
  const patientUrl = `${window.location.origin}/patients/by-number/${encodeURIComponent(patientNumber)}`;
  return (
    <article className="member-card" aria-label={`${name}の会員カード`}>
      <header className="member-card-header">
        <div className="member-card-mark" aria-hidden="true">
          ＋
        </div>
        <div>
          <strong>{clinicName || "診察券"}</strong>
          <span>MEMBER CARD</span>
        </div>
        <div className="member-card-header-line" />
      </header>
      <div className="member-card-main">
        <div className="member-card-identity">
          <span className="member-card-number-label">患者番号 / MEMBER ID</span>
          <strong
            className="member-card-number"
            style={{ fontSize: patientNumber.length > 8 ? 17 : 25 }}
          >
            {patientNumber}
          </strong>
          <div
            className="member-card-name"
            style={{ fontSize: Array.from(name).length > 16 ? 12 : 16 }}
          >
            {name}
            <small>様</small>
          </div>
        </div>
        <div className="member-card-qr">
          <QRCodeSVG
            value={patientUrl}
            size={88}
            level="M"
            marginSize={4}
            title="受付用患者番号QRコード"
          />
          <span>受付用QRコード</span>
        </div>
      </div>
      <footer className="member-card-footer">
        <span>ご来院の際は、このカードをご提示ください。</span>
      </footer>
    </article>
  );
};
export default ClinicCard;
