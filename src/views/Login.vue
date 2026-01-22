<template>
  <div class="login-container">
    <el-card class="box-card">
      <h2>系统登录</h2>
      
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>

        <el-form-item label="验证码">
          <div style="display: flex; gap: 10px; width: 100%;">
            <el-input v-model="form.captcha" placeholder="请输入4位验证码" style="flex: 1;" />
            <img 
              :src="captchaUrl" 
              @click="refreshCaptcha" 
              style="height: 32px; cursor: pointer; border: 1px solid #dcdfe6; border-radius: 4px;" 
              title="点击刷新"
            />
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleLogin" style="width: 100px;">登录</el-button>
          <el-button @click="$router.push('/register')">去注册</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
// 增加 captcha 字段
const form = ref({ username: '', password: '', captcha: '' })
const captchaUrl = ref('')

// 刷新验证码逻辑
const refreshCaptcha = () => {
  captchaUrl.value = '/api/auth/captcha?t=' + new Date().getTime()
}

const handleLogin = async () => {
  if (!form.value.username || !form.value.password) {
    return ElMessage.warning('请输入用户名和密码')
  }
  if (!form.value.captcha) {
    return ElMessage.warning('请输入验证码')
  }

  try {
    // 登录时把验证码也发给后端
    const res = await axios.post('/api/auth/login', form.value)
    
    if (res.data.code === 200) {
      ElMessage.success('登录成功！')
      const user = res.data.data
      localStorage.setItem('user', JSON.stringify(user))

      if (user.role === 'ADMIN') router.push('/admin-dashboard')
      else router.push('/home')
    } else {
      ElMessage.error(res.data.msg)
      refreshCaptcha() // 登录失败自动刷新验证码
    }
  } catch (e) {
    ElMessage.error("登录服务异常")
    refreshCaptcha()
  }
}

// 页面加载时获取第一张验证码
onMounted(() => {
  refreshCaptcha()
})
</script>

<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f2f5; }
.box-card { width: 400px; }
h2 { text-align: center; margin-bottom: 30px; color: #409EFF; }
</style>