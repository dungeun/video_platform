import { beforeEach, vi } from 'vitest';

// Mock environment variables
process.env.REPORT_STORAGE_PROVIDER = 'local';
process.env.REPORT_STORAGE_PATH = './test-reports';

// Mock external dependencies
vi.mock('pdfkit', () => ({
  default: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    fontSize: vi.fn().mockReturnThis(),
    font: vi.fn().mockReturnThis(),
    text: vi.fn().mockReturnThis(),
    moveDown: vi.fn().mockReturnThis(),
    fillColor: vi.fn().mockReturnThis(),
    rect: vi.fn().mockReturnThis(),
    stroke: vi.fn().mockReturnThis(),
    fill: vi.fn().mockReturnThis(),
    image: vi.fn().mockReturnThis(),
    addPage: vi.fn().mockReturnThis(),
    switchToPage: vi.fn().mockReturnThis(),
    save: vi.fn().mockReturnThis(),
    restore: vi.fn().mockReturnThis(),
    opacity: vi.fn().mockReturnThis(),
    rotate: vi.fn().mockReturnThis(),
    end: vi.fn(),
    y: 100,
    x: 50,
    page: { 
      width: 600, 
      height: 800,
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    },
    bufferedPageRange: () => ({ count: 1 })
  }))
}));

vi.mock('exceljs', () => ({
  default: {
    Workbook: vi.fn().mockImplementation(() => ({
      creator: '',
      created: new Date(),
      modified: new Date(),
      properties: {},
      addWorksheet: vi.fn().mockReturnValue({
        getRow: vi.fn().mockReturnValue({
          getCell: vi.fn().mockReturnValue({
            value: '',
            font: {},
            alignment: {},
            fill: {},
            border: {}
          }),
          height: 20
        }),
        getColumn: vi.fn().mockReturnValue({ width: 15 }),
        mergeCells: vi.fn(),
        autoFilter: {},
        views: []
      }),
      worksheets: [],
      xlsx: {
        writeBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-excel'))
      }
    }))
  }
}));

vi.mock('chartjs-node-canvas', () => ({
  ChartJSNodeCanvas: vi.fn().mockImplementation(() => ({
    renderToBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-chart'))
  }))
}));

vi.mock('node-cron', () => ({
  default: {
    schedule: vi.fn().mockReturnValue({
      stop: vi.fn()
    }),
    validate: vi.fn().mockReturnValue(true)
  }
}));

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});