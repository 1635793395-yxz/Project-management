<template>
  <div class="admin-container">
    <div class="header">
      <div class="title-section">
        <h2>⚙️ 系统管理后台</h2>
        <el-tag type="danger" effect="dark">管理员</el-tag>
      </div>
      <div class="user-info">
        <span>管理员: {{ user.realName || user.username }}</span>
        <el-button type="info" size="small" plain @click="goHome" style="margin-left: 15px">去前台首页</el-button>
        <el-button type="danger" size="small" @click="logout">退出登录</el-button>
      </div>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ pendingCount }}</div>
          <div class="stat-label">待审批立项</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ unrepliedCount }}</div>
          <div class="stat-label">待回复留言</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color: #409EFF">{{ pendingHonorCount }}</div>
          <div class="stat-label">待审荣誉</div>
        </el-card>
      </el-col>
      
      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value" style="color: #409EFF">{{ pendingUserCount }}</div>
          <div class="stat-label">待审注册</div>
        </el-card>
      </el-col>

      <el-col :span="4">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-value">{{ projectList.length }}</div>
          <div class="stat-label">在建项目总数</div>
        </el-card>
      </el-col>
    </el-row>
    <el-card class="main-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="🚀 立项审批" name="audit">
           <div class="tab-header">
            <span>待处理的立项申请</span>
            <el-button size="small" @click="fetchApplications">🔄 刷新</el-button>
          </div>
          <el-table :data="applicationList" style="width: 100%" border stripe>
            <el-table-column label="申请项目名称" width="250">
              <template #default="scope">
                <el-link type="primary" :underline="false" @click="viewApplicationDetail(scope.row)">
                  📄 {{ scope.row.projectName }}
                </el-link>
              </template>
            </el-table-column>

            <el-table-column prop="category" label="类别" width="100" />
            <el-table-column prop="managerName" label="拟负责人" width="120" />
            
            <el-table-column label="申请材料" width="120">
              <template #default="scope">
                <el-button 
                  v-if="scope.row.materialUrl" 
                  type="primary" 
                  link 
                  size="small" 
                  @click="downloadMaterial(scope.row.materialUrl)"
                >
                  📄 下载查看
                </el-button>
                <span v-else style="color: #999; font-size: 12px;">未上传</span>
              </template>
            </el-table-column>

            <el-table-column prop="reason" label="申请理由" show-overflow-tooltip />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button type="success" size="small" @click="handleApprove(scope.row)">✅ 通过</el-button>
                <el-button type="danger" size="small" @click="openRejectDialog(scope.row, 'PROJECT')">❌ 驳回</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="applicationList.length === 0" description="暂无待审批的申请" />
        </el-tab-pane>

        <el-tab-pane label="👤 人员审核" name="users">
          <div class="tab-header">
            <span>待审核的项目负责人申请</span>
            <el-button size="small" @click="fetchPendingUsers">🔄 刷新</el-button>
          </div>
          <el-table :data="pendingUserList" style="width: 100%" border stripe>
            <el-table-column prop="username" label="用户名" width="150" />
            <el-table-column prop="realName" label="真实姓名" width="150" />
            <el-table-column prop="applyingProject" label="拟申报项目" width="200" show-overflow-tooltip>
               <template #default="scope">
                 <span v-if="scope.row.applyingProject" style="color: #409EFF; font-weight: bold;">
                   {{ scope.row.applyingProject }}
                 </span>
                 <span v-else style="color: #ccc;">未填写</span>
               </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="注册时间">
               <template #default="scope">{{ scope.row.createdAt?.replace('T',' ').substring(0,16) }}</template>
            </el-table-column>
            <el-table-column label="申请角色">
                <template #default><el-tag type="warning">项目负责人</el-tag></template>
            </el-table-column>
            <el-table-column label="操作" width="200">
              <template #default="scope">
                <el-button type="success" size="small" @click="auditUser(scope.row, 'APPROVED')">✅ 通过</el-button>
                <el-button type="danger" size="small" @click="auditUser(scope.row, 'REJECTED')">❌ 拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="pendingUserList.length === 0" description="暂无待审核人员" />
        </el-tab-pane>

        <el-tab-pane label="🏆 荣誉审核" name="honor">
          <div class="tab-header">
            <span>待处理的项目荣誉申请</span>
            <el-button size="small" @click="fetchPendingHonors">🔄 刷新</el-button>
          </div>
          <el-table :data="pendingHonorList" style="width: 100%" border stripe>
            <el-table-column prop="projectName" label="所属项目" width="200" />
            <el-table-column prop="content" label="荣誉名称" />
            <el-table-column label="证明材料" width="150">
              <template #default="scope">
                <el-image 
                  v-if="scope.row.proofImage"
                  style="width: 50px; height: 50px; border-radius: 4px;"
                  :src="getImageUrl(scope.row.proofImage)" 
                  :preview-src-list="[getImageUrl(scope.row.proofImage)]"
                  fit="cover"
                  preview-teleported
                />
                <span v-else style="color: #999; font-size: 12px;">无图片</span>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="提交时间" width="180">
              <template #default="scope">{{ scope.row.createdAt?.replace('T', ' ').substring(0,16) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="scope">
                <el-button type="success" size="small" @click="auditHonor(scope.row, 'APPROVED')">✅ 通过</el-button>
                <el-button type="danger" size="small" @click="openRejectDialog(scope.row, 'HONOR')">❌ 驳回</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="pendingHonorList.length === 0" description="暂无待审批的荣誉" />
        </el-tab-pane>

        <el-tab-pane label="📂 所有项目" name="projects">
          <div class="tab-header">
            <span>正式项目列表</span>
            <el-input 
              v-model="searchInput" 
              placeholder="输入名称/编号/负责人后回车" 
              style="width: 350px" 
              clearable 
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            >
              <template #append>
                <el-button :icon="Search" @click="handleSearch">搜索</el-button>
              </template>
            </el-input>
          </div>
          
          <el-table :data="filteredProjectList" style="width: 100%" border>
            <el-table-column prop="projectCode" label="编号" width="120" />
            <el-table-column label="项目名称" width="250">
              <template #default="scope"><el-link type="primary" @click="router.push('/project/' + scope.row.id)">{{ scope.row.name }}</el-link></template>
            </el-table-column>
            <el-table-column prop="managerName" label="负责人" width="120" />
            <el-table-column prop="status" label="状态" width="100">
               <template #default="scope"><el-tag :type="getProjectStatusTag(scope.row.status)">{{ scope.row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column label="进度"><template #default="scope"><el-progress :percentage="scope.row.progress" /></template></el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope"><el-button type="danger" size="small" link @click="deleteProject(scope.row)">删除</el-button></template>
            </el-table-column>
          </el-table>
          <el-empty v-if="filteredProjectList.length === 0" description="未找到符合条件的项目" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-card style="margin-top: 20px; border-top: 3px solid #E6A23C;">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold;">📩 待处理的企服留言</span>
          <el-button size="small" @click="fetchMessages">刷新留言</el-button>
        </div>
      </template>
      <el-table :data="unrepliedMessages" style="width: 100%" stripe>
        <el-table-column prop="userName" label="留言人" width="120" />
        <el-table-column prop="content" label="留言内容" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="时间" width="180">
          <template #default="scope">{{ scope.row.createdAt?.replace('T',' ').substring(0,16) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope"><el-button type="primary" size="small" @click="openReplyDialog(scope.row)">↩️ 回复</el-button></template>
        </el-table-column>
      </el-table>
      <el-empty v-if="unrepliedMessages.length === 0" description="所有留言都已处理完毕！" :image-size="50" />
    </el-card>

    <el-dialog v-model="showCreateDialog" title="新建项目" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="项目名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="项目编号"><el-input v-model="form.projectCode" /></el-form-item>
        <el-form-item label="类别"><el-select v-model="form.category"><el-option label="软件开发" value="软件开发" /><el-option label="硬件集成" value="硬件集成" /></el-select></el-form-item>
        <el-form-item label="负责人"><el-input v-model="form.managerName" /></el-form-item>
        <el-divider>详细信息</el-divider>
        <el-form-item label="简介"><el-input v-model="form.intro" type="textarea" /></el-form-item>
        <el-form-item label="内部详情"><el-input v-model="form.details" type="textarea" /></el-form-item>
        <el-form-item label="资源配置"><el-input v-model="form.internalResources" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="showCreateDialog = false">取消</el-button><el-button type="primary" @click="handleCreate">立即创建</el-button></template>
    </el-dialog>

    <el-dialog v-model="showRejectDialog" title="驳回操作" width="500px">
       <el-alert title="请填写驳回原因，以便用户修改。" type="warning" :closable="false" style="margin-bottom: 15px;" />
       <el-form>
         <el-form-item label="驳回原因">
           <el-input v-model="rejectReason" type="textarea" rows="4" placeholder="请输入具体原因..." />
         </el-form-item>
       </el-form>
       <template #footer>
         <el-button @click="showRejectDialog = false">取消</el-button>
         <el-button type="danger" @click="confirmReject">确认驳回</el-button>
       </template>
    </el-dialog>

    <el-dialog v-model="showReplyDialog" title="快速回复留言" width="500px">
       <p style="color: #666; margin-bottom: 10px; background: #f5f7fa; padding: 10px; border-radius: 4px;"><b>用户提问：</b>{{ currentMessage?.content }}</p>
       <el-input v-model="replyText" type="textarea" rows="4" placeholder="请输入回复内容..." />
       <template #footer><el-button @click="showReplyDialog = false">取消</el-button><el-button type="primary" @click="submitReply">发送回复</el-button></template>
    </el-dialog>

    <el-dialog v-model="showAppDetailDialog" title="🔍 申请项目详细预览" width="800px" top="5vh">
      <div v-if="currentApp" class="app-detail-view">
        <el-alert title="这是一个待审核的项目申请，所有信息均为草稿状态。" type="info" show-icon :closable="false" style="margin-bottom: 15px;" />
        
        <el-descriptions border :column="2">
          <el-descriptions-item label="项目名称">{{ currentApp.projectName }}</el-descriptions-item>
          <el-descriptions-item label="预设编号">{{ currentApp.projectCode }}</el-descriptions-item>
          <el-descriptions-item label="项目类别">{{ currentApp.category }}</el-descriptions-item>
          <el-descriptions-item label="拟负责人">{{ currentApp.managerName }}</el-descriptions-item>
          <el-descriptions-item label="提交时间">{{ currentApp.createdAt?.replace('T', ' ').substring(0,16) }}</el-descriptions-item>
          <el-descriptions-item label="申请材料">
             <el-button v-if="currentApp.materialUrl" type="primary" link size="small" @click="downloadMaterial(currentApp.materialUrl)">
               📄 点击下载申请书
             </el-button>
             <span v-else>未上传</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="detail-section">
          <h4 class="detail-title">💡 申请理由 (公开简介)</h4>
          <div class="detail-content">{{ currentApp.reason || '无' }}</div>
        </div>
      </div>
      
      <template #footer>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; color: #999;">ID: {{ currentApp?.id }}</span>
          <div>
            <el-button @click="showAppDetailDialog = false">关闭</el-button>
            <el-button type="danger" @click="openRejectDialog(currentApp, 'PROJECT')">驳回申请</el-button>
            <el-button type="success" @click="handleApprove(currentApp)">通过审批</el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <ChatWidget />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import ChatWidget from '@/components/ChatWidget.vue'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const user = JSON.parse(localStorage.getItem('user') || '{}')

