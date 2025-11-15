<template>
  <div id="appChatPage">
    <!-- 顶部栏 -->
    <div class="header-bar">
      <div class="header-left">
        <a-input
          v-if="isEditingAppName"
          v-model:value="editingAppName"
          class="app-name-input"
          :maxlength="50"
          @blur="saveAppName"
          @keydown.enter="saveAppName"
          @keydown.escape="cancelEditAppName"
          ref="appNameInputRef"
        />
        <h1 v-else class="app-name" @click="startEditAppName" :class="{ editable: isOwner }">
          {{ appInfo?.appName || '网站生成器' }}
        </h1>
        <a-tag v-if="appInfo?.codeGenType" color="blue" class="code-gen-type-tag">
          {{ formatCodeGenType(appInfo.codeGenType) }}
        </a-tag>
      </div>
      <div class="header-right">
        <a-button type="default" @click="showAppDetail">
          <template #icon>
            <InfoCircleOutlined />
          </template>
          应用详情
        </a-button>
        <a-button
          type="primary"
          ghost
          @click="downloadCode"
          :loading="downloading"
          :disabled="!isOwner"
        >
          <template #icon>
            <DownloadOutlined />
          </template>
          下载代码
        </a-button>
        <a-button type="primary" @click="deployApp" :loading="deploying">
          <template #icon>
            <CloudUploadOutlined />
          </template>
          部署
        </a-button>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧对话区域 -->
      <div class="chat-section">
        <!-- 消息区域 -->
        <div class="messages-container" ref="messagesContainer">
          <!-- 加载更多历史消息按钮 -->
          <div v-if="hasMoreHistory && !loadingHistory" class="load-more-container">
            <a-button type="link" @click="loadMoreHistory" :loading="loadingHistory">
              <template #icon>
                <ArrowUpOutlined />
              </template>
              加载更多历史消息
            </a-button>
          </div>
          <div v-if="loadingHistory" class="loading-history">
            <a-spin size="small" />
            <span>正在加载历史消息...</span>
          </div>

          <div v-for="(message, index) in messages" :key="message.id || index" class="message-item">
            <div v-if="message.type === 'user'" class="user-message">
              <div class="message-content">{{ message.content }}</div>
              <div class="message-avatar">
                <a-avatar :src="loginUserStore.loginUser.userAvatar" />
              </div>
            </div>
            <div v-else class="ai-message">
              <div class="message-avatar">
                <a-avatar :src="aiAvatar" />
              </div>
              <div class="message-content">
                <MarkdownRenderer v-if="message.content" :content="message.content" />
                <div v-if="message.loading" class="loading-indicator">
                  <a-spin size="small" />
                  <span>AI 正在思考...</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 用户消息输入框 -->
        <div class="input-container">
          <!-- 选中元素信息提示 -->
          <div v-if="selectedElement" class="selected-element-alert">
            <a-alert
              :message="getSelectedElementMessage()"
              type="info"
              closable
              @close="clearSelectedElement"
              show-icon
            />
          </div>
          <div class="input-wrapper">
            <a-tooltip v-if="!isOwner" title="无法在别人的作品下对话哦~" placement="top">
              <a-textarea
                v-model:value="userInput"
                placeholder="请描述你想生成的网站，越详细效果越好哦"
                :rows="4"
                :maxlength="1000"
                @keydown.enter.prevent="sendMessage"
                :disabled="isGenerating || !isOwner"
              />
            </a-tooltip>
            <a-textarea
              v-else
              v-model:value="userInput"
              placeholder="请描述你想生成的网站，越详细效果越好哦"
              :rows="4"
              :maxlength="1000"
              @keydown.enter.prevent="sendMessage"
              :disabled="isGenerating"
            />
            <div class="input-actions">
              <a-button
                type="primary"
                @click="sendMessage"
                :loading="isGenerating"
                :disabled="!isOwner"
              >
                <template #icon>
                  <SendOutlined />
                </template>
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧网页展示区域 -->
      <div class="preview-section">
        <div class="preview-header">
          <h3>生成后的网页展示</h3>
          <div class="preview-actions">
            <a-button
              v-if="previewUrl && isOwner"
              type="link"
              @click="toggleEditMode"
              :disabled="isGenerating"
            >
              <template #icon>
                <EditOutlined />
              </template>
              {{ isEditMode ? '退出编辑' : '编辑模式' }}
            </a-button>
            <a-button v-if="previewUrl" type="link" @click="openInNewTab">
              <template #icon>
                <ExportOutlined />
              </template>
              新窗口打开
            </a-button>
          </div>
        </div>
        <div class="preview-content">
          <div v-if="!previewUrl && !isGenerating" class="preview-placeholder">
            <div class="placeholder-icon">🌐</div>
            <p>网站文件生成完成后将在这里展示</p>
          </div>
          <div v-else-if="isGenerating" class="preview-loading">
            <a-spin size="large" />
            <p>正在生成网站...</p>
          </div>
          <iframe
            v-else
            :src="previewUrl"
            class="preview-iframe"
            :class="{ 'edit-mode': isEditMode }"
            frameborder="0"
            ref="previewIframe"
            @load="onIframeLoad"
          ></iframe>
        </div>
      </div>
    </div>

    <!-- 应用详情弹窗 -->
    <AppDetailModal
      v-model:open="appDetailVisible"
      :app="appInfo"
      :show-actions="isOwner || isAdmin"
      @edit="editApp"
      @delete="deleteApp"
    />

    <!-- 部署成功弹窗 -->
    <DeploySuccessModal
      v-model:open="deployModalVisible"
      :deploy-url="deployUrl"
      @open-site="openDeployedSite"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/loginUser'
