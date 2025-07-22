// src/components/reservation/PatientSearch.tsx

import React, { useEffect, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Patient } from '../../types/PatientData'; // 必要に応じて作成

interface PatientSearchProps {
    onSelect: (patient: Patient) => void;
}

const PatientSearch: React.FC<PatientSearchProps> = ({ onSelect }) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        const fetchPatients = async () => {
            const snapshot = await getDocs(collection(db, 'patients'));
            const result: Patient[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Patient[];
            setPatients(result);
        };
        fetchPatients();
    }, []);

    return (
        <Autocomplete
            options={patients}
            getOptionLabel={(option) => `${option.name}（${option.id}）`}
            onChange={(_, value) => value && onSelect(value)}
            inputValue={inputValue}
            onInputChange={(_, newValue) => setInputValue(newValue)}
            renderInput={(params) => (
                <TextField
                    {...params}
                    fullWidth
                />

            )}
        />
    );
};

export default PatientSearch;
