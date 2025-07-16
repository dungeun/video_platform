import { ReportTemplate, TemplateSection, SectionType, ChartData, ReportOptions } from '../types';
import { TemplateEngine } from '../utils/template-engine';

export class HTMLGenerator {
  private templateEngine: TemplateEngine;

  constructor() {
    this.templateEngine = new TemplateEngine();
  }

  async generate(
    template: ReportTemplate,
    data: any,
    options?: ReportOptions
  ): Promise<Buffer> {
    const html = this.generateHTML(template, data, options);
    return Buffer.from(html, 'utf-8');
  }

  private generateHTML(
    template: ReportTemplate,
    data: any,
    options?: ReportOptions
  ): string {
    const sections = this.processSections(template.sections, data);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options?.title || template.name}</title>
    ${this.generateStyles(template)}
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="report-container">
        ${options?.watermark ? this.generateWatermark(options.watermark) : ''}
        ${sections}
    </div>
    ${this.generateScripts()}
</body>
</html>`;
  }

  private processSections(sections: TemplateSection[], data: any): string {
    return sections
      .filter(section => !section.condition || this.evaluateCondition(section.condition, data))
      .map(section => this.processSection(section, data))
      .join('\n');
  }

  private processSection(section: TemplateSection, data: any): string {
    const cssClass = `section section-${section.type}`;
    const content = this.renderSectionContent(section, data);
    
    return `
    <div class="${cssClass}" ${section.id ? `id="${section.id}"` : ''}>
        ${section.title ? `<h2 class="section-title">${section.title}</h2>` : ''}
        ${content}
    </div>`;
  }

  private renderSectionContent(section: TemplateSection, data: any): string {
    switch (section.type) {
      case SectionType.HEADER:
        return this.renderHeader(section, data);
      case SectionType.SUMMARY:
        return this.renderSummary(section, data);
      case SectionType.CHART:
        return this.renderChart(section, data);
      case SectionType.TABLE:
        return this.renderTable(section, data);
      case SectionType.TEXT:
        return this.renderText(section, data);
      case SectionType.IMAGE:
        return this.renderImage(section, data);
      default:
        return '';
    }
  }

  private renderHeader(section: TemplateSection, data: any): string {
    const content = this.templateEngine.render(section.content, data);
    
    return `
    <div class="header">
        ${content.logo ? `<img src="${content.logo}" alt="Logo" class="header-logo">` : ''}
        ${content.title ? `<h1 class="header-title">${content.title}</h1>` : ''}
        ${content.subtitle ? `<p class="header-subtitle">${content.subtitle}</p>` : ''}
    </div>`;
  }

  private renderSummary(section: TemplateSection, data: any): string {
    const content = this.templateEngine.render(section.content, data);
    
    if (!content.metrics) return '';
    
    const metricsHtml = content.metrics.map((metric: any) => `
        <div class="metric-card">
            <div class="metric-label">${metric.label}</div>
            <div class="metric-value">${metric.value}</div>
            ${metric.change !== undefined ? `
                <div class="metric-change ${metric.change > 0 ? 'positive' : 'negative'}">
                    ${metric.change > 0 ? '↑' : '↓'} ${Math.abs(metric.change)}%
                </div>
            ` : ''}
        </div>
    `).join('');
    
    return `<div class="metrics-grid">${metricsHtml}</div>`;
  }

  private renderChart(section: TemplateSection, data: any): string {
    const content = this.templateEngine.render(section.content, data);
    const chartId = `chart-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store chart data for script initialization
    const chartData = content as ChartData;
    
    return `
    <div class="chart-container">
        <canvas id="${chartId}"></canvas>
        <script>
            (function() {
                const ctx = document.getElementById('${chartId}').getContext('2d');
                new Chart(ctx, ${JSON.stringify({
                  type: chartData.type,
                  data: chartData.data,
                  options: chartData.options || {}
                })});
            })();
        </script>
    </div>`;
  }

  private renderTable(section: TemplateSection, data: any): string {
    const content = this.templateEngine.render(section.content, data);
    
    if (!content.columns || !content.data) return '';
    
    const headerRow = content.columns
      .map((col: string) => `<th>${col}</th>`)
      .join('');
    
    const dataRows = content.data
      .map((row: any[]) => {
        const cells = row.map(cell => `<td>${cell}</td>`).join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');
    
    return `
    <div class="table-container">
        <table class="data-table">
            <thead>
                <tr>${headerRow}</tr>
            </thead>
            <tbody>
                ${dataRows}
            </tbody>
        </table>
    </div>`;
  }

  private renderText(section: TemplateSection, data: any): string {
    const content = this.templateEngine.render(section.content, data);
    const text = content.text || content;
    
    return `<div class="text-content">${text}</div>`;
  }

  private renderImage(section: TemplateSection, data: any): string {
    const content = this.templateEngine.render(section.content, data);
    const src = content.src || content;
    
    return `
    <div class="image-container">
        <img src="${src}" alt="${content.alt || 'Image'}" class="report-image">
        ${content.caption ? `<p class="image-caption">${content.caption}</p>` : ''}
    </div>`;
  }

  private generateWatermark(watermark: any): string {
    return `
    <div class="watermark" style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(${watermark.rotation || -45}deg);
        opacity: ${watermark.opacity || 0.1};
        font-size: 72px;
        font-weight: bold;
        color: #ccc;
        z-index: -1;
        pointer-events: none;
    ">${watermark.text}</div>`;
  }

  private generateStyles(template: ReportTemplate): string {
    const styles = template.styles || {};
    
    return `
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 24px;
            margin-bottom: 20px;
            color: #2563eb;
        }
        
        /* Header Styles */
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .header-logo {
            max-width: 200px;
            margin-bottom: 20px;
        }
        
        .header-title {
            font-size: 36px;
            margin-bottom: 10px;
        }
        
        .header-subtitle {
            font-size: 18px;
            color: #666;
        }
        
        /* Metrics Styles */
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .metric-card {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        
        .metric-label {
            font-size: 14px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .metric-value {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .metric-change {
            font-size: 14px;
        }
        
        .metric-change.positive {
            color: #10b981;
        }
        
        .metric-change.negative {
            color: #ef4444;
        }
        
        /* Table Styles */
        .table-container {
            overflow-x: auto;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .data-table th,
        .data-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .data-table th {
            background-color: #2563eb;
            color: white;
            font-weight: bold;
        }
        
        .data-table tr:nth-child(even) {
            background-color: #f9fafb;
        }
        
        /* Chart Styles */
        .chart-container {
            position: relative;
            height: 400px;
            margin: 20px 0;
        }
        
        /* Image Styles */
        .image-container {
            text-align: center;
        }
        
        .report-image {
            max-width: 100%;
            height: auto;
        }
        
        .image-caption {
            font-style: italic;
            color: #666;
            margin-top: 10px;
        }
        
        /* Text Styles */
        .text-content {
            line-height: 1.8;
        }
        
        /* Print Styles */
        @media print {
            body {
                background-color: white;
            }
            
            .report-container {
                box-shadow: none;
                max-width: 100%;
            }
            
            .section {
                page-break-inside: avoid;
            }
        }
    </style>`;
  }

  private generateScripts(): string {
    return `
    <script>
        // Additional scripts if needed
    </script>`;
  }

  private evaluateCondition(condition: string, data: any): boolean {
    try {
      return new Function('data', `return ${condition}`)(data);
    } catch {
      return false;
    }
  }
}