import {
  getAppVoById,
  deployApp as deployAppApi,
  deleteApp as deleteAppApi,
  updateApp as updateAppApi,
} from '@/api/appController'
import { listAppChatHistory } from '@/api/chatHistoryController'
import { CodeGenTypeEnum } from '@/utils/codeGenTypes'
import request from '@/request'

import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import AppDetailModal from '@/components/AppDetailModal.vue'
import DeploySuccessModal from '@/components/DeploySuccessModal.vue'
import aiAvatar from '@/assets/aiAvatar.png'
import { API_BASE_URL, getStaticPreviewUrl } from '@/config/env'
import { formatCodeGenType } from '@/utils/codeGenTypes'
import {
  CloudUploadOutlined,
  SendOutlined,
  ExportOutlined,
  InfoCircleOutlined,
  ArrowUpOutlined,
  DownloadOutlined,
  EditOutlined,
} from '@ant-design/icons-vue'
import { initVisualEditor, disableEditMode, type SelectedElement } from '@/utils/visualEditor'

const route = useRoute()
const router = useRouter()
const loginUserStore = useLoginUserStore()

// 应用信息
const appInfo = ref<API.AppVO>()
const appId = ref<string>()

// 对话相关
interface Message {
  type: 'user' | 'ai'
  content: string
  loading?: boolean
  createTime?: string
  id?: number
}

const messages = ref<Message[]>([])
const userInput = ref('')
const isGenerating = ref(false)
const messagesContainer = ref<HTMLElement>()
const hasInitialConversation = ref(false) // 标记是否已经进行过初始对话

// 对话历史相关
const chatHistoryLoaded = ref(false)
const hasMoreHistory = ref(true)
const loadingHistory = ref(false)
const lastCreateTime = ref<string>()

// 预览相关
const previewUrl = ref('')
const previewReady = ref(false)
const previewIframe = ref<HTMLIFrameElement>()

// 编辑模式相关
const isEditMode = ref(false)
const selectedElement = ref<SelectedElement | null>(null)
let visualEditorCleanup: (() => void) | null = null

// 部署相关
const deploying = ref(false)
const deployModalVisible = ref(false)
const deployUrl = ref('')

// 权限相关
const isOwner = computed(() => {
  return appInfo.value?.userId === loginUserStore.loginUser.id
})

const isAdmin = computed(() => {
  return loginUserStore.loginUser.userRole === 'admin'
})

// 应用详情相关
const appDetailVisible = ref(false)

