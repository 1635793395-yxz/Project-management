<template>
  <div>
    <div class="chat-fab-wrapper" @click="toggleChat">
      <div class="chat-fab-btn" :class="{ 'is-open': isOpen }">
        <svg v-if="!isOpen" viewBox="0 0 24 24" width="28" height="28" fill="white">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" width="24" height="24" fill="white">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </div>
      <div class="custom-badge" v-if="unreadCount > 0">
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </div>
    </div>

    <transition name="slide-fade">
      <div v-if="isOpen" class="chat-window">
        <div class="chat-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 14px; color: #606266;">切换联系人:</span>
            <el-select 
              v-model="currentContactId" 
              placeholder="请选择..." 
              size="small" 
              :teleported="false"
              style="width: 140px" 
              @change="handleChangeContact"
            >
              <el-option 
                v-for="(u, index) in contactList" 
                :key="u.id + '_' + index" 
                :label="getContactLabel(u)" 
                :value="u.id"
              >
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <span>{{ getContactLabel(u) }}</span>
                  <el-tag v-if="u.unread > 0" type="danger" effect="dark" round size="small" style="transform: scale(0.8);">
                    {{ u.unread }}
                  </el-tag>
                </div>
              </el-option>
            </el-select>
          </div>
          <div class="header-actions">
             <span class="minimize-btn" @click="isOpen = false">✖</span>
          </div>
        </div>

        <div class="chat-target-info" v-if="currentContact">
          <span class="target-name">{{ currentContact.realName || currentContact.username }}</span>
          <span class="target-role" :class="currentContact.role === 'ADMIN' ? 'role-admin' : 'role-manager'">
            {{ currentContact.role === 'ADMIN' ? '管理员' : '项目负责人' }}
          </span>
        </div>

        <div class="chat-body" ref="chatBodyRef">
          <div v-if="!currentContactId" class="empty-state">
            <div class="empty-icon">👋</div>
            <p>请在上方选择联系人<br>开始聊天</p>
          </div>
          <div v-else>
            <div v-if="historyList.length === 0" class="empty-state">
              <p style="color: #ccc; font-size: 13px;">暂无消息记录</p>
            </div>
            <div v-for="msg in historyList" :key="msg.id" :class="['msg-row', isMe(msg.senderId) ? 'msg-me' : 'msg-other']">
              <div v-if="!isMe(msg.senderId)" class="msg-avatar other">
                {{ getAvatarText(msg.senderId) }}
              </div>
              <div class="msg-content-wrapper">
                 <div class="msg-bubble">{{ msg.content }}</div>
              </div>
              <div v-if="isMe(msg.senderId)" class="msg-avatar me">
                {{ user.realName ? user.realName[0] : user.username[0] }}
              </div>
            </div>
          </div>
        </div>

        <div class="chat-footer">
          <el-input v-model="inputContent" placeholder="输入消息..." @keyup.enter="sendMessage">
            <template #append>
              <el-button @click="sendMessage" :disabled="!inputContent">发送</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'

const user = JSON.parse(localStorage.getItem('user') || '{}')
const isOpen = ref(false)
const unreadCount = ref(0)
const contactList = ref([]) 
const currentContactId = ref(null) 
const historyList = ref([]) 
const inputContent = ref('')
const chatBodyRef = ref(null)
let timer = null 

// 获取当前聊天的对象完整信息
const currentContact = computed(() => {
  return contactList.value.find(u => u.id === currentContactId.value)
})

const isMe = (senderId) => Number(senderId) === Number(user.id)

const init = async () => {
  await fetchContacts()
  await fetchUnread()
  timer = setInterval(() => {
    fetchUnread()
    if (isOpen.value) fetchContacts(true) 
    if (isOpen.value && currentContactId.value) fetchHistory(true) 
  }, 3000)
}

const fetchContacts = async (isSilent = false) => {
  try {
    const timestamp = new Date().getTime()
    const res = await axios.get(`/api/chat/contacts?myRole=${user.role}&myId=${user.id}&t=${timestamp}`)
    if (res.data.code === 200) {
      contactList.value = res.data.data
    }
  } catch (e) {
    if (!isSilent) console.error(e)
  }
}

const fetchUnread = async () => {
  try {
    const res = await axios.get(`/api/chat/unread?userId=${user.id}`)
    if (res.data.code === 200) unreadCount.value = res.data.data
  } catch (e) {}
}

const handleChangeContact = (val) => {
  currentContactId.value = val
  historyList.value = []
  fetchHistory()
  markAsRead()
}

const fetchHistory = async (isSilent = false) => {
  if (!currentContactId.value) return
  try {
    const res = await axios.get(`/api/chat/history?userId1=${user.id}&userId2=${currentContactId.value}`)
    if (res.data.code === 200) {
      const newData = res.data.data
      const shouldScroll = !isSilent || newData.length > historyList.value.length
      historyList.value = newData
      if (shouldScroll) scrollToBottom()
    }
  } catch (e) {}
}

