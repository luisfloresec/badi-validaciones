import { Injectable } from '@nestjs/common';
import PDFDocument = require('pdfkit');
import * as path from 'path';
import * as fs from 'fs';

export interface PdfReportOptions {
  title: string;
  reportDate?: Date;
  generatedBy?: string;
}

export interface PdfReportInfo {
  numeroReporte?: string;
  fechaEjecucion?: string;
  fechaGeneracion?: string;
  usuario?: string;
}

export interface InstitutionalField {
  label: string;
  value: string;
}

export interface PdfImage {
  buffer: Buffer;
  caption: string;
}

@Injectable()
export class PdfGeneratorService {
  private readonly MARGIN = 50;
  private readonly LOGO_PATH = path.join(process.cwd(), '..', '..', 'frontend', 'badi-web', 'public', 'assets', 'logo-badi-circular.png');

  // ── Paleta institucional ────────────────────────────────────────────────
  // Verde profundo como color primario (identidad de banco de alimentos /
  // solidaridad), dorado cálido como acento, y una gama de grises neutros
  // para texto y estructura.
  private readonly COLOR_PRIMARY = '#1B4332';
  private readonly COLOR_PRIMARY_DARK = '#123024';
  private readonly COLOR_PRIMARY_LIGHT = '#2D6A4F';
  private readonly COLOR_ACCENT = '#C89B3C';

  private readonly COLOR_TEXT_PRIMARY = '#1A1A1A';
  private readonly COLOR_TEXT_SECONDARY = '#5B5F5C';
  private readonly COLOR_TEXT_ON_PRIMARY = '#FFFFFF';

  private readonly COLOR_BG_SOFT = '#F5F7F5';
  private readonly COLOR_BG_ROW_ALT = '#EFF3EF';
  private readonly COLOR_BORDER = '#DCE2DD';
  private readonly COLOR_BORDER_STRONG = '#B9C4BB';
  private readonly COLOR_WHITE = '#FFFFFF';

  // ── Tipografía ───────────────────────────────────────────────────────────
  private readonly FONT_BOLD = 'Helvetica-Bold';
  private readonly FONT_REGULAR = 'Helvetica';
  private readonly FONT_ITALIC = 'Helvetica-Oblique';

