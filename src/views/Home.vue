<template>
  <div class="home-container">
    <div class="header">
      <div class="left-title">
        <h2>🏠 项目管理系统</h2>
        <el-tag v-if="user.role === 'ADMIN'" type="danger">管理员</el-tag>
        <el-tag v-else-if="user.role === 'MANAGER'" type="success">项目负责人</el-tag>
        <el-tag v-else type="info">普通成员</el-tag>
      </div>
      
      <div class="user-info">
        <el-button type="warning" plain @click="router.push('/help')" style="margin-right: 10px">
          💁‍♀️ 企服帮助
        </el-button>

        <el-button 
          v-if="user.role === 'ADMIN'" 
          type="info" 
          size="small" 
          plain 
          @click="router.push('/admin-dashboard')" 
          style="margin-right: 15px">
          ⚙️ 去管理后台
        </el-button>

        <span style="margin-right: 5px">{{ user.realName }}</span>
        <el-button size="small" type="danger" @click="logout">退出</el-button>
      </div>
    </div>

    <el-card class="action-card">
      <template #header>
        <div class="card-header">
          <span>🚀 项目控制台</span>
          <div class="btn-group">
            <el-button v-if="user.role === 'MANAGER'" type="success" @click="openDialog('APPLY')">
              📝 发起项目申请
            </el-button>
            <el-tag v-if="user.role !== 'ADMIN' && user.role !== 'MANAGER'" type="info">您仅有查看权限</el-tag>
          </div>
        </div>
      </template>

      <div v-if="user.role === 'ADMIN'" class="admin-hint">
        <p style="font-size: 40px; margin-bottom: 10px;">🛡️</p>
        <p>当前为管理员身份，无需在此发起申请。</p>
        <p>请移步 <el-link type="primary" style="font-size: 16px; vertical-align: baseline;" @click="router.push('/admin-dashboard')">管理后台</el-link> 处理立项审批与荣誉审核。</p>
      </div>

      <el-table v-else-if="applicationList.length > 0" :data="applicationList" style="width: 100%; margin-bottom: 20px" size="small" border>
        <el-table-column prop="projectName" label="申请项目名称" width="200" />
        <el-table-column prop="category" label="类别" width="100" />
        <el-table-column prop="managerName" label="拟负责人" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column v-if="user.role === 'MANAGER'" label="操作" width="180">
          <template #default="scope">
            <el-button v-if="scope.row.status === 'REJECTED'" type="warning" link size="small" @click="viewRejectReason(scope.row)">显示详情</el-button>
            <el-button v-if="scope.row.status === 'REJECTED' || scope.row.status === 'APPROVED'" type="danger" link size="small" @click="deleteApplication(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-empty v-else-if="user.role !== 'ADMIN'" description="暂无申请记录" :image-size="60" />
    </el-card>

    <el-card class="list-card" style="position: relative;">
      
      <div v-if="activeListTab === 'all'" style="position: absolute; right: 20px; top: 15px; z-index: 10;">
        <el-input 
          v-model="searchInput" 
          placeholder="搜索项目名称/编号/负责人" 
          style="width: 300px" 
          clearable 
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #append>
            <el-button :icon="Search" @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>
      <el-tabs v-model="activeListTab" @tab-change="handleTabChange">
        <el-tab-pane label="👤 我的项目" name="my">
          <el-table :data="myProjectList" style="width: 100%" stripe>
            <el-table-column prop="projectCode" label="编号" width="120" />
            <el-table-column label="项目名称" width="250">
              <template #default="scope">
                <el-link type="primary" @click="router.push('/project/' + scope.row.id)">{{ scope.row.name }}</el-link>
              </template>
            </el-table-column>
            <el-table-column prop="managerName" label="负责人" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getProjectStatusTag(scope.row.status)">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="进度">
              <template #default="scope"><el-progress :percentage="scope.row.progress" /></template>
            </el-table-column>
          </el-table>
          <el-empty v-if="myProjectList && myProjectList.length === 0" description="您还没有参与任何项目" />
        </el-tab-pane>

        <el-tab-pane label="🏢 项目库" name="all">
          
          <el-table :data="filteredProjectList" style="width: 100%" stripe>
            <el-table-column prop="projectCode" label="编号" width="120" />
            <el-table-column label="项目名称" width="250">
              <template #default="scope">
                <el-link type="primary" @click="router.push('/project/' + scope.row.id)">{{ scope.row.name }}</el-link>
              </template>
            </el-table-column>
            <el-table-column prop="managerName" label="负责人" width="120" />
            <el-table-column prop="status" label="状态" width="100">
               <template #default="scope"><el-tag :type="getProjectStatusTag(scope.row.status)">{{ scope.row.status }}</el-tag></template>
            </el-table-column>
            <el-table-column label="进度">
              <template #default="scope"><el-progress :percentage="scope.row.progress" /></template>
            </el-table-column>
          </el-table>
          <el-empty v-if="filteredProjectList.length === 0" description="未找到匹配的项目" />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="showDialog" :title="dialogMode === 'DIRECT' ? '新建项目' : '项目申请'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="项目名称"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="项目编号"><el-input v-model="form.projectCode" /></el-form-item>
        <el-form-item label="类别"><el-select v-model="form.category"><el-option label="软件开发" value="软件开发" /><el-option label="硬件集成" value="硬件集成" /></el-select></el-form-item>
        <el-form-item label="公开简介"><el-input v-model="form.intro" type="textarea" /></el-form-item>
        <el-form-item v-if="dialogMode === 'APPLY'" label="项目材料">
           <el-upload
             class="upload-demo"
             action="uploadActionUrl"
             :with-credentials="true"
             :limit="1"
             :on-success="handleMaterialSuccess"
             :on-error="handleMaterialError"
             :file-list="materialFileList"
             accept=".pdf,.doc,.docx"
           >
             <el-button type="primary" plain>点击上传申请材料</el-button>
             <template #tip>
               <div class="el-upload__tip">只能上传.doc/.docx/.pdf文件</div>
             </template>
           </el-upload>
        </el-form-item>
        <el-form-item label="内部详情"><el-input v-model="form.details" type="textarea" /></el-form-item>
        <el-form-item label="资源配置"><el-input v-model="form.internalResources" /></el-form-item>
        <el-form-item label="负责人"><el-input v-model="form.managerName" :disabled="dialogMode === 'APPLY'" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReasonDialog" title="审批反馈详情" width="400px">
      <div style="margin-bottom: 20px;">
        <p style="font-weight: bold; margin-bottom: 8px;">🚫 管理员驳回理由：</p>
        <div style="background: #fef0f0; color: #f56c6c; padding: 10px; border-radius: 4px; line-height: 1.6;">
          {{ currentReason || '管理员未填写具体原因' }}
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showReasonDialog = false">知道了</el-button>
      </template>
    </el-dialog>
    <div class="home-container">
      <ChatWidget v-if="user.role !== 'MEMBER'" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import ChatWidget from '@/components/ChatWidget.vue'
