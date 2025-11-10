<template>
  <a-modal
    v-model:open="visible"
    title="应用详情"
    :footer="null"
    :width="modalWidth"
    :centered="true"
    :destroy-on-close="true"
    class="app-detail-modal"
  >
    <div class="app-detail-content">
      <!-- 应用基础信息 -->
      <a-descriptions :column="descriptionsColumn" bordered>
        <a-descriptions-item label="应用名称">
          <div class="text-content">{{ app?.appName || '未命名应用' }}</div>
        </a-descriptions-item>
        <a-descriptions-item label="创建者">
          <UserInfo :user="app?.user" size="small" />
        </a-descriptions-item>
        <a-descriptions-item label="生成类型">
          <a-tag color="blue" class="code-gen-type-tag">
            {{ formatCodeGenType(app?.codeGenType) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="公开范围">
          <StatusTag type="isPublic" :value="app?.isPublic" />
        </a-descriptions-item>
        <a-descriptions-item label="优先级">
          <StatusTag type="priority" :value="app?.priority" />
        </a-descriptions-item>
        <a-descriptions-item label="部署状态">
          <StatusTag type="deployed" :value="!!app?.deployKey" />
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">
          <div class="text-content">{{ formatTime(app?.createTime) }}</div>
        </a-descriptions-item>
        <a-descriptions-item label="更新时间">
          <div class="text-content">{{ formatTime(app?.updateTime) }}</div>
        </a-descriptions-item>
        <a-descriptions-item label="部署时间" :span="descriptionsColumn">
          <div class="text-content">
            {{ app?.deployedTime ? formatTime(app.deployedTime) : '未部署' }}
          </div>
        </a-descriptions-item>
        <a-descriptions-item label="初始提示词" :span="descriptionsColumn">
          <div class="prompt-text">{{ app?.initPrompt || '无' }}</div>
        </a-descriptions-item>
      </a-descriptions>

      <!-- 操作栏（仅本人或管理员可见） -->
      <div v-if="showActions" class="app-actions">
        <a-space>
          <a-button type="primary" @click="handleEdit">
            <template #icon>
              <EditOutlined />
            </template>
            修改
          </a-button>
          <a-popconfirm
            title="确定要删除这个应用吗？"
            @confirm="handleDelete"
            ok-text="确定"
            cancel-text="取消"
          >
            <a-button danger>
              <template #icon>
                <DeleteOutlined />
              </template>
              删除
            </a-button>
          </a-popconfirm>
        </a-space>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import UserInfo from './UserInfo.vue'
import StatusTag from './StatusTag.vue'
import { formatTime } from '@/utils/time'
import { formatCodeGenType } from '@/utils/codeGenTypes'

interface Props {
  open: boolean
  app?: API.AppVO
  showActions?: boolean
}

interface Emits {
  (e: 'update:open', value: boolean): void
  (e: 'edit'): void
  (e: 'delete'): void
}

const props = withDefaults(defineProps<Props>(), {
  showActions: false,
})

const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

// 响应式弹框宽度
const modalWidth = ref('800px')

// 响应式描述列表列数
const descriptionsColumn = ref(2)

// 监听窗口大小变化
const updateModalSize = () => {
  const width = window.innerWidth

  if (width < 768) {
    // 手机端
    modalWidth.value = '95vw'
    descriptionsColumn.value = 1
  } else if (width < 1024) {
    // 平板端
    modalWidth.value = '90vw'
    descriptionsColumn.value = 1
  } else if (width < 1440) {
    // 小屏桌面
    modalWidth.value = '800px'
    descriptionsColumn.value = 2
  } else {
    // 大屏桌面
    modalWidth.value = '1000px'
    descriptionsColumn.value = 3
  }
}

onMounted(() => {
  updateModalSize()
  window.addEventListener('resize', updateModalSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateModalSize)
})

const handleEdit = () => {
  emit('edit')
}

const handleDelete = () => {
  emit('delete')
}
</script>

<style scoped>
.app-detail-modal :deep(.ant-modal) {
  max-width: 95vw;
  margin: 0 auto;
}

.app-detail-modal :deep(.ant-modal-content) {
  border-radius: 12px;
  overflow: hidden;
}

.app-detail-content {
  padding: 16px 0;
  max-height: 80vh;
  overflow-y: auto;
}

.app-actions {
  margin-top: 24px;
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 文字内容样式 - 防止换行 */
.text-content {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  display: inline-block;
}

/* 提示词文本样式 - 允许换行但限制高度 */
.prompt-text {
  max-width: 100%;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.5;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  font-size: 14px;
}

/* 描述列表样式优化 */
.app-detail-content :deep(.ant-descriptions) {
  margin-bottom: 0;
}

.app-detail-content :deep(.ant-descriptions-item-label) {
  font-weight: 600;
  color: #262626;
  background: #fafafa;
  width: 120px;
  min-width: 120px;
}

.app-detail-content :deep(.ant-descriptions-item-content) {
  color: #595959;
  padding: 12px 16px;
}

/* 响应式优化 */
@media (max-width: 768px) {
  .app-detail-content {
    padding: 12px 0;
    max-height: 70vh;
  }

  .app-detail-content :deep(.ant-descriptions-item-label) {
    width: 100px;
    min-width: 100px;
    font-size: 13px;
  }

  .app-detail-content :deep(.ant-descriptions-item-content) {
    padding: 8px 12px;
    font-size: 13px;
  }

  .text-content {
    font-size: 13px;
  }

  .prompt-text {
    font-size: 13px;
    max-height: 150px;
  }
}

@media (max-width: 480px) {
  .app-detail-content :deep(.ant-descriptions-item-label) {
    width: 80px;
    min-width: 80px;
    font-size: 12px;
  }

  .app-detail-content :deep(.ant-descriptions-item-content) {
    padding: 6px 8px;
    font-size: 12px;
  }

  .text-content {
    font-size: 12px;
  }

  .prompt-text {
    font-size: 12px;
    max-height: 120px;
  }
}

/* 大屏幕优化 */
@media (min-width: 1440px) {
  .app-detail-content {
    max-height: 85vh;
  }

  .app-detail-content :deep(.ant-descriptions-item-label) {
    width: 140px;
    min-width: 140px;
  }

  .prompt-text {
    max-height: 300px;
  }
}
</style>
