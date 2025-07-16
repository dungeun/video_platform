import Handlebars from 'handlebars';
import i18n from 'i18next';
import { 
  NotificationTemplate, 
  TemplateVariable,
  NotificationType 
} from '../types';

export interface TemplateEngineConfig {
  defaultLanguage?: string;
  customHelpers?: Record<string, Handlebars.HelperDelegate>;
}

export class TemplateEngine {
  private handlebars: typeof Handlebars;
  private templates: Map<string, Map<string, NotificationTemplate>>;
  private compiledTemplates: Map<string, Handlebars.TemplateDelegate>;
  private config: TemplateEngineConfig;

  constructor(config: TemplateEngineConfig = {}) {
    this.config = {
      defaultLanguage: 'ko',
      ...config
    };
    this.handlebars = Handlebars.create();
    this.templates = new Map();
    this.compiledTemplates = new Map();
    this.registerDefaultHelpers();
    this.registerCustomHelpers();
  }

  private registerDefaultHelpers(): void {
    // Date formatting helper
    this.handlebars.registerHelper('dateFormat', (date: Date | string, format: string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (!dateObj || isNaN(dateObj.getTime())) return '';
      
      // Simple date formatting
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      
      return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes);
    });

    // Number formatting helper
    this.handlebars.registerHelper('numberFormat', (num: number, locale: string = 'ko-KR') => {
      if (typeof num !== 'number') return '';
      return new Intl.NumberFormat(locale).format(num);
    });

    // Currency formatting helper
    this.handlebars.registerHelper('currency', (amount: number, currency: string = 'KRW', locale: string = 'ko-KR') => {
      if (typeof amount !== 'number') return '';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
      }).format(amount);
    });

    // Conditional helpers
    this.handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    this.handlebars.registerHelper('ne', (a: any, b: any) => a !== b);
    this.handlebars.registerHelper('lt', (a: any, b: any) => a < b);
    this.handlebars.registerHelper('gt', (a: any, b: any) => a > b);
    this.handlebars.registerHelper('lte', (a: any, b: any) => a <= b);
    this.handlebars.registerHelper('gte', (a: any, b: any) => a >= b);

    // Translation helper
    this.handlebars.registerHelper('t', (key: string, options: any) => {
      const lang = options.hash.lang || this.config.defaultLanguage;
      return i18n.t(key, { lng: lang, ...options.hash });
    });

    // Pluralization helper
    this.handlebars.registerHelper('plural', (count: number, singular: string, plural: string) => {
      return count === 1 ? singular : plural;
    });
  }

  private registerCustomHelpers(): void {
    if (this.config.customHelpers) {
      Object.entries(this.config.customHelpers).forEach(([name, helper]) => {
        this.handlebars.registerHelper(name, helper);
      });
    }
  }

  registerTemplate(template: NotificationTemplate): void {
    const languageMap = this.templates.get(template.id) || new Map();
    languageMap.set(template.language, template);
    this.templates.set(template.id, languageMap);

    // Compile template
    const cacheKey = `${template.id}_${template.language}`;
    const compiled = this.handlebars.compile(template.content);
    this.compiledTemplates.set(cacheKey, compiled);

    // Compile subject if it's an email template
    if (template.subject && template.type === NotificationType.EMAIL) {
      const subjectKey = `${cacheKey}_subject`;
      const compiledSubject = this.handlebars.compile(template.subject);
      this.compiledTemplates.set(subjectKey, compiledSubject);
    }
  }

  render(
    templateId: string,
    variables: Record<string, any> = {},
    language?: string
  ): {
    content: string;
    subject?: string;
  } {
    const lang = language || this.config.defaultLanguage;
    const languageMap = this.templates.get(templateId);
    
    if (!languageMap) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Try to get template in requested language, fallback to default
    let template = languageMap.get(lang);
    if (!template && lang !== this.config.defaultLanguage) {
      template = languageMap.get(this.config.defaultLanguage);
    }
    
    if (!template) {
      throw new Error(`Template not found for language: ${lang}`);
    }

    // Validate required variables
    this.validateVariables(template, variables);

    // Get compiled templates
    const cacheKey = `${templateId}_${template.language}`;
    const compiledContent = this.compiledTemplates.get(cacheKey);
    const compiledSubject = this.compiledTemplates.get(`${cacheKey}_subject`);

    if (!compiledContent) {
      throw new Error(`Template not compiled: ${templateId}`);
    }

    // Render with context
    const context = {
      ...variables,
      _language: template.language,
      _timestamp: new Date()
    };

    const result: { content: string; subject?: string } = {
      content: compiledContent(context)
    };

    if (compiledSubject) {
      result.subject = compiledSubject(context);
    }

    return result;
  }

  private validateVariables(
    template: NotificationTemplate,
    variables: Record<string, any>
  ): void {
    const missingVars = template.variables.filter(
      varName => !(varName in variables)
    );

    if (missingVars.length > 0) {
      throw new Error(
        `Missing required template variables: ${missingVars.join(', ')}`
      );
    }
  }

  renderRaw(
    content: string,
    variables: Record<string, any> = {}
  ): string {
    const compiled = this.handlebars.compile(content);
    return compiled(variables);
  }

  getTemplate(
    templateId: string,
    language?: string
  ): NotificationTemplate | undefined {
    const lang = language || this.config.defaultLanguage;
    const languageMap = this.templates.get(templateId);
    
    if (!languageMap) {
      return undefined;
    }

    return languageMap.get(lang) || languageMap.get(this.config.defaultLanguage);
  }

  listTemplates(
    type?: NotificationType,
    language?: string
  ): NotificationTemplate[] {
    const result: NotificationTemplate[] = [];
    
    this.templates.forEach(languageMap => {
      languageMap.forEach(template => {
        if (
          (!type || template.type === type) &&
          (!language || template.language === language)
        ) {
          result.push(template);
        }
      });
    });

    return result;
  }

  extractVariables(content: string): string[] {
    const variablePattern = /\{\{[\s]*([a-zA-Z_$][a-zA-Z0-9_$\.]*)[\s]*\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variablePattern.exec(content)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  validateTemplate(content: string): {
    valid: boolean;
    error?: string;
    variables?: string[];
  } {
    try {
      this.handlebars.compile(content);
      const variables = this.extractVariables(content);
      return { valid: true, variables };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid template syntax'
      };
    }
  }
}