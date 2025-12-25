import { NoteGroup, NoteItem, SimpleExport, FullExport, BackupConfig } from '@shared/types'

export interface ElectronAPI {
  // 认证
  login: (credentials: { username: string; password: string }) => Promise<boolean>
  checkAuth: () => Promise<boolean>
  getInitialPassword: () => Promise<string | null>
  isFirstRun: () => Promise<boolean>
  isUsingDefaultPassword: () => Promise<boolean>
  changePassword: (passwords: { oldPassword: string; newPassword: string }) => Promise<boolean>
  getBackupPath: () => Promise<string>

  // 数据
  loadData: () => Promise<any>
  saveData: (data: any) => Promise<boolean>

  // 笔记管理
  addNoteGroup: (group: Omit<NoteGroup, 'id' | 'createdAt' | 'updatedAt' | 'items'>) => Promise<boolean>
  updateNoteGroup: (id: string, group: Partial<NoteGroup>) => Promise<boolean>
  deleteNoteGroup: (id: string) => Promise<boolean>
  reorderNoteGroups: (groupIds: string[]) => Promise<boolean>
  addNoteItem: (groupId: string, item: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
  updateNoteItem: (groupId: string, itemId: string, item: Partial<NoteItem>) => Promise<boolean>
  deleteNoteItem: (groupId: string, itemId: string) => Promise<boolean>
  reorderNoteItems: (groupId: string, itemIds: string[]) => Promise<boolean>

  // 导出
  exportSimple: () => Promise<SimpleExport>
  exportMarkdown: () => Promise<string>
  exportFull: () => Promise<FullExport>
  importFull: (data: FullExport, mode: 'merge' | 'replace') => Promise<boolean>

  // 备份
  manualBackup: () => Promise<string>
  listBackups: () => Promise<string[]>
  restoreBackup: (file: string) => Promise<boolean>
  getBackupConfig: () => Promise<BackupConfig>
  setBackupConfig: (config: BackupConfig) => Promise<boolean>
  getBackupDir: () => Promise<string>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
