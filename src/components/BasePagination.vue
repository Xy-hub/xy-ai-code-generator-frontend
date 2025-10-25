<template>
  <div class="pagination-wrapper">
    <a-pagination
      v-model:current="currentPage"
      v-model:page-size="pageSize"
      :total="total"
      :show-size-changer="showSizeChanger"
      :show-total="showTotal"
      @change="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  current: number
  pageSize: number
  total: number
  showSizeChanger?: boolean
  showTotal?: (total: number) => string
}

interface Emits {
  (e: 'update:current', value: number): void
  (e: 'update:pageSize', value: number): void
  (e: 'change', page: { current: number; pageSize: number }): void
}

const props = withDefaults(defineProps<Props>(), {
  showSizeChanger: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

const emit = defineEmits<Emits>()

const currentPage = computed({
  get: () => props.current,
  set: (value) => emit('update:current', value),
})

const pageSize = computed({
  get: () => props.pageSize,
  set: (value) => emit('update:pageSize', value),
})

const handleChange = (page: number, size: number) => {
  emit('change', { current: page, pageSize: size })
}
</script>

<style scoped>
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