// 应用名称编辑相关
const isEditingAppName = ref(false)
const editingAppName = ref('')
const appNameInputRef = ref()

// 显示应用详情
const showAppDetail = () => {
  appDetailVisible.value = true
}

// 获取应用信息
const fetchAppInfo = async () => {
  const id = route.params.id as string
  if (!id) {
    message.error('应用ID不存在')
    router.push('/')
    return
  }

  appId.value = id

  try {
    const res = await getAppVoById({ id: id as unknown as number })
    if (res.data.code === 0 && res.data.data) {
      appInfo.value = res.data.data

      // 加载对话历史
      await loadChatHistory()

      // 检查是否需要自动发送初始提示词
      // 只有自己的app且没有对话历史时才自动发送
      if (isOwner.value && appInfo.value.initPrompt && messages.value.length === 0) {
        hasInitialConversation.value = true
        await sendInitialMessage(appInfo.value.initPrompt)
      }
    } else {
      message.error('获取应用信息失败')
      router.push('/')
    }
  } catch (error) {
    console.error('获取应用信息失败：', error)
    message.error('获取应用信息失败')
    router.push('/')
  }
}

// 加载对话历史
const loadChatHistory = async (isLoadMore = false) => {
  if (!appId.value || loadingHistory.value) {
    return
  }

  // 首次加载时，如果已经加载过就不再加载
  if (!isLoadMore && chatHistoryLoaded.value) {
    return
  }

  loadingHistory.value = true
  try {
    const res = await listAppChatHistory({
      appId: appId.value as unknown as number,
      pageSize: 10,
      lastCreateTime: lastCreateTime.value,
    })

    if (res.data.code === 0 && res.data.data) {
      const historyRecords = res.data.data.records || []

      // 将历史消息转换为前端消息格式，按时间升序排列
      const historyMessages: Message[] = historyRecords
        .sort(
          (a, b) => new Date(a.createTime || '').getTime() - new Date(b.createTime || '').getTime(),
        )
        .map((record) => ({
          type: record.messageType === 'user' ? 'user' : 'ai',
          content: record.message || '',
          createTime: record.createTime,
          id: record.id,
        }))

      // 将历史消息添加到现有消息列表的开头
      messages.value = [...historyMessages, ...messages.value]

      // 更新游标
      if (historyRecords.length > 0) {
        lastCreateTime.value = historyRecords[historyRecords.length - 1].createTime
      }

      // 检查是否还有更多历史
      hasMoreHistory.value = historyRecords.length === 10

      if (!isLoadMore) {
        chatHistoryLoaded.value = true
      }

      // 如果有历史消息且至少2条，显示网站
      if (messages.value.length >= 2) {
        updatePreview()
      }
    }
  } catch (error) {
    console.error('加载对话历史失败：', error)
    message.error('加载对话历史失败')
  } finally {
    loadingHistory.value = false
  }
}

// 加载更多历史消息
const loadMoreHistory = async () => {
  if (!hasMoreHistory.value || loadingHistory.value) {
    return
  }

  await loadChatHistory(true)
}

// 发送初始消息
const sendInitialMessage = async (prompt: string) => {
  // 添加用户消息
  messages.value.push({
    type: 'user',
    content: prompt,
  })

  // 添加AI消息占位符
  const aiMessageIndex = messages.value.length
  messages.value.push({
    type: 'ai',
    content: '',
    loading: true,
  })

  await nextTick()
  scrollToBottom()

  // 开始生成
  isGenerating.value = true
  await generateCode(prompt, aiMessageIndex)
}

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim() || isGenerating.value) {
    return
  }

  let message = userInput.value.trim()

  // 如果有选中的元素，将元素信息添加到提示词中
  if (selectedElement.value) {
    const elementInfo = selectedElement.value
    const elementDesc = `[选中元素: ${elementInfo.tagName}${elementInfo.id ? `#${elementInfo.id}` : ''}${elementInfo.className ? `.${elementInfo.className.split(' ')[0]}` : ''}${elementInfo.textContent ? ` (${elementInfo.textContent})` : ''}]`
    message = `${message}\n\n${elementDesc}`
  }

  userInput.value = ''

  // 清除选中元素并退出编辑模式
  clearSelectedElement()
  exitEditMode()

  // 添加用户消息
  messages.value.push({
    type: 'user',
    content: message,
  })

  // 添加AI消息占位符
  const aiMessageIndex = messages.value.length
  messages.value.push({
    type: 'ai',
    content: '',
    loading: true,
  })

  await nextTick()
  scrollToBottom()

  // 开始生成
  isGenerating.value = true
  await generateCode(message, aiMessageIndex)
}

