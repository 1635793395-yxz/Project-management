<template>
  <div class="detail-container">
    <div class="header-actions">
      <el-button @click="$router.back()">⬅️ 返回列表</el-button>
      <el-button v-if="canManage" type="primary" @click="openEditDialog">🛠️ 维护项目信息</el-button>
    </div>

    <el-card v-if="project" class="box-card">
      <template #header>
        <div class="card-header">
          <h2>{{ project?.name }}</h2>
          <div style="display: flex; gap: 10px; align-items: center;">
             <el-progress type="circle" :percentage="project?.progress || 0" :width="50" />
             <el-tag :type="getStatusTag(project?.status)">{{ project?.status }}</el-tag>
          </div>
        </div>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="项目编号">{{ project?.projectCode }}</el-descriptions-item>
        <el-descriptions-item label="类别">{{ project?.category }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ project?.managerName || '未指定' }}</el-descriptions-item>
        <el-descriptions-item label="团队规模">{{ memberList.length + 1 }} 人</el-descriptions-item>
      </el-descriptions>

      <div class="section">
        <h3>📖 公开简介</h3>
        <p class="content-box">{{ project?.intro || '暂无简介' }}</p>
      </div>

      <div class="section member-section">
        <div class="section-header">
           <h3>👥 项目团队成员</h3>
           <div v-if="canManage" style="display: flex; gap: 10px;">
              <el-input v-model="newMemberName" placeholder="输入成员真实姓名..." style="width: 200px" size="small" />
              <el-button type="primary" size="small" @click="addMember">➕ 添加</el-button>
           </div>
        </div>
        <div class="member-grid">
           <div class="member-card manager">
              <div class="avatar">{{ project?.managerName?.[0] || '管' }}</div>
              <div class="info"><div class="name">{{ project?.managerName }}</div><div class="role">负责人</div></div>
           </div>
           <div v-for="m in memberList" :key="m.id" class="member-card">
              <div class="avatar user">{{ m.memberName?.[0] || '员' }}</div>
              <div class="info"><div class="name">{{ m.memberName }}</div><div class="role">{{ m.role === 'MEMBER'?'普通成员':'管理员' }}</div></div>
              <el-button v-if="canManage" class="remove-btn" type="danger" size="small" @click="removeMember(m)">移除</el-button>
           </div>
        </div>
         <el-empty v-if="memberList.length === 0" description="暂无普通成员" :image-size="40" />
      </div>

      <div class="section honor-section">
        <div class="section-header">
           <h3>🏆 项目荣誉</h3>
           <el-button v-if="canManage" type="warning" size="small" @click="openHonorDialog()">➕ 添加</el-button>
        </div>
        
        <div class="honor-list">
          <div v-for="(h, index) in honorList" :key="h.id" class="honor-item">
            <div style="display: flex; align-items: center; flex: 1;">
              <span class="honor-index">{{ index + 1 }}</span>
              <div>
                <div class="honor-text">{{ h.content }}</div>
                <div class="honor-date">
                  {{ h.createdAt?.split('T')[0] }}
                  <el-tag size="small" :type="getHonorTag(h.status)" style="margin-left: 5px;">{{ getHonorText(h.status) }}</el-tag>
                </div>
              </div>
            </div>

            <div class="honor-actions">
              <el-button v-if="h.status === 'APPROVED'" type="primary" link size="small" @click="showHonorDetail(h)">显示详情</el-button>
              <el-button v-if="h.status === 'REJECTED' && canManage" type="danger" link size="small" @click="showHonorReject(h)">📝 查看原因/修改</el-button>
              <el-button v-if="canManage" type="danger" link size="small" @click="deleteHonor(h.id)">删除</el-button>
            </div>
          </div>
        </div>
        <el-empty v-if="honorList.length === 0" description="暂无荣誉，继续加油！" :image-size="40" />
      </div>

      <div v-if="canManage || project?.details" class="secret-section">
        <el-divider><span style="color:red">🔒 内部机密区域</span></el-divider>
        
        <div class="section task-section" style="margin-top: 10px; border: 1px solid #fde2e2;">
          <div class="section-header">
             <h3>✅ 任务详情</h3>
             <div v-if="canManage" style="display: flex; gap: 10px;">
                <el-input v-model="newTaskContent" placeholder="输入任务..." style="width: 200px" size="small" />
                <el-button type="success" size="small" @click="addTask">➕ 添加</el-button>
             </div>
          </div>
          <el-table :data="taskList" style="width: 100%; margin-top: 10px" :show-header="false" stripe>
             <el-table-column width="50">
               <template #default="scope"><el-checkbox v-model="scope.row.isCompleted" :disabled="!canManage" @change="toggleTask(scope.row)" /></template>
             </el-table-column>
             <el-table-column>
               <template #default="scope"><span :class="{ 'completed-text': scope.row.isCompleted }">{{ scope.row.content }}</span></template>
             </el-table-column>
             <el-table-column width="60" align="right">
               <template #default="scope"><el-button v-if="canManage" type="danger" link size="small" @click="deleteTask(scope.row)">删除</el-button></template>
             </el-table-column>
          </el-table>
          <el-empty v-if="taskList.length === 0" description="暂无任务" :image-size="40" />
        </div>

        <h3>📊 内部详情</h3>
        <p class="content-box">{{ project?.details || '暂无内部详情' }}</p>
        <h3>💰 资源配置</h3>
        <p class="content-box">{{ project?.internalResources || '暂无资源配置' }}</p>
      </div>
    </el-card>

    <div v-else v-loading="true" style="height: 200px;"></div>

    <el-dialog v-model="showEditDialog" title="维护项目信息" width="600px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="项目状态"><el-radio-group v-model="editForm.status"><el-radio-button label="进行中"/><el-radio-button label="已暂停"/><el-radio-button label="已完结"/></el-radio-group></el-form-item>
        <el-form-item label="项目名称"><el-input v-model="editForm.name" /></el-form-item>
        <el-form-item label="公开简介"><el-input v-model="editForm.intro" type="textarea" rows="3" /></el-form-item>
        <el-form-item label="内部详情"><el-input v-model="editForm.details" type="textarea" rows="4" /></el-form-item>
        <el-form-item label="资源配置"><el-input v-model="editForm.internalResources" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="showEditDialog = false">取消</el-button><el-button type="primary" @click="submitUpdate">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="showHonorFormDialog" :title="honorForm.id ? '修改荣誉申请' : '添加项目荣誉'" width="500px">
      <el-alert v-if="honorForm.rejectReason" :title="'🚫 被驳回原因：' + honorForm.rejectReason" type="error" :closable="false" style="margin-bottom: 15px;" show-icon />
      <el-form :model="honorForm" label-width="80px">
        <el-form-item label="荣誉名称">
          <el-input v-model="honorForm.content" placeholder="请输入荣誉名称" />
        </el-form-item>
        <el-form-item label="证明材料">
          <el-upload class="upload-demo" action="/api/files/upload" :limit="1" :on-success="handleUploadSuccess" :on-error="handleUploadError" list-type="picture-card" :file-list="fileList">
            <el-icon><Plus /></el-icon>
          </el-upload>
          <div style="font-size: 12px; color: #999; margin-top: 5px; margin-left: 5px;">请上传证明材料（.jpg/.png格式）</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showHonorFormDialog = false">取消</el-button>
        <el-button type="primary" @click="submitHonor">提交审核</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailDialog" title="荣誉详情" width="500px">
      <div style="text-align: center;">
        <h3 style="color: #d48806; margin-bottom: 20px;">{{ currentHonor?.content }}</h3>
        <p style="text-align: left; font-weight: bold;">证明材料：</p>
        <div style="border: 1px solid #eee; padding: 10px; border-radius: 4px;">
          <img v-if="currentHonor?.proofImage" :src="getImageUrl(currentHonor.proofImage)" style="max-width: 100%; border-radius: 4px;" />
          <span v-else style="color: #999;">未上传证明图片</span>
        </div>
      </div>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'

