import ExcelJS from 'exceljs';
import { Report, ReportTemplate, TemplateSection, SectionType, ChartData, ReportOptions } from '../types';
import { TemplateEngine } from '../utils/template-engine';

export class ExcelGenerator {
  private templateEngine: TemplateEngine;

  constructor() {
    this.templateEngine = new TemplateEngine();
  }

  async generate(
    template: ReportTemplate,
    data: any,
    options?: ReportOptions
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties
    workbook.creator = options?.author || 'LinkPick Report Generator';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.properties = {
      title: options?.title || template.name,
      subject: options?.subject,
      keywords: options?.keywords?.join(', ')
    };

    // Process sections
    await this.processSections(workbook, template, data);

    // Add raw data sheet if requested
    if (options?.includeRawData) {
      this.addRawDataSheet(workbook, data);
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
  }

  private async processSections(
    workbook: ExcelJS.Workbook,
    template: ReportTemplate,
    data: any
  ): Promise<void> {
    let currentSheet: ExcelJS.Worksheet | null = null;
    let currentRow = 1;

    for (const section of template.sections) {
      // Check condition
      if (section.condition && !this.evaluateCondition(section.condition, data)) {
        continue;
      }

      // Create new sheet for certain section types or if specified
      if (this.shouldCreateNewSheet(section, currentSheet)) {
        currentSheet = workbook.addWorksheet(section.title || `Sheet ${workbook.worksheets.length + 1}`);
        currentRow = 1;
        this.setupSheet(currentSheet, template);
      }

      if (!currentSheet) {
        currentSheet = workbook.addWorksheet('Report');
        this.setupSheet(currentSheet, template);
      }

      // Process section
      currentRow = await this.processSection(currentSheet, section, data, currentRow);
    }
  }

  private async processSection(
    sheet: ExcelJS.Worksheet,
    section: TemplateSection,
    data: any,
    startRow: number
  ): Promise<number> {
    let currentRow = startRow;

    switch (section.type) {
      case SectionType.HEADER:
        currentRow = this.renderHeader(sheet, section, data, currentRow);
        break;
      case SectionType.SUMMARY:
        currentRow = this.renderSummary(sheet, section, data, currentRow);
        break;
      case SectionType.TABLE:
        currentRow = this.renderTable(sheet, section, data, currentRow);
        break;
      case SectionType.TEXT:
        currentRow = this.renderText(sheet, section, data, currentRow);
        break;
      case SectionType.CHART:
        currentRow = await this.renderChart(sheet, section, data, currentRow);
        break;
      default:
        break;
    }

    // Add spacing between sections
    return currentRow + 2;
  }

  private renderHeader(
    sheet: ExcelJS.Worksheet,
    section: TemplateSection,
    data: any,
    startRow: number
  ): number {
    const content = this.templateEngine.render(section.content, data);
    let currentRow = startRow;

    // Title
    if (content.title) {
      const titleRow = sheet.getRow(currentRow);
      sheet.mergeCells(currentRow, 1, currentRow, 8);
      const titleCell = titleRow.getCell(1);
      titleCell.value = content.title;
      titleCell.font = { size: 20, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleRow.height = 30;
      currentRow++;
    }

    // Subtitle
    if (content.subtitle) {
      const subtitleRow = sheet.getRow(currentRow);
      sheet.mergeCells(currentRow, 1, currentRow, 8);
      const subtitleCell = subtitleRow.getCell(1);
      subtitleCell.value = content.subtitle;
      subtitleCell.font = { size: 14 };
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      currentRow++;
    }

    // Date/Time
    if (content.date !== false) {
      const dateRow = sheet.getRow(currentRow);
      sheet.mergeCells(currentRow, 1, currentRow, 8);
      const dateCell = dateRow.getCell(1);
      dateCell.value = `Generated on: ${new Date().toLocaleString()}`;
      dateCell.font = { size: 10, italic: true };
      dateCell.alignment = { horizontal: 'center' };
      currentRow++;
    }

    return currentRow;
  }

  private renderSummary(
    sheet: ExcelJS.Worksheet,
    section: TemplateSection,
    data: any,
    startRow: number
  ): number {
    const content = this.templateEngine.render(section.content, data);
    let currentRow = startRow;

    // Section title
    if (section.title) {
      const titleRow = sheet.getRow(currentRow);
      titleRow.getCell(1).value = section.title;
      titleRow.getCell(1).font = { size: 16, bold: true };
      currentRow++;
    }

    // Metrics
    if (content.metrics && Array.isArray(content.metrics)) {
      const metricsPerRow = 4;
      let col = 1;

      content.metrics.forEach((metric: any, index: number) => {
        if (index > 0 && index % metricsPerRow === 0) {
          currentRow += 3;
          col = 1;
        }

        // Metric label
        sheet.getCell(currentRow, col).value = metric.label;
        sheet.getCell(currentRow, col).font = { size: 10, color: { argb: '666666' } };

        // Metric value
        sheet.getCell(currentRow + 1, col).value = metric.value;
        sheet.getCell(currentRow + 1, col).font = { size: 14, bold: true };

        // Metric change
        if (metric.change !== undefined) {
          const changeCell = sheet.getCell(currentRow + 2, col);
          changeCell.value = `${metric.change > 0 ? '↑' : '↓'} ${Math.abs(metric.change)}%`;
          changeCell.font = {
            size: 10,
            color: { argb: metric.change > 0 ? '10b981' : 'ef4444' }
          };
        }

        col += 2;
      });

      currentRow += 3;
    }

    return currentRow;
  }

  private renderTable(
    sheet: ExcelJS.Worksheet,
    section: TemplateSection,
    data: any,
    startRow: number
  ): number {
    const content = this.templateEngine.render(section.content, data);
    let currentRow = startRow;

    // Section title
    if (section.title) {
      const titleRow = sheet.getRow(currentRow);
      titleRow.getCell(1).value = section.title;
      titleRow.getCell(1).font = { size: 14, bold: true };
      currentRow += 2;
    }

    if (!content.columns || !content.data) {
      return currentRow;
    }

    // Create table
    const tableStartRow = currentRow;
    const tableData = [content.columns, ...content.data];
    
    // Add table data
    tableData.forEach((row: any[], rowIndex: number) => {
      const excelRow = sheet.getRow(currentRow);
      
      row.forEach((cell: any, colIndex: number) => {
        const excelCell = excelRow.getCell(colIndex + 1);
        excelCell.value = cell;
        
        // Header row styling
        if (rowIndex === 0) {
          excelCell.font = { bold: true, color: { argb: 'FFFFFF' } };
          excelCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '2563eb' }
          };
          excelCell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          // Data row styling
          if (rowIndex % 2 === 0) {
            excelCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'F3F4F6' }
            };
          }
        }
        
        // Borders
        excelCell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
      
      currentRow++;
    });

    // Auto-fit columns
    content.columns.forEach((_: any, index: number) => {
      const column = sheet.getColumn(index + 1);
      column.width = 15; // Or calculate based on content
    });

    // Add filters
    sheet.autoFilter = {
      from: { row: tableStartRow, column: 1 },
      to: { row: currentRow - 1, column: content.columns.length }
    };

    return currentRow;
  }

