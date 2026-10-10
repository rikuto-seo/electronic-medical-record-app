import React from "react";
import { Navigate, useParams } from "react-router-dom";
const PatientQRCodePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/patients/${id}/card`} replace />;
};
export default PatientQRCodePage;
