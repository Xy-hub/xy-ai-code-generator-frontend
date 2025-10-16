<script setup lang="ts">
import { h, ref } from 'vue'
import { useRouter } from 'vue-router'

type MenuItem = {
  key: string
  label: string
  path?: string
  children?: MenuItem[]
}

const router = useRouter()

// Basic configurable menu
const menuItems = ref<MenuItem[]>([
  { key: 'home', label: '首页', path: '/' },
  { key: 'about', label: '关于', path: '/about' },
])

const onMenuClick = ({ key }: { key: string }) => {
  const target = menuItems.value.find(i => i.key === key)
  if (target?.path) router.push(target.path)
}
</script>

<template>
  <div style="display:flex; align-items:center; gap:16px; padding: 0 16px;">
    <div style="display:flex; align-items:center; gap:8px; min-width: 160px;">
      <img src="@/assets/image.png" alt="logo" style="width:32px; height:32px;" />
      <span style="font-weight:600; color:#fff; white-space:nowrap;">AI代码生成大师</span>
    </div>

    <div style="flex:1; min-width:0;">
      <a-menu
        theme="dark"
        mode="horizontal"
        :items="menuItems.map(i => ({ key: i.key, label: i.label }))"
        @click="onMenuClick"
      />
    </div>

    <div style="display:flex; align-items:center; gap:12px;">
      <a-button type="primary">登录</a-button>
    </div>
  </div>
</template>

<style scoped>
</style>


