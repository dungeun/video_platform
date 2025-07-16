# @repo/ui-tables

Ultra-fine-grained UI module for table components only.

## Features

- 🎯 **Single Responsibility**: Table components only
- 📊 **Basic Table**: Simple table with customizable styling
- 🔧 **DataTable**: Advanced table with sorting, filtering, pagination
- 🔄 **Sorting**: Single and multi-column sorting
- 🔍 **Filtering**: Flexible filtering with operators
- 📄 **Pagination**: Built-in pagination controls
- ✅ **Selection**: Row selection with batch operations
- 📥 **Export**: CSV and JSON export functionality
- 🎨 **Column Management**: Show/hide and reorder columns
- 📱 **Responsive**: Mobile-friendly design
- ♿ **Accessible**: ARIA labels and keyboard navigation
- 🎨 **Customizable**: Flexible theming system
- 📝 **TypeScript**: Full type safety

## Installation

```bash
npm install @repo/ui-tables
```

## Basic Usage

### Simple Table

```tsx
import { Table } from '@repo/ui-tables';

const data = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
];

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'email', header: 'Email' }
];

function BasicExample() {
  return (
    <Table 
      data={data} 
      columns={columns}
      striped
      hover
    />
  );
}
```

### DataTable with All Features

```tsx
import { DataTable } from '@repo/ui-tables';

function AdvancedExample() {
  return (
    <DataTable
      data={data}
      columns={[
        { key: 'name', header: 'Name', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
        { 
          key: 'status', 
          header: 'Status',
          render: (value) => (
            <span className={`badge ${value}`}>{value}</span>
          )
        }
      ]}
      pagination={{
        currentPage: 1,
        pageSize: 10,
        totalItems: 100
      }}
      selectable
      exportable
      sortConfig={{ key: 'name', direction: 'asc' }}
    />
  );
}
```

## API Reference

### Table Component

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| data | T[] | required | Array of data objects |
| columns | ColumnConfig[] | required | Column definitions |
| striped | boolean | false | Striped rows |
| bordered | boolean | false | Bordered table |
| hover | boolean | false | Hover effect on rows |
| loading | boolean | false | Loading state |
| stickyHeader | boolean | false | Sticky header |

### DataTable Component

Extends Table with:

| Prop | Type | Description |
|------|------|-------------|
| sortConfig | SortConfig | Sort configuration |
| filters | FilterConfig[] | Active filters |
| pagination | PaginationConfig | Pagination settings |
| selectable | boolean | Enable row selection |
| exportable | boolean | Enable data export |

### Custom Hooks

#### useTableSort
```tsx
const {
  sortConfig,
  handleSort,
  getSortedData,
  resetSort
} = useTableSort<T>();
```

#### useTableFilter
```tsx
const {
  filters,
  addFilter,
  updateFilter,
  deleteFilter,
  getFilteredData
} = useTableFilter<T>();
```

#### useTablePagination
```tsx
const {
  currentPage,
  pageSize,
  paginatedData,
  goToPage,
  changePageSize
} = useTablePagination(data);
```

## Module Structure

```
ui-tables/
├── src/
│   ├── components/
│   │   ├── Table.tsx          # Basic table
│   │   ├── DataTable.tsx      # Advanced table
│   │   ├── TablePagination.tsx
│   │   └── ColumnManager.tsx
│   ├── hooks/
│   │   ├── useTableSort.ts
│   │   ├── useTableFilter.ts
│   │   ├── useTablePagination.ts
│   │   ├── useTableSelection.ts
│   │   └── useColumnManager.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── sortUtils.ts
│   │   ├── filterUtils.ts
│   │   ├── paginationUtils.ts
│   │   └── exportUtils.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Build module
npm run build

# Run tests
npm test

# Development mode
npm run dev
```

## License

MIT