// 生成代码 - 使用 EventSource 处理流式响应
const generateCode = async (userMessage: string, aiMessageIndex: number) => {
  let eventSource: EventSource | null = null
  let streamCompleted = false

  try {
    // 获取 axios 配置的 baseURL
    const baseURL = request.defaults.baseURL || API_BASE_URL

    // 构建URL参数
    const params = new URLSearchParams({
      appId: appId.value || '',
      message: userMessage,
    })

    const url = `${baseURL}/app/chat/gen/code?${params}`

    // 创建 EventSource 连接
    eventSource = new EventSource(url, {
      withCredentials: true,
    })

    let fullContent = ''

    // 处理接收到的消息
    eventSource.onmessage = function (event) {
      if (streamCompleted) return

      try {
        // 解析JSON包装的数据
        const parsed = JSON.parse(event.data)
        const content = parsed.d

        // 拼接内容
        if (content !== undefined && content !== null) {
          fullContent += content
          messages.value[aiMessageIndex].content = fullContent
          messages.value[aiMessageIndex].loading = false
          scrollToBottom()
        }
      } catch (error) {
        console.error('解析消息失败:', error)
        handleError(error, aiMessageIndex)
      }
    }

    // 处理done事件
    eventSource.addEventListener('done', function () {
      if (streamCompleted) return

      streamCompleted = true
      isGenerating.value = false
      eventSource?.close()

      // 延迟更新预览，确保后端已完成处理
      setTimeout(async () => {
        await fetchAppInfo()
        updatePreview()
      }, 1000)
    })

    // 处理错误
    eventSource.onerror = function () {
      if (streamCompleted || !isGenerating.value) return
      // 检查是否是正常的连接关闭
      if (eventSource?.readyState === EventSource.CONNECTING) {
        streamCompleted = true
        isGenerating.value = false
        eventSource?.close()

        setTimeout(async () => {
          await fetchAppInfo()
          updatePreview()
        }, 1000)
      } else {
        handleError(new Error('SSE连接错误'), aiMessageIndex)
      }
    }
  } catch (error) {
    console.error('创建 EventSource 失败：', error)
    handleError(error, aiMessageIndex)
  }
}

// 错误处理函数
const handleError = (error: unknown, aiMessageIndex: number) => {
  console.error('生成代码失败：', error)
  messages.value[aiMessageIndex].content = '抱歉，生成过程中出现了错误，请重试。'
  messages.value[aiMessageIndex].loading = false
  message.error('生成失败，请重试')
  isGenerating.value = false
}

