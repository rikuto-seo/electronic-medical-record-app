import React from 'react';
import { Patient } from '../../types/PatientData';
import PatientInfoFields from './PatientInfoFields';
interface Props {
  patient: Patient;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  onEmergencyContactChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
const PatientBasicInfoForm: React.FC<Props> = props => <PatientInfoFields {...props} />;
export default PatientBasicInfoForm;