  public createDocument(options: PdfReportOptions): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: this.MARGIN + 18, bottom: 90, left: this.MARGIN, right: this.MARGIN },
      bufferPages: true,
      info: {
        Title: options.title,
        Author: 'Banco de Alimentos de Imbabura (BADI)',
        Creator: 'Sistema Web de Gestión Social',
      },
    });

    doc.on('pageAdded', () => {
      doc.y = this.MARGIN;
    });

    return doc;
  }

  public drawHeader(doc: PDFKit.PDFDocument, options: PdfReportOptions): void {
    const pageWidth = doc.page.width - this.MARGIN * 2;
    const blockTop = this.MARGIN;

    // 1. Logo
    let textStartX = this.MARGIN;
    if (fs.existsSync(this.LOGO_PATH)) {
      doc.image(this.LOGO_PATH, this.MARGIN, blockTop, { height: 58 });
      textStartX = this.MARGIN + 72;
    }

    // 2. Nombre institucional + subtítulo
    doc.font(this.FONT_BOLD).fontSize(15).fillColor(this.COLOR_PRIMARY)
      .text('BANCO DE ALIMENTOS DE IMBABURA', textStartX, blockTop + 4, {
        align: 'left',
        characterSpacing: 0.4,
      });

    doc.font(this.FONT_REGULAR).fontSize(9.5).fillColor(this.COLOR_TEXT_SECONDARY)
      .text('Sistema Web de Gestión Social', textStartX, blockTop + 24, { align: 'left' });

    // Pequeña línea de acento bajo el subtítulo
    doc.moveTo(textStartX, blockTop + 40)
      .lineTo(textStartX + 46, blockTop + 40)
      .strokeColor(this.COLOR_ACCENT)
      .lineWidth(2)
      .stroke();

    // Fecha, alineada a la derecha, si viene provista
    if (options.reportDate) {
      const dateStr = options.reportDate.toLocaleDateString('es-EC', {
        day: '2-digit', month: 'long', year: 'numeric',
      });
      doc.font(this.FONT_REGULAR).fontSize(9).fillColor(this.COLOR_TEXT_SECONDARY)
        .text(dateStr, this.MARGIN, blockTop + 8, { width: pageWidth, align: 'right' });
    }

    doc.y = blockTop + 58;

    // 3. Separador horizontal
    doc.moveDown(0.8);
    doc.moveTo(this.MARGIN, doc.y)
      .lineTo(this.MARGIN + pageWidth, doc.y)
      .strokeColor(this.COLOR_BORDER_STRONG)
      .lineWidth(1)
      .stroke();

    // 4. Título principal, con acento centrado debajo
    doc.moveDown(1.4);
    doc.font(this.FONT_BOLD).fontSize(19).fillColor(this.COLOR_TEXT_PRIMARY)
      .text(options.title.toUpperCase(), this.MARGIN, doc.y, { width: pageWidth, align: 'center', characterSpacing: 0.3 });

    const titleBottom = doc.y + 6;
    const centerX = this.MARGIN + pageWidth / 2;
    doc.moveTo(centerX - 28, titleBottom)
      .lineTo(centerX + 28, titleBottom)
      .strokeColor(this.COLOR_ACCENT)
      .lineWidth(2.2)
      .stroke();

    doc.y = titleBottom + 16;
  }

  public drawReportInfo(doc: PDFKit.PDFDocument, info: PdfReportInfo): void {
    const pageWidth = doc.page.width - this.MARGIN * 2;
    const startY = doc.y;
    const boxHeight = 54;

    // Tarjeta con barra de acento lateral izquierda
    doc.rect(this.MARGIN, startY, pageWidth, boxHeight)
      .fillAndStroke(this.COLOR_BG_SOFT, this.COLOR_BORDER);
    doc.rect(this.MARGIN, startY, 4, boxHeight).fill(this.COLOR_PRIMARY);

    const colWidth = (pageWidth - 4) / 4;
    const textY = startY + 13;

    const columns: Array<[string, string]> = [
      ['Reporte No.', info.numeroReporte || 'S/N'],
      ['Fecha de Entrega', info.fechaEjecucion || 'N/A'],
      ['Fecha de Generación', info.fechaGeneracion || 'N/A'],
      ['Generado por', info.usuario || 'Sistema'],
    ];

    columns.forEach(([label, value], i) => {
      const colX = this.MARGIN + 16 + colWidth * i;
      doc.font(this.FONT_BOLD).fontSize(8).fillColor(this.COLOR_PRIMARY)
        .text(label.toUpperCase(), colX, textY, { width: colWidth - 12, characterSpacing: 0.3 });
      doc.font(this.FONT_BOLD).fontSize(10.5).fillColor(this.COLOR_TEXT_PRIMARY)
        .text(value, colX, textY + 14, { width: colWidth - 12 });

      // Separador vertical entre columnas
      if (i > 0) {
        doc.moveTo(colX - 8, startY + 10)
          .lineTo(colX - 8, startY + boxHeight - 10)
          .strokeColor(this.COLOR_BORDER_STRONG)
          .lineWidth(0.75)
          .stroke();
      }
    });

    doc.y = startY + boxHeight + 14;
  }

  public drawSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    this.checkPageBreak(doc, 40);
    doc.moveDown(0.6);

    const markerSize = 10;
    const markerY = doc.y + 2;

    // Cuadro de acento junto al título, estilo institucional
    doc.rect(this.MARGIN, markerY, markerSize, markerSize).fill(this.COLOR_PRIMARY);

    doc.font(this.FONT_BOLD).fontSize(13).fillColor(this.COLOR_TEXT_PRIMARY)
      .text(title.toUpperCase(), this.MARGIN + markerSize + 10, doc.y, { characterSpacing: 0.5 });

    doc.moveDown(0.3);
    doc.moveTo(this.MARGIN, doc.y + 2)
      .lineTo(doc.page.width - this.MARGIN, doc.y + 2)
      .strokeColor(this.COLOR_BORDER)
      .lineWidth(1)
      .stroke();

    doc.moveDown(1);
  }

  public drawInstitutionalCard(doc: PDFKit.PDFDocument, fields: InstitutionalField[]): void {
    const pageWidth = doc.page.width - this.MARGIN * 2;
    const labelWidth = 190;

    for (const field of fields) {
      const labelText = field.label.toUpperCase();
      const valueText = field.value || 'N/A';

      doc.font(this.FONT_BOLD).fontSize(10.5);
      const labelHeight = doc.heightOfString(labelText, { width: labelWidth, characterSpacing: 0.2 });
      
      doc.font(this.FONT_REGULAR).fontSize(11);
      const valueHeight = doc.heightOfString(valueText, { width: pageWidth - labelWidth });

      const rowHeight = Math.max(labelHeight, valueHeight);

      this.checkPageBreak(doc, rowHeight + 15);
      const startY = doc.y;

      doc.font(this.FONT_BOLD).fontSize(10.5).fillColor(this.COLOR_PRIMARY)
        .text(labelText, this.MARGIN, startY, { width: labelWidth, characterSpacing: 0.2 });

      doc.font(this.FONT_REGULAR).fontSize(11).fillColor(this.COLOR_TEXT_PRIMARY)
        .text(valueText, this.MARGIN + labelWidth, startY, { width: pageWidth - labelWidth });

      const nextY = startY + rowHeight + 6;

      // Línea inferior sutil y sólida
      doc.moveTo(this.MARGIN, nextY)
        .lineTo(this.MARGIN + pageWidth, nextY)
        .strokeColor(this.COLOR_BORDER)
        .lineWidth(0.75)
        .stroke();

      doc.y = nextY + 8;
    }
    doc.moveDown(0.2);
  }

  public drawTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][], colWidths: number[]): void {
    const startX = this.MARGIN;
    const tableWidth = doc.page.width - this.MARGIN * 2;
    const cellPaddingH = 6;
    const cellPaddingV = 7;
    const headerHeight = 26;

    this.checkPageBreak(doc, headerHeight + 30);
    let currentY = doc.y;

    const drawHeaderRow = (y: number): number => {
      doc.rect(startX, y, tableWidth, headerHeight).fill(this.COLOR_PRIMARY);
      let x = startX;
      doc.fillColor(this.COLOR_TEXT_ON_PRIMARY).font(this.FONT_BOLD).fontSize(9.5);
      for (let i = 0; i < headers.length; i++) {
        const colInnerWidth = colWidths[i] - cellPaddingH * 2;
        const textHeight = doc.heightOfString(headers[i].toUpperCase(), { width: colInnerWidth, align: 'center' });
        const textY = y + (headerHeight - textHeight) / 2;
        doc.text(headers[i].toUpperCase(), x + cellPaddingH, textY, {
          width: colInnerWidth,
          align: 'center',
          characterSpacing: 0.2,
        });
        x += colWidths[i];
      }
      return y + headerHeight;
    };

    currentY = drawHeaderRow(currentY);
    doc.font(this.FONT_REGULAR).fontSize(10);

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      const row = rows[rowIndex];

      // Altura de fila dinámica: la celda con más texto define la altura
      const cellHeights = row.map((cellText, colIndex) => {
        const colInnerWidth = colWidths[colIndex] - cellPaddingH * 2;
        return doc.heightOfString(cellText ?? '', { width: colInnerWidth, align: 'center' });
      });
      const rowHeight = Math.max(...cellHeights) + cellPaddingV * 2;

      if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        currentY = doc.y;
        currentY = drawHeaderRow(currentY);
        doc.font(this.FONT_REGULAR).fontSize(10);
      }

      if (rowIndex % 2 !== 0) {
        doc.rect(startX, currentY, tableWidth, rowHeight).fill(this.COLOR_BG_ROW_ALT);
      }

      let currentX = startX;
      doc.fillColor(this.COLOR_TEXT_PRIMARY);

      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        const colInnerWidth = colWidths[colIndex] - cellPaddingH * 2;
        const textY = currentY + (rowHeight - cellHeights[colIndex]) / 2;
        doc.text(row[colIndex] ?? '', currentX + cellPaddingH, textY, {
          width: colInnerWidth,
          align: 'center',
        });
        currentX += colWidths[colIndex];
      }

      // Línea divisoria horizontal sutil entre filas (sin rejilla vertical)
      doc.moveTo(startX, currentY + rowHeight)
        .lineTo(startX + tableWidth, currentY + rowHeight)
        .strokeColor(this.COLOR_BORDER)
        .lineWidth(0.5)
        .stroke();

      currentY += rowHeight;
    }

    doc.y = currentY + 12;
  }

  public drawLongText(doc: PDFKit.PDFDocument, text: string): void {
    const pageWidth = doc.page.width - this.MARGIN * 2;
    const innerWidth = pageWidth - 26;
    const textHeight = doc.heightOfString(text, { width: innerWidth, align: 'justify' });
    const boxHeight = textHeight + 24;

    this.checkPageBreak(doc, boxHeight + 10);

    const startY = doc.y;
    doc.rect(this.MARGIN, startY, pageWidth, boxHeight)
      .fillAndStroke(this.COLOR_BG_SOFT, this.COLOR_BORDER);
    doc.rect(this.MARGIN, startY, 4, boxHeight).fill(this.COLOR_PRIMARY);

    doc.font(this.FONT_REGULAR).fontSize(10).fillColor(this.COLOR_TEXT_PRIMARY)
      .text(text, this.MARGIN + 18, startY + 12, { width: innerWidth, align: 'justify' });

    doc.y = startY + boxHeight + 15;
  }

  public drawGallery(doc: PDFKit.PDFDocument, images: PdfImage[]): void {
    const pageWidth = doc.page.width - this.MARGIN * 2;

    if (images.length === 0) {
      this.checkPageBreak(doc, 64);
      const y = doc.y;
      doc.rect(this.MARGIN, y, pageWidth, 60).fillAndStroke(this.COLOR_BG_SOFT, this.COLOR_BORDER);
      doc.font(this.FONT_ITALIC).fontSize(10.5).fillColor(this.COLOR_TEXT_SECONDARY)
        .text('Sin evidencia fotográfica', this.MARGIN, y + 25, { width: pageWidth, align: 'center' });
      doc.y = y + 74;
      return;
    }

    const colCount = 2;
    const gutter = 18;
    const captionHeight = 22;
    const imgWidth = (pageWidth - gutter * (colCount - 1)) / colCount;
    const imgHeight = imgWidth * 0.75;
    const rowHeight = imgHeight + captionHeight + 18;

    for (let i = 0; i < images.length; i += colCount) {
      this.checkPageBreak(doc, rowHeight);
      const rowY = doc.y;
      const rowImages = images.slice(i, i + colCount);

      rowImages.forEach((image, idx) => {
        const cardX = this.MARGIN + idx * (imgWidth + gutter);

        // Marco de tarjeta con borde institucional
        doc.rect(cardX, rowY, imgWidth, imgHeight)
          .fillAndStroke(this.COLOR_WHITE, this.COLOR_BORDER_STRONG);

        try {
          doc.image(image.buffer, cardX + 3, rowY + 3, {
            fit: [imgWidth - 6, imgHeight - 6],
            align: 'center',
            valign: 'center',
          });
        } catch (err) {
          doc.font(this.FONT_REGULAR).fontSize(9.5).fillColor('#B03030')
            .text('Error al cargar imagen', cardX, rowY + imgHeight / 2 - 6, { width: imgWidth, align: 'center' });
        }

        // Barra de leyenda
        doc.rect(cardX, rowY + imgHeight, imgWidth, captionHeight).fill(this.COLOR_BG_SOFT);
        doc.font(this.FONT_ITALIC).fontSize(8.5).fillColor(this.COLOR_TEXT_SECONDARY)
          .text(image.caption, cardX + 4, rowY + imgHeight + 6, { width: imgWidth - 8, align: 'center', lineBreak: false });
      });

      doc.y = rowY + rowHeight;
    }
  }

  public finalizeDocument(doc: PDFKit.PDFDocument): void {
    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);

      const pageWidth = doc.page.width - this.MARGIN * 2;
      const footerY = doc.page.height - 58;

      const originalBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      // Línea de acento delgada sobre el footer
      doc.moveTo(this.MARGIN, footerY)
        .lineTo(this.MARGIN + pageWidth, footerY)
        .strokeColor(this.COLOR_ACCENT)
        .lineWidth(1.2)
        .stroke();

      doc.font(this.FONT_REGULAR).fontSize(8).fillColor(this.COLOR_TEXT_SECONDARY);

      // Izquierda: marca institucional
      doc.font(this.FONT_BOLD).fillColor(this.COLOR_PRIMARY)
        .text('BADI', this.MARGIN, footerY + 9, { lineBreak: false, continued: true, characterSpacing: 0.5 });
      doc.font(this.FONT_REGULAR).fillColor(this.COLOR_TEXT_SECONDARY)
        .text('  ·  Sistema Web BADI', { lineBreak: false });

      // Centro: descripción
      doc.font(this.FONT_REGULAR).fillColor(this.COLOR_TEXT_SECONDARY)
        .text('Reporte generado automáticamente', this.MARGIN, footerY + 9, { width: pageWidth, align: 'center', lineBreak: false });

      // Derecha: número de página
      doc.font(this.FONT_BOLD).fillColor(this.COLOR_TEXT_PRIMARY)
        .text(`Página ${i + 1} de ${pages.count}`, this.MARGIN, footerY + 9, { width: pageWidth, align: 'right', lineBreak: false });

      // Línea inferior: sello de fecha/hora
      const now = new Date();
      doc.font(this.FONT_ITALIC).fontSize(7.5).fillColor(this.COLOR_TEXT_SECONDARY)
        .text(`Generado el ${now.toLocaleDateString('es-EC')} a las ${now.toLocaleTimeString('es-EC')}`, this.MARGIN, footerY + 24, {
          width: pageWidth,
          align: 'center',
          lineBreak: false,
        });

      doc.page.margins.bottom = originalBottomMargin;
    }
  }

  private checkPageBreak(doc: PDFKit.PDFDocument, requiredSpace: number): void {
    if (doc.y + requiredSpace > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
    }
  }
}