import { useLoginUserStore } from '@/stores/loginUser'
import { message } from 'ant-design-vue'
import router from '@/router'

// 是否为首次获取登录用户
let firstFetchLoginUser = true

/**
 * 全局权限校验
 */
router.beforeEach(async (to, from, next) => {
  const loginUserStore = useLoginUserStore()
  let loginUser = loginUserStore.loginUser
  // 确保页面刷新，首次加载时，能够等后端返回用户信息后再校验权限
  if (firstFetchLoginUser) {
    await loginUserStore.fetchLoginUser()
    loginUser = loginUserStore.loginUser
    firstFetchLoginUser = false
  }
  const toUrl = to.fullPath
  if (toUrl.startsWith('/admin')) {
    if (!loginUser) {
      message.error('没有权限')
      // 如果没登陆则跳转到登录页
      next(`/user/login?redirect=${to.fullPath}`)
      return
    }
    if (loginUser.userRole !== 'admin') {
      message.error('没有权限')
      //如果登录了，则进入401页面
      next(`/noAuth`)
      return
    }
  }
  next()
})
