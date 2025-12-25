const { contextBridge, ipcRenderer } = require('electron')

console.log('预加载脚本开始执行...')

// 创建完整的API接口
const electronAPI = {
  // 认证相关
  login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  checkAuth: () => ipcRenderer.invoke('auth:check'),
  getInitialPassword: () => ipcRenderer.invoke('auth:getInitialPassword'),
  isFirstRun: () => ipcRenderer.invoke('auth:isFirstRun'),
  isUsingDefaultPassword: () => ipcRenderer.invoke('auth:isUsingDefaultPassword'),
  changePassword: (passwords) => ipcRenderer.invoke('auth:changePassword', passwords),
  getBackupPath: () => ipcRenderer.invoke('auth:getBackupPath'),

  // 数据操作
  loadData: () => ipcRenderer.invoke('data:load'),
  saveData: (data) => ipcRenderer.invoke('data:save', data),
  createBackup: () => ipcRenderer.invoke('data:backup'),

  // 密码管理
  addPassword: (record) => ipcRenderer.invoke('password:add', record),
  updatePassword: (id, record) => ipcRenderer.invoke('password:update', id, record),
  deletePassword: (id) => ipcRenderer.invoke('password:delete', id),

  // 主机管理
  addHost: (record) => ipcRenderer.invoke('host:add', record),
  updateHost: (id, record) => ipcRenderer.invoke('host:update', id, record),
  deleteHost: (id) => ipcRenderer.invoke('host:delete', id)
}

// 暴露API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI)
console.log('✅ electronAPI已成功暴露，包含方法:', Object.keys(electronAPI))