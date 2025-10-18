<template>
  <div id="userNotAuthPage">
    <div class="error-icon">
      <a-icon name="exclamation-circle" :size="64" />
    </div>
    <h2 class="title">访问受限</h2>
    <div class="desc">抱歉，您没有权限访问此页面</div>
    <div class="tips">
      请联系管理员获取相应权限，或返回
      <RouterLink to="/">首页</RouterLink>
    </div>
    <div class="actions">
      <a-button type="primary" @click="goBack">返回上页</a-button>
      <a-button @click="goHome">返回首页</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// 返回上一页
const goBack = () => {
  router.go(-1)
}

// 返回首页
const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
#userNotAuthPage {
  max-width: 400px;
  margin: 0 auto;
  text-align: center;
  padding: 60px 20px;
}

.error-icon {
  margin-bottom: 24px;
  color: #ff4d4f;
}

.title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
}

.desc {
  font-size: 16px;
  color: #666;
  margin-bottom: 24px;
  line-height: 1.5;
}

.tips {
  margin-bottom: 32px;
  color: #999;
  font-size: 14px;
}

.tips a {
  color: #1890ff;
  text-decoration: none;
}

.tips a:hover {
  text-decoration: underline;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
