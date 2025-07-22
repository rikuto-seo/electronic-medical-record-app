// src/pages/NewPatientPage.tsx
import React from 'react';
import PatientForm from '../components/patient-form/PatientForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';

const NewPatientPage: React.FC = () => {
  return (
    <div>
      <h2>
        <FontAwesomeIcon icon={faUserPlus} style={{ marginRight: '0.5em', color: '#4A90E2' }} />
        新規患者登録
      </h2>
      <PatientForm />
    </div>
  );
};

export default NewPatientPage;
