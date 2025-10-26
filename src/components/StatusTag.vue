<template>
  <a-tag :color="tagColor">{{ tagText }}</a-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type: 'priority' | 'isPublic' | 'deployed' | 'userRole' | 'messageType' | 'isDelete'
  value: number | string | boolean | undefined
}

const props = defineProps<Props>()

const tagConfig = computed(() => {
  switch (props.type) {
    case 'priority':
      return {
        color: props.value === 99 ? 'gold' : 'default',
        text: props.value === 99 ? '精选' : props.value || 0,
      }
    case 'isPublic':
      return {
        color: props.value === 1 ? 'green' : 'default',
        text: props.value === 1 ? '公开' : '私有',
      }
    case 'deployed':
      return {
        color: props.value ? 'green' : 'default',
        text: props.value ? '已部署' : '未部署',
      }
    case 'userRole':
      return {
        color: props.value === 'admin' ? 'red' : 'blue',
        text: props.value === 'admin' ? '管理员' : '普通用户',
      }
    case 'messageType':
      return {
        color: props.value === 'user' ? 'blue' : 'green',
        text: props.value === 'user' ? '用户消息' : 'AI消息',
      }
    case 'isDelete':
      return {
        color: props.value === 1 ? 'red' : 'green',
        text: props.value === 1 ? '已删除' : '正常',
      }
    default:
      return {
        color: 'default',
        text: props.value || '',
      }
  }
})

const tagColor = computed(() => tagConfig.value.color)
const tagText = computed(() => tagConfig.value.text)
</script>
