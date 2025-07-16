import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import {
  DataSource,
  DataSourceType,
  DataSourceConnection,
  DataSourceError
} from '../types';

export class DataSourceService extends EventEmitter {
  private dataSources: Map<string, DataSource> = new Map();
  private connectionCache: Map<string, any> = new Map();

  async register(dataSource: Omit<DataSource, 'id'>): Promise<DataSource> {
    const newDataSource: DataSource = {
      ...dataSource,
      id: dataSource.id || uuidv4()
    };

    this.validateDataSource(newDataSource);
    this.dataSources.set(newDataSource.id, newDataSource);
    
    this.emit('datasource:registered', newDataSource);
    return newDataSource;
  }

  async get(dataSourceId: string): Promise<DataSource> {
    const dataSource = this.dataSources.get(dataSourceId);
    if (!dataSource) {
      throw new DataSourceError(`Data source ${dataSourceId} not found`);
    }
    return dataSource;
  }

  async list(filters?: { type?: DataSourceType; isActive?: boolean }): Promise<DataSource[]> {
    let sources = Array.from(this.dataSources.values());

    if (filters) {
      if (filters.type) {
        sources = sources.filter(ds => ds.type === filters.type);
      }
      if (filters.isActive !== undefined) {
        sources = sources.filter(ds => ds.isActive === filters.isActive);
      }
    }

    return sources;
  }

  async fetchData(
    dataSourceId: string,
    parameters?: Record<string, any>
  ): Promise<any> {
    const dataSource = await this.get(dataSourceId);

    if (!dataSource.isActive) {
      throw new DataSourceError(`Data source ${dataSourceId} is not active`);
    }

    switch (dataSource.type) {
      case DataSourceType.DATABASE:
        return this.fetchFromDatabase(dataSource, parameters);
      case DataSourceType.API:
        return this.fetchFromAPI(dataSource, parameters);
      case DataSourceType.FILE:
        return this.fetchFromFile(dataSource, parameters);
      case DataSourceType.CUSTOM:
        return this.fetchFromCustom(dataSource, parameters);
      default:
        throw new DataSourceError(`Unsupported data source type: ${dataSource.type}`);
    }
  }

  private async fetchFromDatabase(
    dataSource: DataSource,
    parameters?: Record<string, any>
  ): Promise<any> {
    // In a real implementation, this would connect to the database
    // For now, we'll simulate with mock data
    const mockData = {
      campaigns: [
        {
          id: 'camp1',
          name: 'Summer Campaign',
          startDate: '2024-06-01',
          endDate: '2024-08-31',
          budget: 50000,
          spent: 35000,
          reach: 2500000,
          engagement: 125000
        },
        {
          id: 'camp2',
          name: 'Fall Collection',
          startDate: '2024-09-01',
          endDate: '2024-11-30',
          budget: 75000,
          spent: 45000,
          reach: 3200000,
          engagement: 180000
        }
      ],
      influencers: [
        {
          id: 'inf1',
          name: 'John Doe',
          followers: 125000,
          engagementRate: 4.8,
          campaigns: 12,
          earnings: 45000
        },
        {
          id: 'inf2',
          name: 'Jane Smith',
          followers: 250000,
          engagementRate: 5.2,
          campaigns: 18,
          earnings: 78000
        }
      ]
    };

    // Apply parameters as filters
    if (parameters?.table) {
      return mockData[parameters.table as keyof typeof mockData] || [];
    }

    return mockData;
  }

  private async fetchFromAPI(
    dataSource: DataSource,
    parameters?: Record<string, any>
  ): Promise<any> {
    const connection = dataSource.connection;
    
    if (!connection.url) {
      throw new DataSourceError('API URL is required');
    }

    try {
      const response = await axios({
        method: connection.method || 'GET',
        url: connection.url,
        headers: connection.headers,
        params: parameters
      });

      return response.data;
    } catch (error: any) {
      throw new DataSourceError(
        `Failed to fetch from API: ${error.message}`
      );
    }
  }

  private async fetchFromFile(
    dataSource: DataSource,
    parameters?: Record<string, any>
  ): Promise<any> {
    // In a real implementation, this would read from file system
    // For now, return mock data
    return {
      data: [
        ['Date', 'Revenue', 'Costs', 'Profit'],
        ['2024-01', 120000, 80000, 40000],
        ['2024-02', 135000, 85000, 50000],
        ['2024-03', 145000, 90000, 55000]
      ]
    };
  }

  private async fetchFromCustom(
    dataSource: DataSource,
    parameters?: Record<string, any>
  ): Promise<any> {
    // Custom data source would have its own implementation
    // This is a placeholder
    return {
      custom: true,
      parameters,
      timestamp: new Date().toISOString()
    };
  }

  async testConnection(dataSourceId: string): Promise<boolean> {
    try {
      const dataSource = await this.get(dataSourceId);
      
      // Try to fetch minimal data
      await this.fetchData(dataSourceId, { limit: 1 });
      
      return true;
    } catch (error) {
      return false;
    }
  }

  async update(
    dataSourceId: string,
    updates: Partial<DataSource>
  ): Promise<DataSource> {
    const dataSource = await this.get(dataSourceId);
    
    const updatedDataSource: DataSource = {
      ...dataSource,
      ...updates,
      id: dataSource.id // Preserve ID
    };

    this.validateDataSource(updatedDataSource);
    this.dataSources.set(dataSourceId, updatedDataSource);
    
    // Clear connection cache
    this.connectionCache.delete(dataSourceId);
    
    this.emit('datasource:updated', updatedDataSource);
    return updatedDataSource;
  }

  async delete(dataSourceId: string): Promise<void> {
    const dataSource = await this.get(dataSourceId);
    
    // Remove from storage
    this.dataSources.delete(dataSourceId);
    this.connectionCache.delete(dataSourceId);
    
    this.emit('datasource:deleted', { dataSourceId });
  }

  private validateDataSource(dataSource: DataSource): void {
    if (!dataSource.name) {
      throw new DataSourceError('Data source name is required');
    }

    if (!dataSource.type) {
      throw new DataSourceError('Data source type is required');
    }

    if (!dataSource.connection) {
      throw new DataSourceError('Data source connection is required');
    }

    // Type-specific validation
    switch (dataSource.type) {
      case DataSourceType.DATABASE:
        if (!dataSource.connection.host || !dataSource.connection.database) {
          throw new DataSourceError('Database host and name are required');
        }
        break;
      case DataSourceType.API:
        if (!dataSource.connection.url) {
          throw new DataSourceError('API URL is required');
        }
        break;
    }
  }

  // Helper method to build SQL query with parameters
  buildQuery(template: string, parameters: Record<string, any>): string {
    let query = template;
    
    // Replace named parameters
    Object.entries(parameters).forEach(([key, value]) => {
      const placeholder = `:${key}`;
      let replacementValue: string;
      
      if (typeof value === 'string') {
        replacementValue = `'${value.replace(/'/g, "''")}'`;
      } else if (value instanceof Date) {
        replacementValue = `'${value.toISOString()}'`;
      } else if (value === null || value === undefined) {
        replacementValue = 'NULL';
      } else {
        replacementValue = String(value);
      }
      
      query = query.replace(new RegExp(placeholder, 'g'), replacementValue);
    });
    
    return query;
  }
}