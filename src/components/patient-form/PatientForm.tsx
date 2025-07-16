// src/components/patient-form/PatientForm.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../../types/PatientData';
import { v4 as uuidv4 } from 'uuid';
import { addPatient } from '../../lib/firebase/patient'; // Firestore操作関数（あなたの環境に合わせてパスを調整してください）

const PatientForm: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    birthDate: '',
    firstVisitDate: new Date().toISOString().split('T')[0],
    insuranceInfo: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phoneNumber: '',
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name.startsWith('emergencyContact.')) {
      const key = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [key]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newPatient: Patient = {
      id: uuidv4(),
      name: formData.name,
      age: Number(formData.age),
      gender: formData.gender,
      birthDate: formData.birthDate,
      firstVisitDate: formData.firstVisitDate,
      insuranceInfo: formData.insuranceInfo,
      emergencyContact: formData.emergencyContact,
      records: [], // 初期診療記録は空
    };

    try {
      await addPatient(newPatient);  // Firestoreに保存
      navigate(`/patients/${newPatient.id}`); // 保存成功後に詳細画面へ遷移
    } catch (error) {
      console.error('患者の保存に失敗しました', error);
      alert('患者の保存に失敗しました。再度お試しください。');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>氏名</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>年齢</label>
        <input
          name="age"
          type="number"
          value={formData.age}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>性別</label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          required
        >
          <option value="">選択してください</option>
          <option value="男性">男性</option>
          <option value="女性">女性</option>
          <option value="その他">その他</option>
        </select>
      </div>
      <div>
        <label>生年月日</label>
        <input
          type="date"
          name="birthDate"
          value={formData.birthDate}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>初診日</label>
        <input
          type="date"
          name="firstVisitDate"
          value={formData.firstVisitDate}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>保険情報</label>
        <input
          type="text"
          name="insuranceInfo"
          value={formData.insuranceInfo}
          onChange={handleChange}
        />
      </div>

      <h2>📞 緊急連絡先</h2>
      <div>
        <label>氏名</label>
        <input
          type="text"
          name="emergencyContact.name"
          value={formData.emergencyContact.name}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>続柄</label>
        <input
          type="text"
          name="emergencyContact.relationship"
          value={formData.emergencyContact.relationship}
          onChange={handleChange}
        />
      </div>
      <div>
        <label>電話番号</label>
        <input
          type="tel"
          name="emergencyContact.phoneNumber"
          value={formData.emergencyContact.phoneNumber}
          onChange={handleChange}
        />
      </div>

      <button type="submit">登録する</button>
    </form>
  );
};

export default PatientForm;