import { Upload, Search } from '@element-plus/icons-vue'

const router = useRouter()
const user = JSON.parse(localStorage.getItem('user') || '{}')

const activeListTab = ref('my')
const myProjectList = ref([])
const projectList = ref([])
const applicationList = ref([])

const showDialog = ref(false)
const dialogMode = ref('APPLY')
const form = ref({ name: '', projectCode: '', category: '', intro: '', details: '', internalResources: '', managerName: user.realName, materialUrl: '' })

const showReasonDialog = ref(false)
const currentReason = ref('')
const materialFileList = ref([])

const searchInput = ref('')
const activeSearchQuery = ref('')

const BACKEND_URL = 'https://projectmanagement-backend-mkwx.onrender.com'
const uploadActionUrl = `${BACKEND_URL}/api/files/upload`

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

const fetchMyProjects = async () => {
  try {
    const res = await axios.get(`/api/projects/my?userId=${user.id}`)
    if (res.data.code === 200) myProjectList.value = res.data.data
  } catch (e) {}
}

const fetchProjects = async () => {
  try {
    const res = await axios.get('/api/projects')
    if (res.data.code === 200) projectList.value = res.data.data
  } catch (e) {}
}

const fetchApplications = async () => {
  if (user.role === 'ADMIN') return;

  try {
    const res = await axios.get(`/api/applications/list?userId=${user.id}&role=${user.role}`)
    if (res.data.code === 200) applicationList.value = res.data.data
  } catch (e) {}
}

