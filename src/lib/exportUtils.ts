import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { StudentSubmission, AssignmentConfig, QuestionEvaluation, CompetenceItem } from '../types';

/**
 * Converts a base64 Data URL to a Blob for reliable, leak-free browser downloads
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  try {
    const parts = dataUrl.split(';base64,');
    if (parts.length < 2) {
      return new Blob([dataUrl]);
    }
    const contentType = parts[0].split(':')[1] || 'image/png';
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  } catch {
    return new Blob([dataUrl]);
  }
}

/**
 * Triggers a direct browser file download for a Blob
 * Compatible with mobile Safari, Chrome Android, PWAs and desktop browsers
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {}
    }, 4000);
  } catch (err) {
    console.error('Erreur triggerFileDownload, tentative via FileReader:', err);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const a = document.createElement('a');
        a.href = reader.result as string;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
      reader.readAsDataURL(blob);
    } catch {}
  }
}

/**
 * Triggers a direct browser file download for a Data URL using Blob conversion
 */
export function triggerDataUrlDownload(dataUrl: string, filename: string) {
  try {
    const blob = dataUrlToBlob(dataUrl);
    triggerFileDownload(blob, filename);
  } catch {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Saves a jsPDF instance safely by extracting its blob first.
 * Prevents mobile browser issues where pdf.save() gets silently blocked.
 */
export function savePdfSafely(pdf: jsPDF, filename: string) {
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  try {
    const blob = pdf.output('blob');
    triggerFileDownload(blob, safeFilename);
  } catch (e) {
    try {
      pdf.save(safeFilename);
    } catch (saveErr) {
      console.warn('Fallback data URI pour le PDF:', saveErr);
      const dataUri = pdf.output('datauristring');
      triggerDataUrlDownload(dataUri, safeFilename);
    }
  }
}

/**
 * Converts ANY image source (PNG, JPEG, WebP, Blob URL, remote URL) to a clean JPEG Data URL.
 * Guarantees that jsPDF will NEVER throw "UNKNOWN IMAGE FORMAT" or crash on mobile.
 */
export async function ensureSafeJpegDataUrl(src: string, maxDim: number = 2000): Promise<string> {
  if (!src) return '';
  return new Promise((resolve) => {
    const img = new Image();
    if (src.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        let w = img.naturalWidth || img.width || 800;
        let h = img.naturalHeight || img.height || 600;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.max(1, Math.round(w * ratio));
          h = Math.max(1, Math.round(h * ratio));
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch (e) {
        console.warn('Canvas conversion to JPEG failed, using fallback:', e);
        resolve(src);
      }
    };
    img.onerror = () => {
      console.warn('Image loading failed in ensureSafeJpegDataUrl');
      resolve(src);
    };
    img.src = src;
  });
}

/**
 * Rotates an image Data URL by the specified degrees and returns a new JPEG Data URL.
 * Also resizes to a safe max dimension (2400px) so memory limits are respected on mobile.
 */
export async function getRotatedImageDataUrl(src: string, rotation: number): Promise<string> {
  const normRot = ((rotation % 360) + 360) % 360;
  if (!src) return '';

  return new Promise((resolve) => {
    const img = new Image();
    if (src.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        const is90or270 = normRot === 90 || normRot === 270;
        let w = is90or270 ? img.naturalHeight || img.height : img.naturalWidth || img.width;
        let h = is90or270 ? img.naturalWidth || img.width : img.naturalHeight || img.height;
        const maxDim = 2400;
        if (w > maxDim || h > maxDim) {
          const ratio = Math.min(maxDim / w, maxDim / h);
          w = Math.max(1, Math.round(w * ratio));
          h = Math.max(1, Math.round(h * ratio));
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (normRot !== 0) {
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((normRot * Math.PI) / 180);
          const origW = normRot === 90 || normRot === 270 ? h : w;
          const origH = normRot === 90 || normRot === 270 ? w : h;
          ctx.drawImage(img, -origW / 2, -origH / 2, origW, origH);
        } else {
          ctx.drawImage(img, 0, 0, w, h);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

/**
 * Captures an HTML element to a high-resolution Canvas using html2canvas safely.
 * Includes a 6-second timeout to prevent app freeze if external resources hang.
 */
export async function captureElementToCanvas(element: HTMLElement, scale: number = 1.5): Promise<HTMLCanvasElement> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('html2canvas capture timed out after 6 seconds')), 6000);
  });

  const capturePromise = (async () => {
    // Pre-decode and wait for all images inside element
    const imgs = Array.from(element.querySelectorAll('img'));
    await Promise.all(
      imgs.map((img) => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve(null);
        return new Promise((res) => {
          img.onload = () => res(null);
          img.onerror = () => res(null);
          setTimeout(() => res(null), 1000);
        });
      })
    );

    const targetWidth = Math.max(element.offsetWidth || 1280, 1000);
    const targetHeight = Math.max(element.offsetHeight || 900, 600);

    return await html2canvas(element, {
      scale: Math.min(scale, 1.5),
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#0b1329',
      logging: false,
      imageTimeout: 5000,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: targetWidth,
      height: targetHeight,
      windowWidth: targetWidth,
      onclone: (clonedDoc) => {
        const target = clonedDoc.getElementById('export-clone-container');
        if (target) {
          target.style.position = 'static';
          target.style.left = '0';
          target.style.top = '0';
          target.style.visibility = 'visible';
          target.style.display = 'block';
          target.style.opacity = '1';
        }
        const host = clonedDoc.getElementById('praxis-export-host');
        if (host) {
          host.style.position = 'static';
          host.style.left = '0';
          host.style.top = '0';
          host.style.zIndex = '1';
          host.style.visibility = 'visible';
          host.style.display = 'block';
          host.style.opacity = '1';
        }
        const allImgs = clonedDoc.querySelectorAll('img');
        allImgs.forEach((img) => {
          img.loading = 'eager';
        });
      },
    });
  })();

  return Promise.race([capturePromise, timeoutPromise]);
}

/**
 * Exports an HTML element as an Image (PNG)
 */
export async function exportElementAsPng(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await captureElementToCanvas(element, 1.5);
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          triggerFileDownload(blob, filename.endsWith('.png') ? filename : `${filename}.png`);
          resolve();
        } else {
          const dataUrl = canvas.toDataURL('image/png');
          triggerDataUrlDownload(dataUrl, filename.endsWith('.png') ? filename : `${filename}.png`);
          resolve();
        }
      }, 'image/png');
    } catch {
      try {
        const dataUrl = canvas.toDataURL('image/png');
        triggerDataUrlDownload(dataUrl, filename.endsWith('.png') ? filename : `${filename}.png`);
        resolve();
      } catch (innerErr) {
        reject(innerErr);
      }
    }
  });
}

