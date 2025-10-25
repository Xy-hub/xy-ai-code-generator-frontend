<template>
  <div id="userSettingsPage">
    <a-card title="个人设置" :bordered="false">
      <a-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 16 }"
        @finish="handleSubmit"
      >
        <a-form-item label="用户名" name="userName">
          <a-input v-model:value="formData.userName" placeholder="请输入用户名" />
        </a-form-item>

        <a-form-item label="用户头像" name="userAvatar">
          <a-input v-model:value="formData.userAvatar" placeholder="请输入头像URL" />
        </a-form-item>

        <a-form-item label="个人简介" name="userProfile">
          <a-textarea
            v-model:value="formData.userProfile"
            placeholder="请输入个人简介"
            :rows="4"
            :maxlength="200"
            show-count
          />
        </a-form-item>

        <a-form-item :wrapper-col="{ offset: 4, span: 16 }">
          <a-button type="primary" html-type="submit" :loading="loading"> 保存设置 </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { updateUser, getLoginUser } from '@/api/userController'
import { useLoginUserStore } from '@/stores/loginUser'
import type { FormInstance } from 'ant-design-vue'

const router = useRouter()
const loginUserStore = useLoginUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

// 表单数据
const formData = reactive({
  id: 0,
  userName: '',
  userAvatar: '',
  userProfile: '',
})

// 表单验证规则
const rules = {
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' },
  ],
}

// 获取当前用户信息
const fetchUserInfo = async () => {
  // 优先使用store中的数据
  const storeUser = loginUserStore.loginUser
  if (storeUser && storeUser.id) {
    formData.id = storeUser.id
    formData.userName = storeUser.userName || ''
    formData.userAvatar = storeUser.userAvatar || ''
    formData.userProfile = storeUser.userProfile || ''
    return
  }

  // 如果store中没有数据，则从API获取
  try {
    const res = await getLoginUser()
    if (res.data.code === 0 && res.data.data) {
      const user = res.data.data
      formData.id = user.id || 0
      formData.userName = user.userName || ''
      formData.userAvatar = user.userAvatar || ''
      formData.userProfile = user.userProfile || ''

      // 同时更新store
      loginUserStore.setLoginUser(user)
    } else {
      message.error('获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息失败：', error)
    message.error('获取用户信息失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value?.validate()
    loading.value = true

    const res = await updateUser({
      id: formData.id,
      userName: formData.userName,
      userAvatar: formData.userAvatar,
      userProfile: formData.userProfile,
    })

    if (res.data.code === 0) {
      message.success('保存成功')
      // 更新store中的用户信息
      loginUserStore.setLoginUser({
        ...loginUserStore.loginUser,
        userName: formData.userName,
        userAvatar: formData.userAvatar,
        userProfile: formData.userProfile,
      })
    } else {
      message.error('保存失败：' + res.data.message)
    }
  } catch (error) {
    console.error('保存失败：', error)
    message.error('保存失败')
  } finally {
    loading.value = false
  }
}

// 页面加载时获取用户信息
onMounted(() => {
  fetchUserInfo()
})
</script>

<style scoped>
#userSettingsPage {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
}

:deep(.ant-card-head-title) {
  font-size: 18px;
  font-weight: 600;
}
</style>
