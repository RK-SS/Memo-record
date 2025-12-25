import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { DataManager } from './dataManager'

const isDev = process.env.NODE_ENV === 'development'
let mainWindow: BrowserWindow | null = null
const dataManager = new DataManager()

function createWindow() {
  const preloadPath = join(__dirname, 'preload.js')
  
  // 设置图标路径
  let iconPath: string
  if (isDev) {
    // 开发模式：从项目根目录的 assets 文件夹
    iconPath = join(__dirname, '../../assets/icon.png')
  } else {
    // 生产模式：从打包后的资源目录
    iconPath = join(process.resourcesPath, 'assets/icon.png')
  }
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: preloadPath,
      webSecurity: !isDev
    },
    show: false,
    autoHideMenuBar: true
  })

  mainWindow.setMenuBarVisibility(false)

  if (isDev) {
    mainWindow.loadURL('http://localhost:3001')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show())
  mainWindow.on('closed', () => { mainWindow = null })
}

function registerIpcHandlers() {
  // 认证
  ipcMain.handle('auth:login', (_, credentials) => dataManager.login(credentials.username, credentials.password))
  ipcMain.handle('auth:check', () => dataManager.isAuthenticated())
  ipcMain.handle('auth:getInitialPassword', () => dataManager.getInitialPassword())
  ipcMain.handle('auth:isFirstRun', () => dataManager.isFirstRun())
  ipcMain.handle('auth:isUsingDefaultPassword', () => dataManager.isUsingDefaultPassword())
  ipcMain.handle('auth:changePassword', (_, { oldPassword, newPassword }) => dataManager.changePassword(oldPassword, newPassword))
  ipcMain.handle('auth:getBackupPath', () => dataManager.getBackupDir())

  // 数据
  ipcMain.handle('data:load', () => dataManager.loadData())
  ipcMain.handle('data:save', (_, data) => dataManager.saveData(data))

  // 笔记管理
  ipcMain.handle('note:addGroup', (_, group) => dataManager.addNoteGroup(group))
  ipcMain.handle('note:updateGroup', (_, id, group) => dataManager.updateNoteGroup(id, group))
  ipcMain.handle('note:deleteGroup', (_, id) => dataManager.deleteNoteGroup(id))
  ipcMain.handle('note:reorderGroups', (_, groupIds) => dataManager.reorderNoteGroups(groupIds))
  ipcMain.handle('note:addItem', (_, groupId, item) => dataManager.addNoteItem(groupId, item))
  ipcMain.handle('note:updateItem', (_, groupId, itemId, item) => dataManager.updateNoteItem(groupId, itemId, item))
  ipcMain.handle('note:deleteItem', (_, groupId, itemId) => dataManager.deleteNoteItem(groupId, itemId))
  ipcMain.handle('note:reorderItems', (_, groupId, itemIds) => dataManager.reorderNoteItems(groupId, itemIds))

  // 导出
  ipcMain.handle('export:simple', () => dataManager.exportSimple())
  ipcMain.handle('export:markdown', () => dataManager.exportMarkdown())
  ipcMain.handle('export:full', () => dataManager.exportFull())
  ipcMain.handle('import:full', (_, data, mode) => dataManager.importFull(data, mode))

  // 备份
  ipcMain.handle('backup:manual', () => dataManager.manualBackup())
  ipcMain.handle('backup:list', () => dataManager.listBackups())
  ipcMain.handle('backup:restore', (_, file) => dataManager.restoreBackup(file))
  ipcMain.handle('backup:getConfig', () => dataManager.getBackupConfig())
  ipcMain.handle('backup:setConfig', (_, config) => dataManager.setBackupConfig(config))
  ipcMain.handle('backup:getDir', () => dataManager.getBackupDir())
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
