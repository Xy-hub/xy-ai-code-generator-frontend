/**
 * 可视化编辑工具
 * 用于处理 iframe 中的元素选择和通信
 */

export interface SelectedElement {
  tagName: string
  id?: string
  className?: string
  textContent?: string
  xpath?: string
  selector?: string
}

/**
 * 初始化可视化编辑模式
 * @param iframe iframe 元素
 * @param onElementSelected 元素选中回调（null 表示取消选中）
 * @returns 清理函数
 */
export function initVisualEditor(
  iframe: HTMLIFrameElement,
  onElementSelected: (element: SelectedElement | null) => void,
): () => void {
  if (!iframe.contentWindow || !iframe.contentDocument) {
    console.warn('iframe 未加载完成')
    return () => {}
  }

  const iframeWindow = iframe.contentWindow
  const iframeDocument = iframe.contentDocument

  let hoveredElement: HTMLElement | null = null
  let selectedElement: HTMLElement | null = null
  let hoverBorder: HTMLElement | null = null
  let selectedBorder: HTMLElement | null = null

  // 创建边框元素
  const createBorder = (color: string, zIndex: number) => {
    const border = iframeDocument.createElement('div')
    border.style.position = 'fixed'
    border.style.pointerEvents = 'none'
    border.style.border = `2px solid ${color}`
    border.style.borderRadius = '2px'
    border.style.zIndex = zIndex.toString()
    border.style.transition = 'all 0.1s ease'
    border.style.boxSizing = 'border-box'
    border.style.margin = '0'
    border.style.padding = '0'
    iframeDocument.body.appendChild(border)
    return border
  }

  // 更新边框位置和大小
  const updateBorder = (element: HTMLElement, border: HTMLElement) => {
    const rect = element.getBoundingClientRect()

    border.style.left = `${rect.left}px`
    border.style.top = `${rect.top}px`
    border.style.width = `${rect.width}px`
    border.style.height = `${rect.height}px`
  }

  // 获取元素信息
  const getElementInfo = (element: HTMLElement): SelectedElement => {
    const tagName = element.tagName.toLowerCase()
    const id = element.id || undefined
    const className =
      typeof element.className === 'string'
        ? element.className
        : element.className && typeof element.className === 'object'
          ? String(element.className)
          : undefined
    const textContent = element.textContent?.trim().substring(0, 50) || undefined

    // 生成简单的选择器
    let selector = tagName
    if (id) {
      selector = `#${id}`
    } else if (className) {
      const classes = className.split(/\s+/).filter(Boolean)
      if (classes.length > 0) {
        selector = `${tagName}.${classes[0]}`
      }
    }

    // 生成 XPath（简化版）
    const getXPath = (el: HTMLElement): string => {
      if (el.id) {
        return `//*[@id="${el.id}"]`
      }
      const path: string[] = []
      let current: HTMLElement | null = el
      while (current && current !== iframeDocument.body) {
        let index = 1
        let sibling = current.previousElementSibling
        while (sibling) {
          if (sibling.tagName === current.tagName) {
            index++
          }
          sibling = sibling.previousElementSibling
        }
        path.unshift(`${current.tagName.toLowerCase()}[${index}]`)
        current = current.parentElement
      }
      return '/' + path.join('/')
    }

    return {
      tagName,
      id,
      className,
      textContent,
      xpath: getXPath(element),
      selector,
    }
  }

  // 清除悬浮边框
  const clearHoverBorder = () => {
    if (hoverBorder && hoverBorder.parentNode) {
      hoverBorder.parentNode.removeChild(hoverBorder)
      hoverBorder = null
    }
    hoveredElement = null
  }

  // 清除选中边框
  const clearSelectedBorder = () => {
    if (selectedBorder && selectedBorder.parentNode) {
      selectedBorder.parentNode.removeChild(selectedBorder)
      selectedBorder = null
    }
    selectedElement = null
  }

  // 鼠标移动事件处理
  const handleMouseMove = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target || target === hoveredElement || target === selectedElement) {
      return
    }

    // 忽略边框元素本身
    if (target === hoverBorder || target === selectedBorder) {
      return
    }

    // 忽略 body 和 html
    if (target === iframeDocument.body || target === iframeDocument.documentElement) {
      clearHoverBorder()
      return
    }

    hoveredElement = target

    // 创建或更新悬浮边框
    if (!hoverBorder) {
      hoverBorder = createBorder('#1890ff', 999999)
    }
    updateBorder(target, hoverBorder)
  }

  // 鼠标点击事件处理
  const handleClick = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const target = e.target as HTMLElement
    if (!target || target === iframeDocument.body || target === iframeDocument.documentElement) {
      return
    }

    // 如果点击的是已选中的元素，取消选中
    if (target === selectedElement) {
      clearSelectedBorder()
      onElementSelected(null)
      return
    }

    // 清除之前的选中
    clearSelectedBorder()

    // 设置新的选中元素
    selectedElement = target

    // 创建选中边框
    selectedBorder = createBorder('#52c41a', 999998)
    updateBorder(target, selectedBorder)

    // 获取元素信息并回调
    const elementInfo = getElementInfo(target)
    onElementSelected(elementInfo)
  }

  // 滚动事件处理（更新边框位置）
  const handleScroll = () => {
    if (hoveredElement && hoverBorder) {
      updateBorder(hoveredElement, hoverBorder)
    }
    if (selectedElement && selectedBorder) {
      updateBorder(selectedElement, selectedBorder)
    }
  }

  // 窗口大小改变事件处理
  const handleResize = () => {
    if (hoveredElement && hoverBorder) {
      updateBorder(hoveredElement, hoverBorder)
    }
    if (selectedElement && selectedBorder) {
      updateBorder(selectedElement, selectedBorder)
    }
  }

  // 添加事件监听
  iframeDocument.addEventListener('mousemove', handleMouseMove)
  iframeDocument.addEventListener('click', handleClick, true)
  iframeWindow.addEventListener('scroll', handleScroll, true)
  iframeWindow.addEventListener('resize', handleResize)

  // 返回清理函数
  return () => {
    clearHoverBorder()
    clearSelectedBorder()
    iframeDocument.removeEventListener('mousemove', handleMouseMove)
    iframeDocument.removeEventListener('click', handleClick, true)
    iframeWindow.removeEventListener('scroll', handleScroll, true)
    iframeWindow.removeEventListener('resize', handleResize)
  }
}

/**
 * 向 iframe 发送消息，启用编辑模式
 * @param iframe iframe 元素
 */
export function enableEditMode(iframe: HTMLIFrameElement) {
  if (!iframe.contentWindow) {
    return
  }

  try {
    iframe.contentWindow.postMessage(
      {
        type: 'ENABLE_EDIT_MODE',
      },
      '*',
    )
  } catch (error) {
    console.error('发送编辑模式消息失败:', error)
  }
}

/**
 * 向 iframe 发送消息，禁用编辑模式
 * @param iframe iframe 元素
 */
export function disableEditMode(iframe: HTMLIFrameElement) {
  if (!iframe.contentWindow) {
    return
  }

  try {
    iframe.contentWindow.postMessage(
      {
        type: 'DISABLE_EDIT_MODE',
      },
      '*',
    )
  } catch (error) {
    console.error('发送禁用编辑模式消息失败:', error)
  }
}
