<template>
  <div class="help-container">
    <div class="header">
      <div class="title">
        <h2>💁‍♀️ 企服帮助中心</h2>
        <span class="subtitle">有问题？在这里反馈，管理员和负责人会为您解答。</span>
      </div>
      <el-button @click="goHome">⬅️ 返回首页</el-button>
    </div>

    <el-card class="input-card">
      <el-form :model="form">
        <el-form-item label="我要留言">
          <el-input v-model="form.content" type="textarea" rows="3" placeholder="请详细描述您的问题..." />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联项目">
              <el-select v-model="form.projectId" placeholder="选择关联项目(可选)" clearable style="width: 100%">
                <el-option v-for="p in projectOptions" :key="p.id" :label="p.name" :value="p.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系方式">
              <el-input v-model="form.contactInfo" placeholder="手机号/邮箱(可选)" />
            </el-form-item>
          </el-col>
        </el-row>
        <div style="text-align: right;">
          <el-button type="primary" @click="submitMessage">提交</el-button>
        </div>
      </el-form>
    </el-card>

    <div class="message-list">
      <el-card v-for="msg in messageList" :key="msg.id" class="message-card">
        <template #header>
          <div class="msg-header">
            <div class="user-info">
              <span class="avatar">{{ msg.userName?.[0] || '客' }}</span>
              <span class="name">{{ msg.userName || '未知用户' }}</span>
              <el-tag v-if="msg.projectName" size="small" type="info" effect="plain">项目: {{ msg.projectName }}</el-tag>
            </div>
            <div class="time">{{ msg.createdAt ? msg.createdAt.replace('T', ' ').substring(0, 16) : '' }}</div>
          </div>
        </template>
        
        <div class="msg-content">{{ msg.content }}</div>
        
        <div class="reply-section" v-if="msg.replyList && msg.replyList.length > 0">
          <div v-for="reply in msg.replyList" :key="reply.id" class="reply-box">
            <div class="reply-header">
              <span style="font-weight: bold; color: #409EFF;">
                  {{ reply.replierName || '系统回复' }}
              </span>
              
              <div class="reply-actions">
                <span class="reply-time">{{ reply.createdAt ? reply.createdAt.replace('T', ' ').substring(0, 16) : '' }}</span>
                
                <el-button 
                  v-if="user.role === 'ADMIN' || reply.replierId === user.id" 
                  type="danger" 
                  link 
                  size="small" 
                  style="margin-left: 10px;"
                  @click="deleteReply(reply.id)">
                  删除
                </el-button>
              </div>
            </div>
            <div class="reply-text">{{ reply.content }}</div>
          </div>
        </div>

        <div class="action-bar">
          <el-button v-if="canReply(msg)" type="primary" link @click="openReplyDialog(msg)">
            回复
          </el-button>
          
          <el-button v-if="user.role === 'ADMIN'" type="danger" link @click="deleteMessage(msg.id)">
            删除
          </el-button>
        </div>
      </el-card>
      
      <el-empty v-if="messageList.length === 0" description="暂无留言，快来抢沙发！" />
    </div>

    <el-dialog v-model="showReplyDialog" title="回复留言" width="500px">
      <p style="color: #666; margin-bottom: 10px;">问题：{{ currentMsg?.content }}</p>
      <el-input v-model="replyText" type="textarea" rows="4" placeholder="请输入回复内容..." />
      <template #footer>
        <el-button @click="showReplyDialog = false">取消</el-button>
        <el-button type="primary" @click="submitReply">发送回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const user = JSON.parse(localStorage.getItem('user') || '{}')
const messageList = ref([])
const projectOptions = ref([])
const form = ref({ content: '', projectId: null, contactInfo: '' })

const showReplyDialog = ref(false)
const currentMsg = ref(null)
const replyText = ref('')

const goHome = () => { router.push('/home') }

const init = async () => {
  await fetchMessages()
  await fetchProjects()
}

const fetchMessages = async () => {
  try {
    const res = await axios.get('/api/messages/list')
    if (res.data.code === 200) messageList.value = res.data.data
  } catch (e) {}
}

const fetchProjects = async () => {
  try {
    const res = await axios.get('/api/projects')
    if (res.data.code === 200) projectOptions.value = res.data.data
  } catch (e) {}
}

const submitMessage = async () => {
  if (!form.value.content) return ElMessage.warning("请填写内容")
  try {
    const res = await axios.post('/api/messages/add', { userId: user.id, ...form.value })
    if (res.data.code === 200) {
      ElMessage.success(res.data.msg)
      form.value = { content: '', projectId: null, contactInfo: '' }
      fetchMessages()
    }
  } catch (e) { ElMessage.error("提交失败") }
}

const canReply = (msg) => {
  if (msg.userId === user.id) return false
  if (user.role === 'ADMIN' || user.role === 'MANAGER') return true
  return false
}

const openReplyDialog = (msg) => {
  currentMsg.value = msg
  replyText.value = '' 
  showReplyDialog.value = true
}

const submitReply = async () => {
  if (!replyText.value) return ElMessage.warning("回复内容为空")
  
  const prefix = user.role === 'ADMIN' ? '系统管理员' : '项目负责人'
  const displayName = `${prefix} ${user.realName}`

  try {
    const res = await axios.post('/api/messages/reply', {
      id: currentMsg.value.id,
      replyContent: replyText.value,
      replierName: displayName,
      replierId: user.id
    })
    if (res.data.code === 200) {
      ElMessage.success("已回复")
      showReplyDialog.value = false
      fetchMessages()
    }
  } catch (e) { ElMessage.error("回复失败") }
}

// 删除整个留言（及回复）
const deleteMessage = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除该留言及其所有回复吗?', '警告', { type: 'warning' })
    await axios.delete(`/api/messages/${id}`)
    ElMessage.success('留言已删除')
    fetchMessages()
  } catch (e) {}
}

// 删除单条回复
const deleteReply = async (replyId) => {
  try {
    await ElMessageBox.confirm('确定删除这条回复吗?', '提示', { type: 'warning' })
    await axios.delete(`/api/messages/reply/${replyId}`)
    ElMessage.success('回复已删除')
    fetchMessages()
  } catch (e) {}
}

onMounted(() => init())
</script>

<style scoped>
.help-container { max-width: 800px; margin: 20px auto; padding: 0 20px; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.title h2 { margin: 0; color: #303133; }
.subtitle { color: #909399; font-size: 14px; }
.input-card { margin-bottom: 30px; border-top: 3px solid #409EFF; }
.message-card { margin-bottom: 20px; }
.msg-header { display: flex; justify-content: space-between; align-items: center; }
.user-info { display: flex; align-items: center; gap: 10px; }
.avatar { width: 32px; height: 32px; background: #E6A23C; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; }
.time { color: #ccc; font-size: 12px; }
.msg-content { padding: 10px 0; font-size: 15px; line-height: 1.6; color: #333; }

/* 回复列表样式 */
.reply-section { background: #f5f7fa; padding: 15px; border-radius: 4px; margin-top: 10px; }
.reply-box { margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid #e4e7ed; }
.reply-box:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
.reply-header { display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin-bottom: 5px; }
.reply-actions { display: flex; align-items: center; gap: 10px; }
.reply-time { font-size: 12px; color: #999; }
.reply-text { font-size: 14px; color: #606266; line-height: 1.5; }
.action-bar { border-top: 1px solid #eee; margin-top: 10px; padding-top: 10px; text-align: right; }
</style>