import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

export interface ExcelColumn {
  header: string;
  key: string;
  width: number;
}

export interface ExcelReportOptions {
  title: string;
  sheetName: string;
  columns: ExcelColumn[];
  data: Record<string, any>[];
  summaryRow?: Record<string, any>; // Para reportes que requieran una fila de totales al final
}

@Injectable()
export class ExcelGeneratorService {
  private readonly HEADER_FILL: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF015641' }, // Verde institucional
  };
  private readonly HEADER_FONT: Partial<ExcelJS.Font> = {
    bold: true,
    color: { argb: 'FFFFFFFF' },
    size: 10,
  };

  /**
   * Genera un workbook de Excel estandarizado
   */
  public async generateExcel(options: ExcelReportOptions): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Web BADI';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(options.sheetName, {
      properties: { defaultRowHeight: 20 },
    });

    const totalCols = options.columns.length;

    // 1. Título institucional superior
    sheet.mergeCells(1, 1, 1, totalCols);
    const instCell = sheet.getCell('A1');
    instCell.value = 'BADI — Banco de Alimentos Imbabura';
    instCell.font = { bold: true, size: 14, color: { argb: 'FF015641' } };
    instCell.alignment = { horizontal: 'center' };

    // 2. Nombre del reporte
    sheet.mergeCells(2, 1, 2, totalCols);
    const titleCell = sheet.getCell('A2');
    titleCell.value = options.title.toUpperCase();
    titleCell.font = { bold: true, size: 12 };
    titleCell.alignment = { horizontal: 'center' };

    // 3. Fecha de generación e información adicional
    const now = new Date();
    sheet.mergeCells(3, 1, 3, totalCols);
    const dateCell = sheet.getCell('A3');
    dateCell.value = `Fecha de generación: ${now.toLocaleString('es-EC')} — Total registros: ${options.data.length}`;
    dateCell.font = { italic: true, size: 10, color: { argb: 'FF666666' } };
    dateCell.alignment = { horizontal: 'center' };

    // 4. Mapeo de columnas a ExcelJS
    const headerRowIndex = 5;
    sheet.columns = options.columns.map((col) => ({
      key: col.key,
      width: col.width,
    }));

    // 5. Estilos de cabecera de la tabla
    const headerRow = sheet.getRow(headerRowIndex);
    options.columns.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = col.header;
      cell.font = this.HEADER_FONT;
      cell.fill = this.HEADER_FILL;
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      
      // Borde fino
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    headerRow.height = 25;

    // 6. Volcado de datos con formato cebra
    let currentRowIndex = headerRowIndex + 1;
    for (const record of options.data) {
      const row = sheet.getRow(currentRowIndex);
      
      options.columns.forEach((col, i) => {
        const cell = row.getCell(i + 1);
        cell.value = this.formatValue(record[col.key]);
        cell.alignment = { vertical: 'middle', wrapText: true };
        cell.font = { size: 10 };
        cell.border = {
          left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
          bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } }
        };
      });

      // Filas alternadas (Gris muy claro)
      if ((currentRowIndex - headerRowIndex) % 2 === 0) {
        options.columns.forEach((_, i) => {
          row.getCell(i + 1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9F9F9' },
          };
        });
      }
      currentRowIndex++;
    }

    // 7. Auto-filtros y congelar cabeceras
    sheet.autoFilter = {
      from: { row: headerRowIndex, column: 1 },
      to: { row: headerRowIndex, column: totalCols },
    };
    sheet.views = [{ state: 'frozen', ySplit: headerRowIndex }];

    return workbook;
  }

  /**
   * Helper interno para formatear fechas u objetos
   */
  private formatValue(value: any): string | number {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) {
      return value.toLocaleString('es-EC');
    }
    return value;
  }
}
