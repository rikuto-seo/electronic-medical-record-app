//src/hooks/usePatientContext.ts
import { useContext } from 'react';
import { PatientContext } from '../components/PatientContext';

export const usePatientContext = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatientContext must be used within a PatientProvider');
  }
  return context;
};
