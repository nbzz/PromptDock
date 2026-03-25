import { PromptHistoryEntry, StoredTemplate } from '@/lib/types';
import { loadHistory } from '@/lib/history';
import { loadLocalTemplates } from '@/lib/storage';

export interface Backup {
  version: string;
  createdAt: string;
  templates: StoredTemplate[];
  history: PromptHistoryEntry[];
}

const BACKUP_VERSION = '1.0';

export function createBackup(): Backup {
  return {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    templates: loadLocalTemplates(),
    history: loadHistory()
  };
}

export function downloadBackup(backup: Backup): void {
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  const date = new Date().toISOString().slice(0, 10);
  link.download = `promptdock-backup-${date}.json`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 200);
}

export interface RestoreResult {
  templatesRestored: number;
  historyRestored: number;
}

export function restoreBackup(
  backup: Backup,
  existingTemplates: StoredTemplate[],
  existingHistory: PromptHistoryEntry[]
): RestoreResult {
  // Merge templates: skip if id already exists
  const existingTemplateIds = new Set(existingTemplates.map((t) => t.id));
  const newTemplates = backup.templates.filter((t) => !existingTemplateIds.has(t.id));

  // Merge history: skip if id already exists
  const existingHistoryIds = new Set(existingHistory.map((h) => h.id));
  const newHistory = backup.history.filter((h) => !existingHistoryIds.has(h.id));

  return {
    templatesRestored: newTemplates.length,
    historyRestored: newHistory.length
  };
}

export function parseBackupFile(file: File): Promise<Backup> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text) as Backup;
        if (!data.version || !data.createdAt || !Array.isArray(data.templates)) {
          reject(new Error('无效的备份文件格式'));
          return;
        }
        resolve(data);
      } catch {
        reject(new Error('无法解析备份文件'));
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
}
