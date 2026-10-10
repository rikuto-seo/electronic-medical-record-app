import React from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { Patient } from '../../types/PatientData';
import { usePatientContext } from '../../hooks/usePatientContext';

interface Props { value: Patient | null; onSelect: (patient: Patient | null) => void; disabled?: boolean }

const PatientSearch: React.FC<Props> = ({ value, onSelect, disabled }) => {
  const { patients, patientsLoading, patientsError } = usePatientContext();
  return <div>
    <Autocomplete
      id="reservation-patient"
      disablePortal
      value={value}
      options={patients}
      disabled={disabled || patientsLoading}
      loading={patientsLoading}
      loadingText="患者情報を読み込み中…"
      clearText="患者の選択を解除"
      openText="患者一覧を開く"
      closeText="患者一覧を閉じる"
      noOptionsText={patientsError || '該当する患者がいません'}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      getOptionLabel={patient => `${patient.name}${patient.patientNumber ? `（${patient.patientNumber}）` : ''}`}
      filterOptions={(options, state) => {
        const term = state.inputValue.trim().toLowerCase().replace(/[\s-]/g, '');
        return options.filter(patient => [patient.name, patient.nameKana, patient.patientNumber, patient.phoneNumber, patient.id]
          .some(field => field?.toLowerCase().replace(/[\s-]/g, '').includes(term))).slice(0, 50);
      }}
      onChange={(_, selected) => onSelect(selected)}
      renderOption={(props, patient) => <li {...props} key={patient.id}>
        <div><strong>{patient.name}</strong><br /><small>{patient.nameKana || patient.birthDate}　{patient.phoneNumber || ''}</small></div>
      </li>}
      renderInput={params => <TextField {...params} label="患者" placeholder="氏名・ふりがな・患者番号・電話番号" required />}
    />
    {patientsError && <p className="reservation-error" role="alert">{patientsError}</p>}
  </div>;
};
export default PatientSearch;
