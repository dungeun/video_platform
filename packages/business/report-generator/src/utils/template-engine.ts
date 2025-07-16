import Handlebars from 'handlebars';
import { format, parseISO } from 'date-fns';

export class TemplateEngine {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  render(template: any, data: any): any {
    if (typeof template === 'string') {
      const compiled = this.handlebars.compile(template);
      return compiled(data);
    }

    // Recursively render object properties
    if (typeof template === 'object' && template !== null) {
      if (Array.isArray(template)) {
        return template.map(item => this.render(item, data));
      }

      const rendered: any = {};
      for (const [key, value] of Object.entries(template)) {
        rendered[key] = this.render(value, data);
      }
      return rendered;
    }

    return template;
  }

  private registerHelpers(): void {
    // Date formatting
    this.handlebars.registerHelper('formatDate', (date: any, formatStr: string) => {
      if (!date) return '';
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, formatStr || 'yyyy-MM-dd');
    });

    // Number formatting
    this.handlebars.registerHelper('formatNumber', (num: number, decimals: number = 0) => {
      if (typeof num !== 'number') return num;
      return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    });

    // Currency formatting
    this.handlebars.registerHelper('currency', (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
      }).format(amount);
    });

    // Percentage formatting
    this.handlebars.registerHelper('percentage', (value: number, decimals: number = 1) => {
      if (typeof value !== 'number') return value;
      return `${value.toFixed(decimals)}%`;
    });

    // Conditional helpers
    this.handlebars.registerHelper('ifEquals', function(arg1: any, arg2: any, options: any) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
    });

    this.handlebars.registerHelper('ifGreater', function(arg1: number, arg2: number, options: any) {
      return (arg1 > arg2) ? options.fn(this) : options.inverse(this);
    });

    this.handlebars.registerHelper('ifLess', function(arg1: number, arg2: number, options: any) {
      return (arg1 < arg2) ? options.fn(this) : options.inverse(this);
    });

    // Array helpers
    this.handlebars.registerHelper('join', (array: any[], separator: string = ', ') => {
      if (!Array.isArray(array)) return '';
      return array.join(separator);
    });

    this.handlebars.registerHelper('first', (array: any[]) => {
      return Array.isArray(array) ? array[0] : array;
    });

    this.handlebars.registerHelper('last', (array: any[]) => {
      return Array.isArray(array) ? array[array.length - 1] : array;
    });

    this.handlebars.registerHelper('length', (array: any[]) => {
      return Array.isArray(array) ? array.length : 0;
    });

    // Math helpers
    this.handlebars.registerHelper('add', (a: number, b: number) => a + b);
    this.handlebars.registerHelper('subtract', (a: number, b: number) => a - b);
    this.handlebars.registerHelper('multiply', (a: number, b: number) => a * b);
    this.handlebars.registerHelper('divide', (a: number, b: number) => b !== 0 ? a / b : 0);

    // String helpers
    this.handlebars.registerHelper('uppercase', (str: string) => str?.toUpperCase());
    this.handlebars.registerHelper('lowercase', (str: string) => str?.toLowerCase());
    this.handlebars.registerHelper('capitalize', (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    this.handlebars.registerHelper('truncate', (str: string, length: number = 100) => {
      if (!str || str.length <= length) return str;
      return str.substring(0, length) + '...';
    });

    // Chart data helper
    this.handlebars.registerHelper('chartData', (type: string, data: any) => {
      // Transform data for chart rendering
      if (!data) return null;

      switch (type) {
        case 'line':
        case 'bar':
          return {
            type,
            data: {
              labels: data.labels || [],
              datasets: data.datasets || []
            }
          };
        case 'pie':
        case 'doughnut':
          return {
            type,
            data: {
              labels: data.labels || [],
              datasets: [{
                data: data.values || [],
                backgroundColor: data.colors || []
              }]
            }
          };
        default:
          return data;
      }
    });

    // Table data helper
    this.handlebars.registerHelper('tableData', (data: any) => {
      if (!data) return [];
      
      // Convert object array to table rows
      if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
        const columns = Object.keys(data[0]);
        const rows = data.map(item => columns.map(col => item[col]));
        return { columns, data: rows };
      }
      
      return data;
    });

    // Custom comparison operators
    this.handlebars.registerHelper('compare', function(
      left: any,
      operator: string,
      right: any,
      options: any
    ) {
      const operators: Record<string, Function> = {
        '==': (l: any, r: any) => l == r,
        '===': (l: any, r: any) => l === r,
        '!=': (l: any, r: any) => l != r,
        '!==': (l: any, r: any) => l !== r,
        '<': (l: any, r: any) => l < r,
        '>': (l: any, r: any) => l > r,
        '<=': (l: any, r: any) => l <= r,
        '>=': (l: any, r: any) => l >= r,
        'in': (l: any, r: any[]) => r.includes(l),
        'not in': (l: any, r: any[]) => !r.includes(l)
      };

      const result = operators[operator]?.(left, right) ?? false;
      return result ? options.fn(this) : options.inverse(this);
    });
  }

  registerCustomHelper(name: string, helper: Function): void {
    this.handlebars.registerHelper(name, helper);
  }

  compile(template: string): HandlebarsTemplateDelegate {
    return this.handlebars.compile(template);
  }
}