  private renderText(
    sheet: ExcelJS.Worksheet,
    section: TemplateSection,
    data: any,
    startRow: number
  ): number {
    const content = this.templateEngine.render(section.content, data);
    let currentRow = startRow;

    if (section.title) {
      sheet.getCell(currentRow, 1).value = section.title;
      sheet.getCell(currentRow, 1).font = { size: 12, bold: true };
      currentRow++;
    }

    const text = content.text || content;
    const lines = text.split('\n');
    
    lines.forEach((line: string) => {
      sheet.getCell(currentRow, 1).value = line;
      sheet.mergeCells(currentRow, 1, currentRow, 8);
      sheet.getCell(currentRow, 1).alignment = { wrapText: true };
      currentRow++;
    });

    return currentRow;
  }

  private async renderChart(
    sheet: ExcelJS.Worksheet,
    section: TemplateSection,
    data: any,
    startRow: number
  ): Promise<number> {
    const content = this.templateEngine.render(section.content, data);
    let currentRow = startRow;

    // Section title
    if (section.title) {
      sheet.getCell(currentRow, 1).value = section.title;
      sheet.getCell(currentRow, 1).font = { size: 14, bold: true };
      currentRow += 2;
    }

    // For Excel, we'll add the chart data as a table
    // since embedding actual charts requires more complex operations
    if (content.data) {
      const chartData = content as ChartData;
      
      // Add chart data table
      const tableData = [
        ['Category', ...chartData.data.datasets.map(ds => ds.label)],
        ...chartData.data.labels.map((label, index) => [
          label,
          ...chartData.data.datasets.map(ds => ds.data[index])
        ])
      ];

      tableData.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
          const excelCell = sheet.getCell(currentRow + rowIndex, colIndex + 1);
          excelCell.value = cell;
          
          if (rowIndex === 0) {
            excelCell.font = { bold: true };
            excelCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'E5E7EB' }
            };
          }
          
