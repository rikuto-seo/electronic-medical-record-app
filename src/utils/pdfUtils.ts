// src/utils/pdfUtils.ts
import html2pdf from 'html2pdf.js';

export const exportToPDF = (elementId: string, fileName = '診療録.pdf') => {
  const element = document.getElementById(elementId);
  if (!element) return;

  const opt = {
    margin:       0,
    filename:     fileName,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(element).save();
};
