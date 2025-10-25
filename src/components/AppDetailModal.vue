<template>
  <a-modal v-model:open="visible" title="应用详情" :footer="null" width="600px">
    <div class="app-detail-content">
      <!-- 应用基础信息 -->
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="应用名称">
          {{ app?.appName || '未命名应用' }}
        </a-descriptions-item>
        <a-descriptions-item label="创建者">
          <UserInfo :user="app?.user" size="small" />
        </a-descriptions-item>
        <a-descriptions-item label="生成类型">
          {{ formatCodeGenType(app?.codeGenType) }}
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
          {{ formatTime(app?.createTime) }}
        </a-descriptions-item>
        <a-descriptions-item label="更新时间">
          {{ formatTime(app?.updateTime) }}
        </a-descriptions-item>
        <a-descriptions-item label="部署时间" :span="2">
          {{ app?.deployedTime ? formatTime(app.deployedTime) : '未部署' }}
        </a-descriptions-item>
        <a-descriptions-item label="初始提示词" :span="2">
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
import { computed } from 'vue'
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

const handleEdit = () => {
  emit('edit')
}

const handleDelete = () => {
  emit('delete')
}
</script>

<style scoped>
.app-detail-content {
  padding: 16px 0;
}

.app-actions {
  margin-top: 24px;
  text-align: center;
}

.prompt-text {
  max-width: 100%;
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.5;
}
</style>