const sendMessage = async () => {
  if (!inputContent.value.trim()) return
  if (!currentContactId.value) return ElMessage.warning("请先选择联系人")
  try {
    await axios.post('/api/chat/send', {
      senderId: user.id,
      receiverId: currentContactId.value,
      content: inputContent.value
    })
    inputContent.value = ''
    fetchHistory() 
    scrollToBottom()
  } catch (e) { ElMessage.error("发送失败") }
}

const markAsRead = async () => {
  if (!currentContactId.value) return
  try {
    await axios.post('/api/chat/read', { senderId: currentContactId.value, receiverId: user.id })
    fetchUnread()
    fetchContacts()
  } catch (e) {}
}

const toggleChat = () => {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    fetchContacts()
    if (!currentContactId.value && contactList.value.length > 0) {
        currentContactId.value = contactList.value[0].id
    }
    if (currentContactId.value) { fetchHistory(); markAsRead() }
    setTimeout(scrollToBottom, 100)
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBodyRef.value) chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  })
}

const getContactLabel = (u) => {
  return u.realName || u.username
}

const getAvatarText = (uid) => {
  const target = contactList.value.find(c => Number(c.id) === Number(uid))
  if (target) return (target.realName || target.username)[0]
  return '?'
}

onMounted(() => init())
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.chat-fab-wrapper {
  position: fixed; bottom: 40px; right: 40px; z-index: 9999; cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.chat-fab-wrapper:hover { transform: translateY(-5px) scale(1.05); }

.chat-fab-btn {
  width: 64px; height: 64px;
  background: linear-gradient(135deg, #07c160 0%, #05a050 100%);
  border-radius: 50%;
  box-shadow: 0 8px 24px rgba(7, 193, 96, 0.4);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s ease;
}
.chat-fab-btn.is-open {
  background: #909399;
  box-shadow: 0 8px 24px rgba(144, 147, 153, 0.4);
  transform: rotate(90deg);
}

.custom-badge {
  position: absolute; top: -2px; right: -2px;
  background-color: #f56c6c; color: white;
  font-size: 12px; font-weight: bold;
  height: 22px; min-width: 22px; padding: 0 6px;
  border-radius: 11px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}

.chat-window { 
  position: fixed; bottom: 120px; right: 40px; width: 380px; height: 550px; 
  background: white; border-radius: 12px; 
  box-shadow: 0 12px 40px rgba(0,0,0,0.15); 
  display: flex; flex-direction: column; z-index: 9998; 
  border: 1px solid #ebeef5; overflow: visible; 
  transform-origin: bottom right;
}

.chat-header { 
  padding: 10px 15px; border-bottom: 1px solid #f0f0f0; background: #fff; 
  border-radius: 12px 12px 0 0; display: flex; justify-content: space-between; align-items: center;
  z-index: 10;
}
.minimize-btn { cursor: pointer; color: #909399; font-weight: bold; padding: 5px; }

/* 身份确认栏样式 */
.chat-target-info {
  background-color: #f9f9f9;
  padding: 10px 0;
  text-align: center;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.02);
}
.target-name { font-size: 16px; font-weight: bold; color: #333; }
.target-role { font-size: 11px; padding: 2px 6px; border-radius: 4px; }
.role-admin { background: #fff0f0; color: #f56c6c; border: 1px solid #fab6b6; }
.role-manager { background: #f0f9eb; color: #67c23a; border: 1px solid #b3e19d; }

.chat-body { flex: 1; padding: 20px; overflow-y: auto; background: #f7f7f7; }
.chat-footer { padding: 15px; background: white; border-top: 1px solid #f0f0f0; border-radius: 0 0 12px 12px; }

.empty-state { text-align: center; margin-top: 60px; color: #909399; }
.empty-icon { font-size: 40px; margin-bottom: 10px; }

.msg-row { display: flex; margin-bottom: 20px; width: 100%; }
.msg-me { justify-content: flex-end; }
.msg-other { justify-content: flex-start; }

.msg-avatar { 
  width: 38px; height: 38px; border-radius: 8px; 
  display: flex; align-items: center; justify-content: center; 
  color: white; font-size: 15px; font-weight: 600; flex-shrink: 0; 
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}
.msg-avatar.me { background-color: #07c160; margin-left: 12px; }
.msg-avatar.other { background-color: #409EFF; margin-right: 12px; }

.msg-content-wrapper { max-width: 70%; display: flex; flex-direction: column; }
.msg-bubble { 
  padding: 10px 14px; border-radius: 8px; font-size: 14px; line-height: 1.6; word-break: break-all; position: relative;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.msg-me .msg-bubble { background-color: #95ec69; color: black; border-top-right-radius: 0; }
.msg-other .msg-bubble { background-color: white; color: #333; border: 1px solid #eee; border-top-left-radius: 0; }

.slide-fade-enter-active { transition: all 0.3s ease-out; }
.slide-fade-leave-active { transition: all 0.2s cubic-bezier(1.0, 0.5, 0.8, 1.0); }
.slide-fade-enter-from, .slide-fade-leave-to { transform: translateY(20px); opacity: 0; }
</style>