const activeTab = ref('audit')
const showCreateDialog = ref(false)

const applicationList = ref([])
const projectList = ref([])
const messageList = ref([]) 
const pendingHonorList = ref([])
const pendingUserList = ref([])

const showRejectDialog = ref(false)
const rejectReason = ref('')
const currentRejectItem = ref(null)
const rejectType = ref('') 

const showReplyDialog = ref(false)
const replyText = ref('')
const currentMessage = ref(null)

const showAppDetailDialog = ref(false)
const currentApp = ref(null)

// 搜索功能相关
const searchInput = ref('')
const activeSearchQuery = ref('')

const filteredProjectList = computed(() => {
  const q = activeSearchQuery.value.toLowerCase().trim()
  if (!q) return projectList.value
  
  return projectList.value.filter(p => 
    (p.name && p.name.toLowerCase().includes(q)) || 
    (p.projectCode && p.projectCode.toLowerCase().includes(q)) || 
    (p.managerName && p.managerName.toLowerCase().includes(q))
  )
})

const handleSearch = () => {
  activeSearchQuery.value = searchInput.value
  if(searchInput.value) {
    ElMessage.info('已执行搜索')
  }
}

const pendingCount = computed(() => applicationList.value.length)
const pendingHonorCount = computed(() => pendingHonorList.value.length) 
const unrepliedMessages = computed(() => messageList.value.filter(m => !m.isReplied))
const unrepliedCount = computed(() => unrepliedMessages.value.length)
const pendingUserCount = computed(() => pendingUserList.value.length)