/**
 * Exports an HTML element as a Panoramic PDF preserving aspect ratio
 */
export async function exportElementAsPanoramicPdf(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await captureElementToCanvas(element, 1.5);
  const imgData = canvas.toDataURL('image/jpeg', 0.92);

  const pdfWidth = Math.max(100, canvas.width * 0.75);
  const pdfHeight = Math.max(100, canvas.height * 0.75);

  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
    unit: 'pt',
    format: [pdfWidth, pdfHeight],
  });

  pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  savePdfSafely(pdf, filename);
}

/**
 * Exports an HTML element as a multi-page A4 PDF
 */
export async function exportElementAsMultiPageA4Pdf(element: HTMLElement, filename: string): Promise<void> {
  const canvas = await captureElementToCanvas(element, 1.5);
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;

  // A4 dimensions in pt: 595.28 x 841.89
  const a4Width = 595.28;
  const a4Height = 841.89;

  const pageHeightInCanvasPixels = Math.floor((imgWidth * a4Height) / a4Width);
  let renderedHeight = 0;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  let pageIndex = 0;

  while (renderedHeight < imgHeight) {
    if (pageIndex > 0) {
      pdf.addPage('a4', 'portrait');
    }

    const currentSliceHeight = Math.min(pageHeightInCanvasPixels, imgHeight - renderedHeight);

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = imgWidth;
    sliceCanvas.height = currentSliceHeight;
    const ctx = sliceCanvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#0b1329';
      ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
      ctx.drawImage(
        canvas,
        0,
        renderedHeight,
        imgWidth,
        currentSliceHeight,
        0,
        0,
        imgWidth,
        currentSliceHeight
      );

      const sliceDataUrl = sliceCanvas.toDataURL('image/jpeg', 0.92);
      const renderPtHeight = (currentSliceHeight * a4Width) / imgWidth;
      pdf.addImage(sliceDataUrl, 'JPEG', 0, 0, a4Width, renderPtHeight);
    }

    renderedHeight += currentSliceHeight;
    pageIndex++;
  }

  savePdfSafely(pdf, filename);
}

