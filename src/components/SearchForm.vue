<template>
  <div class="search-form">
    <a-form layout="inline" :model="searchParams" @finish="handleSearch">
      <slot />
      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>
    <a-divider />
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'

interface Props {
  modelValue: Record<string, any>
}

interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
  (e: 'search'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const searchParams = reactive({ ...props.modelValue })

const handleSearch = () => {
  emit('update:modelValue', { ...searchParams })
  emit('search')
}
</script>

<style scoped>
.search-form {
  margin-bottom: 16px;
}
</style>
