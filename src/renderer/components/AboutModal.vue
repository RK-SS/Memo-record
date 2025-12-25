<template>
  <div v-if="visible" class="modal-overlay" @click="$emit('close')">
    <div class="modal about-modal" @click.stop>
      <button class="btn-close" @click="$emit('close')">×</button>
      
      <div class="about-header">
        <div class="app-icon">📝</div>
        <h1>备忘记事录</h1>
        <p class="version">v{{ version }}</p>
      </div>

      <p class="description">一个简洁高效的笔记管理工具，支持分组管理、Markdown 渲染、数据备份等功能。</p>

      <div class="author-section">
        <h3>开发者</h3>
        <div class="author-info">
          <p><strong>作者：</strong>R.K</p>
          <p><strong>邮箱：</strong><a href="mailto:rkss1900@163.com">rkss1900@163.com</a></p>
          <p><strong>GitHub：</strong><a href="https://github.com/RK-SS" target="_blank">github.com/RK-SS</a></p>
        </div>
      </div>

      <div class="donate-section">
        <h3>支持作者 ☕</h3>
        <p>如果这个软件对你有帮助，欢迎请作者喝杯咖啡~</p>
        <div class="qrcode">
          <img src="/qrcode.png" alt="打赏二维码" />
        </div>
      </div>

      <div class="footer">
        <p>© 2025 R.K. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ visible: boolean }>()
defineEmits<{ close: [] }>()

const version = '1.0.0'
</script>

<style scoped>
.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5); display: flex;
  justify-content: center; align-items: center; z-index: 2000;
}

.about-modal {
  background: var(--bg-primary); color: var(--text-primary);
  padding: 32px; border-radius: 16px; width: 90%; max-width: 420px;
  max-height: 90vh; overflow-y: auto; position: relative;
  text-align: center;
}

.btn-close {
  position: absolute; top: 12px; right: 12px;
  background: none; border: none; font-size: 24px;
  cursor: pointer; color: var(--text-secondary); padding: 4px 8px;
}
.btn-close:hover { color: var(--text-primary); }

.about-header { margin-bottom: 20px; }
.app-icon { font-size: 64px; margin-bottom: 8px; }
.about-header h1 { margin: 0; font-size: 24px; color: var(--text-primary); }
.version { color: var(--text-secondary); margin: 4px 0 0; }

.description {
  color: var(--text-secondary); font-size: 14px;
  line-height: 1.6; margin-bottom: 24px; padding: 0 10px;
}

.author-section, .donate-section {
  background: var(--bg-secondary); border-radius: 12px;
  padding: 16px; margin-bottom: 16px; text-align: left;
}

.author-section h3, .donate-section h3 {
  margin: 0 0 12px; font-size: 15px; color: var(--text-primary);
}

.author-info p { margin: 6px 0; font-size: 14px; color: var(--text-secondary); }
.author-info a { color: #3b82f6; text-decoration: none; }
.author-info a:hover { text-decoration: underline; }

.donate-section { text-align: center; }
.donate-section p { font-size: 13px; color: var(--text-secondary); margin-bottom: 12px; }

.qrcode { display: flex; justify-content: center; gap: 16px; }
.qrcode img { width: 150px; height: 150px; border-radius: 8px; border: 1px solid var(--border-color); }

.footer { margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color); }
.footer p { margin: 0; font-size: 12px; color: var(--text-tertiary); }
</style>
