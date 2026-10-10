// Generate PDFs from the production renderer using fictional patient data only.
// Run: node scripts/verify-patient-pdfs.cjs
const fs = require('fs');
const path = require('path');
const ts = require('typescript');
const root = path.resolve(__dirname,'..');
const scratch = path.join(root,'tmp','pdfs');
const lib = path.join(scratch,'lib');
fs.mkdirSync(lib,{recursive:true});
fs.writeFileSync(path.join(lib,'package.json'),JSON.stringify({type:'commonjs'}));
for (const file of ['patientPdfRenderer','patientPdfData','patientUtils','reservationUtils','paymentUtils']) {
  const source = fs.readFileSync(path.join(root,'src','utils',`${file}.ts`),'utf8');
  fs.writeFileSync(path.join(lib,`${file}.js`),ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText);
}
const {buildPatientSummaryPdf,buildMedicalRecordsPdf} = require(path.join(lib,'patientPdfRenderer.js'));
const font = fs.readFileSync(path.join(root,'public','fonts','NotoSansJP-Regular.ttf')).toString('base64');
const patient = {
  id:'fictional-patient-001',patientNumber:'TEST-001',name:'検証用 山田花子',nameKana:'ケンショウヨウ ヤマダハナコ',
  gender:'女性',birthDate:'1987-10-10',age:20,firstVisitDate:'2026-10-09',phoneNumber:'090-0000-0000',
  address:'東京都千代田区 検証用住所 1-2-3 サンプルマンション101',email:'sample@example.invalid',occupation:'事務職',
  assignedStaff:'検証スタッフA',referralSource:'家族の紹介',
  emergencyContact:{name:'検証用 山田太郎',relationship:'夫',phoneNumber:'080-0000-0000'},
  allergies:'テープ貼付部に発赤歴あり。使用材料を確認する。',currentMedications:'お薬手帳確認予定。本人の申告内容を次回来院時に確認する。',
  medicalHistory:'2020年に左足関節捻挫。手術歴なし（本人申告）。',existingDiagnosis:'他院の診断書は未確認。',familyHistory:'未確認',
  insuranceInfo:'自費 / 支払方法は受付で確認',notes:'連絡は電話を希望。平日は18時以降がつながりやすい。',
};
const record = {
  id:'record-001',date:'2026-10-09T10:00',chiefComplaint:'右肩の動かしにくさ（検証用の架空記録）',
  currentCondition:'右肩挙上時に違和感。日常動作への影響を聞き取り、観察所見と区別して記録する。',
  treatmentPlan:'問診と評価を行い、本人と施術方針を確認する。',notes:'このデータはPDF表示の検証専用です。',
  painSeverity:0,painScale:0,acupunctureCount:0,acupunctureType:'未施術',
  vitalSigns:{bloodPressure:'120/80',pulse:68,temperature:36.5},treatmentPerformedBy:'検証スタッフA',
  followUpDate:'2026-10-16',patientFeedback:'説明内容を確認した。',adverseReactions:'未確認',mediaUrls:['https://example.invalid/test.jpg'],
  historyOfPresentIllness:'約3週間前から右肩の動かしにくさを自覚（本人申告）。',dailyLifeImpact:'洗濯物を干す動作が困難。',
  rangeOfMotion:'右肩屈曲 AROM 120°、左150°（検証用）',functionalAssessment:'日常動作を聞き取り、確認済みの範囲を記録する。',
  treatmentDetails:'今回は評価と説明を実施。鍼施術は未実施。',informedConsent:'評価と今後の方針を説明し、本人の理解を確認した。',
  nextVisitPlan:'次回、可動域と生活への影響を再確認する。',
};
const options = {exportedAt:new Date('2026-10-09T01:30:00Z')};
const outputs = [
  ['patient-summary.pdf',buildPatientSummaryPdf(patient,font,options)],
  ['medical-records.pdf',buildMedicalRecordsPdf(patient,[record,{...record,id:'record-002',date:'2026-10-16T14:00',chiefComplaint:'再診の記録'}],font,options)],
  ['long-record.pdf',buildMedicalRecordsPdf(patient,[{...record,currentCondition:('長文の現症を途中で切らずに改ページできることを確認する。\n').repeat(150)+'現症の最終行',notes:'長文記録の最終備考'}],font,{...options,includeSummary:false})],
];
for (const [name,doc] of outputs) {
  fs.writeFileSync(path.join(scratch,name),Buffer.from(doc.output('arraybuffer')));
  process.stdout.write(`${name}: ${doc.getNumberOfPages()} pages\n`);
}
