import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs'
import { join } from 'path'
import { app } from 'electron'
import { DataStore, NoteGroup, NoteItem, SimpleExport, FullExport, BackupConfig } from '../shared/types'

export class DataManager {
  private dataPath: string
  private backupDir: string
  private currentUser: string | null = null
  private data: DataStore | null = null

  constructor() {
    const userDataPath = app.getPath('userData')
    this.dataPath = join(userDataPath, 'data.json')
    this.backupDir = join(userDataPath, 'backups')
    
    // 确保目录存在
    if (!existsSync(userDataPath)) {
      mkdirSync(userDataPath, { recursive: true })
    }
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true })
    }
  }

  // 初始化默认数据
  private getDefaultData(): DataStore {
    const defaultPassword = this.generateRandomPassword()
    return {
      user: { username: 'admin', password: defaultPassword },
      noteGroups: [],
      backupConfig: { enabled: true, maxBackups: 10 }
    }
  }

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let password = ''
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2)
  }

  // 获取北京时间格式的时间戳（用于文件名）
  private getBeijingTimestamp(): string {
    const now = new Date()
    const beijingOffset = 8 * 60 // UTC+8
    const localOffset = now.getTimezoneOffset()
    const beijingTime = new Date(now.getTime() + (beijingOffset + localOffset) * 60 * 1000)
    
    const year = beijingTime.getFullYear()
    const month = String(beijingTime.getMonth() + 1).padStart(2, '0')
    const day = String(beijingTime.getDate()).padStart(2, '0')
    const hours = String(beijingTime.getHours()).padStart(2, '0')
    const minutes = String(beijingTime.getMinutes()).padStart(2, '0')
    const seconds = String(beijingTime.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}-${minutes}-${seconds}`
  }

  // 获取初始密码
  getInitialPassword(): string | null {
    try {
      if (!existsSync(this.dataPath)) {
        const defaultData = this.getDefaultData()
        this.saveDataToFile(defaultData)
        return defaultData.user.password
      }
      const data = this.loadDataFromFile()
      const isDefault = (data.user.password.length === 8 && /^[A-Za-z0-9]+$/.test(data.user.password))
      return isDefault ? data.user.password : null
    } catch {
      return null
    }
  }

  isFirstRun(): boolean {
    return !existsSync(this.dataPath)
  }

  isUsingDefaultPassword(): boolean {
    try {
      if (!existsSync(this.dataPath)) return true
      const data = this.loadDataFromFile()
      return data.user.password.length === 8 && /^[A-Za-z0-9]+$/.test(data.user.password)
    } catch {
      return false
    }
  }

  // 数据文件操作
  private loadDataFromFile(): DataStore {
    try {
      if (!existsSync(this.dataPath)) {
        const defaultData = this.getDefaultData()
        this.saveDataToFile(defaultData)
        return defaultData
      }
      const content = readFileSync(this.dataPath, 'utf-8')
      const data = JSON.parse(content) as DataStore
      // 兼容旧数据：将 snippetGroups 迁移到 noteGroups
      if ((data as any).snippetGroups && !data.noteGroups) {
        data.noteGroups = (data as any).snippetGroups
        delete (data as any).snippetGroups
      }
      if (!data.noteGroups) data.noteGroups = []
      if (!data.backupConfig) data.backupConfig = { enabled: true, maxBackups: 10 }
      return data
    } catch {
      return this.getDefaultData()
    }
  }

  private saveDataToFile(data: DataStore): boolean {
    try {
      writeFileSync(this.dataPath, JSON.stringify(data, null, 2), 'utf-8')
      // 自动备份
      if (data.backupConfig?.enabled) {
        this.autoBackup()
      }
      return true
    } catch {
      return false
    }
  }

  // 认证
  login(username: string, password: string): boolean {
    const data = this.loadDataFromFile()
    if (data.user.username === username && data.user.password === password) {
      this.currentUser = username
      this.data = data
      return true
    }
    return false
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null
  }

  loadData(): DataStore | null {
    if (!this.isAuthenticated()) return null
    if (!this.data) this.data = this.loadDataFromFile()
    return this.data
  }

  saveData(data: DataStore): boolean {
    if (!this.isAuthenticated()) return false
    this.data = data
    return this.saveDataToFile(data)
  }

  changePassword(oldPassword: string, newPassword: string): boolean {
    if (!this.isAuthenticated() || !this.data) return false
    if (this.data.user.password !== oldPassword) return false
    this.data.user.password = newPassword
    return this.saveDataToFile(this.data)
  }

  // ==================== 笔记管理 ====================

  addNoteGroup(group: Omit<NoteGroup, 'id' | 'createdAt' | 'updatedAt' | 'items'>): boolean {
    if (!this.isAuthenticated() || !this.data) return false
    if (!this.data.noteGroups) this.data.noteGroups = []

    const newGroup: NoteGroup = {
      ...group,
      id: this.generateId(),
      items: [],
      order: group.order ?? this.data.noteGroups.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.data.noteGroups.push(newGroup)
    return this.saveDataToFile(this.data)
  }

  updateNoteGroup(id: string, updates: Partial<NoteGroup>): boolean {
    if (!this.isAuthenticated() || !this.data?.noteGroups) return false
    const index = this.data.noteGroups.findIndex(g => g.id === id)
    if (index === -1) return false
    this.data.noteGroups[index] = {
      ...this.data.noteGroups[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }
    return this.saveDataToFile(this.data)
  }

  deleteNoteGroup(id: string): boolean {
    if (!this.isAuthenticated() || !this.data?.noteGroups) return false
    const index = this.data.noteGroups.findIndex(g => g.id === id)
    if (index === -1) return false
    this.data.noteGroups.splice(index, 1)
    return this.saveDataToFile(this.data)
  }

  reorderNoteGroups(groupIds: string[]): boolean {
    if (!this.isAuthenticated() || !this.data?.noteGroups) return false
    const groupMap = new Map(this.data.noteGroups.map(g => [g.id, g]))
    this.data.noteGroups = groupIds
      .map((id, index) => {
        const group = groupMap.get(id)
        if (group) { group.order = index; group.updatedAt = new Date().toISOString() }
        return group
      })
      .filter((g): g is NoteGroup => g !== undefined)
    return this.saveDataToFile(this.data)
  }

  addNoteItem(groupId: string, item: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>): boolean {
    if (!this.isAuthenticated() || !this.data?.noteGroups) return false
    const group = this.data.noteGroups.find(g => g.id === groupId)
    if (!group) return false
    const newItem: NoteItem = {
      ...item,
      id: this.generateId(),
      order: item.order ?? group.items.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    group.items.push(newItem)
    group.updatedAt = new Date().toISOString()
    return this.saveDataToFile(this.data)
  }

  updateNoteItem(groupId: string, itemId: string, updates: Partial<NoteItem>): boolean {
    if (!this.isAuthenticated() || !this.data?.noteGroups) return false
    const group = this.data.noteGroups.find(g => g.id === groupId)
    if (!group) return false
    const itemIndex = group.items.findIndex(i => i.id === itemId)
    if (itemIndex === -1) return false
    group.items[itemIndex] = { ...group.items[itemIndex], ...updates, updatedAt: new Date().toISOString() }
    group.updatedAt = new Date().toISOString()
    return this.saveDataToFile(this.data)
  }

  deleteNoteItem(groupId: string, itemId: string): boolean {
    if (!this.isAuthenticated() || !this.data?.noteGroups) return false
    const group = this.data.noteGroups.find(g => g.id === groupId)
    if (!group) return false
    const itemIndex = group.items.findIndex(i => i.id === itemId)
    if (itemIndex === -1) return false
    group.items.splice(itemIndex, 1)
    group.updatedAt = new Date().toISOString()
    return this.saveDataToFile(this.data)
  }

  reorderNoteItems(groupId: string, itemIds: string[]): boolean {
    if (!this.isAuthenticated() || !this.data?.noteGroups) return false
    const group = this.data.noteGroups.find(g => g.id === groupId)
    if (!group) return false
    const itemMap = new Map(group.items.map(i => [i.id, i]))
    group.items = itemIds
      .map((id, index) => {
        const item = itemMap.get(id)
        if (item) { item.order = index; item.updatedAt = new Date().toISOString() }
        return item
      })
      .filter((i): i is NoteItem => i !== undefined)
    group.updatedAt = new Date().toISOString()
    return this.saveDataToFile(this.data)
  }

  // ==================== 导出功能 ====================

  // 简化导出 - 只包含用户关心的数据
  exportSimple(): SimpleExport {
    const groups = this.data?.noteGroups || []
    const result: SimpleExport = {}
    for (const group of groups) {
      result[group.name] = group.items.map(item => ({
        title: item.title,
        content: item.content
      }))
    }
    return result
  }

  // Markdown 导出
  exportMarkdown(): string {
    const groups = this.data?.noteGroups || []
    let md = ''
    for (const group of groups) {
      md += `# ${group.name}\n\n`
      if (group.description) md += `${group.description}\n\n`
      for (const item of group.items) {
        md += `## ${item.title}\n\n${item.content}\n\n`
      }
    }
    return md
  }

  // 完整导出 - 用于备份恢复
  exportFull(): FullExport {
    return {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      noteGroups: this.data?.noteGroups || []
    }
  }

  // 导入
  importFull(data: FullExport, mode: 'merge' | 'replace'): boolean {
    console.log('importFull 被调用, mode:', mode, 'data:', data)
    
    if (!this.isAuthenticated() || !this.data) {
      console.error('导入失败: 未认证或数据为空')
      return false
    }
    
    if (!data.noteGroups || !Array.isArray(data.noteGroups)) {
      console.error('导入失败: noteGroups 不存在或不是数组')
      return false
    }
    
    if (data.noteGroups.length === 0) {
      console.error('导入失败: noteGroups 为空')
      return false
    }

    console.log('开始导入', data.noteGroups.length, '个分组')

    if (mode === 'replace') {
      this.data.noteGroups = data.noteGroups.map((group, gIndex) => ({
        ...group,
        id: this.generateId(),
        order: gIndex,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: (group.items || []).map((item, iIndex) => ({
          ...item,
          id: this.generateId(),
          order: iIndex,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      }))
    } else {
      if (!this.data.noteGroups) this.data.noteGroups = []
      const existingNames = new Set(this.data.noteGroups.map(g => g.name))
      let maxOrder = Math.max(0, ...this.data.noteGroups.map(g => g.order))

      for (const group of data.noteGroups) {
        if (existingNames.has(group.name)) {
          const existingGroup = this.data.noteGroups.find(g => g.name === group.name)!
          let maxItemOrder = Math.max(0, ...existingGroup.items.map(i => i.order))
          for (const item of (group.items || [])) {
            existingGroup.items.push({
              ...item,
              id: this.generateId(),
              order: ++maxItemOrder,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
          }
          existingGroup.updatedAt = new Date().toISOString()
        } else {
          this.data.noteGroups.push({
            ...group,
            id: this.generateId(),
            order: ++maxOrder,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            items: (group.items || []).map((item, iIndex) => ({
              ...item,
              id: this.generateId(),
              order: iIndex,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }))
          })
          existingNames.add(group.name)
        }
      }
    }
    
    const result = this.saveDataToFile(this.data)
    console.log('导入保存结果:', result)
    return result
  }

  // ==================== 备份功能 ====================

  private autoBackup(): void {
    try {
      const config = this.data?.backupConfig
      if (!config?.enabled) return

      const timestamp = this.getBeijingTimestamp()
      const backupFile = join(this.backupDir, `backup-${timestamp}.json`)
      writeFileSync(backupFile, JSON.stringify(this.data, null, 2), 'utf-8')

      // 清理旧备份
      this.cleanOldBackups(config.maxBackups)
    } catch (error) {
      console.error('自动备份失败:', error)
    }
  }

  private cleanOldBackups(maxBackups: number): void {
    try {
      const files = readdirSync(this.backupDir)
        .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
        .sort()
        .reverse()

      if (files.length > maxBackups) {
        for (const file of files.slice(maxBackups)) {
          unlinkSync(join(this.backupDir, file))
        }
      }
    } catch (error) {
      console.error('清理备份失败:', error)
    }
  }

  manualBackup(): string {
    if (!this.isAuthenticated() || !this.data) return ''
    try {
      const timestamp = this.getBeijingTimestamp()
      const backupFile = join(this.backupDir, `manual-${timestamp}.json`)
      writeFileSync(backupFile, JSON.stringify(this.data, null, 2), 'utf-8')
      return backupFile
    } catch {
      return ''
    }
  }

  listBackups(): string[] {
    try {
      return readdirSync(this.backupDir)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse()
    } catch {
      return []
    }
  }

  restoreBackup(backupFile: string): boolean {
    if (!this.isAuthenticated()) return false
    try {
      const filePath = join(this.backupDir, backupFile)
      if (!existsSync(filePath)) return false
      const content = readFileSync(filePath, 'utf-8')
      const data = JSON.parse(content) as DataStore
      this.data = data
      return this.saveDataToFile(data)
    } catch {
      return false
    }
  }

  getBackupConfig(): BackupConfig {
    return this.data?.backupConfig || { enabled: true, maxBackups: 10 }
  }

  setBackupConfig(config: BackupConfig): boolean {
    if (!this.isAuthenticated() || !this.data) return false
    this.data.backupConfig = config
    return this.saveDataToFile(this.data)
  }

  getBackupDir(): string {
    return this.backupDir
  }
}
