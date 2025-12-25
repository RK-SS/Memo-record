<template>
  <div>
    <Navbar />
    <div class="container">
      <div class="welcome">
        <h1>👋 欢迎回来</h1>
        <p>你的个人笔记本</p>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📁</div>
          <div class="stat-info">
            <div class="stat-number">{{ groupCount }}</div>
            <div class="stat-label">分组</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-info">
            <div class="stat-number">{{ noteCount }}</div>
            <div class="stat-label">笔记</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💾</div>
          <div class="stat-info">
            <div class="stat-number">{{ backupCount }}</div>
            <div class="stat-label">备份</div>
          </div>
        </div>
      </div>

      <!-- 快速操作 -->
      <div class="quick-actions">
        <router-link to="/notes" class="action-card">
          <span class="action-icon">✏️</span>
          <span class="action-text">写笔记</span>
        </router-link>
        <router-link to="/settings" class="action-card">
          <span class="action-icon">⚙️</span>
          <span class="action-text">设置</span>
        </router-link>
        <button @click="createBackup" class="action-card" :disabled="backingUp">
          <span class="action-icon">📦</span>
          <span class="action-text">{{
            backingUp ? "备份中..." : "立即备份"
          }}</span>
        </button>
      </div>

      <!-- 最近笔记 -->
      <div class="recent-section" v-if="recentNotes.length > 0">
        <h2>最近编辑</h2>
        <div class="recent-list">
          <div
            v-for="note in recentNotes"
            :key="note.id"
            class="recent-item"
            @click="goToNotes"
          >
            <div class="recent-title">{{ note.title }}</div>
            <div class="recent-group">{{ note.groupName }}</div>
            <div class="recent-time">{{ formatTime(note.updatedAt) }}</div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <p>还没有笔记，开始创建吧！</p>
        <router-link to="/notes" class="btn btn-primary">创建笔记</router-link>
      </div>
    </div>

    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import Navbar from "../components/Navbar.vue";
import { useDataStore } from "../stores/data";

const router = useRouter();
const dataStore = useDataStore();
const backingUp = ref(false);
const backupCount = ref(0);
const toast = reactive({ show: false, message: "", type: "success" });

const showToast = (message: string, type = "success") => {
  toast.message = message;
  toast.type = type;
  toast.show = true;
  setTimeout(() => {
    toast.show = false;
  }, 2000);
};

const noteGroups = computed(() => dataStore.data?.noteGroups || []);
const groupCount = computed(() => noteGroups.value.length);
const noteCount = computed(() =>
  noteGroups.value.reduce((sum, g) => sum + g.items.length, 0)
);

const recentNotes = computed(() => {
  const notes: Array<{
    id: string;
    title: string;
    groupName: string;
    updatedAt: string;
  }> = [];
  for (const group of noteGroups.value) {
    for (const item of group.items) {
      notes.push({
        id: item.id,
        title: item.title,
        groupName: group.name,
        updatedAt: item.updatedAt,
      });
    }
  }
  return notes
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);
});

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return date.toLocaleDateString("zh-CN");
};

const createBackup = async () => {
  backingUp.value = true;
  try {
    const path = await dataStore.manualBackup();
    if (path) {
      showToast("备份成功");
      backupCount.value = (await dataStore.listBackups()).length;
    } else {
      showToast("备份失败", "error");
    }
  } finally {
    backingUp.value = false;
  }
};

const goToNotes = () => router.push("/notes");

onMounted(async () => {
  await dataStore.loadData();
  backupCount.value = (await dataStore.listBackups()).length;
});
</script>

<style scoped>
.welcome {
  margin-bottom: 32px;
}
.welcome h1 {
  margin: 0 0 8px;
  font-size: 28px;
  color: var(--text-primary);
}
.welcome p {
  margin: 0;
  color: var(--text-secondary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-left: 33%;
}
.stat-icon {
  font-size: 32px;
}
.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}
.stat-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}
.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--bg-primary);
  border-radius: 12px;
  border: 2px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  color: inherit;
}
.action-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
}
.action-card:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.action-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
.action-text {
  font-weight: 500;
  color: var(--text-primary);
}

.recent-section {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--card-shadow);
}
.recent-section h2 {
  margin: 0 0 16px;
  font-size: 18px;
  color: var(--text-primary);
}
.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.recent-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}
.recent-item:hover {
  background: var(--bg-secondary);
}
.recent-title {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary);
}
.recent-group {
  padding: 2px 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-right: 12px;
}
.recent-time {
  font-size: 13px;
  color: var(--text-tertiary);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--bg-primary);
  border-radius: 12px;
}
.empty-state p {
  margin-bottom: 16px;
  color: var(--text-secondary);
}

.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 2000;
}
.toast.success {
  background: var(--success-color);
}
.toast.error {
  background: var(--danger-color);
}
</style>
