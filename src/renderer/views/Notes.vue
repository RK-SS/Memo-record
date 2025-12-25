<template>
  <div @click="closeDropdown">
    <Navbar @search="handleSearch" />
    <div class="container">
      <!-- 搜索结果模式 -->
      <div v-if="searchQuery" class="search-results">
        <div class="search-header">
          <h2>搜索结果: "{{ searchQuery }}"</h2>
          <span class="result-count">找到 {{ searchResults.length }} 条</span>
        </div>
        <div v-if="searchResults.length > 0" class="cards-grid">
          <div v-for="result in searchResults" :key="result.item.id" class="note-card" @click="openDetailModal(result.item)">
            <div class="card-header">
              <span class="card-title">{{ result.item.title }}</span>
              <span class="card-group">{{ result.groupName }}</span>
            </div>
            <div class="card-preview"><pre>{{ getPreview(result.item.content) }}</pre></div>
          </div>
        </div>
        <div v-else class="empty-state">未找到匹配的笔记</div>
      </div>

      <!-- 正常模式 -->
      <template v-else>
        <div class="page-header">
          <h1>📝 笔记</h1>
          <div class="header-actions">
            <div class="export-dropdown" @click.stop>
              <button @click="showExportMenu = !showExportMenu" class="btn btn-secondary">导出 ▾</button>
              <div v-if="showExportMenu" class="dropdown-menu">
                <button @click="handleExport('simple')">简化 JSON</button>
                <button @click="handleExport('markdown')">Markdown</button>
                <button @click="handleExport('full')">完整备份</button>
              </div>
            </div>
            <button @click="showImportModal = true" class="btn btn-secondary">导入</button>
            <button @click="openAddGroupModal" class="btn btn-primary">新建分组</button>
          </div>
        </div>

        <!-- 分组标签栏 -->
        <div class="tabs-container" v-if="sortedGroups.length > 0">
          <draggable v-model="sortedGroups" item-key="id" direction="horizontal" @end="onGroupDragEnd" class="tabs-list">
            <template #item="{ element: group }">
              <div class="tab-item" :class="{ active: activeGroupId === group.id }" @click="activeGroupId = group.id"
                :style="{ '--tab-color': group.color || '#3b82f6' }">
                <span class="tab-name">{{ group.name }}</span>
                <span class="tab-count">{{ group.items.length }}</span>
              </div>
            </template>
          </draggable>
        </div>

        <!-- 当前分组内容 -->
        <div v-if="activeGroup" class="group-content">
          <div class="group-toolbar">
            <div class="group-info">
              <span v-if="activeGroup.description" class="group-desc">{{ activeGroup.description }}</span>
            </div>
            <div class="group-actions">
              <button @click="openAddItemModal" class="btn btn-sm btn-primary">添加卡片</button>
              <button @click="openEditGroupModal(activeGroup)" class="btn btn-sm btn-secondary">编辑</button>
              <button @click="confirmDeleteGroup(activeGroup)" class="btn btn-sm btn-danger">删除</button>
            </div>
          </div>

          <draggable :list="activeGroup.items" item-key="id" @end="onItemDragEnd" class="cards-grid">
            <template #item="{ element: item }">
              <div class="note-card" @click="openDetailModal(item)">
                <div class="card-header">
                  <span class="card-title">{{ item.title }}</span>
                  <div class="card-actions" @click.stop>
                    <button @click="copyContent(item.content)" class="btn-icon" title="复制">📋</button>
                    <button @click="openEditItemModal(item)" class="btn-icon" title="编辑">✏️</button>
                    <button @click="confirmDeleteItem(item)" class="btn-icon" title="删除">🗑️</button>
                  </div>
                </div>
                <div class="card-preview"><pre>{{ getPreview(item.content) }}</pre></div>
              </div>
            </template>
          </draggable>

          <div v-if="activeGroup.items.length === 0" class="empty-cards">
            <p>暂无卡片</p>
            <button @click="openAddItemModal" class="btn btn-primary">添加第一个卡片</button>
          </div>
        </div>
        <div v-else class="empty-state"><p>暂无分组，点击"新建分组"开始创建</p></div>
      </template>
    </div>

    <!-- 卡片详情模态框 -->
    <div v-if="showDetailModal && detailItem" class="modal-overlay" @click="showDetailModal = false">
      <div class="modal modal-detail" @click.stop>
        <div class="detail-header">
          <h2>{{ detailItem.title }}</h2>
          <div class="detail-actions">
            <button @click="copyContent(detailItem.content)" class="btn btn-secondary">复制</button>
            <button @click="showDetailModal = false" class="btn-close">×</button>
          </div>
        </div>
        <div class="detail-content markdown-content" v-html="renderMarkdown(detailItem.content)"></div>
      </div>
    </div>

    <!-- 添加/编辑分组模态框 -->
    <div v-if="showGroupModal" class="modal-overlay" @click="closeGroupModal">
      <div class="modal" @click.stop>
        <h2>{{ editingGroup ? '编辑分组' : '新建分组' }}</h2>
        <form @submit.prevent="saveGroup">
          <div class="form-group">
            <label class="form-label">分组名称 *</label>
            <input v-model="groupForm.name" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">描述</label>
            <input v-model="groupForm.description" type="text" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">颜色</label>
            <div class="color-picker">
              <div v-for="color in presetColors" :key="color" class="color-option"
                :class="{ selected: groupForm.color === color }" :style="{ background: color }"
                @click="groupForm.color = color"></div>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeGroupModal" class="btn btn-secondary">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 添加/编辑卡片模态框 -->
    <div v-if="showItemModal" class="modal-overlay" @click="closeItemModal">
      <div class="modal modal-lg" @click.stop>
        <h2>{{ editingItem ? '编辑卡片' : '添加卡片' }}</h2>
        <form @submit.prevent="saveItem">
          <div class="form-group">
            <label class="form-label">标题 *</label>
            <input v-model="itemForm.title" type="text" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">内容 (支持 Markdown)</label>
            <div class="editor-container">
              <div class="editor-tabs">
                <button type="button" :class="{ active: editorTab === 'edit' }" @click="editorTab = 'edit'">编辑</button>
                <button type="button" :class="{ active: editorTab === 'preview' }" @click="editorTab = 'preview'">预览</button>
              </div>
              <textarea v-if="editorTab === 'edit'" v-model="itemForm.content" class="form-input content-textarea"
                rows="12" placeholder="支持 Markdown 语法..."></textarea>
              <div v-else class="preview-content markdown-content" v-html="renderMarkdown(itemForm.content)"></div>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeItemModal" class="btn btn-secondary">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">保存</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 导入模态框 -->
    <div v-if="showImportModal" class="modal-overlay" @click="showImportModal = false">
      <div class="modal" @click.stop>
        <h2>导入笔记</h2>
        <div class="form-group">
          <label class="form-label">选择文件 (JSON)</label>
          <input type="file" accept=".json" @change="handleFileSelect" class="form-input" />
        </div>
        <div v-if="importPreview" class="import-preview">
          <p>将导入 {{ importPreview.noteGroups.length }} 个分组</p>
          <div class="form-group">
            <label class="form-label">导入模式</label>
            <select v-model="importMode" class="form-input">
              <option value="merge">合并</option>
              <option value="replace">覆盖</option>
            </select>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" @click="showImportModal = false" class="btn btn-secondary">取消</button>
          <button @click="handleImport" class="btn btn-primary" :disabled="!importPreview || importing">
            {{ importing ? '导入中...' : '确认导入' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="toast.show" class="toast" :class="toast.type">{{ toast.message }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import draggable from 'vuedraggable'
import { marked } from 'marked'
import hljs from '../utils/highlight'
import 'highlight.js/styles/github-dark.css'
import Navbar from '../components/Navbar.vue'
import { useDataStore } from '../stores/data'
import { NoteGroup, NoteItem, FullExport } from '@shared/types'

const renderer = new marked.Renderer()
renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  if (lang && hljs.getLanguage(lang)) {
    return `<pre><code class="hljs language-${lang}">${hljs.highlight(text, { language: lang }).value}</code></pre>`
  }
  return `<pre><code class="hljs">${text}</code></pre>`
}
marked.setOptions({ renderer, breaks: true })

const dataStore = useDataStore()
const presetColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

const activeGroupId = ref<string | null>(null)
const showGroupModal = ref(false)
const showItemModal = ref(false)
const showDetailModal = ref(false)
const showImportModal = ref(false)
const showExportMenu = ref(false)
const saving = ref(false)
const importing = ref(false)
const editorTab = ref<'edit' | 'preview'>('edit')
const editingGroup = ref<NoteGroup | null>(null)
const editingItem = ref<NoteItem | null>(null)
const detailItem = ref<NoteItem | null>(null)
const importPreview = ref<FullExport | null>(null)
const importMode = ref<'merge' | 'replace'>('merge')
const searchQuery = ref('')

const toast = reactive({ show: false, message: '', type: 'success' })
const groupForm = reactive({ name: '', description: '', color: '#3b82f6' })
const itemForm = reactive({ title: '', content: '' })

const noteGroups = computed(() => dataStore.data?.noteGroups || [])
const sortedGroups = computed({
  get: () => [...noteGroups.value].sort((a, b) => a.order - b.order),
  set: () => {}
})
const activeGroup = computed(() => sortedGroups.value.find(g => g.id === activeGroupId.value) || null)

// 搜索结果
const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []
  const query = searchQuery.value.toLowerCase()
  const results: { item: NoteItem; groupName: string }[] = []
  for (const group of noteGroups.value) {
    for (const item of group.items) {
      if (item.title.toLowerCase().includes(query) || item.content.toLowerCase().includes(query)) {
        results.push({ item, groupName: group.name })
      }
    }
  }
  return results
})