/**
 * Exports the raw student handwritten copy as a PDF or Image
 */
export async function exportRawHandwrittenCopy(
  pages: string[],
  rotation: number,
  studentName: string,
  format: 'png' | 'pdf',
  filename: string
): Promise<void> {
  if (format === 'png') {
    const rotated = await getRotatedImageDataUrl(pages[0], rotation);
    triggerDataUrlDownload(rotated, filename.endsWith('.png') ? filename : `${filename}.png`);
    return;
  }

  // Export as PDF (multi-page if pages > 1)
  let pdf: jsPDF | null = null;

  for (let i = 0; i < pages.length; i++) {
    const rotated = await getRotatedImageDataUrl(pages[i], rotation);
    const safeJpeg = await ensureSafeJpegDataUrl(rotated, 2000);

    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const orientation = img.width > img.height ? 'landscape' : 'portrait';
          const targetW = img.width * 0.75;
          const targetH = img.height * 0.75;
          if (i === 0) {
            pdf = new jsPDF({
              orientation,
              unit: 'pt',
              format: [targetW, targetH],
            });
            pdf.addImage(safeJpeg, 'JPEG', 0, 0, targetW, targetH);
          } else if (pdf) {
            pdf.addPage([targetW, targetH], orientation);
            pdf.addImage(safeJpeg, 'JPEG', 0, 0, targetW, targetH);
          }
        } catch (e) {
          console.error('Error adding page to PDF:', e);
        }
        resolve();
      };
      img.onerror = () => resolve();
      img.src = safeJpeg;
    });
  }

  if (pdf) {
    savePdfSafely(pdf as jsPDF, filename);
  }
}

export interface DirectReportData {
  submission: StudentSubmission;
  studentName: string;
  grade: number;
  gradeMax: number;
  appreciation: string;
  questions: QuestionEvaluation[];
  competences: CompetenceItem[];
  teacherNotes?: string;
  pages: string[];
  activePageIndex: number;
  exportAllPages?: boolean;
  rotatedPages?: string[];
  config?: AssignmentConfig;
  isValidated?: boolean;
}

/**
 * High-Reliability Native Vector PDF Report Generator (Pure jsPDF)
 * Never crashes, no html2canvas dependency, embeds student copy safely as JPEG,
 * and builds a comprehensive evaluation dossier.
 */
