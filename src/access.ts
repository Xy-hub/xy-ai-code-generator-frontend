import { useLoginUserStore } from '@/stores/loginUser'
import { message } from 'ant-design-vue'
import router from '@/router'

// 是否为首次获取登录用户
let firstFetchLoginUser = true

// 不需要登录的页面列表
const publicPages = ['/user/login', '/user/register', '/noAuth']

/**
 * 全局权限校验
 */
router.beforeEach(async (to, from, next) => {
  const loginUserStore = useLoginUserStore()
  let loginUser = loginUserStore.loginUser

  // 如果是公开页面，直接放行
  if (publicPages.includes(to.path)) {
    next()
    return
  }

  // 确保页面刷新，首次加载时，能够等后端返回用户信息后再校验权限
  if (firstFetchLoginUser) {
    await loginUserStore.fetchLoginUser()
    loginUser = loginUserStore.loginUser
    firstFetchLoginUser = false
  }

  // 全局登录检查
  if (!loginUser || !loginUser.id || loginUser.userName === '未登录') {
    message.warning('请先登录')
    next(`/user/login?redirect=${to.fullPath}`)
    return
  }

  // 管理员权限检查
  if (to.path.startsWith('/admin') && loginUser.userRole !== 'admin') {
    message.error('没有权限')
    next('/noAuth')
    return
  }

  next()
})