const handleSearch = (query: string) => { searchQuery.value = query }

watch(sortedGroups, (groups) => {
  if (groups.length > 0 && !activeGroupId.value) activeGroupId.value = groups[0].id
}, { immediate: true })

const showToast = (message: string, type = 'success') => {
  toast.message = message; toast.type = type; toast.show = true
  setTimeout(() => { toast.show = false }, 2000)
}

const renderMarkdown = (content: string) => content ? marked(content) : ''
const getPreview = (content: string) => {
  const lines = content.split('\n').slice(0, 4).join('\n')
  return lines.length > 120 ? lines.slice(0, 120) + '...' : lines
}

const copyContent = async (content: string) => {
  try { await navigator.clipboard.writeText(content); showToast('已复制') }
  catch { showToast('复制失败', 'error') }
}

const openDetailModal = (item: NoteItem) => { detailItem.value = item; showDetailModal.value = true }
const closeDropdown = () => { showExportMenu.value = false }

// 分组操作
const openAddGroupModal = () => {
  editingGroup.value = null; groupForm.name = ''; groupForm.description = ''; groupForm.color = '#3b82f6'
  showGroupModal.value = true
}
const openEditGroupModal = (group: NoteGroup) => {
  editingGroup.value = group; groupForm.name = group.name
  groupForm.description = group.description || ''; groupForm.color = group.color || '#3b82f6'
  showGroupModal.value = true
}
const closeGroupModal = () => { showGroupModal.value = false; editingGroup.value = null }

