<template>
  <div class="register-container">
    <el-card class="box-card">
      <h2>用户注册</h2>
      
      <el-tabs v-model="regType" stretch style="margin-bottom: 20px;">
        <el-tab-pane label="普通成员注册" name="MEMBER"></el-tab-pane>
        <el-tab-pane label="项目负责人注册" name="MANAGER"></el-tab-pane>
      </el-tabs>

      <el-alert v-if="regType === 'MANAGER'" title="注意：负责人账号需管理员审核通过后方可登录。" type="warning" :closable="false" show-icon style="margin-bottom: 20px;"/>
      
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>

        <el-form-item label="确认密码">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
        
        <el-form-item label="真实姓名">
          <el-input v-model="form.realName" placeholder="例如：张三" />
        </el-form-item>

        <el-form-item v-if="regType === 'MANAGER'" label="负责项目">
          <el-input v-model="form.applyingProject" placeholder="请输入您负责的项目名称" />
        </el-form-item>
        <el-form-item label="验证码">
          <div style="display: flex; gap: 10px; width: 100%;">
            <el-input v-model="form.captcha" placeholder="4位验证码" style="flex: 1;" />
            <img :src="captchaUrl" @click="refreshCaptcha" style="height: 32px; cursor: pointer; border: 1px solid #dcdfe6; border-radius: 4px;" title="点击刷新"/>
          </div>
        </el-form-item>

        <el-form-item label-width="0">
          <el-button type="primary" @click="handleRegister" style="width: 100%">
            {{ regType === 'MANAGER' ? '提交审核' : '立即注册' }}
          </el-button>
        </el-form-item>
        
        <div style="text-align: center;">
          <el-button link @click="$router.push('/login')">已有账号？返回登录</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ElMessage } from 'element-plus'
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const regType = ref('MEMBER')

const form = ref({ 
  username: '', 
  password: '', 
  confirmPassword: '', 
  realName: '', 
  applyingProject: '', // 初始化字段
  captcha: '' 
})

const BACKEND_URL = 'https://projectmanagement-backend-mkwx.onrender.com'

const captchaUrl = ref('')

const refreshCaptcha = () => {
  captchaUrl.value = `${BACKEND_URL}/api/auth/captcha?t=` + new Date().getTime()
}

const handleRegister = async () => {
  if (!form.value.username) return ElMessage.warning('请填写用户名')
  if (!form.value.password) return ElMessage.warning('请填写密码')
  if (!form.value.confirmPassword) return ElMessage.warning('请确认密码')
  if (form.value.password !== form.value.confirmPassword) return ElMessage.warning('两次密码不一致')
  if (!form.value.realName) return ElMessage.warning('请填写真实姓名')
  
  // 如果是负责人注册，必须填项目名称
  if (regType.value === 'MANAGER' && !form.value.applyingProject) {
    return ElMessage.warning('请填写拟申报的项目名称')
  }

  if (!form.value.captcha) return ElMessage.warning('请输入验证码')

  try {
    // 发送请求时带上 regType
    const payload = { ...form.value, regType: regType.value }
    const response = await axios.post(`${BACKEND_URL}/api/auth/register`, payload, { withCredentials: true })
    
    if (response.data.code === 200) {
      if (regType.value === 'MANAGER') {
        ElMessage.success('申请已提交！请耐心等待管理员审核。')
      } else {
        ElMessage.success('注册成功！请登录')
      }
      setTimeout(() => { router.push('/login') }, 1500)
    } else {
      ElMessage.error(response.data.msg)
      refreshCaptcha()
    }
  } catch (error) {
    ElMessage.error('注册服务异常')
    refreshCaptcha()
  }
}

onMounted(() => { refreshCaptcha() })
</script>

<style scoped>
.register-container { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f0f2f5; }
.box-card { width: 450px; }
h2 { text-align: center; margin-bottom: 20px; color: #409EFF; }
</style>