export async function exportDirectStudentReportPdf(
  data: DirectReportData,
  filename: string
): Promise<void> {
  const {
    submission,
    studentName,
    grade,
    gradeMax,
    appreciation,
    questions,
    competences,
    teacherNotes,
    pages,
    activePageIndex,
    exportAllPages = false,
    rotatedPages = [],
    config,
    isValidated = false,
  } = data;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4', // 595.28 x 841.89
  });

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;

  const displayPages = exportAllPages
    ? rotatedPages.length > 0 ? rotatedPages : pages
    : [rotatedPages[activePageIndex] || pages[activePageIndex] || submission.imageDataUrl];

  const todayStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // PAGE(S) 1..N: Student's Scanned Handwritten Copies
  for (let pIdx = 0; pIdx < displayPages.length; pIdx++) {
    if (pIdx > 0) {
      pdf.addPage('a4', 'portrait');
    }

    // Top Header Banner
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.rect(0, 0, pageWidth, 56, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(`PRAXIS • Copie manuscrite de l'élève : ${studentName}`, margin, 26);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(203, 213, 225);
    const subText = `${config?.discipline || 'Évaluation'} • ${config?.level || ''} ${
      displayPages.length > 1 ? `(Page ${pIdx + 1}/${displayPages.length})` : ''
    } • Note : ${grade}/${gradeMax}`;
    pdf.text(subText, margin, 44);

    // Draw copy image centered
    const pageSrc = displayPages[pIdx];
    if (pageSrc) {
      const safeJpeg = await ensureSafeJpegDataUrl(pageSrc, 1800);
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            const availWidth = contentWidth;
            const availHeight = pageHeight - 56 - margin - 20;
            const ratio = Math.min(availWidth / img.width, availHeight / img.height);
            const drawW = img.width * ratio;
            const drawH = img.height * ratio;
            const drawX = margin + (contentWidth - drawW) / 2;
            const drawY = 66 + (availHeight - drawH) / 2;

            // Background frame
            pdf.setFillColor(241, 245, 249);
            pdf.rect(drawX - 2, drawY - 2, drawW + 4, drawH + 4, 'F');

            pdf.addImage(safeJpeg, 'JPEG', drawX, drawY, drawW, drawH);
          } catch (e) {
            console.error('Error embedding copy image in direct PDF:', e);
          }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = safeJpeg;
      });
    }

    // Footer on copy page
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Document numérisé : ${submission.fileName || 'Copie'} • ${todayStr}`, margin, pageHeight - 16);
  }

  // NEXT PAGE: Official Evaluation Sheet
  pdf.addPage('a4', 'portrait');
  let currentY = 36;

  // Header Banner
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.roundedRect(margin, currentY, contentWidth, 54, 6, 6, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15);
  pdf.text(`FICHE D'ÉVALUATION ET DE NOTATION`, margin + 16, currentY + 24);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(148, 163, 184);
  pdf.text(`Élève : ${studentName}  |  ${config?.discipline || ''} - ${config?.level || ''}  |  ${todayStr}`, margin + 16, currentY + 42);

  if (isValidated) {
    pdf.setFillColor(16, 185, 129); // emerald-500
    pdf.roundedRect(pageWidth - margin - 120, currentY + 14, 106, 26, 4, 4, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('Correction validée', pageWidth - margin - 110, currentY + 30);
  }

  currentY += 66;

  // Note Box & Performance Mention
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, currentY, contentWidth, 52, 6, 6, 'FD');

  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.text(`${grade} / ${gradeMax}`, margin + 16, currentY + 34);

  const mention =
    grade >= gradeMax * 0.7
      ? 'Très bon travail - Objectifs atteints'
      : grade >= gradeMax * 0.5
      ? 'Acquis / Satisfaisant - Poursuivre les efforts'
      : 'À encourager - Des points à consolider';

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  if (grade >= gradeMax * 0.7) {
    pdf.setTextColor(5, 150, 105); // emerald-600
  } else if (grade >= gradeMax * 0.5) {
    pdf.setTextColor(2, 132, 199); // sky-600
  } else {
    pdf.setTextColor(225, 29, 72); // rose-600
  }
  pdf.text(mention, margin + 120, currentY + 32);

  currentY += 64;

  // Appreciation Block
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin, currentY, contentWidth, 68, 6, 6, 'FD');

  pdf.setTextColor(51, 65, 85);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text(`APPRÉCIATION PÉDAGOGIQUE POUR L'ÉLÈVE :`, margin + 12, currentY + 18);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9.5);
  pdf.setTextColor(15, 23, 42);
  const appLines = pdf.splitTextToSize(appreciation || 'Aucune appréciation renseignée.', contentWidth - 24);
  pdf.text(appLines, margin + 12, currentY + 34);

  currentY += 80;

  // Competences Grid if present
  if (competences.length > 0) {
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(margin, currentY, contentWidth, 20, 3, 3, 'F');
    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.text('COMPÉTENCES DU SOCLE ÉVALUÉES', margin + 10, currentY + 14);
    currentY += 24;

    for (const comp of competences) {
      if (currentY > pageHeight - 80) {
        pdf.addPage('a4', 'portrait');
        currentY = 40;
      }
      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, currentY, contentWidth, 22, 3, 3, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(51, 65, 85);
      pdf.text(comp.nom, margin + 10, currentY + 15);

      // Status pill
      if (comp.statut === 'Acquis') {
        pdf.setFillColor(16, 185, 129);
      } else if (comp.statut === 'En cours') {
        pdf.setFillColor(245, 158, 11);
      } else {
        pdf.setFillColor(239, 68, 68);
      }
      pdf.roundedRect(pageWidth - margin - 80, currentY + 4, 70, 14, 3, 3, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(comp.statut, pageWidth - margin - 60, currentY + 14);

      currentY += 26;
    }
    currentY += 10;
  }

  // Questions breakdown header
  if (currentY > pageHeight - 120) {
    pdf.addPage('a4', 'portrait');
    currentY = 40;
  }

  pdf.setFillColor(241, 245, 249);
  pdf.roundedRect(margin, currentY, contentWidth, 20, 3, 3, 'F');
  pdf.setTextColor(30, 41, 59);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9.5);
  pdf.text('DÉTAIL QUESTION PAR QUESTION', margin + 10, currentY + 14);
  currentY += 24;

  // Questions loop
  for (const q of questions) {
    if (currentY > pageHeight - 130) {
      pdf.addPage('a4', 'portrait');
      currentY = 40;
    }

    pdf.setDrawColor(203, 213, 225);
    pdf.setFillColor(255, 255, 255);

    // Box height estimation
    const reponseLines = pdf.splitTextToSize(`Réponse élève : ${q.reponse_eleve || 'Non traité'}`, contentWidth - 24);
    const attenduLines = pdf.splitTextToSize(`Attendu : ${q.reponse_attendue || '—'}`, contentWidth - 24);
    const justifLines = pdf.splitTextToSize(`Barème : ${q.justification || '—'}`, contentWidth - 24);
    const boxHeight = 32 + (reponseLines.length + attenduLines.length + justifLines.length) * 12;

    pdf.roundedRect(margin, currentY, contentWidth, boxHeight, 4, 4, 'FD');

    // Question Title + Score
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(15, 23, 42);
    pdf.text(q.numero_ou_titre, margin + 10, currentY + 16);

    pdf.setTextColor(37, 99, 235); // blue-600
    pdf.text(`${q.note} / ${q.note_max} pts`, pageWidth - margin - 80, currentY + 16);

    let innerY = currentY + 30;

    // Student formula
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(reponseLines, margin + 10, innerY);
    innerY += reponseLines.length * 12 + 2;

    // Expected
    pdf.setTextColor(16, 149, 108); // emerald-700
    pdf.text(attenduLines, margin + 10, innerY);
    innerY += attenduLines.length * 12 + 2;

    // Justification
    pdf.setTextColor(100, 116, 139);
    pdf.text(justifLines, margin + 10, innerY);

    currentY += boxHeight + 8;
  }

  // Teacher notes if provided
  if (teacherNotes) {
    if (currentY > pageHeight - 80) {
      pdf.addPage('a4', 'portrait');
      currentY = 40;
    }
    pdf.setFillColor(254, 243, 199); // amber-100
    pdf.setDrawColor(251, 191, 36);
    pdf.roundedRect(margin, currentY, contentWidth, 42, 4, 4, 'FD');
    pdf.setTextColor(146, 64, 14);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('NOTES DE L\'ENSEIGNANT :', margin + 10, currentY + 16);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.text(teacherNotes, margin + 10, currentY + 30);
  }

  // Save the PDF safely
  savePdfSafely(pdf, filename);
}

