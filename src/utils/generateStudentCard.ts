import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Student } from '@/types';
import { SchoolSettings } from '@/hooks/useSchoolSettings';
import schoolLogoDefault from '@/assets/school-logo.png';

const generateQRCode = async (uniqueId: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(uniqueId, { width: 200, margin: 1 });
  } catch {
    return '';
  }
};

export const generateStudentCards = async (
  students: Student[],
  schoolSettings?: SchoolSettings | null
) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  
  const cardWidth = 85.6; // Credit card size
  const cardHeight = 54;
  const marginX = 12;
  const marginY = 10;
  const cardsPerRow = 2;
  const cardsPerPage = 8;
  const gapX = 8;
  const gapY = 8;

  const schoolName = schoolSettings?.school_name || 'SMA NEGERI 1 MANONJAYA';
  const schoolAddress = schoolSettings?.school_address || '';
  const logoUrl = schoolSettings?.school_logo_url || schoolLogoDefault;

  // Load logo
  let logoImage: string | null = null;
  try {
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    logoImage = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    logoImage = null;
  }

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const cardIndex = i % cardsPerPage;
    
    if (cardIndex === 0 && i > 0) doc.addPage();
    
    const row = Math.floor(cardIndex / cardsPerRow);
    const col = cardIndex % cardsPerRow;
    const x = marginX + col * (cardWidth + gapX);
    const y = marginY + row * (cardHeight + gapY);

    // Card background with gradient effect
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'F');
    
    // Card border
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.5);
    doc.roundedRect(x, y, cardWidth, cardHeight, 3, 3, 'S');

    // Header background
    doc.setFillColor(30, 64, 175);
    doc.roundedRect(x + 0.25, y + 0.25, cardWidth - 0.5, 14, 2.75, 2.75, 'F');
    doc.setFillColor(30, 64, 175);
    doc.rect(x + 0.25, y + 8, cardWidth - 0.5, 6.25, 'F');

    // School logo placeholder or actual logo
    const logoSize = 8;
    const logoX = x + 3;
    const logoY = y + 3;
    
    if (logoImage) {
      try {
        doc.addImage(logoImage, 'PNG', logoX, logoY, logoSize, logoSize);
      } catch {
        // Fallback circle if logo fails
        doc.setFillColor(255, 255, 255);
        doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 'F');
      }
    } else {
      doc.setFillColor(255, 255, 255);
      doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 'F');
      doc.setFontSize(5);
      doc.setTextColor(30, 64, 175);
      doc.text('LOGO', logoX + logoSize / 2, logoY + logoSize / 2 + 1.5, { align: 'center' });
    }

    // School name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    const schoolNameTruncated = schoolName.length > 30 ? schoolName.substring(0, 30) + '...' : schoolName;
    doc.text(schoolNameTruncated.toUpperCase(), x + 13, y + 7);
    
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.text('KARTU PELAJAR', x + 13, y + 11);

    // QR Code
    const qrUrl = await generateQRCode(student.student_unique_id);
    if (qrUrl) {
      const qrSize = 26;
      const qrX = x + 4;
      const qrY = y + 18;
      
      // QR background
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2, 2, 2, 'F');
      doc.addImage(qrUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    }

    // Student info section
    const infoX = x + 34;
    const infoY = y + 20;
    const lineHeight = 5;

    // Student name
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const nameTruncated = student.full_name.length > 22 ? student.full_name.substring(0, 22) + '...' : student.full_name;
    doc.text(nameTruncated, infoX, infoY);

    // Separator line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(infoX, infoY + 2, x + cardWidth - 4, infoY + 2);

    // Labels and values
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    
    doc.text('NISN', infoX, infoY + lineHeight + 2);
    doc.text('KELAS', infoX, infoY + lineHeight * 2 + 2);
    doc.text('JURUSAN', infoX, infoY + lineHeight * 3 + 2);

    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(student.nisn, infoX + 15, infoY + lineHeight + 2);
    doc.text(student.class_name, infoX + 15, infoY + lineHeight * 2 + 2);
    const majorTruncated = student.major.length > 15 ? student.major.substring(0, 15) + '...' : student.major;
    doc.text(majorTruncated, infoX + 15, infoY + lineHeight * 3 + 2);

    // Footer with ID
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x + 0.25, y + cardHeight - 8, cardWidth - 0.5, 7.75, 2.75, 2.75, 'F');
    doc.setFillColor(248, 250, 252);
    doc.rect(x + 0.25, y + cardHeight - 8, cardWidth - 0.5, 4, 'F');
    
    doc.setFontSize(5);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(`ID: ${student.student_unique_id}`, x + cardWidth / 2, y + cardHeight - 3, { align: 'center' });

    // Active badge
    if (student.is_active) {
      doc.setFillColor(34, 197, 94);
      doc.roundedRect(x + cardWidth - 14, y + 17, 10, 4, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(4);
      doc.text('AKTIF', x + cardWidth - 9, y + 19.8, { align: 'center' });
    }
  }

  doc.save('kartu-pelajar.pdf');
};