const route = useRoute()
const project = ref(null)
const taskList = ref([])
const memberList = ref([]) 
const honorList = ref([]) 

const newTaskContent = ref('')
const newMemberName = ref('')
const newHonorContent = ref('') 

const user = JSON.parse(localStorage.getItem('user') || '{}')
const showEditDialog = ref(false)
const editForm = ref({})

// 荣誉变量
const showHonorFormDialog = ref(false)
const showDetailDialog = ref(false)
const honorForm = ref({ content: '', proofImage: '' })
const fileList = ref([])
const currentHonor = ref(null)

const canManage = computed(() => {
  if (!project.value) return false
  return user.id === project.value.managerId
})

const initData = async () => {
  await fetchDetail()
  await fetchTasks()
  await fetchMembers() 
  await fetchHonors() 
}

const fetchDetail = async () => { try { const res = await axios.get(`/api/projects/${route.params.id}?userId=${user.id}`); if (res.data.code === 200) project.value = res.data.data } catch (e) {} }
const fetchTasks = async () => { try { const res = await axios.get(`/api/tasks?projectId=${route.params.id}`); if (res.data.code === 200) taskList.value = res.data.data } catch (e) {} }
const fetchMembers = async () => { try { const res = await axios.get(`/api/members?projectId=${route.params.id}`); if (res.data.code === 200) memberList.value = res.data.data } catch (e) {} }

const addMember = async () => { 
  if(!newMemberName.value.trim()) return;
  try {
    const res = await axios.post('/api/members/add', { 
      projectId: project.value.id, 
      realName: newMemberName.value 
    });
    if (res.data.code === 200) {
      ElMessage.success('添加成功')
      newMemberName.value = ''; 
      fetchMembers()
    } else {
      ElMessage.error(res.data.msg)
    }
  } catch (e) {
    ElMessage.error('添加失败，请检查网络')
  }
}