// 更新预览
const updatePreview = () => {
  if (appId.value) {
    const codeGenType = appInfo.value?.codeGenType || CodeGenTypeEnum.HTML
    const newPreviewUrl = getStaticPreviewUrl(codeGenType, appId.value)
    previewUrl.value = newPreviewUrl
    previewReady.value = true
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 部署应用
const deployApp = async () => {
  if (!appId.value) {
    message.error('应用ID不存在')
    return
  }

  deploying.value = true
  try {
    const res = await deployAppApi({
      appId: appId.value as unknown as number,
    })

    if (res.data.code === 0 && res.data.data) {
      deployUrl.value = res.data.data
      deployModalVisible.value = true
      message.success('部署成功')
    } else {
      message.error('部署失败：' + res.data.message)
    }
  } catch (error) {
    console.error('部署失败：', error)
    message.error('部署失败，请重试')
  } finally {
    deploying.value = false
  }
}

// 在新窗口打开预览
const openInNewTab = () => {
  if (previewUrl.value) {
    window.open(previewUrl.value, '_blank')
  }
}

// 打开部署的网站
const openDeployedSite = () => {
  if (deployUrl.value) {
    window.open(deployUrl.value, '_blank')
  }
}

// iframe加载完成
const onIframeLoad = () => {
  previewReady.value = true
  // 如果处于编辑模式，重新初始化编辑器
  if (isEditMode.value && previewIframe.value) {
    initEditMode()
  }
}

// 切换编辑模式
const toggleEditMode = () => {
  if (isEditMode.value) {
    exitEditMode()
  } else {
    enterEditMode()
  }
}

// 进入编辑模式
const enterEditMode = () => {
  if (!previewIframe.value || !previewUrl.value) {
    message.warning('预览页面未加载完成')
    return
  }

  isEditMode.value = true
  initEditMode()
}

// 退出编辑模式
const exitEditMode = () => {
  isEditMode.value = false
  clearSelectedElement()

  if (visualEditorCleanup) {
    visualEditorCleanup()
    visualEditorCleanup = null
  }

  if (previewIframe.value) {
    disableEditMode(previewIframe.value)
  }
}

// 初始化编辑模式
const initEditMode = () => {
  if (!previewIframe.value) {
    return
  }

  // 清理之前的编辑器
  if (visualEditorCleanup) {
    visualEditorCleanup()
  }

  // 等待 iframe 完全加载
  const iframe = previewIframe.value
  if (!iframe.contentWindow || !iframe.contentDocument) {
    // 如果 iframe 还未加载完成，等待一下再试
    setTimeout(() => {
      if (isEditMode.value) {
        initEditMode()
      }
    }, 100)
    return
  }

  // 初始化可视化编辑器
  visualEditorCleanup = initVisualEditor(iframe, (element: SelectedElement | null) => {
    if (element) {
      selectedElement.value = element
    } else {
      selectedElement.value = null
    }
  })
}

// 清除选中元素
const clearSelectedElement = () => {
  selectedElement.value = null
}

// 获取选中元素信息消息
const getSelectedElementMessage = (): string => {
  if (!selectedElement.value) {
    return ''
  }

  const el = selectedElement.value
  const parts: string[] = []

  parts.push(`标签: ${el.tagName}`)
  if (el.id) {
    parts.push(`ID: ${el.id}`)
  }
  if (el.className) {
    parts.push(`类名: ${el.className.split(' ')[0]}`)
  }
  if (el.textContent) {
    parts.push(`文本: ${el.textContent}`)
  }

  return `已选中元素 - ${parts.join(' | ')}`
}

// 编辑应用
const editApp = () => {
  if (appInfo.value?.id) {
    router.push(`/app/edit/${appInfo.value.id}`)
  }
}

// 删除应用
const deleteApp = async () => {
  if (!appInfo.value?.id) return

  try {
    const res = await deleteAppApi({ id: appInfo.value.id })
    if (res.data.code === 0) {
      message.success('删除成功')
      appDetailVisible.value = false
      router.push('/')
    } else {
      message.error('删除失败：' + res.data.message)
    }
  } catch (error) {
    console.error('删除失败：', error)
    message.error('删除失败')
  }
}

// 开始编辑应用名称
const startEditAppName = () => {
  if (!isOwner.value) return

  isEditingAppName.value = true
  editingAppName.value = appInfo.value?.appName || ''

  nextTick(() => {
    appNameInputRef.value?.focus()
  })
}

// 保存应用名称
const saveAppName = async () => {
  if (!isEditingAppName.value || !appInfo.value?.id) return

  const newName = editingAppName.value.trim()

  // 如果名称没有变化，直接取消编辑
  if (newName === appInfo.value.appName) {
    cancelEditAppName()
    return
  }

  // 验证名称
  if (!newName) {
    message.error('应用名称不能为空')
    return
  }

  if (newName.length > 50) {
    message.error('应用名称不能超过50个字符')
    return
  }

  try {
    const res = await updateAppApi({
      id: appInfo.value.id,
      appName: newName,
    })

    if (res.data.code === 0) {
      // 更新本地数据
      if (appInfo.value) {
        appInfo.value.appName = newName
      }
      message.success('应用名称更新成功')
      isEditingAppName.value = false
    } else {
      message.error('更新失败：' + res.data.message)
    }
  } catch (error) {
    console.error('更新应用名称失败：', error)
    message.error('更新失败，请重试')
  }
}

// 取消编辑应用名称
const cancelEditAppName = () => {
  isEditingAppName.value = false
  editingAppName.value = ''
}

// 下载相关
const downloading = ref(false)

// 下载代码
const downloadCode = async () => {
  if (!appId.value) {
    message.error('应用ID不存在')
    return
  }
  downloading.value = true
  try {
    const API_BASE_URL = request.defaults.baseURL || ''
    const url = `${API_BASE_URL}/app/download/${appId.value}`
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`)
    }
    // 获取文件名
    const contentDisposition = response.headers.get('Content-Disposition')
    const fileName = contentDisposition?.match(/filename="(.+)"/)?.[1] || `app-${appId.value}.zip`
    // 下载文件
    const blob = await response.blob()
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = fileName
    link.click()
    // 清理
    URL.revokeObjectURL(downloadUrl)
    message.success('代码下载成功')
  } catch (error) {
    console.error('下载失败：', error)
    message.error('下载失败，请重试')
  } finally {
    downloading.value = false
  }
}

// 页面加载时获取应用信息
onMounted(() => {
  fetchAppInfo()
})

// 清理资源
onUnmounted(() => {
  // EventSource 会在组件卸载时自动清理
  // 清理可视化编辑器
  if (visualEditorCleanup) {
    visualEditorCleanup()
    visualEditorCleanup = null
  }
})
</script>

<style scoped>
#appChatPage {
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: #fdfdfd;
}

/* 顶部栏 */
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  cursor: default;
  transition: all 0.2s ease;
}

.code-gen-type-tag {
  font-size: 12px;
}

.app-name.editable {
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.app-name.editable:hover {
  background-color: #fafafa;
  border-color: #e8e8e8;
}

.app-name-input {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 6px 12px;
  min-width: 200px;
  background-color: #ffffff;
  transition: all 0.2s ease;
}

.app-name-input:hover {
  border-color: #d9d9d9;
}

.app-name-input:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 1px rgba(24, 144, 255, 0.1);
  outline: none;
}

.header-right {
  display: flex;
  gap: 12px;
}

/* 主要内容区域 */
.main-content {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 8px;
  overflow: hidden;
}

/* 左侧对话区域 */
.chat-section {
  flex: 2;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.messages-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.loading-history {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  color: #666;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 12px;
}

.message-item {
  margin-bottom: 12px;
}

.user-message {
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  gap: 8px;
}

.ai-message {
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 8px;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.5;
  word-wrap: break-word;
}

.user-message .message-content {
  background: #1890ff;
  color: white;
}

.ai-message .message-content {
  background: #f5f5f5;
  color: #1a1a1a;
  padding: 8px 12px;
}

.message-avatar {
  flex-shrink: 0;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
}

/* 输入区域 */
.input-container {
  padding: 16px;
  background: white;
}

.input-wrapper {
  position: relative;
}

.input-wrapper .ant-input {
  padding-right: 50px;
}

.input-actions {
  position: absolute;
  bottom: 8px;
  right: 8px;
}

.selected-element-alert {
  margin-bottom: 12px;
}

/* 右侧预览区域 */
.preview-section {
  flex: 3;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.preview-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.preview-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.preview-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.preview-loading p {
  margin-top: 16px;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-iframe.edit-mode {
  cursor: crosshair;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .main-content {
    flex-direction: column;
  }

  .chat-section,
  .preview-section {
    flex: none;
    height: 50vh;
  }
}

@media (max-width: 768px) {
  .header-bar {
    padding: 12px 16px;
  }

  .app-name {
    font-size: 16px;
  }

  .main-content {
    padding: 8px;
    gap: 8px;
  }

  .message-content {
    max-width: 85%;
  }
}
</style>