const saveGroup = async () => {
  saving.value = true
  try {
    if (editingGroup.value) await dataStore.updateNoteGroup(editingGroup.value.id, { ...groupForm })
    else await dataStore.addNoteGroup({ ...groupForm, order: noteGroups.value.length })
    closeGroupModal()
  } finally { saving.value = false }
}

const confirmDeleteGroup = async (group: NoteGroup) => {
  if (confirm(`确定删除"${group.name}"及其所有卡片？`)) {
    await dataStore.deleteNoteGroup(group.id)
    if (activeGroupId.value === group.id) activeGroupId.value = sortedGroups.value[0]?.id || null
  }
}

const onGroupDragEnd = async () => {
  await dataStore.reorderNoteGroups(sortedGroups.value.map(g => g.id))
}

// 卡片操作
const openAddItemModal = () => {
  editingItem.value = null; itemForm.title = ''; itemForm.content = ''; editorTab.value = 'edit'
  showItemModal.value = true
}
const openEditItemModal = (item: NoteItem) => {
  editingItem.value = item; itemForm.title = item.title; itemForm.content = item.content; editorTab.value = 'edit'
  showItemModal.value = true
}
const closeItemModal = () => { showItemModal.value = false; editingItem.value = null }

const saveItem = async () => {
  if (!activeGroup.value) return
  saving.value = true
  try {
    if (editingItem.value) await dataStore.updateNoteItem(activeGroup.value.id, editingItem.value.id, { ...itemForm })
    else await dataStore.addNoteItem(activeGroup.value.id, { ...itemForm, order: activeGroup.value.items.length })
    closeItemModal()
  } finally { saving.value = false }
}

const confirmDeleteItem = async (item: NoteItem) => {
  if (!activeGroup.value) return
  if (confirm(`确定删除"${item.title}"？`)) await dataStore.deleteNoteItem(activeGroup.value.id, item.id)
}

const onItemDragEnd = async () => {
  if (!activeGroup.value) return
  await dataStore.reorderNoteItems(activeGroup.value.id, activeGroup.value.items.map(i => i.id))
}

