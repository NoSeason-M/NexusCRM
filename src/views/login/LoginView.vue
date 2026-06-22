<script setup>
// 登录页面
</script>

<template>
  <div class="login">
    <div class="login-card">
      <h2 class="login-title">NexusCRM</h2>
      <p class="login-desc">客户关系管理系统</p>

      <el-form class="login-form">
        <el-form-item>
          <el-input placeholder="用户名" />
        </el-form-item>
        <el-form-item>
          <el-input type="password" placeholder="密码" show-password />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" class="login-btn">登 录</el-button>
        </el-form-item>
      </el-form>
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
  width: 400px;
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

.login-btn {
  width: 100%;
}
</style>
