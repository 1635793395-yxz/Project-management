import { createRouter, createWebHistory } from 'vue-router'
import ProjectDetail from '../views/ProjectDetail.vue'
import Register from '../views/Register.vue'
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
import AdminDashboard from '../views/AdminDashboard.vue'
import HelpCenter from '../views/HelpCenter.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' }, // 默认改成跳登录页
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/home', component: Home },
    { path: '/project/:id', component: ProjectDetail },
    { path: '/admin-dashboard', component: AdminDashboard },
    { path: '/help', component: HelpCenter }
  ]
})

export default router