const form = ref({ name: '', projectCode: '', category: '', managerName: user.realName, intro: '', details: '', internalResources: '' })

// 初始化数据
const initData = async () => {
  if (user.role !== 'ADMIN') { router.push('/home'); return }
  await fetchApplications()
  await fetchProjects()
  await fetchMessages()
  await fetchPendingHonors() 
  await fetchPendingUsers()
}

const fetchApplications = async () => { try { const res = await axios.get(`/api/applications/list?userId=${user.id}&role=ADMIN`); if (res.data.code === 200) applicationList.value = res.data.data } catch (e) {} }
const fetchProjects = async () => { try { const res = await axios.get('/api/projects'); if (res.data.code === 200) projectList.value = res.data.data } catch (e) {} }
const fetchMessages = async () => { try { const res = await axios.get('/api/messages/list'); if (res.data.code === 200) messageList.value = res.data.data } catch (e) {} }
const fetchPendingHonors = async () => { try { const res = await axios.get('/api/honors/pending'); if (res.data.code === 200) pendingHonorList.value = res.data.data } catch (e) {} }
const fetchPendingUsers = async () => { try { const res = await axios.get('/api/users/pending'); if (res.data.code === 200) pendingUserList.value = res.data.data } catch (e) {} }

const viewApplicationDetail = (row) => {
  currentApp.value = row
  showAppDetailDialog.value = true
}

