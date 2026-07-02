/**
 * 格式化工具
 *
 * 所有函数处理 null / undefined / NaN 输入，返回默认值 "-" 或 "0" 等安全值。
 */

/**
 * 格式化数字，加千分位分隔符
 * @param {number|null|undefined} value
 * @returns {string}
 */
export function formatNumber(value) {
  if (value == null || Number.isNaN(Number(value))) return '0'
  return new Intl.NumberFormat('zh-CN').format(value)
}

/**
 * 格式化金额（人民币，不保留小数）
 * @param {number|null|undefined} value
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
 * @param {number|null|undefined} value 0~100
 * @returns {string}
 */
export function formatPercent(value) {
  if (value == null || Number.isNaN(Number(value))) return '0%'
  return `${Math.round(value)}%`
}

/**
 * 格式化日期（年月日）
 * @param {string|Date|null|undefined} date
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

/**
 * 格式化日期时间（年月日 时分）
 * @param {string|Date|null|undefined} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return '-'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '-'
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(d)
}

/**
 * 格式化 ISO 日期字符串为指定样式
 * @param {string|Date|null|undefined} date
 * @param {'date'|'datetime'} style
 * @returns {string}
 */
export function formatDateStyle(date, style = 'date') {
  if (!date) return '-'
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return '-'
  const options = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }
  if (style === 'datetime') {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }
  return new Intl.DateTimeFormat('zh-CN', options).format(d)
}
