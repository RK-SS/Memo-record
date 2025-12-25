// 用户认证相关
export interface User {
  username: string
  password: string
}

// 笔记项
export interface NoteItem {
  id: string
  title: string
  content: string
  order: number
  createdAt: string
  updatedAt: string
}

// 笔记分组
export interface NoteGroup {
  id: string
  name: string
  description?: string
  color?: string
  items: NoteItem[]
  order: number
  createdAt: string
  updatedAt: string
}

// 备份配置
export interface BackupConfig {
  enabled: boolean
  maxBackups: number
  backupPath?: string
}

// 数据存储结构
export interface DataStore {
  user: User
  noteGroups: NoteGroup[]
  backupConfig?: BackupConfig
}

// 简化导出格式 - 用户友好
export interface SimpleExport {
  [groupName: string]: Array<{ title: string; content: string }>
}

// 完整导出格式 - 用于备份恢复
export interface FullExport {
  version: string
  exportedAt: string
  noteGroups: NoteGroup[]
}

// IPC通信事件
export interface IpcEvents {
  // 认证相关
  'auth:login': (credentials: { username: string; password: string }) => boolean
  'auth:check': () => boolean
  
  // 数据操作
  'data:load': () => DataStore | null
  'data:save': (data: DataStore) => boolean

  // 笔记管理
  'note:addGroup': (group: Omit<NoteGroup, 'id' | 'createdAt' | 'updatedAt' | 'items'>) => boolean
  'note:updateGroup': (id: string, group: Partial<NoteGroup>) => boolean
  'note:deleteGroup': (id: string) => boolean
  'note:reorderGroups': (groupIds: string[]) => boolean
  'note:addItem': (groupId: string, item: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => boolean
  'note:updateItem': (groupId: string, itemId: string, item: Partial<NoteItem>) => boolean
  'note:deleteItem': (groupId: string, itemId: string) => boolean
  'note:reorderItems': (groupId: string, itemIds: string[]) => boolean

  // 导入导出
  'export:simple': () => SimpleExport
  'export:markdown': () => string
  'export:full': () => FullExport
  'import:full': (data: FullExport, mode: 'merge' | 'replace') => boolean

  // 备份
  'backup:auto': () => boolean
  'backup:manual': () => string
  'backup:list': () => string[]
  'backup:restore': (backupFile: string) => boolean
  'backup:getConfig': () => BackupConfig
  'backup:setConfig': (config: BackupConfig) => boolean
}