/**
 * High-Reliability Native Canvas PNG Generator
 * Fallback when html2canvas fails or times out.
 */
export async function exportDirectStudentReportPng(
  data: DirectReportData,
  filename: string
): Promise<void> {
  const { submission, studentName, grade, gradeMax, appreciation, pages, activePageIndex, rotatedPages = [] } = data;
  const pageSrc = rotatedPages[activePageIndex] || pages[activePageIndex] || submission.imageDataUrl;
  const safeJpeg = await ensureSafeJpegDataUrl(pageSrc, 1600);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const copyW = img.width;
        const copyH = img.height;
        const headerH = 120;
        const footerH = 160;
        const totalW = Math.max(copyW, 1000);
        const totalH = copyH + headerH + footerH;

        const canvas = document.createElement('canvas');
        canvas.width = totalW;
        canvas.height = totalH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          triggerDataUrlDownload(safeJpeg, filename);
          resolve();
          return;
        }

        // Background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, totalW, totalH);

        // Header
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, totalW, headerH);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText(`PRAXIS • ${studentName}`, 30, 50);

        ctx.font = 'bold 28px sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`Note : ${grade} / ${gradeMax}`, totalW - 260, 50);

        ctx.font = '18px sans-serif';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`Devoir corrigé le ${new Date().toLocaleDateString('fr-FR')}`, 30, 90);

        // Draw Copy Image centered
        const copyX = (totalW - copyW) / 2;
        ctx.drawImage(img, copyX, headerH, copyW, copyH);

        // Footer / Appreciation
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, headerH + copyH, totalW, footerH);

        ctx.font = 'bold 18px sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText('Appréciation pédagogique :', 30, headerH + copyH + 35);

        ctx.font = 'italic 16px sans-serif';
        ctx.fillStyle = '#cbd5e1';
        const cleanApp = appreciation || 'Devoir vérifié et corrigé par le professeur.';
        ctx.fillText(cleanApp.slice(0, 110), 30, headerH + copyH + 70);
        if (cleanApp.length > 110) {
          ctx.fillText(cleanApp.slice(110, 220), 30, headerH + copyH + 100);
        }

        canvas.toBlob((blob) => {
          if (blob) {
            triggerFileDownload(blob, filename.endsWith('.png') ? filename : `${filename}.png`);
          } else {
            triggerDataUrlDownload(canvas.toDataURL('image/png'), filename);
          }
          resolve();
        }, 'image/png');
      } catch (err) {
        console.warn('Canvas export failed, downloading raw image:', err);
        triggerDataUrlDownload(safeJpeg, filename);
        resolve();
      }
    };
    img.onerror = () => {
      triggerDataUrlDownload(safeJpeg, filename);
      resolve();
    };
    img.src = safeJpeg;
  });
}

