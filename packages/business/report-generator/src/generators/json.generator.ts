import { ReportTemplate, ReportOptions } from '../types';
import { TemplateEngine } from '../utils/template-engine';

export class JSONGenerator {
  private templateEngine: TemplateEngine;

  constructor() {
    this.templateEngine = new TemplateEngine();
  }

  async generate(
    template: ReportTemplate,
    data: any,
    options?: ReportOptions
  ): Promise<Buffer> {
    const output: any = {
      metadata: {
        reportType: template.name,
        generatedAt: new Date().toISOString(),
        format: 'json',
        version: '1.0'
      }
    };

    // Add report options as metadata
    if (options) {
      output.metadata = {
        ...output.metadata,
        title: options.title,
        author: options.author,
        subject: options.subject,
        keywords: options.keywords
      };
    }

    // Process sections
    output.sections = [];

    for (const section of template.sections) {
      if (section.condition && !this.evaluateCondition(section.condition, data)) {
        continue;
      }

      const sectionData = {
        id: section.id,
        type: section.type,
        title: section.title,
        content: this.templateEngine.render(section.content, data)
      };

      output.sections.push(sectionData);
    }

    // Include raw data if requested
    if (options?.includeRawData) {
      output.rawData = data;
    }

    // Convert to buffer
    const jsonString = JSON.stringify(output, null, options?.compress ? 0 : 2);
    return Buffer.from(jsonString, 'utf-8');
  }

  private evaluateCondition(condition: string, data: any): boolean {
    try {
      return new Function('data', `return ${condition}`)(data);
    } catch {
      return false;
    }
  }
}