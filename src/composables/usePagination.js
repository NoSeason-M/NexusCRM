/**
 * 分页组合式函数
 *
 * 封装分页逻辑，提供页码/每页条数/总数管理。
 */
import { ref } from 'vue'

export function usePagination(options = {}) {
  const page = ref(options.page || 1)
  const pageSize = ref(options.pageSize || 10)
  const total = ref(0)

  /**
   * 设置总数
   * @param {number} val
   */
  function setTotal(val) {
    total.value = val
  }

  /**
   * 重置到第一页（切换筛选条件时调用）
   */
  function resetPage() {
    page.value = 1
  }

  /**
   * 切换页码
   * @param {number} val
   */
  function changePage(val) {
    page.value = val
  }

  /**
   * 切换每页条数（自动回到第一页）
   * @param {number} val
   */
  function changePageSize(val) {
    pageSize.value = val
    page.value = 1
  }

  return {
    page,
    pageSize,
    total,
    setTotal,
    resetPage,
    changePage,
    changePageSize
  }
}