/**
 * Generates and downloads a single, complete PDF containing all students' correction sheets.
 * Provides teachers with a 1-click batch export that works on all devices without window.print().
 */
export async function exportAllCorrectionSheetsPdf(
  config: AssignmentConfig,
  submissions: StudentSubmission[],
  filename?: string
): Promise<void> {
  const gradedStudents = submissions.filter((s) => s.status === 'completed' && s.result);
  if (gradedStudents.length === 0) return;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;
  const contentWidth = pageWidth - margin * 2;
  const todayStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  for (let i = 0; i < gradedStudents.length; i++) {
    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    const sub = gradedStudents[i];
    const res = sub.result!;

    // Top Header Banner
    pdf.setFillColor(15, 23, 42); // slate-900
    pdf.roundedRect(margin, 36, contentWidth, 54, 6, 6, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text(`RÉPUBLIQUE FRANÇAISE • FICHE D'ÉVALUATION`, margin + 16, 58);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`${config.discipline} • ${config.level} • ${config.title}`, margin + 16, 76);

    let currentY = 104;

    // Student identity and Note Box
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, currentY, contentWidth, 56, 6, 6, 'FD');

    pdf.setTextColor(30, 41, 59);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text(`Élève : ${sub.studentName}`, margin + 16, currentY + 28);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Fichier : ${sub.fileName || 'Copie'} • Restitution le ${todayStr}`, margin + 16, currentY + 44);

    // Note in box
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(37, 99, 235); // blue-600
    pdf.text(`${res.note} / ${res.note_sur}`, pageWidth - margin - 100, currentY + 36);

    currentY += 70;

    // Appreciation
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, currentY, contentWidth, 68, 6, 6, 'FD');

    pdf.setTextColor(51, 65, 85);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.text('APPRÉCIATION GÉNÉRALE :', margin + 12, currentY + 18);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(15, 23, 42);
    const appLines = pdf.splitTextToSize(res.appreciation || '—', contentWidth - 24);
    pdf.text(appLines, margin + 12, currentY + 34);

    currentY += 80;

    // Questions detail if any
    if (res.questions && res.questions.length > 0) {
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(margin, currentY, contentWidth, 20, 3, 3, 'F');
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.text('DÉTAIL DU BARÈME ET DES QUESTIONS', margin + 10, currentY + 14);
      currentY += 24;

      for (const q of res.questions.slice(0, 8)) {
        if (currentY > pageHeight - 60) break;
        pdf.setDrawColor(226, 232, 240);
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(margin, currentY, contentWidth, 24, 3, 3, 'FD');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(15, 23, 42);
        pdf.text(q.numero_ou_titre, margin + 10, currentY + 16);

        pdf.setTextColor(37, 99, 235);
        pdf.text(`${q.note} / ${q.note_max} pts`, pageWidth - margin - 70, currentY + 16);

        currentY += 28;
      }
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Fiche ${i + 1} sur ${gradedStudents.length} • Générée avec PRAXIS`, margin, pageHeight - 20);
  }

  const exportFilename = filename || `Praxis_Fiches_${config.title.replace(/[^a-zA-Z0-9]/g, '_')}_Toute_La_Classe.pdf`;
  savePdfSafely(pdf, exportFilename);
}