const downloadMaterial = (path) => {
  if (!path) return
  window.open(path, '_blank')
}

// 审批立项
const handleApprove = async (row) => {
  try { 
    await ElMessageBox.confirm(`通过 "${row.projectName}"?`, '审批', { type: 'success' }); 
    await axios.post('/api/applications/audit', { id: row.id, status: 'APPROVED' }); 
    ElMessage.success('已通过'); 
    showAppDetailDialog.value = false;
    fetchApplications(); 
    fetchProjects();
  } catch (e) {}
}

// 审批荣誉
const auditHonor = async (row, status) => {
  try { await axios.post('/api/honors/audit', { id: row.id, status }); ElMessage.success('审核完成'); fetchPendingHonors() } catch (e) { ElMessage.error("失败") }
}

// 审核人员
const auditUser = async (row, status) => {
  const actionText = status === 'APPROVED' ? '通过' : '拒绝'
  try {
    await ElMessageBox.confirm(`确定要${actionText}用户 "${row.realName}" 的负责人申请吗？`, '提示', {
      type: status === 'APPROVED' ? 'success' : 'warning'
    })
    await axios.post('/api/users/audit', { id: row.id, status })
    ElMessage.success('操作成功')
    fetchPendingUsers()
  } catch (e) {}
}

// 统一的驳回入口
const openRejectDialog = (row, type) => {
  currentRejectItem.value = row
  rejectType.value = type
  rejectReason.value = '' 
  showRejectDialog.value = true
}