const removeMember = async (m) => { await axios.delete(`/api/members/${m.id}`); fetchMembers() }
const addTask = async () => { if(!newTaskContent.value) return; await axios.post('/api/tasks', { projectId: project.value.id, content: newTaskContent.value }); newTaskContent.value=''; fetchTasks() }
const toggleTask = async (t) => { await axios.post(`/api/tasks/toggle/${t.id}`); fetchTasks() }
const deleteTask = async (t) => { await axios.delete(`/api/tasks/${t.id}`); fetchTasks() }
const openEditDialog = () => { editForm.value = JSON.parse(JSON.stringify(project.value)); showEditDialog.value = true }
const submitUpdate = async () => { await axios.put(`/api/projects?operatorId=${user.id}`, editForm.value); showEditDialog.value=false; fetchDetail() }

// 荣誉逻辑
const fetchHonors = async () => {
  try {
    const res = await axios.get(`/api/honors?projectId=${route.params.id}`)
    if (res.data.code === 200) {
      if (canManage.value) honorList.value = res.data.data
      else honorList.value = res.data.data.filter(h => h.status === 'APPROVED')
    }
  } catch (e) {}
}

const openHonorDialog = () => {
  honorForm.value = { content: '', proofImage: '' }
  fileList.value = []
  showHonorFormDialog.value = true
}

const handleUploadSuccess = (res) => {
  if (res.code === 200) {
    honorForm.value.proofImage = res.data
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error('上传失败: ' + res.msg)
  }
}
const handleUploadError = () => ElMessage.error('上传出错')

const submitHonor = async () => {
  if (!honorForm.value.content) return ElMessage.warning("请填写荣誉名称")
  try {
    await axios.post('/api/honors', { 
      projectId: project.value.id, 
      ...honorForm.value 
    })
    ElMessage.success('已提交审核')
    showHonorFormDialog.value = false
    fetchHonors()
  } catch (e) { ElMessage.error('提交失败') }
}

const showHonorReject = (honor) => {
  honorForm.value = { ...honor } 
  if (honor.proofImage) {
    fileList.value = [{ name: 'proof.jpg', url: getImageUrl(honor.proofImage) }]
  } else {
    fileList.value = []
  }
  showHonorFormDialog.value = true
}

const showHonorDetail = (honor) => {
  currentHonor.value = honor
  showDetailDialog.value = true
}

const deleteHonor = async (id) => {
  try {
    await axios.delete(`/api/honors/${id}`)
    ElMessage.success('已删除')
    fetchHonors()
  } catch (e) {}
}

const getStatusTag = (s) => s === '已完结' ? 'success' : (s === '进行中' ? 'primary' : (s === '已暂停' ? 'danger' : 'info'))
const getHonorTag = (s) => s === 'APPROVED' ? 'success' : (s === 'REJECTED' ? 'danger' : 'warning')
const getHonorText = (s) => s === 'APPROVED' ? '已通过' : (s === 'REJECTED' ? '已驳回' : '审核中')
const getImageUrl = (path) => {
  if (!path) return ''
  return path.startsWith('http') ? path : path
}

onMounted(() => { if(route.params.id) initData() })
</script>

<style scoped>
.detail-container { max-width: 900px; margin: 20px auto; }
.header-actions { display: flex; justify-content: space-between; margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.section { margin-top: 25px; }
.section-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 15px; }
.task-section, .member-section, .honor-section { background: #fdfdfd; padding: 20px; border: 1px solid #ebeef5; border-radius: 8px; }
.content-box { background: #f9f9f9; padding: 15px; border-radius: 4px; line-height: 1.6; }
.secret-section { background: #fff1f0; padding: 15px; border-radius: 8px; border: 1px dashed red; margin-top: 20px; }
.completed-text { text-decoration: line-through; color: #999; }

.member-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; }
.member-card { display: flex; align-items: center; background: white; border: 1px solid #ebeef5; padding: 10px; border-radius: 6px; position: relative; }
.member-card:hover { box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1); }
.member-card.manager { border: 1px solid #409EFF; background: #ecf5ff; }
.avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 10px; flex-shrink: 0; }
.avatar.user { background: #67C23A; } 
.member-card.manager .avatar { background: #409EFF; }
.info .name { font-weight: bold; font-size: 14px; }
.info .role { font-size: 12px; color: #999; }
.remove-btn { position: absolute; right: 5px; top: 5px; opacity: 0; transition: opacity 0.2s; }
.member-card:hover .remove-btn { opacity: 1; }

.honor-list { display: flex; flex-direction: column; gap: 10px; }
.honor-item { 
  display: flex; align-items: center; justify-content: space-between;
  background: #fffbf0; border: 1px solid #fcebbd; padding: 10px 15px; border-radius: 6px; 
}
/* 修改序号样式 */
.honor-index {
  font-weight: bold;
  font-size: 15px;
  color: #b06d00; /* 更深的颜色 */
  margin-right: 8px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2); /* 添加阴影 */
  min-width: 24px; /* 固定宽度保持对齐 */
  display: inline-block;
  text-align: center;
  flex-shrink: 0; /* 防止序号被压缩 */
}
.honor-text { font-weight: bold; color: #d48806; font-size: 15px; }
.honor-date { font-size: 12px; color: #999; margin-top: 4px; }
</style>