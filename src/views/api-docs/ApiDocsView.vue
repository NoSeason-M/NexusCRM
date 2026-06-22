<script setup>
import { ref } from 'vue'
import { getMockHealth, resetMockData } from '@/api/mock'
import request from '@/api/request'

// 接口列表定义
const endpoints = [
  {
    method: 'GET',
    url: '/api/health',
    desc: '健康检查 — 查看模拟服务状态',
    color: '#67c23a',
    bgColor: '#f0f9eb',
    action: async () => {
      const res = await getMockHealth()
      return res
    }
  },
  {
    method: 'POST',
    url: '/api/mock/reset',
    desc: '重置模拟数据 — 重新生成种子数据',
    color: '#409eff',
    bgColor: '#ecf5ff',
    action: async () => {
      const res = await resetMockData()
      return res
    }
  },
  {
    method: 'GET',
    url: '/api/mock/error',
    desc: '模拟服务端错误 — 返回 500 错误',
    color: '#f56c6c',
    bgColor: '#fef0f0',
    action: async () => {
      // 这个接口会报错，catch 后手动显示
      try {
        await request.get('/mock/error')
      } catch (e) {
        // 返回错误响应数据
        if (e.response?.data) {
          return e.response.data
        }
        return { code: -1, message: e.message || '请求失败', data: {} }
      }
    }
  }
]

const loadingIndex = ref(-1)
const results = ref([])

async function tryEndpoint(index) {
  const endpoint = endpoints[index]
  loadingIndex.value = index
  try {
    const result = await endpoint.action()
    results.value[index] = {
      success: true,
      data: result
    }
  } catch (e) {
    results.value[index] = {
      success: false,
      data: e.response?.data || { message: e.message }
    }
  } finally {
    loadingIndex.value = -1
  }
}

function getMethodTagType(method) {
  const map = { GET: 'success', POST: 'primary', PUT: 'warning', DELETE: 'danger' }
  return map[method] || 'info'
}
</script>

<template>
  <div class="api-docs">
    <div class="page-card">
      <div class="page-card__header">
        <span class="title">接口文档</span>
        <el-tag type="info" size="small">模拟接口 (MSW)</el-tag>
      </div>
      <div class="page-card__body">
        <p class="api-tip">
          基于 MSW (Mock Service Worker) 的模拟接口，数据源使用 Faker.js 生成，种子为
          <strong>2026</strong>。
          每次刷新页面或点击"重置模拟数据"可重新生成。
        </p>

        <div
          v-for="(ep, index) in endpoints"
          :key="ep.url"
          class="api-card"
        >
          <!-- 接口头部 -->
          <div class="api-header">
            <div class="api-method">
              <el-tag
                :type="getMethodTagType(ep.method)"
                size="small"
                effect="dark"
              >
                {{ ep.method }}
              </el-tag>
              <code class="api-url">{{ ep.url }}</code>
            </div>
            <el-button
              type="primary"
              size="small"
              plain
              :loading="loadingIndex === index"
              @click="tryEndpoint(index)"
            >
              {{ loadingIndex === index ? '请求中...' : 'Try it' }}
            </el-button>
          </div>

          <!-- 接口描述 -->
          <p class="api-desc">{{ ep.desc }}</p>

          <!-- 接口响应 -->
          <div v-if="results[index]" class="api-response">
            <div class="response-header">
              <span class="response-label">Response</span>
              <el-tag
                v-if="results[index].success"
                size="small"
                type="success"
                effect="plain"
              >
                成功
              </el-tag>
              <el-tag
                v-else
                size="small"
                type="danger"
                effect="plain"
              >
                失败
              </el-tag>
            </div>
            <pre class="response-body"><code>{{ JSON.stringify(results[index].data, null, 2) }}</code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.api-tip {
  font-size: 14px;
  color: $text-secondary;
  margin-bottom: 24px;
  line-height: 1.6;
}

.api-card {
  border: 1px solid $border-light;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  transition: box-shadow 0.2s;

  &:hover {
    box-shadow: $box-shadow-base;
  }

  & + .api-card {
    margin-top: 0;
  }
}

.api-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.api-method {
  display: flex;
  align-items: center;
  gap: 12px;
}

.api-url {
  font-size: 15px;
  font-weight: 600;
  color: $text-primary;
  background: $bg-base;
  padding: 2px 8px;
  border-radius: 4px;
}

.api-desc {
  font-size: 13px;
  color: $text-secondary;
  margin-left: 0;
}

.api-response {
  margin-top: 12px;
  border: 1px solid $border-lighter;
  border-radius: 6px;
  overflow: hidden;
}

.response-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: $bg-base;
  border-bottom: 1px solid $border-lighter;
}

.response-label {
  font-size: 13px;
  font-weight: 600;
  color: $text-regular;
}

.response-body {
  padding: 12px;
  margin: 0;
  background: #1e1e1e;
  color: #d4d4d4;
  font-size: 13px;
  line-height: 1.5;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;

  code {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  }
}
</style>
