const { contextBridge, ipcRenderer } = require('electron')

const electronAPI = {
  // 认证
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  checkAuth: () => ipcRenderer.invoke('auth:check'),
  getInitialPassword: () => ipcRenderer.invoke('auth:getInitialPassword'),
  isFirstRun: () => ipcRenderer.invoke('auth:isFirstRun'),
  isUsingDefaultPassword: () => ipcRenderer.invoke('auth:isUsingDefaultPassword'),
  changePassword: (passwords) => ipcRenderer.invoke('auth:changePassword', passwords),
  getBackupPath: () => ipcRenderer.invoke('auth:getBackupPath'),

  // 数据
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (data) => ipcRenderer.invoke('data:save', data),

  // 笔记管理
  addNoteGroup: (group) => ipcRenderer.invoke('note:addGroup', group),
  updateNoteGroup: (id, group) => ipcRenderer.invoke('note:updateGroup', id, group),
  deleteNoteGroup: (id) => ipcRenderer.invoke('note:deleteGroup', id),
  reorderNoteGroups: (groupIds) => ipcRenderer.invoke('note:reorderGroups', groupIds),
  addNoteItem: (groupId, item) => ipcRenderer.invoke('note:addItem', groupId, item),
  updateNoteItem: (groupId, itemId, item) => ipcRenderer.invoke('note:updateItem', groupId, itemId, item),
  deleteNoteItem: (groupId, itemId) => ipcRenderer.invoke('note:deleteItem', groupId, itemId),
  reorderNoteItems: (groupId, itemIds) => ipcRenderer.invoke('note:reorderItems', groupId, itemIds),

  // 导出
  exportSimple: () => ipcRenderer.invoke('export:simple'),
  exportMarkdown: () => ipcRenderer.invoke('export:markdown'),
  exportFull: () => ipcRenderer.invoke('export:full'),
  importFull: (data, mode) => ipcRenderer.invoke('import:full', data, mode),

  // 备份
  manualBackup: () => ipcRenderer.invoke('backup:manual'),
  listBackups: () => ipcRenderer.invoke('backup:list'),
  restoreBackup: (file) => ipcRenderer.invoke('backup:restore', file),
  getBackupConfig: () => ipcRenderer.invoke('backup:getConfig'),
  setBackupConfig: (config) => ipcRenderer.invoke('backup:setConfig', config),
  getBackupDir: () => ipcRenderer.invoke('backup:getDir')
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
