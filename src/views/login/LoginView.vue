<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = reactive({
  username: 'admin',
  password: 'Admin@2026'
})

const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  if (!form.username.trim() || !form.password.trim()) {
    errorMsg.value = '请输入用户名和密码'
    return
  }

  errorMsg.value = ''
  loading.value = true

  try {
    await userStore.login({
      username: form.username.trim(),
      password: form.password
    })
    // 跳转到首页或 redirect 参数指定的页面
    const redirect = route.query.redirect || '/dashboard'
    router.push(redirect)
  } catch (e) {
    errorMsg.value = e.response?.data?.message || e.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login">
    <div class="login-card">
      <h2 class="login-title">NexusCRM</h2>
      <p class="login-desc">客户关系管理系统</p>

      <el-form
        class="login-form"
        :model="form"
        @keyup.enter="handleLogin"
        @submit.prevent
      >
        <el-alert
          v-if="errorMsg"
          :title="errorMsg"
          type="error"
          show-icon
          :closable="true"
          @close="errorMsg = ''"
          class="login-error"
        />

        <el-form-item>
          <el-input
            v-model="form.username"
            placeholder="用户名"
            :disabled="loading"
            size="large"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="form.password"
            type="password"
            placeholder="密码"
            show-password
            :disabled="loading"
            size="large"
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            class="login-btn"
            size="large"
            :loading="loading"
            @click="handleLogin"
          >
            {{ loading ? '登录中...' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-hint">
        <p>测试账号：admin / Admin@2026</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 420px;
  padding: 40px;
  background: $bg-white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  text-align: center;
}

.login-title {
  font-size: 28px;
  color: $text-primary;
  margin-bottom: 8px;
}

.login-desc {
  font-size: 14px;
  color: $text-secondary;
  margin-bottom: 30px;
}

.login-form {
  text-align: left;
}

.login-error {
  margin-bottom: 16px;
}

.login-btn {
  width: 100%;
}

.login-hint {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid $border-lighter;

  p {
    font-size: 12px;
    color: $text-placeholder;
  }
}
</style>
