<script setup lang="ts">
import { h, ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { LogoutOutlined } from '@ant-design/icons-vue'
import { userLogout } from '@/api/userController.ts'
import { message, type MenuProps } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()
const loginUserStore = useLoginUserStore()

type MenuItem = {
  key: string
  label: string
  path?: string
  children?: MenuItem[]
}

// 全局菜单项
const originItems = ref<MenuItem[]>([
  { key: '/home', label: '首页', path: '/' },
  { key: '/admin/userManage', label: '用户管理', path: '/admin/userManage' },
])

// 过滤菜单项 - 根据用户权限显示菜单
const filterMenus = (menus: MenuItem[] = []) => {
  return menus.filter((menu) => {
    // 检查菜单是否需要管理员权限
    if (menu.key?.startsWith('/admin')) {
      const loginUser = loginUserStore.loginUser
      // 只有管理员才能看到管理菜单
      return loginUser?.userRole === 'admin'
    }
    // 其他菜单项默认显示
    return true
  })
}

// 过滤后的菜单项
const menuItems = computed(() => filterMenus(originItems.value))

// Get current selected key based on route
const selectedKeys = computed(() => {
  const currentPath = route.path
  const currentItem = menuItems.value.find((item) => item.path === currentPath)
  return currentItem ? [currentItem.key] : []
})

const onMenuClick = ({ key }: { key: string }) => {
  const target = menuItems.value.find((i) => i.key === key)
  if (target?.path) router.push(target.path)
}

// 用户注销
const doLogout = async () => {
  const res = await userLogout()
  if (res.data.code === 0) {
    loginUserStore.setLoginUser({
      userName: '未登录',
    })
    message.success('退出登录成功')
    await router.push('/user/login')
  } else {
    message.error('退出登录失败，' + res.data.message)
  }
}
</script>

<template>
  <div
    style="
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 0 16px;
      background: #fff;
      border-bottom: 1px solid #f0f0f0;
    "
  >
    <div style="display: flex; align-items: center; gap: 8px; min-width: 160px">
      <img src="@/assets/image.png" alt="logo" style="width: 32px; height: 32px" />
      <span style="font-weight: 600; color: #333; white-space: nowrap">AI代码生成大师</span>
    </div>

    <div style="flex: 1; min-width: 0">
      <a-menu
        theme="light"
        mode="horizontal"
        :items="menuItems.map((i) => ({ key: i.key, label: i.label }))"
        :selected-keys="selectedKeys"
        @click="onMenuClick"
      />
    </div>

    <div class="user-login-status">
      <div v-if="loginUserStore.loginUser.id">
        <a-dropdown>
          <a-space>
            <a-avatar :src="loginUserStore.loginUser.userAvatar" />
            {{ loginUserStore.loginUser.userName ?? '无名' }}
          </a-space>
          <template #overlay>
            <a-menu>
              <a-menu-item @click="doLogout">
                <LogoutOutlined />
                退出登录
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>

      <div v-else>
        <a-button type="primary" href="/user/login">登录</a-button>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
