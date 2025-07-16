import { ReportTemplate, TemplateSection, SectionType, ReportOptions } from '../types';
import { TemplateEngine } from '../utils/template-engine';

export class CSVGenerator {
  private templateEngine: TemplateEngine;

  constructor() {
    this.templateEngine = new TemplateEngine();
  }

  async generate(
    template: ReportTemplate,
    data: any,
    options?: ReportOptions
  ): Promise<Buffer> {
    const csvLines: string[] = [];
    
    // Add title if specified
    if (options?.title) {
      csvLines.push(`"${options.title}"`);
      csvLines.push(''); // Empty line
    }

    // Process sections
    for (const section of template.sections) {
      if (section.condition && !this.evaluateCondition(section.condition, data)) {
        continue;
      }

      const sectionCsv = this.processSection(section, data);
      if (sectionCsv) {
        csvLines.push(...sectionCsv);
        csvLines.push(''); // Empty line between sections
      }
    }

    // Convert to buffer
    const csvContent = csvLines.join('\n');
    return Buffer.from(csvContent, 'utf-8');
  }

  private processSection(section: TemplateSection, data: any): string[] | null {
    const lines: string[] = [];

    switch (section.type) {
      case SectionType.TABLE:
        const tableLines = this.renderTable(section, data);
        if (tableLines) lines.push(...tableLines);
        break;
      case SectionType.SUMMARY:
        const summaryLines = this.renderSummary(section, data);
        if (summaryLines) lines.push(...summaryLines);
        break;
      default:
        // Other section types not suitable for CSV
        break;
    }

    return lines.length > 0 ? lines : null;
  }

  private renderTable(section: TemplateSection, data: any): string[] | null {
    const content = this.templateEngine.render(section.content, data);
    
    if (!content.columns || !content.data) {
      return null;
    }

    const lines: string[] = [];
    
    // Add section title as comment
    if (section.title) {
      lines.push(`# ${section.title}`);
    }

    // Header row
    lines.push(this.formatRow(content.columns));

    // Data rows
    for (const row of content.data) {
      lines.push(this.formatRow(row));
    }

    return lines;
  }

  private renderSummary(section: TemplateSection, data: any): string[] | null {
    const content = this.templateEngine.render(section.content, data);
    
    if (!content.metrics) {
      return null;
    }

    const lines: string[] = [];
    
    // Add section title
    if (section.title) {
      lines.push(`# ${section.title}`);
    }

    // Metrics as key-value pairs
    lines.push('Metric,Value,Change');
    
    for (const metric of content.metrics) {
      const row = [
        metric.label,
        metric.value,
        metric.change !== undefined ? `${metric.change}%` : ''
      ];
      lines.push(this.formatRow(row));
    }

    return lines;
  }

  private formatRow(row: any[]): string {
    return row.map(cell => this.escapeCSV(String(cell))).join(',');
  }

  private escapeCSV(value: string): string {
    // Escape quotes and wrap in quotes if necessary
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private evaluateCondition(condition: string, data: any): boolean {
    try {
      return new Function('data', `return ${condition}`)(data);
    } catch {
      return false;
    }
  }
}