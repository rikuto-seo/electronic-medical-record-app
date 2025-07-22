// src/components/patient-form/PatientForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../../types/PatientData';
import { v4 as uuidv4 } from 'uuid';
import { addPatient } from '../../lib/firebase/patient';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhoneAlt,faInfoCircle} from '@fortawesome/free-solid-svg-icons';

const PatientForm: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birthDate: '',
    email: '',
    phoneNumber: '',
    address: '',
    firstVisitDate: new Date().toISOString().split('T')[0],
    insuranceInfo: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phoneNumber: '',
    },
  });

  const calculateAge = (birthDateStr: string): number => {
    if (!birthDateStr) return 0;
    const today = new Date();
    const birthDate = new Date(birthDateStr);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

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
    const calculatedAge = calculateAge(formData.birthDate);

    const newPatient: Patient = {
      id: uuidv4(),
      name: formData.name,
      age: calculatedAge,
      gender: formData.gender,
      birthDate: formData.birthDate,
      firstVisitDate: formData.firstVisitDate,
      insuranceInfo: formData.insuranceInfo,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      address: formData.address,
      emergencyContact: formData.emergencyContact,
      records: [],
    };

    try {
      await addPatient(newPatient);

      const tryNavigateToDetail = async (retries = 10, delay = 300) => {
        for (let i = 0; i < retries; i++) {
          const snap = await getDoc(doc(db, 'patients', newPatient.id));
          if (snap.exists()) {
            navigate(`/patients/${newPatient.id}`);
            return;
          }
          await new Promise((res) => setTimeout(res, delay));
        }
        alert('保存は成功しましたが、遷移に失敗しました。患者一覧からご確認ください。');
      };

      await tryNavigateToDetail();
    } catch (error) {
      console.error('患者の保存に失敗しました', error);
      alert('患者の保存に失敗しました。再度お試しください。');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>
        <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: '0.5em', color: '#457B9D' }} />
        基本情報
      </h2>

      <div>
        <label>氏名</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
      </div>

      <div>
        <label>性別</label>
        <select name="gender" value={formData.gender} onChange={handleChange} required>
          <option value="">選択してください</option>
          <option value="男性">男性</option>
          <option value="女性">女性</option>
          <option value="その他">その他</option>
        </select>
      </div>

      <div>
        <label>生年月日</label>
        <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} required />
      </div>

      <div>
        <label>年齢</label>
        <input type="number" value={calculateAge(formData.birthDate)} readOnly />
      </div>

      <div>
        <label>

          メールアドレス
        </label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} />
      </div>

      <div>
        <label>
          電話番号
        </label>
        <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
      </div>

      <div>
        <label>
          住所
        </label>
        <input type="text" name="address" value={formData.address} onChange={handleChange} />
      </div>

      <div>
        <label>初診日</label>
        <input type="date" name="firstVisitDate" value={formData.firstVisitDate} onChange={handleChange} required />
      </div>

      <div>
        <label>保険情報</label>
        <input type="text" name="insuranceInfo" value={formData.insuranceInfo} onChange={handleChange} />
      </div>

      <h2>
        <FontAwesomeIcon icon={faPhoneAlt} style={{ marginRight: '0.5em', color: '#E63946' }} />
        緊急連絡先
      </h2>

      <div>
        <label>氏名</label>
        <input type="text" name="emergencyContact.name" value={formData.emergencyContact.name} onChange={handleChange} />
      </div>

      <div>
        <label>続柄</label>
        <input type="text" name="emergencyContact.relationship" value={formData.emergencyContact.relationship} onChange={handleChange} />
      </div>

      <div>
        <label>電話番号</label>
        <input type="tel" name="emergencyContact.phoneNumber" value={formData.emergencyContact.phoneNumber} onChange={handleChange} />
      </div>

      <button type="submit">登録する</button>
    </form>
  );
};

export default PatientForm;
