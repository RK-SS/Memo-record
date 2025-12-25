import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DataStore, NoteGroup, NoteItem, FullExport, BackupConfig } from '@shared/types'

export const useDataStore = defineStore('data', () => {
  const data = ref<DataStore | null>(null)
  const loading = ref(false)

  const loadData = async () => {
    loading.value = true
    try {
      if (!window.electronAPI) return null
      const result = await window.electronAPI.loadData()
      data.value = result
      return result
    } catch (error) {
      console.error('加载数据失败:', error)
      return null
    } finally {
      loading.value = false
    }
  }

  // 笔记分组
  const addNoteGroup = async (group: Omit<NoteGroup, 'id' | 'createdAt' | 'updatedAt' | 'items'>) => {
    const result = await window.electronAPI.addNoteGroup(group)
    if (result) await loadData()
    return result
  }

  const updateNoteGroup = async (id: string, group: Partial<NoteGroup>) => {
    const result = await window.electronAPI.updateNoteGroup(id, group)
    if (result) await loadData()
    return result
  }

  const deleteNoteGroup = async (id: string) => {
    const result = await window.electronAPI.deleteNoteGroup(id)
    if (result) await loadData()
    return result
  }

  const reorderNoteGroups = async (groupIds: string[]) => {
    const result = await window.electronAPI.reorderNoteGroups(groupIds)
    if (result) await loadData()
    return result
  }

  // 笔记项
  const addNoteItem = async (groupId: string, item: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await window.electronAPI.addNoteItem(groupId, item)
    if (result) await loadData()
    return result
  }

  const updateNoteItem = async (groupId: string, itemId: string, item: Partial<NoteItem>) => {
    const result = await window.electronAPI.updateNoteItem(groupId, itemId, item)
    if (result) await loadData()
    return result
  }

  const deleteNoteItem = async (groupId: string, itemId: string) => {
    const result = await window.electronAPI.deleteNoteItem(groupId, itemId)
    if (result) await loadData()
    return result
  }

  const reorderNoteItems = async (groupId: string, itemIds: string[]) => {
    const result = await window.electronAPI.reorderNoteItems(groupId, itemIds)
    if (result) await loadData()
    return result
  }

  // 导出
  const exportSimple = () => window.electronAPI.exportSimple()
  const exportMarkdown = () => window.electronAPI.exportMarkdown()
  const exportFull = () => window.electronAPI.exportFull()
  
  const importFull = async (importData: FullExport, mode: 'merge' | 'replace') => {
    try {
      // 确保数据可以序列化
      const cleanData = {
        version: importData.version || '2.0',
        exportedAt: importData.exportedAt || new Date().toISOString(),
        noteGroups: importData.noteGroups.map(group => ({
          id: group.id || '',
          name: group.name,
          description: group.description || '',
          color: group.color || '#3b82f6',
          order: group.order || 0,
          items: (group.items || []).map(item => ({
            id: item.id || '',
            title: item.title,
            content: item.content,
            order: item.order || 0,
            createdAt: item.createdAt || '',
            updatedAt: item.updatedAt || ''
          })),
          createdAt: group.createdAt || '',
          updatedAt: group.updatedAt || ''
        }))
      }
      
      const result = await window.electronAPI.importFull(cleanData, mode)
      if (result) await loadData()
      return result
    } catch (error) {
      console.error('importFull 错误:', error)
      throw error
    }
  }

  // 备份
  const manualBackup = () => window.electronAPI.manualBackup()
  const listBackups = () => window.electronAPI.listBackups()
  const restoreBackup = async (file: string) => {
    const result = await window.electronAPI.restoreBackup(file)
    if (result) await loadData()
    return result
  }
  const getBackupConfig = () => window.electronAPI.getBackupConfig()
  const setBackupConfig = (config: BackupConfig) => window.electronAPI.setBackupConfig(config)
  const getBackupDir = () => window.electronAPI.getBackupDir()

  return {
    data, loading, loadData,
    addNoteGroup, updateNoteGroup, deleteNoteGroup, reorderNoteGroups,
    addNoteItem, updateNoteItem, deleteNoteItem, reorderNoteItems,
    exportSimple, exportMarkdown, exportFull, importFull,
    manualBackup, listBackups, restoreBackup, getBackupConfig, setBackupConfig, getBackupDir
  }
})