// 导出
const handleExport = async (type: 'simple' | 'markdown' | 'full') => {
  showExportMenu.value = false
  let content: string, filename: string, mimeType: string
  const date = new Date().toISOString().slice(0, 10)
  
  if (type === 'simple') {
    const data = await dataStore.exportSimple()
    content = JSON.stringify(data, null, 2)
    filename = `notes-${date}.json`
    mimeType = 'application/json'
  } else if (type === 'markdown') {
    content = await dataStore.exportMarkdown()
    filename = `notes-${date}.md`
    mimeType = 'text/markdown'
  } else {
    const data = await dataStore.exportFull()
    content = JSON.stringify(data, null, 2)
    filename = `notes-backup-${date}.json`
    mimeType = 'application/json'
  }
  
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
  showToast('导出成功')
}

// 导入
const handleFileSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result as string)
      console.log('导入的原始数据:', data)
      
      if (data.noteGroups || data.snippetGroups) {
        // 完整备份格式
        if (data.snippetGroups && !data.noteGroups) data.noteGroups = data.snippetGroups
        
        // 确保 noteGroups 是数组且有内容
        if (Array.isArray(data.noteGroups) && data.noteGroups.length > 0) {
          // 确保每个分组都有 items 数组
          data.noteGroups = data.noteGroups.map((group: NoteGroup) => ({
            ...group,
            items: Array.isArray(group.items) ? group.items : []
          }))
          importPreview.value = data
          console.log('导入预览数据:', importPreview.value)
        } else {
          showToast('文件中没有笔记数据', 'error')
        }
      } else if (typeof data === 'object' && !Array.isArray(data)) {
        // 简化 JSON 格式: { "分组名": [{ title, content }] }
        const noteGroups: NoteGroup[] = []
        let order = 0
        for (const [groupName, items] of Object.entries(data)) {
          if (Array.isArray(items) && items.length > 0) {
            noteGroups.push({
              id: '', name: groupName, description: '', color: '#3b82f6', order: order++,
              items: items.map((item: { title?: string; content?: string }, idx: number) => ({
                id: '', title: item.title || '未命名', content: item.content || '', 
                order: idx, createdAt: '', updatedAt: ''
              })),
              createdAt: '', updatedAt: ''
            })
          }
        }
        if (noteGroups.length > 0) {
          importPreview.value = { version: '2.0', exportedAt: '', noteGroups }
          console.log('简化格式导入预览:', importPreview.value)
        } else {
          showToast('文件格式不正确或没有数据', 'error')
        }
      } else {
        showToast('文件格式不正确', 'error')
      }
    } catch (err) { 
      console.error('解析文件失败:', err)
      showToast('无法解析文件', 'error') 
    }
  }
  reader.readAsText(file)
}

const handleImport = async () => {
  if (!importPreview.value) {
    showToast('请先选择文件', 'error')
    return
  }
  
  console.log('开始导入，模式:', importMode.value, '数据:', importPreview.value)
  importing.value = true
  
  try {
    // 深拷贝数据，确保可以序列化
    const importData = JSON.parse(JSON.stringify(importPreview.value))
    console.log('序列化后的数据:', importData)
    
    const success = await dataStore.importFull(importData, importMode.value)
    console.log('导入结果:', success)
    
    if (success) {
      showImportModal.value = false
      importPreview.value = null
      
      // 重新加载数据
      await dataStore.loadData()
      
      // 更新活动分组
      if (sortedGroups.value.length > 0 && !activeGroupId.value) {
        activeGroupId.value = sortedGroups.value[0].id
      }
      
      showToast('导入成功')
    } else {
      showToast('导入失败，请检查文件格式', 'error')
    }
  } catch (err) {
    console.error('导入异常:', err)
    showToast('导入失败: ' + (err as Error).message, 'error')
  } finally {
    importing.value = false
  }
}

onMounted(() => { dataStore.loadData() })
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h1 { color: var(--text-primary); }
.header-actions { display: flex; gap: 8px; }

.search-results { margin-bottom: 20px; }
.search-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.search-header h2 { margin: 0; color: var(--text-primary); font-size: 18px; }
.result-count { color: var(--text-secondary); font-size: 14px; }
.card-group { font-size: 12px; color: var(--text-tertiary); background: var(--bg-tertiary); padding: 2px 8px; border-radius: 4px; }

.export-dropdown { position: relative; }
.dropdown-menu {
  position: absolute; top: 100%; right: 0; margin-top: 4px;
  background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 100; min-width: 140px;
}
.dropdown-menu button {
  display: block; width: 100%; padding: 10px 16px; border: none;
  background: none; text-align: left; cursor: pointer; font-size: 14px; color: var(--text-primary);
}
.dropdown-menu button:hover { background: var(--bg-secondary); }

