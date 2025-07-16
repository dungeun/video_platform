import PDFDocument from 'pdfkit';
import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import { Report, ReportTemplate, TemplateSection, SectionType, ChartData, ReportOptions } from '../types';
import { TemplateEngine } from '../utils/template-engine';

export class PDFGenerator {
  private chartRenderer: ChartJSNodeCanvas;
  private templateEngine: TemplateEngine;

  constructor() {
    this.chartRenderer = new ChartJSNodeCanvas({
      width: 800,
      height: 400,
      backgroundColour: 'white'
    });
    this.templateEngine = new TemplateEngine();
  }

  async generate(
    template: ReportTemplate,
    data: any,
    options?: ReportOptions
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: this.getPageSize(template.layout?.pageSize),
        layout: template.layout?.orientation || 'portrait',
        margins: template.layout?.margins || {
          top: 50,
          bottom: 50,
          left: 50,
          right: 50
        },
        info: {
          Title: options?.title || template.name,
          Author: options?.author || 'LinkPick Report Generator',
          Subject: options?.subject,
          Keywords: options?.keywords?.join(', ')
        }
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Apply watermark if specified
      if (options?.watermark) {
        this.applyWatermark(doc, options.watermark);
      }

      // Process sections
      this.processSections(doc, template, data)
        .then(() => {
          // Add table of contents if requested
          if (options?.includeTableOfContents) {
            this.addTableOfContents(doc);
          }

          doc.end();
        })
        .catch(reject);
    });
  }

  private async processSections(
    doc: PDFDocument,
    template: ReportTemplate,
    data: any
  ): Promise<void> {
    for (const section of template.sections) {
      // Check condition
      if (section.condition && !this.evaluateCondition(section.condition, data)) {
        continue;
      }

      // Handle page breaks
      if (section.pageBreak === 'before') {
        doc.addPage();
      }

      // Process section based on type
      await this.processSection(doc, section, data, template);

      if (section.pageBreak === 'after') {
        doc.addPage();
      }
    }
  }

  private async processSection(
    doc: PDFDocument,
    section: TemplateSection,
    data: any,
    template: ReportTemplate
  ): Promise<void> {
    // Apply section styles
    if (section.style) {
      this.applySectionStyle(doc, section.style);
    }

    switch (section.type) {
      case SectionType.HEADER:
        await this.renderHeader(doc, section, data);
        break;
      case SectionType.SUMMARY:
        await this.renderSummary(doc, section, data);
        break;
      case SectionType.CHART:
        await this.renderChart(doc, section, data);
        break;
      case SectionType.TABLE:
        await this.renderTable(doc, section, data);
        break;
      case SectionType.TEXT:
        await this.renderText(doc, section, data);
        break;
      case SectionType.IMAGE:
        await this.renderImage(doc, section, data);
        break;
      case SectionType.PAGE_BREAK:
        doc.addPage();
        break;
      case SectionType.CUSTOM:
        await this.renderCustom(doc, section, data);
        break;
    }
  }

  private async renderHeader(
    doc: PDFDocument,
    section: TemplateSection,
    data: any
  ): Promise<void> {
    const content = this.templateEngine.render(section.content, data);

    // Title
    if (content.title) {
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text(content.title, { align: 'center' });
    }

    // Subtitle
    if (content.subtitle) {
      doc.fontSize(16)
         .font('Helvetica')
         .text(content.subtitle, { align: 'center' });
    }

    // Logo
    if (content.logo) {
      try {
        doc.image(content.logo, doc.page.width / 2 - 50, doc.y + 20, {
          width: 100,
          align: 'center'
        });
      } catch (error) {
        console.error('Failed to load logo:', error);
      }
    }

    doc.moveDown(2);
  }

  private async renderSummary(
    doc: PDFDocument,
    section: TemplateSection,
    data: any
  ): Promise<void> {
    const content = this.templateEngine.render(section.content, data);

    if (section.title) {
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .text(section.title);
      doc.moveDown();
    }

    // Render metrics
    if (content.metrics && Array.isArray(content.metrics)) {
      const metricsPerRow = 3;
      const metricWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / metricsPerRow;

      content.metrics.forEach((metric: any, index: number) => {
        const x = doc.page.margins.left + (index % metricsPerRow) * metricWidth;
        const y = doc.y + Math.floor(index / metricsPerRow) * 80;

        // Metric box
        doc.rect(x, y, metricWidth - 10, 70)
           .stroke();

        // Metric label
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor('#666666')
           .text(metric.label, x + 10, y + 10, {
             width: metricWidth - 20,
             align: 'center'
           });

        // Metric value
        doc.fontSize(20)
           .font('Helvetica-Bold')
           .fillColor('#000000')
           .text(metric.value.toString(), x + 10, y + 30, {
             width: metricWidth - 20,
             align: 'center'
           });

        // Metric change (if provided)
        if (metric.change) {
          const changeColor = metric.change > 0 ? '#10b981' : '#ef4444';
          const changeSymbol = metric.change > 0 ? '↑' : '↓';
          
          doc.fontSize(12)
             .font('Helvetica')
             .fillColor(changeColor)
             .text(`${changeSymbol} ${Math.abs(metric.change)}%`, x + 10, y + 50, {
               width: metricWidth - 20,
               align: 'center'
             });
        }
      });

      doc.y += Math.ceil(content.metrics.length / metricsPerRow) * 80 + 20;
      doc.fillColor('#000000');
    }
  }

  private async renderChart(
    doc: PDFDocument,
    section: TemplateSection,
    data: any
  ): Promise<void> {
    const content = this.templateEngine.render(section.content, data);

    if (section.title) {
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text(section.title);
      doc.moveDown();
    }

    // Generate chart image
    try {
      const chartData = content as ChartData;
      const chartImage = await this.chartRenderer.renderToBuffer({
        type: chartData.type as any,
        data: chartData.data,
        options: chartData.options || {}
      });

      // Insert chart image
      doc.image(chartImage, {
        width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: 'center'
      });
    } catch (error) {
      console.error('Failed to render chart:', error);
      doc.text('[Chart rendering failed]');
    }

    doc.moveDown();
  }

  private async renderTable(
    doc: PDFDocument,
    section: TemplateSection,
    data: any
  ): Promise<void> {
    const content = this.templateEngine.render(section.content, data);

    if (section.title) {
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text(section.title);
      doc.moveDown();
    }

    if (!content.columns || !content.data) {
      return;
    }

    const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const columnWidth = tableWidth / content.columns.length;
    const startX = doc.page.margins.left;
    let currentY = doc.y;

    // Table header
    doc.fontSize(10)
       .font('Helvetica-Bold')
       .fillColor('#ffffff');

    // Header background
    doc.rect(startX, currentY, tableWidth, 25)
       .fill('#2563eb');

    // Header text
    content.columns.forEach((column: string, index: number) => {
      doc.fillColor('#ffffff')
         .text(column, startX + index * columnWidth + 5, currentY + 7, {
           width: columnWidth - 10,
           align: 'left'
         });
    });

    currentY += 25;
    doc.fillColor('#000000');

    // Table rows
    doc.font('Helvetica')
       .fontSize(9);

    content.data.forEach((row: any[], rowIndex: number) => {
      // Alternating row colors
      if (rowIndex % 2 === 0) {
        doc.rect(startX, currentY, tableWidth, 20)
           .fill('#f3f4f6');
        doc.fillColor('#000000');
      }

      // Row data
      row.forEach((cell: any, cellIndex: number) => {
        doc.text(String(cell), startX + cellIndex * columnWidth + 5, currentY + 5, {
          width: columnWidth - 10,
          align: 'left'
        });
      });

      currentY += 20;

      // Check if we need a new page
      if (currentY > doc.page.height - doc.page.margins.bottom - 50) {
        doc.addPage();
        currentY = doc.page.margins.top;
      }
    });

    doc.y = currentY + 10;
  }

  private async renderText(
    doc: PDFDocument,
    section: TemplateSection,
    data: any
  ): Promise<void> {
    const content = this.templateEngine.render(section.content, data);

    if (section.title) {
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text(section.title);
      doc.moveDown();
    }

    doc.fontSize(11)
       .font('Helvetica')
       .text(content.text || content, {
         align: section.style?.textAlign || 'left'
       });

    doc.moveDown();
  }

  private async renderImage(
    doc: PDFDocument,
    section: TemplateSection,
    data: any
  ): Promise<void> {
    const content = this.templateEngine.render(section.content, data);

    try {
      const options: any = {
        width: content.width || doc.page.width - doc.page.margins.left - doc.page.margins.right,
        align: content.align || 'center'
      };

      if (content.height) {
        options.height = content.height;
      }

      doc.image(content.src || content, options);

      if (content.caption) {
        doc.fontSize(9)
           .font('Helvetica-Oblique')
           .fillColor('#666666')
           .text(content.caption, { align: 'center' });
        doc.fillColor('#000000');
      }
    } catch (error) {
      console.error('Failed to render image:', error);
      doc.text('[Image not found]');
    }

    doc.moveDown();
  }

  private async renderCustom(
    doc: PDFDocument,
    section: TemplateSection,
    data: any
  ): Promise<void> {
    // Custom rendering logic based on content type
    const content = this.templateEngine.render(section.content, data);
    
    // This would be extended based on specific custom requirements
    doc.text(JSON.stringify(content));
  }

  private applySectionStyle(doc: PDFDocument, style: any): void {
    if (style.fontSize) {
      doc.fontSize(style.fontSize);
    }
    if (style.fontFamily) {
      doc.font(style.fontFamily);
    }
    // Additional style applications
  }

  private applyWatermark(doc: PDFDocument, watermark: any): void {
    // Save current state
    const currentPage = doc.page;

    doc.on('pageAdded', () => {
      this.addWatermarkToPage(doc, watermark);
    });

    // Add to current page
    this.addWatermarkToPage(doc, watermark);
  }

  private addWatermarkToPage(doc: any, watermark: any): void {
    doc.save();
    doc.opacity(watermark.opacity || 0.1);
    
    if (watermark.text) {
      doc.fontSize(50)
         .rotate(watermark.rotation || -45, { origin: [doc.page.width / 2, doc.page.height / 2] })
         .text(watermark.text, 0, doc.page.height / 2, {
           align: 'center',
           width: doc.page.width
         });
    }
    
    doc.restore();
  }

  private addTableOfContents(doc: PDFDocument): void {
    // This would be implemented to track sections and create TOC
    // For now, placeholder implementation
  }

  private evaluateCondition(condition: string, data: any): boolean {
    try {
      // Simple condition evaluation - in production use a safe evaluator
      return new Function('data', `return ${condition}`)(data);
    } catch {
      return false;
    }
  }

  private getPageSize(size?: string | [number, number]): any {
    if (Array.isArray(size)) {
      return size;
    }
    return size || 'A4';
  }
}