          excelCell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });
      });

      currentRow += tableData.length;

      // Note about chart
      currentRow++;
      sheet.getCell(currentRow, 1).value = 
        '📊 Chart data provided above. Create chart from this data in Excel.';
      sheet.getCell(currentRow, 1).font = { italic: true, size: 10 };
      sheet.mergeCells(currentRow, 1, currentRow, 4);
    }

    return currentRow;
  }

  private addRawDataSheet(workbook: ExcelJS.Workbook, data: any): void {
    const sheet = workbook.addWorksheet('Raw Data');
    
    // Convert data to table format
    if (Array.isArray(data)) {
      if (data.length > 0) {
        // Extract headers from first object
        const headers = Object.keys(data[0]);
        
        // Add headers
        const headerRow = sheet.getRow(1);
        headers.forEach((header, index) => {
          const cell = headerRow.getCell(index + 1);
          cell.value = header;
          cell.font = { bold: true };
        });

        // Add data
        data.forEach((item, rowIndex) => {
          const row = sheet.getRow(rowIndex + 2);
          headers.forEach((header, colIndex) => {
            row.getCell(colIndex + 1).value = item[header];
          });
        });

        // Auto-fit columns
        headers.forEach((_, index) => {
          sheet.getColumn(index + 1).width = 15;
        });
      }
    } else if (typeof data === 'object') {
      // Convert object to key-value pairs
      let currentRow = 1;
      Object.entries(data).forEach(([key, value]) => {
        sheet.getCell(currentRow, 1).value = key;
        sheet.getCell(currentRow, 1).font = { bold: true };
        sheet.getCell(currentRow, 2).value = JSON.stringify(value);
        currentRow++;
      });
    }
  }

  private setupSheet(sheet: ExcelJS.Worksheet, template: ReportTemplate): void {
    // Set default column widths
    for (let i = 1; i <= 10; i++) {
      sheet.getColumn(i).width = 15;
    }

    // Freeze panes
    sheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
  }

  private shouldCreateNewSheet(section: TemplateSection, currentSheet: ExcelJS.Worksheet | null): boolean {
    // Create new sheet for tables with title or if no current sheet
    return !currentSheet || 
           (section.type === SectionType.TABLE && section.title) ||
           section.pageBreak === 'before';
  }

  private evaluateCondition(condition: string, data: any): boolean {
    try {
      return new Function('data', `return ${condition}`)(data);
    } catch {
      return false;
    }
  }
}