const handleTabChange = (tabName) => {
  if (tabName === 'my') fetchMyProjects()
  if (tabName === 'all') fetchProjects()
}

const openDialog = (mode) => {
  dialogMode.value = mode
  form.value = { name: '', projectCode: '', category: '', intro: '', details: '', internalResources: '', managerName: user.realName, materialUrl: '' }
  materialFileList.value = [] 
  showDialog.value = true
}

const handleMaterialSuccess = (res) => {
  if (res.code === 200) {
    form.value.materialUrl = res.data
    ElMessage.success('材料上传成功')
  } else {
    ElMessage.error('上传失败: ' + res.msg)
  }
}

const handleMaterialError = () => ElMessage.error('上传服务出错')

const handleSubmit = async () => {
  if (!form.value.name) return ElMessage.warning("请填写名称")
  if (dialogMode.value === 'APPLY' && !form.value.materialUrl) {
      return ElMessage.warning("请上传项目申请材料")
  }
  const payload = {
    name: form.value.name, 
    projectCode: form.value.projectCode, 
    category: form.value.category,
    intro: form.value.intro, 
    details: form.value.details, 
    internalResources: form.value.internalResources,
    managerName: form.value.managerName, 
    projectName: form.value.name, 
    reason: form.value.intro, 
    applicantId: user.id,
    materialUrl: form.value.materialUrl
  }
  try {
    let url = dialogMode.value === 'DIRECT' ? '/api/projects' : '/api/applications/submit'
    const res = await axios.post(url, payload)
    if (res.data.code === 200) {
      ElMessage.success(dialogMode.value === 'DIRECT' ? '已创建' : '已提交')
      showDialog.value = false
      fetchMyProjects(); fetchApplications()
      if (dialogMode.value === 'DIRECT') fetchProjects()
    } else ElMessage.error(res.data.msg)
  } catch (e) { ElMessage.error("提交失败") }
}

const auditApply = async (row, status) => {
  try {
    await axios.post('/api/applications/audit', { id: row.id, status })
    ElMessage.success('审核完成')
    fetchApplications()
  } catch (e) { ElMessage.error("操作失败") }
}

const viewRejectReason = (row) => {
  currentReason.value = row.rejectReason
  showReasonDialog.value = true
}

const deleteApplication = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这条申请记录吗？', '提示', { type: 'warning' })
    const res = await axios.delete(`/api/applications/${row.id}`)
    if (res.data.code === 200) {
      ElMessage.success('删除成功')
      fetchApplications() 
    }
  } catch (e) {}
}

const logout = () => { localStorage.removeItem('user'); router.push('/login') }

const getStatusTag = (s) => s === 'APPROVED' ? 'success' : (s === 'REJECTED' ? 'danger' : 'warning')
const getStatusText = (s) => s === 'APPROVED' ? '已通过' : (s === 'REJECTED' ? '已驳回' : '待审核')
const getProjectStatusTag = (s) => s === '已完结' ? 'success' : (s === '进行中' ? 'primary' : (s === '筹备中' ? 'warning' : 'danger'))

onMounted(() => {
  if (!user.id) router.push('/login')
  else {
    fetchApplications(); fetchMyProjects();
    fetchProjects()
  }
})
</script>

<style scoped>
.home-container { padding: 20px; max-width: 1200px; margin: 0 auto; }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.left-title { display: flex; align-items: center; gap: 10px; }
.action-card { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
.list-card { min-height: 300px; }
.admin-hint {
  text-align: center;
  padding: 40px;
  color: #606266;
  background-color: #fcfcfc;
  border-radius: 4px;
}
</style>