// 确认驳回
const confirmReject = async () => {
  if (!rejectReason.value.trim()) return ElMessage.warning("请填写驳回原因")
  try {
    if (rejectType.value === 'PROJECT') {
      await axios.post('/api/applications/audit', { id: currentRejectItem.value.id, status: 'REJECTED', reason: rejectReason.value })
      fetchApplications()
    } else if (rejectType.value === 'HONOR') {
      await axios.post('/api/honors/audit', { id: currentRejectItem.value.id, status: 'REJECTED', reason: rejectReason.value })
      fetchPendingHonors()
    }
    ElMessage.success('已驳回')
    showRejectDialog.value = false
    showAppDetailDialog.value = false 
  } catch (e) { ElMessage.error("操作失败") }
}

const handleCreate = async () => { if (!form.value.name) return ElMessage.warning("信息不全"); try { const res = await axios.post('/api/projects', form.value); if (res.data.code === 200) { ElMessage.success('创建成功'); showCreateDialog.value = false; fetchProjects() } else ElMessage.error(res.data.msg) } catch (e) {} }
const deleteProject = async (row) => { try { await ElMessageBox.confirm('确定永久删除吗？', '警告', { type: 'warning' }); await axios.delete(`/api/projects/${row.id}`); ElMessage.success('删除成功'); fetchProjects() } catch (e) {} }

const openReplyDialog = (msg) => { currentMessage.value = msg; replyText.value = ''; showReplyDialog.value = true }
const submitReply = async () => { if (!replyText.value) return ElMessage.warning("回复为空"); try { const res = await axios.post('/api/messages/reply', { id: currentMessage.value.id, replyContent: replyText.value, replierName: '系统管理员 ' + user.realName }); if (res.data.code === 200) { ElMessage.success("已回复"); showReplyDialog.value = false; fetchMessages() } } catch (e) { ElMessage.error("回复失败") } }

const logout = () => { localStorage.removeItem('user'); router.push('/login') }
const goHome = () => { router.push('/home') }

const getImageUrl = (path) => {
  if (!path) return ''
  return path.startsWith('http') ? path : path
}

const getProjectStatusTag = (status) => {
  if (status === '已完结') return 'success'
  if (status === '进行中') return 'primary'
  if (status === '筹备中') return 'warning'
  if (status === '已暂停') return 'danger'
  return 'info'
}

onMounted(() => { initData() })
</script>

<style scoped>
.admin-container { padding: 20px; max-width: 1400px; margin: 0 auto; background-color: #f5f7fa; min-height: 100vh; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; background: #fff; padding: 15px 20px; border-radius: 8px; box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05); }
.title-section { display: flex; align-items: center; gap: 15px; }
.stat-card { text-align: center; cursor: pointer; }
.stat-value { font-size: 24px; font-weight: bold; color: #409EFF; }
.stat-label { font-size: 14px; color: #909399; margin-top: 5px; }
.main-card { min-height: 500px; }
.tab-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }

.app-detail-view { padding: 0 10px; }
.detail-section { margin-top: 20px; }
.detail-title { font-weight: bold; margin-bottom: 8px; color: #303133; border-left: 4px solid #409EFF; padding-left: 8px; }
.detail-content { background: #f8f9fa; padding: 12px; border-radius: 4px; line-height: 1.6; font-size: 14px; color: #606266; white-space: pre-wrap; }
</style>