<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLoginUserStore } from '@/stores/loginUser.ts'
import { LogoutOutlined, EditOutlined } from '@ant-design/icons-vue'
import { userLogout, updateUser, getUserVoById } from '@/api/userController.ts'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'

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
// 编辑用户信息相关状态
const editModalVisible = ref(false)
const editFormRef = ref<FormInstance>()
const editForm = reactive<API.UserUpdateRequest>({
  id: undefined,
  userName: '',
  userAvatar: '',
  userProfile: '',
  userRole: 'user',
})

// 编辑表单验证规则
const editRules = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  userAvatar: [{ type: 'url', message: '请输入有效的头像URL', trigger: 'blur' }],
}

// 打开编辑弹窗
const openEditModal = async () => {
  try {
    // 获取当前用户信息
    const res = await getUserVoById({ id: loginUserStore.loginUser.id! })
    if (res.data.data) {
      Object.assign(editForm, {
        id: res.data.data.id,
        userName: res.data.data.userName,
        userAvatar: res.data.data.userAvatar,
        userProfile: res.data.data.userProfile,
        userRole: res.data.data.userRole,
      })
      editModalVisible.value = true
    } else {
      message.error('获取用户信息失败')
    }
  } catch (error) {
    message.error('获取用户信息失败')
  }
}

// 确认编辑
const handleEditOk = async () => {
  try {
    await editFormRef.value?.validate()
    const res = await updateUser(editForm)
    if (res.data.code === 0) {
      message.success('编辑成功')
      editModalVisible.value = false
      // 更新本地用户信息
      loginUserStore.setLoginUser({
        ...loginUserStore.loginUser,
        userName: editForm.userName,
        userAvatar: editForm.userAvatar,
        userProfile: editForm.userProfile,
        userRole: editForm.userRole,
      })
    } else {
      message.error('编辑失败，' + res.data.message)
    }
  } catch (error) {
    console.error('编辑用户失败:', error)
  }
}

// 取消编辑
const handleEditCancel = () => {
  editModalVisible.value = false
  editFormRef.value?.resetFields()
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
            <a-menu style="min-width: 120px">
              <a-menu-item @click="openEditModal" style="white-space: nowrap">
                <EditOutlined />
                编辑信息
              </a-menu-item>
              <a-menu-item @click="doLogout" style="white-space: nowrap">
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
    <!-- 编辑用户信息弹窗 -->
    <a-modal
      v-model:open="editModalVisible"
      title="编辑个人信息"
      :width="500"
      @ok="handleEditOk"
      @cancel="handleEditCancel"
    >
      <a-form
        :model="editForm"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
        :rules="editRules"
        ref="editFormRef"
      >
        <a-form-item label="用户名" name="userName">
          <a-input v-model:value="editForm.userName" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item label="头像" name="userAvatar">
          <a-input v-model:value="editForm.userAvatar" placeholder="请输入头像URL" />
        </a-form-item>
        <a-form-item label="简介" name="userProfile">
          <a-textarea v-model:value="editForm.userProfile" placeholder="请输入个人简介" :rows="3" />
        </a-form-item>
        <a-form-item label="用户角色" name="userRole">
          <a-select v-model:value="editForm.userRole" disabled>
            <a-select-option value="user">普通用户</a-select-option>
            <a-select-option value="admin">管理员</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<style scoped></style>
