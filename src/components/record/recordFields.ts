import { FieldPath } from "react-hook-form";
import { MedicalRecordFormData } from "../../schema/medicalRecordSchema";
export type RecordSection = "subjective" | "objective" | "treatment" | "plan";
export type RecordField = {
  name: FieldPath<MedicalRecordFormData>;
  label: string;
  type?: "textarea" | "text" | "date" | "number";
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  wide?: boolean;
};
export const recordSections: {
  id: RecordSection;
  label: string;
  description: string;
  fields: RecordField[];
}[] = [
  {
    id: "subjective",
    label: "問診・症状",
    description: "患者さんの訴えと生活への影響を記録します。",
    fields: [
      {
        name: "chiefComplaint",
        label: "主訴",
        type: "textarea",
        hint: "患者さんが困っていること、今回の相談内容",
      },
      {
        name: "historyOfPresentIllness",
        label: "現病歴・これまでの経過",
        type: "textarea",
      },
      { name: "symptomOnsetDate", label: "発症日", type: "date" },
      { name: "symptomDuration", label: "症状の持続期間" },
      { name: "symptomLocation", label: "症状の部位・左右" },
      { name: "painType", label: "痛みの性質" },
      {
        name: "painSeverity",
        label: "痛みの程度（NRS 0〜10）",
        type: "number",
        min: 0,
        max: 10,
        step: 1,
      },
      {
        name: "aggravatingFactors",
        label: "増悪する動作・条件",
        type: "textarea",
      },
      {
        name: "relievingFactors",
        label: "軽減する動作・条件",
        type: "textarea",
      },
      {
        name: "dailyLifeImpact",
        label: "日常生活・仕事への影響",
        type: "textarea",
      },
      { name: "patientGoals", label: "患者さんの希望・目標", type: "textarea" },
    ],
  },
  {
    id: "objective",
    label: "評価・所見",
    description: "観察・測定した所見を、患者さんの訴えと分けて記録します。",
    fields: [
      {
        name: "currentCondition",
        label: "現症・観察所見",
        type: "textarea",
        required: true,
        wide: true,
      },
      {
        name: "rangeOfMotion",
        label: "関節可動域（ROM）",
        type: "textarea",
        hint: "部位・左右・方向・角度などを記録",
      },
      { name: "muscleStrength", label: "筋力・MMT", type: "textarea" },
      { name: "palpationFindings", label: "触診所見", type: "textarea" },
      {
        name: "postureFindings",
        label: "姿勢・アライメント",
        type: "textarea",
      },
      { name: "gaitFindings", label: "歩行・動作所見", type: "textarea" },
      { name: "orthopedicTests", label: "整形外科的テスト", type: "textarea" },
      {
        name: "neurologicalExamResults",
        label: "神経学的所見",
        type: "textarea",
      },
      {
        name: "functionalAssessment",
        label: "機能評価・ADL",
        type: "textarea",
      },
      {
        name: "skinCondition",
        label: "皮膚・腫脹・浮腫の状態",
        type: "textarea",
      },
      {
        name: "imagingResults",
        label: "画像・他院検査の情報",
        type: "textarea",
      },
      {
        name: "otherExamResults",
        label: "その他の検査・測定",
        type: "textarea",
      },
      {
        name: "safetyFindings",
        label: "安全確認・禁忌・注意所見",
        type: "textarea",
        wide: true,
      },
      {
        name: "vitalSigns.bloodPressure",
        label: "血圧（mmHg）",
        hint: "例: 120/80",
      },
      {
        name: "vitalSigns.pulse",
        label: "脈拍（回/分）",
        type: "number",
        min: 0,
        step: 1,
      },
      {
        name: "vitalSigns.temperature",
        label: "体温（℃）",
        type: "number",
        min: 0,
        step: 0.1,
      },
      {
        name: "vitalSigns.respiratoryRate",
        label: "呼吸数（回/分）",
        type: "number",
        min: 0,
        step: 1,
      },
      {
        name: "vitalSigns.oxygenSaturation",
        label: "SpO2（%）",
        type: "number",
        min: 0,
        max: 100,
        step: 1,
      },
    ],
  },
  {
    id: "treatment",
    label: "施術内容",
    description: "今回実際に行った施術・説明と、その反応を記録します。",
    fields: [
      {
        name: "treatmentDetails",
        label: "実施した施術・対応",
        type: "textarea",
        wide: true,
      },
      { name: "treatmentDate", label: "施術日", type: "date" },
      { name: "treatmentDuration", label: "施術時間" },
      { name: "treatedAreas", label: "施術部位・左右", type: "textarea" },
      { name: "usedPoints", label: "使用穴・刺鍼部位", type: "textarea" },
      { name: "acupunctureType", label: "鍼の種類・規格" },
      {
        name: "acupunctureCount",
        label: "使用した鍼の本数",
        type: "number",
        min: 0,
        step: 1,
      },
      { name: "stimulationMethod", label: "刺激方法・通電条件" },
      {
        name: "needleRetentionMinutes",
        label: "置鍼時間（分）",
        type: "number",
        min: 0,
        step: 1,
      },
      {
        name: "moxibustionType",
        label: "灸の種類・施灸内容",
        type: "textarea",
      },
      { name: "manualTherapy", label: "手技の内容", type: "textarea" },
      {
        name: "physicalTherapy",
        label: "物理療法・使用機器",
        type: "textarea",
      },
      {
        name: "adverseReactions",
        label: "有害反応・施術中の変化",
        type: "textarea",
      },
      {
        name: "patientFeedback",
        label: "施術後の患者さんの反応",
        type: "textarea",
      },
      {
        name: "medicationsPrescribed",
        label: "薬剤に関する記録",
        type: "textarea",
      },
    ],
  },
  {
    id: "plan",
    label: "方針・経過",
    description: "評価に基づく方針、説明、今後の確認事項を記録します。",
    fields: [
      { name: "diagnosis", label: "診断名・既存の診断情報", type: "textarea" },
      {
        name: "clinicalAssessment",
        label: "施術上の評価・見立て",
        type: "textarea",
      },
      { name: "treatmentGoals", label: "治療・施術の目標", type: "textarea" },
      {
        name: "treatmentPlan",
        label: "治療・施術方針",
        type: "textarea",
        required: true,
      },
      { name: "treatmentFrequency", label: "予定頻度・期間" },
      { name: "followUpDate", label: "次回確認日", type: "date" },
      {
        name: "treatmentProgress",
        label: "前回からの経過・変化",
        type: "textarea",
      },
      {
        name: "nextVisitPlan",
        label: "次回の評価・対応予定",
        type: "textarea",
      },
      { name: "precautions", label: "施術上の注意事項", type: "textarea" },
      {
        name: "informedConsent",
        label: "説明内容・同意の確認",
        type: "textarea",
      },
      {
        name: "selfCareInstructions",
        label: "生活上の説明・セルフケア",
        type: "textarea",
      },
      {
        name: "referralPlan",
        label: "他院への相談・紹介の記録",
        type: "textarea",
      },
      { name: "notes", label: "申し送り・備考", type: "textarea", wide: true },
    ],
  },
];