.tabs-container { background: var(--bg-secondary); border-radius: 8px; padding: 8px; margin-bottom: 16px; }
.tabs-list { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
.tab-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 16px;
  background: var(--bg-primary); border-radius: 6px; cursor: pointer;
  border: 2px solid transparent; transition: all 0.2s; white-space: nowrap; color: var(--text-primary);
}
.tab-item:hover { border-color: var(--tab-color); }
.tab-item.active { background: var(--tab-color); color: white; }
.tab-name { font-weight: 500; }
.tab-count { font-size: 12px; padding: 2px 6px; background: rgba(0,0,0,0.1); border-radius: 10px; }
.tab-item.active .tab-count { background: rgba(255,255,255,0.3); }

.group-content { background: var(--bg-primary); border-radius: 8px; padding: 16px; box-shadow: var(--card-shadow); }
.group-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color); }
.group-desc { color: var(--text-secondary); font-size: 14px; }
.group-actions { display: flex; gap: 8px; }

.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.note-card { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; cursor: pointer; transition: all 0.2s; overflow: hidden; }
.note-card:hover { border-color: var(--primary-color); box-shadow: 0 4px 12px rgba(59,130,246,0.15); transform: translateY(-2px); }
.card-header { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-primary); border-bottom: 1px solid var(--border-color); }
.card-title { font-weight: 600; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.card-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; }
.note-card:hover .card-actions { opacity: 1; }
.btn-icon { background: none; border: none; cursor: pointer; padding: 4px 6px; border-radius: 4px; font-size: 14px; }
.btn-icon:hover { background: var(--bg-tertiary); }
.card-preview { padding: 12px; max-height: 100px; overflow: hidden; }
.card-preview pre { margin: 0; font-size: 12px; color: var(--text-secondary); font-family: 'Consolas', monospace; white-space: pre-wrap; word-break: break-all; }

.empty-cards { text-align: center; padding: 40px; color: var(--text-secondary); }
.empty-state { text-align: center; padding: 60px 20px; background: var(--bg-primary); border-radius: 8px; color: var(--text-secondary); }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--modal-overlay); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal { background: var(--bg-primary); color: var(--text-primary); padding: 24px; border-radius: 12px; width: 90%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
.modal-lg { max-width: 700px; }
.modal-detail { max-width: 800px; }
.modal h2 { margin: 0 0 20px; }

.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color); }
.detail-header h2 { margin: 0; }
.detail-actions { display: flex; gap: 8px; align-items: center; }
.btn-close { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary); padding: 0 8px; }
.detail-content { max-height: 60vh; overflow-y: auto; }

.color-picker { display: flex; gap: 8px; flex-wrap: wrap; }
.color-option { width: 32px; height: 32px; border-radius: 6px; cursor: pointer; border: 3px solid transparent; transition: transform 0.2s; }
.color-option:hover { transform: scale(1.1); }
.color-option.selected { border-color: var(--text-primary); }

.editor-container { border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; }
.editor-tabs { display: flex; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); }
.editor-tabs button { padding: 8px 16px; border: none; background: none; cursor: pointer; font-size: 14px; color: var(--text-secondary); }
.editor-tabs button.active { background: var(--bg-primary); color: var(--text-primary); font-weight: 500; }
.content-textarea { border: none; border-radius: 0; font-family: 'Consolas', monospace; resize: vertical; min-height: 250px; background: var(--bg-primary); color: var(--text-primary); }
.content-textarea:focus { box-shadow: none; }
.preview-content { padding: 12px; min-height: 250px; max-height: 300px; overflow-y: auto; background: var(--bg-secondary); }

.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px; }
.import-preview { margin: 16px 0; padding: 12px; background: var(--bg-secondary); border-radius: 6px; }

.markdown-content { line-height: 1.7; color: var(--text-primary); }
.markdown-content :deep(pre) { background: #1e293b; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 12px 0; }
.markdown-content :deep(code) { font-family: 'Consolas', monospace; font-size: 14px; }
.markdown-content :deep(p code) { background: var(--bg-tertiary); padding: 2px 6px; border-radius: 4px; color: #e11d48; }
.markdown-content :deep(p) { margin: 0 0 12px; }

.btn-sm { padding: 6px 12px; font-size: 13px; }

.toast { position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 8px; color: white; font-weight: 500; z-index: 2000; animation: slideUp 0.3s ease; }
.toast.success { background: var(--success-color); }
.toast.error { background: var(--danger-color); }
@keyframes slideUp { from { opacity: 0; transform: translateX(-50%) translateY(20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
</style>
