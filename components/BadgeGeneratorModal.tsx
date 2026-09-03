import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Personale, Cantiere, AppSettings } from '../types';
import { Icons } from '../constants';
import jsPDF from 'jspdf';

interface BadgeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  personaleList: Personale[];
  cantieriList: Cantiere[];
  settings: AppSettings;
  initialPersonaleId?: string;
  onUpdatePersonale: (updated: Personale) => void;
}

export const BadgeGeneratorModal: React.FC<BadgeGeneratorModalProps> = ({
  isOpen,
  onClose,
  personaleList,
  cantieriList,
  settings,
  initialPersonaleId,
  onUpdatePersonale,
}) => {
  const [selectedPersonaleId, setSelectedPersonaleId] = useState<string>(
    initialPersonaleId || (personaleList[0]?.id || '')
  );
  const [selectedCantiereId, setSelectedCantiereId] = useState<string>('all');
  const [badgeOrientation, setBadgeOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [badgeView, setBadgeView] = useState<'both' | 'front' | 'back'>('both');
  const [printMode, setPrintMode] = useState<'single' | 'sheet'>('single');
  const [subappaltoDitta, setSubappaltoDitta] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const currentPersonale = personaleList.find(p => p.id === selectedPersonaleId) || personaleList[0];
  const currentCantiere = cantieriList.find(c => c.id === selectedCantiereId);
  const activeWorkers = personaleList.filter(p => p.inForza);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, targetPersonale?: Personale) => {
    const file = e.target.files?.[0];
    const target = targetPersonale || currentPersonale;
    if (file && target) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        onUpdatePersonale({ ...target, foto: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (dStr?: string) => {
    if (!dStr) return 'N/D';
    const d = new Date(dStr);
    return !isNaN(d.getTime()) ? d.toLocaleDateString('it-IT') : dStr;
  };

  const formatBirthInfo = (worker?: Personale) => {
    if (!worker) return 'N/D';
    const dStr = worker.dataNascita ? formatDate(worker.dataNascita) : '';
    const place = worker.luogoNascita?.trim();
    if (place && dStr && dStr !== 'N/D') {
      return `Nato a ${place} il ${dStr}`;
    } else if (dStr && dStr !== 'N/D') {
      return `Data Nascita: ${dStr}`;
    } else if (place) {
      return `Luogo Nascita: ${place}`;
    }
    return 'Data/Luogo Nascita: N/D';
  };

  const triggerPrint = () => {
    window.print();
  };

  // Funzione di rendering grafico del badge per il PDF (coordinate in millimetri)
  const drawPdfBadge = (
    doc: jsPDF,
    worker: Personale,
    x: number,
    y: number,
    isVert: boolean,
    isBack: boolean,
    cantiereName?: string
  ) => {
    const w = isVert ? 54 : 85.6;
    const h = isVert ? 85.6 : 54;

    // Linea di taglio tratteggiata attorno al badge
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.setDrawColor(180, 190, 205);
    doc.setLineWidth(0.2);
    doc.rect(x - 0.6, y - 0.6, w + 1.2, h + 1.2, 'S');
    doc.setLineDashPattern([], 0); // Ripristina linea continua

    // Sfondo del badge
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, w, h, 'F');
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.3);
    doc.rect(x, y, w, h, 'S');

    if (isBack) {
      // RETRO DEL BADGE
      // Header Retro
      doc.setFillColor(241, 245, 249);
      doc.rect(x, y, w, isVert ? 11 : 9, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.line(x, y + (isVert ? 11 : 9), x + w, y + (isVert ? 11 : 9));

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(isVert ? 7 : 7.5);
      doc.text("NOTE DI SICUREZZA - D.LGS. 81/2008", x + w / 2, y + (isVert ? 7 : 6), { align: 'center' });

      // Testi normativi
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(isVert ? 5.5 : 5.8);

      let textY = y + (isVert ? 16 : 13);
      const lines = [
        "• Il presente tesserino deve essere esposto in modo",
        "  visibile per l'intera durata dei lavori in cantiere.",
        "• Documento personale e non cedibile a terzi.",
        "• In caso di smarrimento o deterioramento avvisare",
        "  tempestivamente la direzione di cantiere.",
        "• Rilasciato ai sensi dell'art. 18, co. 1, lett. u e art. 26,",
        "  co. 8 del D.Lgs. 81/2008 e s.m.i."
      ];

      lines.forEach((l) => {
        doc.text(l, x + 3, textY);
        textY += (isVert ? 3.3 : 3.0);
      });

      if (subappaltoDitta) {
        doc.setFillColor(254, 243, 199);
        doc.setDrawColor(245, 158, 11);
        doc.roundedRect(x + 3, textY, w - 6, 5.5, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5);
        doc.setTextColor(146, 64, 14);
        doc.text(`Subappalto autorizzato a: ${subappaltoDitta.substring(0, 32)}`, x + 4, textY + 3.8);
      }

      // Firme
      const signY = y + h - (isVert ? 16 : 13);
      doc.setDrawColor(148, 163, 184);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(x + 4, signY + 5, x + (w / 2) - 2, signY + 5);
      doc.line(x + (w / 2) + 2, signY + 5, x + w - 4, signY + 5);
      doc.setLineDashPattern([], 0);

      doc.setFontSize(4.8);
      doc.setTextColor(100, 116, 139);
      doc.text("Firma Lavoratore", x + 4, signY + 8);
      doc.text("Firma Datore di Lavoro", x + (w / 2) + 2, signY + 8);

      // Bottom Bar Retro (normativa)
      doc.setFontSize(4.5);
      doc.setTextColor(148, 163, 184);
      doc.text("TESSERINO DI RICONOSCIMENTO • D.LGS. 81/2008", x + w / 2, y + h - 2, { align: 'center' });

    } else {
      // FRONTE DEL BADGE
      // Header Fronte (Scuro Istituzionale)
      const headerH = isVert ? 14 : 11;
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(x, y, w, headerH, 'F');

      // Nome Azienda
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(isVert ? 7.5 : 8);
      doc.setFont('helvetica', 'bold');
      const companyName = (settings.nomeAzienda || 'IMPRESA EDILE').toUpperCase();
      doc.text(companyName.substring(0, 30), x + w / 2, y + (isVert ? 5.5 : 5), { align: 'center' });

      // Sottotitolo Legge 81/08
      doc.setFontSize(isVert ? 5 : 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(147, 197, 253); // blue-300
      doc.text("TESSERINO DI RICONOSCIMENTO (D.Lgs. 81/08)", x + w / 2, y + (isVert ? 10.5 : 9), { align: 'center' });

      if (isVert) {
        // LAYOUT VERTICALE (54 x 85.6 mm)
        // Foto Lavoratore (centrata)
        const photoW = 20;
        const photoH = 25;
        const photoX = x + (w - photoW) / 2;
        const photoY = y + 17;

        if (worker.foto) {
          try {
            doc.addImage(worker.foto, 'JPEG', photoX, photoY, photoW, photoH);
          } catch {
            doc.setFillColor(241, 245, 249);
            doc.rect(photoX, photoY, photoW, photoH, 'F');
            doc.setFontSize(6);
            doc.setTextColor(148, 163, 184);
            doc.text("FOTO", photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
          }
        } else {
          doc.setFillColor(241, 245, 249);
          doc.rect(photoX, photoY, photoW, photoH, 'F');
          doc.setFontSize(6);
          doc.setTextColor(148, 163, 184);
          doc.text("FOTO", photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
        }
        // Cornice foto
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.3);
        doc.rect(photoX, photoY, photoW, photoH, 'S');

        // Dati Lavoratore
        let curY = y + 43.5;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const fullName = `${worker.cognome} ${worker.nome}`.toUpperCase();
        doc.text(fullName.substring(0, 24), x + w / 2, curY, { align: 'center' });

        curY += 3.8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.2);
        doc.setTextColor(71, 85, 105);
        doc.text(worker.ruolo.toUpperCase().substring(0, 26), x + w / 2, curY, { align: 'center' });

        // Data e Luogo di Nascita
        curY += 3.6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.5);
        doc.setTextColor(71, 85, 105);
        doc.text(formatBirthInfo(worker).substring(0, 34), x + w / 2, curY, { align: 'center' });

        // BOX DATA DI ASSUNZIONE (OBBLIGATORIO D.LGS 81/08 - IN EVIDENZA)
        curY += 2.8;
        doc.setFillColor(239, 246, 255); // blue-50
        doc.setDrawColor(191, 219, 254); // blue-200
        doc.roundedRect(x + 4, curY, w - 8, 7.0, 1, 1, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(4.8);
        doc.setTextColor(37, 99, 235); // blue-600
        doc.text("DATA ASSUNZIONE", x + w / 2, curY + 2.6, { align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(30, 58, 138); // blue-900
        doc.text(formatDate(worker.dataAssunzione), x + w / 2, curY + 5.8, { align: 'center' });

        // Codice Fiscale
        curY += 10.0;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.6);
        doc.setTextColor(71, 85, 105);
        doc.text(`C.F.: ${worker.codiceFiscale || 'N/D'}`, x + w / 2, curY, { align: 'center' });

        // Cantiere
        if (cantiereName) {
          curY += 3.4;
          doc.setFontSize(5.2);
          doc.setTextColor(51, 65, 85);
          doc.text(`Cantiere: ${cantiereName.substring(0, 26)}`, x + w / 2, curY, { align: 'center' });
        }

        // Footer Bar (senza matricola)
        doc.setFillColor(248, 250, 252);
        doc.rect(x, y + h - 6.5, w, 6.5, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(x, y + h - 6.5, x + w, y + h - 6.5);

        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text("D.Lgs. 81/2008", x + 2.5, y + h - 2.5);

        doc.setTextColor(4, 120, 87); // emerald-700
        doc.text("AUTORIZZATO", x + w - 2.5, y + h - 2.5, { align: 'right' });

      } else {
        // LAYOUT ORIZZONTALE (85.6 x 54 mm)
        // Foto Lavoratore (a sinistra)
        const photoW = 20;
        const photoH = 26;
        const photoX = x + 5;
        const photoY = y + 14;

        if (worker.foto) {
          try {
            doc.addImage(worker.foto, 'JPEG', photoX, photoY, photoW, photoH);
          } catch {
            doc.setFillColor(241, 245, 249);
            doc.rect(photoX, photoY, photoW, photoH, 'F');
            doc.setFontSize(6);
            doc.setTextColor(148, 163, 184);
            doc.text("FOTO", photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
          }
        } else {
          doc.setFillColor(241, 245, 249);
          doc.rect(photoX, photoY, photoW, photoH, 'F');
          doc.setFontSize(6);
          doc.setTextColor(148, 163, 184);
          doc.text("FOTO", photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
        }
        doc.setDrawColor(15, 23, 42);
        doc.setLineWidth(0.3);
        doc.rect(photoX, photoY, photoW, photoH, 'S');

        // Dati a destra
        const dataX = x + 28.5;
        let curY = y + 16.0;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.8);
        doc.setTextColor(15, 23, 42);
        doc.text(`${worker.cognome} ${worker.nome}`.toUpperCase().substring(0, 26), dataX, curY);

        curY += 4.0;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.2);
        doc.setTextColor(71, 85, 105);
        doc.text(`Mansione: ${worker.ruolo.toUpperCase()}`, dataX, curY);

        // Data e Luogo di Nascita
        curY += 3.6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.6);
        doc.setTextColor(71, 85, 105);
        doc.text(formatBirthInfo(worker).substring(0, 36), dataX, curY);

        // Box Data Assunzione
        curY += 2.8;
        doc.setFillColor(239, 246, 255);
        doc.setDrawColor(191, 219, 254);
        doc.roundedRect(dataX, curY, 52, 7.0, 1, 1, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(4.8);
        doc.setTextColor(37, 99, 235);
        doc.text("DATA ASSUNZIONE (D.Lgs. 81/08)", dataX + 2, curY + 2.6);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(30, 58, 138);
        doc.text(formatDate(worker.dataAssunzione), dataX + 2, curY + 5.8);

        // Codice Fiscale
        curY += 10.0;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5.6);
        doc.setTextColor(71, 85, 105);
        doc.text(`Codice Fiscale: ${worker.codiceFiscale || 'N/D'}`, dataX, curY);

        // Cantiere
        if (cantiereName) {
          curY += 3.4;
          doc.setFontSize(5.2);
          doc.setTextColor(51, 65, 85);
          doc.text(`Cantiere: ${cantiereName.substring(0, 32)}`, dataX, curY);
        }

        // Footer Bar (senza matricola)
        doc.setFillColor(248, 250, 252);
        doc.rect(x, y + h - 5.5, w, 5.5, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(x, y + h - 5.5, x + w, y + h - 5.5);

        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(100, 116, 139);
        doc.text("D.Lgs. 81/2008", x + 3, y + h - 2.0);

        doc.setTextColor(4, 120, 87);
        doc.text("LAVORATORE AUTORIZZATO", x + w - 3, y + h - 2.0, { align: 'right' });
      }
    }
  };

  // Genera PDF pronto per foglio A4 alle dimensioni reali (nessuna distorsione o allargamento a tutto schermo)
  const downloadPdf = () => {
    // Creiamo SEMPRE un documento A4 (210 x 297 mm) per garantire che qualsiasi stampante lo stampi alla scala 1:1 corretta!
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    const isVert = badgeOrientation === 'vertical';
    const cantiereName = currentCantiere ? currentCantiere.nome : undefined;

    if (printMode === 'single') {
      if (!currentPersonale) return;

      // Intestazione del foglio A4
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text("TESSERINO DI RICONOSCIMENTO (D.Lgs. 81/2008)", 105, 18, { align: 'center' });

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Azienda: ${settings.nomeAzienda}  •  Dipendente: ${currentPersonale.cognome} ${currentPersonale.nome}`, 105, 24, { align: 'center' });

      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Dimensioni reali di stampa: 85,6 × 54,0 mm (Standard ID-1). Ritagliare lungo le linee tratteggiate.", 105, 29, { align: 'center' });

      // Riquadro di verifica scala 100% (lunghezza esatta 50 mm)
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(248, 250, 252);
      doc.rect(75, 34, 60, 6.5, 'FD');
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text("VERIFICA SCALA: QUESTA LINEA MISURA 50 MM (5 CM)", 105, 38, { align: 'center' });
      doc.setDrawColor(71, 85, 105);
      doc.line(80, 39.5, 130, 39.5); // 50 mm line
      doc.line(80, 38.5, 80, 40.5);
      doc.line(130, 38.5, 130, 40.5);

      // Posizionamento tesserini
      const startY = 48;
      if (isVert) {
        // Verticale: 54 x 85.6 mm
        if (badgeView === 'both') {
          // Fronte e Retro affiancati
          const frontX = 45;
          const backX = 111;
          drawPdfBadge(doc, currentPersonale, frontX, startY, true, false, cantiereName);
          drawPdfBadge(doc, currentPersonale, backX, startY, true, true, cantiereName);

          // Etichette Fronte / Retro
          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 116, 139);
          doc.text("FRONTE", frontX + 27, startY + 90, { align: 'center' });
          doc.text("RETRO", backX + 27, startY + 90, { align: 'center' });

          // Linea di piega centrale
          doc.setLineDashPattern([2, 2], 0);
          doc.setDrawColor(148, 163, 184);
          doc.line(105, startY, 105, startY + 85.6);
          doc.setFontSize(5.5);
          doc.text("PIEGARE QUI", 105, startY + 43, { align: 'center', angle: 90 });
          doc.setLineDashPattern([], 0);
        } else if (badgeView === 'front') {
          drawPdfBadge(doc, currentPersonale, (210 - 54) / 2, startY, true, false, cantiereName);
        } else {
          drawPdfBadge(doc, currentPersonale, (210 - 54) / 2, startY, true, true, cantiereName);
        }
      } else {
        // Orizzontale: 85.6 x 54 mm
        if (badgeView === 'both') {
          // Fronte e Retro incolonnati o affiancati
          const frontX = 18;
          const backX = 106.4;
          drawPdfBadge(doc, currentPersonale, frontX, startY, false, false, cantiereName);
          drawPdfBadge(doc, currentPersonale, backX, startY, false, true, cantiereName);

          doc.setFontSize(7);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 116, 139);
          doc.text("FRONTE", frontX + 42.8, startY + 58, { align: 'center' });
          doc.text("RETRO", backX + 42.8, startY + 58, { align: 'center' });
        } else if (badgeView === 'front') {
          drawPdfBadge(doc, currentPersonale, (210 - 85.6) / 2, startY, false, false, cantiereName);
        } else {
          drawPdfBadge(doc, currentPersonale, (210 - 85.6) / 2, startY, false, true, cantiereName);
        }
      }

      // Istruzioni in fondo al foglio
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text("Istruzioni: Nelle opzioni della stampante impostare 'Scala: 100%' oppure 'Dimensioni effettive'. Non selezionare 'Adatta alla pagina'.", 105, 275, { align: 'center' });
      doc.text("Conforme all'art. 18, comma 1, lett. u e all'art. 26, comma 8 del D.Lgs. 9 aprile 2008 n. 81.", 105, 280, { align: 'center' });

      doc.save(`Tesserino_${currentPersonale.cognome}_${currentPersonale.nome}_A4.pdf`);

    } else {
      // MODALITÀ FOGLIO A4 MULTI-BADGE
      const workers = activeWorkers;
      const pageSize = isVert ? 9 : 8;
      const totalPages = Math.ceil(workers.length / pageSize) || 1;

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) doc.addPage();

        // Intestazione Foglio A4
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`FOGLIO TESSERINI DI CANTIERE - ${settings.nomeAzienda.toUpperCase()}`, 105, 12, { align: 'center' });

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text(`D.Lgs. 81/2008 • Pagina ${page + 1} di ${totalPages} • Scala reale 1:1 (85,6 × 54 mm) • Ritagliare lungo le linee tratteggiate`, 105, 16.5, { align: 'center' });

        const pageWorkers = workers.slice(page * pageSize, (page + 1) * pageSize);

        if (isVert) {
          // Griglia 3 colonne x 3 righe = 9 tesserini (54 x 85.6 mm)
          // Larghezza totale = 3 * 54 + 2 * 6 = 174 mm (Margine sinistro = (210 - 174) / 2 = 18 mm)
          // Altezza totale = 3 * 85.6 + 2 * 5 = 266.8 mm (Margine superiore = 19 mm)
          const startX = 18;
          const startY = 20;
          const gapX = 6;
          const gapY = 5;

          pageWorkers.forEach((wObj, idx) => {
            const col = idx % 3;
            const row = Math.floor(idx / 3);
            const posX = startX + col * (54 + gapX);
            const posY = startY + row * (85.6 + gapY);
            drawPdfBadge(doc, wObj, posX, posY, true, false, cantiereName);
          });
        } else {
          // Griglia 2 colonne x 4 righe = 8 tesserini (85.6 x 54 mm)
          // Larghezza totale = 2 * 85.6 + 8 = 179.2 mm (Margine sinistro = (210 - 179.2) / 2 = 15.4 mm)
          // Altezza totale = 4 * 54 + 3 * 6 = 234 mm (Margine superiore = 24 mm)
          const startX = 15.4;
          const startY = 24;
          const gapX = 8;
          const gapY = 6;

          pageWorkers.forEach((wObj, idx) => {
            const col = idx % 2;
            const row = Math.floor(idx / 2);
            const posX = startX + col * (85.6 + gapX);
            const posY = startY + row * (54 + gapY);
            drawPdfBadge(doc, wObj, posX, posY, false, false, cantiereName);
          });
        }
      }

      doc.save(`Tesserini_Cantieri_Foglio_A4.pdf`);
    }
  };

  // Componente del singolo badge (Fronte / Retro)
  const renderSingleBadgeCard = (personale: Personale, viewType: 'front' | 'back' = 'front', isPrintVersion: boolean = false) => {
    const isVert = badgeOrientation === 'vertical';

    // CLASSI CSS RIGOROSE PER DIMENSIONI ESATTE IN STAMPA (Millimetri standard ID-1)
    const printDimensionClass = isVert ? 'badge-fixed-size-vert' : 'badge-fixed-size-horiz';

    if (viewType === 'back') {
      return (
        <div 
          className={`bg-white text-slate-900 border border-slate-800 rounded-lg shadow-sm flex flex-col justify-between p-3 relative overflow-hidden ${printDimensionClass}`}
          style={{ width: isVert ? '54mm' : '85.6mm', height: isVert ? '85.6mm' : '54mm', boxSizing: 'border-box' }}
        >
          {/* Asola porta-badge sul retro */}
          {isVert && (
            <div className="w-8 h-1.5 bg-slate-200 rounded-full mx-auto mb-1 border border-slate-300" />
          )}

          <div>
            <div className="border-b border-slate-200 pb-1.5 mb-1.5 text-center">
              <p className="text-[7px] font-black uppercase tracking-widest text-slate-400">NOTE DI SICUREZZA CANTIERE</p>
              <p className="text-[8px] font-black text-slate-800 uppercase leading-tight">{settings.nomeAzienda}</p>
            </div>

            <div className="space-y-1 text-[6.5px] text-slate-600 leading-tight">
              <p>• Il presente tesserino deve essere esposto in modo visibile per l'intera permanenza nell'area di cantiere.</p>
              <p>• È personale e non cedibile a terzi. In caso di smarrimento o deterioramento, avvisare tempestivamente la direzione.</p>
              <p>• Rilasciato ai sensi dell'art. 18, co. 1, lett. u e art. 26, co. 8 del D.Lgs. 9 aprile 2008 n. 81 e s.m.i.</p>
              {subappaltoDitta && (
                <div className="p-1 bg-amber-50 border border-amber-200 rounded text-amber-900 font-bold mt-1">
                  Subappalto autorizzato a: {subappaltoDitta}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-1.5 grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-[6px] font-bold text-slate-400 uppercase">Firma Lavoratore</p>
              <div className="h-5 border-b border-dashed border-slate-400 mt-1" />
            </div>
            <div>
              <p className="text-[6px] font-bold text-slate-400 uppercase">Firma Datore di Lavoro</p>
              <div className="h-5 border-b border-dashed border-slate-400 mt-1" />
            </div>
          </div>

          <div className="text-center text-[5.5px] text-slate-400 pt-1 border-t border-slate-100 uppercase font-bold">
            Tesserino di Riconoscimento Cantiere • D.Lgs. 81/2008
          </div>
        </div>
      );
    }

    // FRONTE BADGE
    return (
      <div 
        className={`bg-white text-slate-900 border border-slate-900 rounded-lg shadow-sm flex flex-col justify-between relative overflow-hidden ${printDimensionClass}`}
        style={{ width: isVert ? '54mm' : '85.6mm', height: isVert ? '85.6mm' : '54mm', boxSizing: 'border-box' }}
      >
        {/* Asola badge clip foro superiore se verticale */}
        {isVert && (
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-slate-800/40 rounded-full z-20 border border-white/50" />
        )}

        {/* Intestazione Aziendale */}
        <div className="bg-slate-900 text-white px-2 py-1.5 text-center relative z-10">
          <p className="text-[8.5px] font-black uppercase tracking-wider truncate drop-shadow-sm leading-tight">
            {settings.nomeAzienda}
          </p>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <span className="text-[6px] font-bold text-blue-300 uppercase tracking-widest leading-none">
              TESSERINO DI RICONOSCIMENTO
            </span>
            <span className="text-[5.5px] text-slate-300 leading-none">
              • D.Lgs. 81/08
            </span>
          </div>
        </div>

        {/* Contenuto Badge */}
        {isVert ? (
          // CONTENUTO VERTICALE (54 x 85.6 mm)
          <div className="p-2 flex-1 flex flex-col items-center justify-center text-center">
            {/* Fototessera */}
            <div className="relative shrink-0 mb-1.5">
              {personale.foto ? (
                <img 
                  src={personale.foto} 
                  alt="Foto" 
                  className="w-[20mm] h-[25mm] object-cover rounded-md border border-slate-900 shadow-xs bg-slate-100" 
                />
              ) : (
                <div className="w-[20mm] h-[25mm] rounded-md border border-dashed border-slate-400 bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-0.5">
                  <span className="text-xs">📷</span>
                  <span className="text-[7.5px] font-bold">FOTO</span>
                </div>
              )}
            </div>

            {/* Dati Dipendente */}
            <div className="w-full space-y-0.5">
              <h3 className="text-[9.5px] font-black text-slate-900 leading-tight uppercase tracking-tight truncate">
                {personale.cognome} {personale.nome}
              </h3>

              <p className="text-[7px] font-bold text-slate-600 uppercase tracking-wider truncate">
                {personale.ruolo} {personale.categoria ? `• ${personale.categoria}` : ''}
              </p>

              {/* DATA E LUOGO DI NASCITA */}
              <p className="text-[6.5px] font-semibold text-slate-600 leading-tight truncate px-1">
                {formatBirthInfo(personale)}
              </p>

              {/* DATA DI ASSUNZIONE (IN EVIDENZA NORMATIVA D.LGS. 81/08) */}
              <div className="inline-block bg-blue-50 border border-blue-200 rounded-md px-2 py-0.5 my-0.5 w-[94%]">
                <p className="text-[5.5px] font-black text-blue-600 uppercase tracking-wider leading-none">
                  DATA ASSUNZIONE
                </p>
                <p className="text-[8.5px] font-black text-blue-950 leading-tight">
                  {formatDate(personale.dataAssunzione)}
                </p>
              </div>

              {personale.codiceFiscale && (
                <p className="text-[6.5px] font-bold text-slate-500 font-mono tracking-wider">
                  C.F.: {personale.codiceFiscale}
                </p>
              )}

              {currentCantiere && (
                <p className="text-[6px] font-bold text-slate-700 truncate bg-slate-100 px-1 py-0.5 rounded">
                  🏗️ {currentCantiere.nome}
                </p>
              )}
            </div>
          </div>
        ) : (
          // CONTENUTO ORIZZONTALE (85.6 x 54 mm)
          <div className="p-2 flex-1 flex flex-row items-center gap-2.5">
            {/* Fototessera */}
            <div className="relative shrink-0">
              {personale.foto ? (
                <img 
                  src={personale.foto} 
                  alt="Foto" 
                  className="w-[20mm] h-[26mm] object-cover rounded-md border border-slate-900 shadow-xs bg-slate-100" 
                />
              ) : (
                <div className="w-[20mm] h-[26mm] rounded-md border border-dashed border-slate-400 bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-0.5">
                  <span className="text-xs">📷</span>
                  <span className="text-[7.5px] font-bold">FOTO</span>
                </div>
              )}
            </div>

            {/* Dati Dipendente a destra */}
            <div className="flex-1 min-w-0 space-y-0.5 text-left">
              <h3 className="text-[10px] font-black text-slate-900 leading-tight uppercase tracking-tight truncate">
                {personale.cognome} {personale.nome}
              </h3>

              <p className="text-[7.2px] font-bold text-slate-600 uppercase tracking-wider truncate">
                {personale.ruolo} {personale.categoria ? `• ${personale.categoria}` : ''}
              </p>

              {/* DATA E LUOGO DI NASCITA */}
              <p className="text-[6.8px] font-semibold text-slate-600 leading-tight truncate">
                {formatBirthInfo(personale)}
              </p>

              {/* DATA ASSUNZIONE */}
              <div className="bg-blue-50 border border-blue-200 rounded-md px-2 py-0.5 inline-block">
                <span className="text-[5.5px] font-black text-blue-600 uppercase tracking-wider block leading-none">
                  DATA ASSUNZIONE (D.Lgs. 81/08)
                </span>
                <span className="text-[8.5px] font-black text-blue-950 leading-tight">
                  {formatDate(personale.dataAssunzione)}
                </span>
              </div>

              {personale.codiceFiscale && (
                <p className="text-[6.5px] font-bold text-slate-500 font-mono tracking-wider">
                  C.F.: {personale.codiceFiscale}
                </p>
              )}

              {currentCantiere && (
                <p className="text-[6px] font-bold text-slate-700 truncate bg-slate-100 px-1 py-0.5 rounded">
                  🏗️ {currentCantiere.nome}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Barra Inferiore Badge (senza matricola) */}
        <div className="bg-slate-100 border-t border-slate-200 px-2 py-0.5 flex items-center justify-between text-[6px] font-black text-slate-500">
          <span className="font-bold">D.Lgs. 81/2008</span>
          <span className="text-emerald-700 font-bold uppercase">LAVORATORE AUTORIZZATO</span>
        </div>
      </div>
    );
  };

  // Suddivisione lavoratori per pagina A4 (9 per pagina in verticale, 8 in orizzontale)
  const pageSize = badgeOrientation === 'vertical' ? 9 : 8;
  const workerPages: Personale[][] = [];
  for (let i = 0; i < activeWorkers.length; i += pageSize) {
    workerPages.push(activeWorkers.slice(i, i + pageSize));
  }

  return (
    <>
      {/* MODALE A SCHERMO */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto no-print">
        <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
          
          {/* HEADER MODALE */}
          <div className="p-6 md:px-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
                <Icons.Badge />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                    Generatore Tesserini di Cantiere
                  </h2>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full uppercase">
                    D.Lgs. 81/2008
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-bold">
                  Badge identificativi a norma di legge con data di assunzione e fototessera
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-red-500 border border-slate-100 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          {/* CORPO MODALE */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 custom-scrollbar">
            
            {/* COLONNA SINISTRA: OPZIONI E CONTROLLI */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Modalità Stampa: Singolo vs Foglio A4 Multi-Badge */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Modalità di Creazione & Stampa
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintMode('single')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                      printMode === 'single'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Icons.Personale /> Singolo Dipendente
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintMode('sheet')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 ${
                      printMode === 'sheet'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Icons.Grid /> Foglio A4 ({activeWorkers.length})
                  </button>
                </div>
              </div>

              {/* Selezione Dipendente (in modalità singolo) */}
              {printMode === 'single' && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Seleziona Dipendente
                  </label>
                  <select
                    value={selectedPersonaleId}
                    onChange={(e) => setSelectedPersonaleId(e.target.value)}
                    className="w-full p-3.5 bg-white border-2 border-slate-200 rounded-xl font-bold text-slate-900 focus:border-blue-500 outline-none text-sm"
                  >
                    {personaleList.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.cognome} {p.nome} ({p.ruolo}) {!p.inForza ? '[Cessato]' : ''}
                      </option>
                    ))}
                  </select>

                  {/* Avviso data assunzione mancante */}
                  {currentPersonale && !currentPersonale.dataAssunzione && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold flex items-start gap-2">
                      <span className="text-base leading-none">⚠️</span>
                      <div>
                        <p className="font-black">Data di assunzione non inserita!</p>
                        <p className="text-[11px] font-medium text-amber-700">
                          Il D.Lgs. 81/08 richiede obbligatoriamente la data di assunzione sul badge. Inseriscila dall'anagrafica.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Caricamento Fototessera */}
                  {currentPersonale && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {currentPersonale.foto ? (
                          <img src={currentPersonale.foto} alt="Foto" className="w-9 h-11 object-cover rounded-lg border border-slate-300" />
                        ) : (
                          <div className="w-9 h-11 rounded-lg bg-slate-200 flex items-center justify-center text-xs">📷</div>
                        )}
                        <div>
                          <p className="text-xs font-black text-slate-800">Fototessera</p>
                          <p className="text-[10px] text-slate-400">{currentPersonale.foto ? 'Presente' : 'Nessuna foto'}</p>
                        </div>
                      </div>
                      <div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          accept="image/*" 
                          onChange={(e) => handlePhotoUpload(e)} 
                          className="hidden" 
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-500 text-blue-600 rounded-lg text-xs font-black uppercase transition-all"
                        >
                          {currentPersonale.foto ? 'Cambia Foto' : '+ Carica Foto'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Modifica Rapida Dati Anagrafici Badge */}
                  {currentPersonale && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <span>📝</span> Dati Badge Lavoratore
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase block">Data di Nascita</label>
                          <input
                            type="date"
                            value={currentPersonale.dataNascita || ''}
                            onChange={(e) => onUpdatePersonale({ ...currentPersonale, dataNascita: e.target.value })}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase block">Luogo di Nascita</label>
                          <input
                            type="text"
                            placeholder="es. Roma (RM)"
                            value={currentPersonale.luogoNascita || ''}
                            onChange={(e) => onUpdatePersonale({ ...currentPersonale, luogoNascita: e.target.value })}
                            className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-blue-700 uppercase block">Data di Assunzione (D.Lgs. 81/08)</label>
                        <input
                          type="date"
                          value={currentPersonale.dataAssunzione || ''}
                          onChange={(e) => onUpdatePersonale({ ...currentPersonale, dataAssunzione: e.target.value })}
                          className="w-full p-2 bg-blue-50/50 border border-blue-200 rounded-lg text-xs font-bold text-blue-950"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Personalizzazione Aspetto Badge */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Orientamento e Formato
                </label>

                {/* Orientamento */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBadgeOrientation('vertical')}
                    className={`py-2 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${
                      badgeOrientation === 'vertical'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Verticale (54×85mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBadgeOrientation('horizontal')}
                    className={`py-2 px-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${
                      badgeOrientation === 'horizontal'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Orizzontale (85×54mm)
                  </button>
                </div>

                {/* Fronte / Retro View (Solo in modalità singolo) */}
                {printMode === 'single' && (
                  <div className="flex gap-2">
                    {(['both', 'front', 'back'] as const).map((view) => (
                      <button
                        key={view}
                        type="button"
                        onClick={() => setBadgeView(view)}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                          badgeView === view
                            ? 'bg-blue-100 text-blue-800 border border-blue-300'
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        {view === 'both' ? 'Fronte & Retro' : view === 'front' ? 'Solo Fronte' : 'Solo Retro'}
                      </button>
                    ))}
                  </div>
                )}

                {/* Cantiere Assegnato */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Cantiere di Assegnazione</label>
                  <select
                    value={selectedCantiereId}
                    onChange={(e) => setSelectedCantiereId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="all">Tutti i cantieri dell'impresa (Generico)</option>
                    {cantieriList.map(c => (
                      <option key={c.id} value={c.id}>{c.nome} ({c.cliente})</option>
                    ))}
                  </select>
                </div>

                {/* Ditta in subappalto */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Eventuale Impresa Subappaltatrice</label>
                  <input
                    type="text"
                    placeholder="Es. Edilizia Rossi Srl (se lavoratore in subappalto)"
                    value={subappaltoDitta}
                    onChange={(e) => setSubappaltoDitta(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* COLONNA DESTRA: ANTEPRIMA A VIDEO */}
            <div className="lg:col-span-7 bg-slate-100/70 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[420px] border border-slate-200">
              <div className="w-full flex items-center justify-between mb-4 px-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                  {printMode === 'single' ? 'Anteprima Tesserino' : `Anteprima Griglia A4 (${activeWorkers.length} lavoratori)`}
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded-full border border-slate-200">
                  Formato reale: 85,6 × 54 mm
                </span>
              </div>

              {printMode === 'single' && currentPersonale && (
                <div className="flex flex-wrap items-center justify-center gap-6 my-auto">
                  {(badgeView === 'both' || badgeView === 'front') && (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FRONTE</span>
                      <div className="border border-dashed border-slate-400 p-1 rounded-xl bg-white shadow-sm">
                        {renderSingleBadgeCard(currentPersonale, 'front')}
                      </div>
                    </div>
                  )}
                  {(badgeView === 'both' || badgeView === 'back') && (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RETRO</span>
                      <div className="border border-dashed border-slate-400 p-1 rounded-xl bg-white shadow-sm">
                        {renderSingleBadgeCard(currentPersonale, 'back')}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {printMode === 'sheet' && (
                <div className="w-full max-h-[420px] overflow-y-auto p-4 bg-white rounded-2xl border border-slate-200 custom-scrollbar">
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 font-bold mb-4 text-center">
                    📄 Verranno impaginati {activeWorkers.length} tesserini ({badgeOrientation === 'vertical' ? '9' : '8'} per foglio A4) pronti con linee di taglio per la stampa.
                  </div>
                  <div className={`grid ${badgeOrientation === 'vertical' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'} gap-3 justify-items-center`}>
                    {activeWorkers.map(worker => (
                      <div key={worker.id} className="border border-dashed border-slate-300 p-1 rounded-lg bg-slate-50/50">
                        {renderSingleBadgeCard(worker, 'front')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER MODALE: AZIONI DI STAMPA E DOWNLOAD */}
          <div className="p-6 md:px-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
            <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
              📏 <span className="font-bold">Stampa fedele 100%:</span> I tesserini vengono impaginati su foglio A4 alle misure fisiche effettive (85,6 × 54 mm).
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={downloadPdf}
                className="flex-1 sm:flex-none px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                title="Genera il file PDF impaginato su foglio A4 a scala 1:1"
              >
                <Icons.Pdf /> Scarica PDF {printMode === 'single' ? 'Tesserino' : 'Foglio A4'}
              </button>
              <button
                type="button"
                onClick={triggerPrint}
                className="flex-1 sm:flex-none px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
              >
                <Icons.Printer /> Stampa {printMode === 'single' ? 'Tesserino (A4)' : 'Tutti i Tesserini (A4)'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PORTAL DI STAMPA DIRETTA SU FOGLIO A4 (Attivo SOLO durante window.print()) */}
      {createPortal(
        <div id="badge-print-portal">
          <style dangerouslySetInnerHTML={{ __html: `
            @media screen {
              #badge-print-portal {
                display: none !important;
              }
            }
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body > *:not(#badge-print-portal) {
                display: none !important;
              }
              #badge-print-portal {
                display: block !important;
                position: static !important;
                width: 190mm !important;
                margin: 0 auto !important;
                background: #ffffff !important;
                padding: 0 !important;
              }
              .badge-fixed-size-vert {
                width: 54mm !important;
                min-width: 54mm !important;
                max-width: 54mm !important;
                height: 85.6mm !important;
                min-height: 85.6mm !important;
                max-height: 85.6mm !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .badge-fixed-size-horiz {
                width: 85.6mm !important;
                min-width: 85.6mm !important;
                max-width: 85.6mm !important;
                height: 54mm !important;
                min-height: 54mm !important;
                max-height: 54mm !important;
                box-sizing: border-box !important;
                overflow: hidden !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .a4-print-page {
                width: 190mm !important;
                min-height: 270mm !important;
                box-sizing: border-box !important;
                page-break-after: always !important;
                break-after: page !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
              }
              .a4-print-page:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
              }
            }
          `}} />

          {/* STAMPA SINGOLO TESSERINO SU FOGLIO A4 (MISURA REALE 1:1 CON RITAGLIO) */}
          {printMode === 'single' && currentPersonale && (
            <div className="a4-print-page">
              {/* Header Pagina di Stampa */}
              <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
                <h1 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  Tesserino di Riconoscimento Cantiere (D.Lgs. 81/2008)
                </h1>
                <p className="text-[9px] font-bold text-slate-600 uppercase">
                  Impresa: {settings.nomeAzienda}  •  Lavoratore: {currentPersonale.cognome} {currentPersonale.nome} ({currentPersonale.ruolo})
                </p>
                <p className="text-[8px] text-slate-500 mt-0.5">
                  Formato reale: 85,6 × 54,0 mm (Standard ID-1) • Ritagliare lungo le linee tratteggiate esterne
                </p>
              </div>

              {/* Riquadro di controllo scala per verifica con righello */}
              <div className="mb-6 p-2 bg-slate-50 border border-slate-300 rounded flex items-center justify-between text-[8px] text-slate-700">
                <span className="font-bold">VERIFICA SCALA 100%:</span>
                <div style={{ width: '50mm' }} className="h-4 bg-slate-200 border border-slate-400 flex items-center justify-center font-mono font-bold text-[7px]">
                  |← 50 mm (5 cm) →|
                </div>
                <span>Se la barra grigia misura esattamente 5 cm, le impostazioni di stampa sono perfette.</span>
              </div>

              {/* Tesserino/i posizionati */}
              <div className="flex flex-wrap items-start justify-center gap-8 my-6">
                {(badgeView === 'both' || badgeView === 'front') && (
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                      FRONTE
                    </span>
                    <div className="border border-dashed border-slate-500 p-[1mm] rounded-lg">
                      {renderSingleBadgeCard(currentPersonale, 'front', true)}
                    </div>
                  </div>
                )}

                {(badgeView === 'both' || badgeView === 'back') && (
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">
                      RETRO
                    </span>
                    <div className="border border-dashed border-slate-500 p-[1mm] rounded-lg">
                      {renderSingleBadgeCard(currentPersonale, 'back', true)}
                    </div>
                  </div>
                )}
              </div>

              {/* Note e Istruzioni a piè di pagina */}
              <div className="mt-auto pt-6 border-t border-slate-300 text-center space-y-1">
                <p className="text-[7.5px] font-bold text-slate-700">
                  OBBLIGO DI ESPOSIZIONE: I lavoratori devono esporre visibilmente la tessera di riconoscimento per tutta la durata delle attività in cantiere.
                </p>
                <p className="text-[6.5px] text-slate-500">
                  Rilasciato ai sensi dell'art. 18, co. 1, lett. u e art. 26, co. 8 del D.Lgs. 9 aprile 2008 n. 81 e s.m.i.
                </p>
              </div>
            </div>
          )}

          {/* STAMPA FOGLIO A4 MULTI-BADGE PER TUTTI I DIPENDENTI ATTIVI */}
          {printMode === 'sheet' && (
            <div>
              {workerPages.map((pageGroup, pageIndex) => (
                <div key={pageIndex} className="a4-print-page">
                  {/* Intestazione del foglio */}
                  <div className="border-b border-slate-800 pb-2 mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xs font-black text-slate-900 uppercase">
                        FOGLIO TESSERINI DI CANTIERE • {settings.nomeAzienda}
                      </h2>
                      <p className="text-[7.5px] text-slate-600">
                        D.Lgs. 81/2008 • Formato tessera standard 85,6 × 54 mm • Ritagliare lungo le linee tratteggiate
                      </p>
                    </div>
                    <div className="text-[8px] font-black text-slate-500 uppercase">
                      Pagina {pageIndex + 1} di {workerPages.length}
                    </div>
                  </div>

                  {/* Griglia tesserini perfettamente calibrata su A4 */}
                  {badgeOrientation === 'vertical' ? (
                    // 3 colonne x 3 righe (9 badge verticali per pagina A4)
                    <div 
                      className="grid grid-cols-3 justify-center items-center gap-x-[6mm] gap-y-[5mm]"
                      style={{ width: '174mm', margin: '0 auto' }}
                    >
                      {pageGroup.map(worker => (
                        <div key={worker.id} className="border border-dashed border-slate-500 p-[0.8mm] rounded-lg inline-block">
                          {renderSingleBadgeCard(worker, 'front', true)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    // 2 colonne x 4 righe (8 badge orizzontali per pagina A4)
                    <div 
                      className="grid grid-cols-2 justify-center items-center gap-x-[8mm] gap-y-[6mm]"
                      style={{ width: '179.2mm', margin: '0 auto' }}
                    >
                      {pageGroup.map(worker => (
                        <div key={worker.id} className="border border-dashed border-slate-500 p-[0.8mm] rounded-lg inline-block">
                          {renderSingleBadgeCard(worker, 'front', true)}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer Foglio */}
                  <div className="mt-auto pt-3 border-t border-slate-200 text-center text-[7px] text-slate-400">
                    Art. 18 e 26 D.Lgs. 81/08 - Impostare 'Scala: 100%' o 'Dimensioni effettive' nella finestra di stampa della stampante.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
