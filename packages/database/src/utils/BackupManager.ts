import { DatabaseProvider } from '../providers';
import { DatabaseConfig } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

export interface BackupOptions {
  outputPath: string;
  tables?: string[];
  format?: 'sql' | 'csv' | 'json';
  compress?: boolean;
}

export interface RestoreOptions {
  inputPath: string;
  tables?: string[];
  dropExisting?: boolean;
}

export class BackupManager {
  constructor(
    private provider: DatabaseProvider,
    private config: DatabaseConfig
  ) {}

  async backup(options: BackupOptions): Promise<string> {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const fileName = `backup_${timestamp}.${options.format || 'sql'}`;
    const filePath = path.join(options.outputPath, fileName);

    try {
      switch (this.config.type) {
        case 'postgresql':
          await this.backupPostgreSQL(filePath, options);
          break;
        case 'mysql':
          await this.backupMySQL(filePath, options);
          break;
        case 'sqlite':
          await this.backupSQLite(filePath, options);
          break;
        default:
          throw new Error(`Backup not supported for ${this.config.type}`);
      }

      if (options.compress) {
        await this.compressBackup(filePath);
        return `${filePath}.gz`;
      }

      return filePath;
    } catch (error) {
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  async restore(options: RestoreOptions): Promise<void> {
    try {
      const isCompressed = options.inputPath.endsWith('.gz');
      let inputPath = options.inputPath;

      if (isCompressed) {
        inputPath = await this.decompressBackup(options.inputPath);
      }

      switch (this.config.type) {
        case 'postgresql':
          await this.restorePostgreSQL(inputPath, options);
          break;
        case 'mysql':
          await this.restoreMySQL(inputPath, options);
          break;
        case 'sqlite':
          await this.restoreSQLite(inputPath, options);
          break;
        default:
          throw new Error(`Restore not supported for ${this.config.type}`);
      }

      if (isCompressed) {
        fs.unlinkSync(inputPath);
      }
    } catch (error) {
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  private async backupPostgreSQL(filePath: string, options: BackupOptions): Promise<void> {
    const { host, port, database, user, password } = this.config as any;
    const tables = options.tables?.join(' -t ') || '';
    const tablesFlag = tables ? `-t ${tables}` : '';
    
    const command = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${user} -d ${database} ${tablesFlag} -f ${filePath}`;
    await execAsync(command);
  }

  private async backupMySQL(filePath: string, options: BackupOptions): Promise<void> {
    const { host, port, database, user, password } = this.config as any;
    const tables = options.tables?.join(' ') || '';
    
    const command = `mysqldump -h ${host} -P ${port} -u ${user} -p${password} ${database} ${tables} > ${filePath}`;
    await execAsync(command);
  }

  private async backupSQLite(filePath: string, options: BackupOptions): Promise<void> {
    const { database } = this.config as any;
    const command = `sqlite3 ${database} ".backup '${filePath}'"`;
    await execAsync(command);
  }

  private async restorePostgreSQL(inputPath: string, options: RestoreOptions): Promise<void> {
    const { host, port, database, user, password } = this.config as any;
    
    if (options.dropExisting) {
      await execAsync(`PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -c "DROP DATABASE IF EXISTS ${database}; CREATE DATABASE ${database};"`);
    }
    
    const command = `PGPASSWORD="${password}" psql -h ${host} -p ${port} -U ${user} -d ${database} -f ${inputPath}`;
    await execAsync(command);
  }

  private async restoreMySQL(inputPath: string, options: RestoreOptions): Promise<void> {
    const { host, port, database, user, password } = this.config as any;
    
    const command = `mysql -h ${host} -P ${port} -u ${user} -p${password} ${database} < ${inputPath}`;
    await execAsync(command);
  }

  private async restoreSQLite(inputPath: string, options: RestoreOptions): Promise<void> {
    const { database } = this.config as any;
    const command = `sqlite3 ${database} ".restore '${inputPath}'"`;
    await execAsync(command);
  }

  private async compressBackup(filePath: string): Promise<void> {
    await execAsync(`gzip ${filePath}`);
  }

  private async decompressBackup(filePath: string): Promise<string> {
    const outputPath = filePath.replace('.gz', '');
    await execAsync(`gunzip -c ${filePath} > ${outputPath}`);
    return outputPath;
  }

  async listBackups(directory: string): Promise<Array<{ name: string; size: number; created: Date }>> {
    const files = await fs.promises.readdir(directory);
    const backupFiles = files.filter(file => 
      file.startsWith('backup_') && (file.endsWith('.sql') || file.endsWith('.sql.gz'))
    );

    return Promise.all(
      backupFiles.map(async (file) => {
        const stats = await fs.promises.stat(path.join(directory, file));
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime
        };
      })
    );
  }

  async deleteOldBackups(directory: string, daysToKeep: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const backups = await this.listBackups(directory);
    let deletedCount = 0;

    for (const backup of backups) {
      if (backup.created < cutoffDate) {
        await fs.promises.unlink(path.join(directory, backup.name));
        deletedCount++;
      }
    }

    return deletedCount;
  }
}