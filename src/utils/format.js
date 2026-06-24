/**
 * 格式化工具
 */

/**
 * 格式化数字，加千分位分隔符
 * @param {number} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return '0'
  return new Intl.NumberFormat('zh-CN').format(value)
}

/**
 * 格式化金额（人民币，不保留小数）
 * @param {number} value
 * @returns {string}
 */
export function formatCurrency(value) {
  if (value == null || Number.isNaN(Number(value))) return '¥0'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0
  }).format(value)
}

/**
 * 格式化百分比
 * @param {number} value 0~100
 * @returns {string}
 */
export function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return '0%'
  return `${Math.round(value)}%`
}

/**
 * 格式化日期
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d)
}
