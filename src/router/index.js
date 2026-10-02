import { createRouter, createWebHistory } from 'vue-router'
import ScanApplyView from '../views/ScanApplyView.vue'
import ProfileTemplatesView from '../views/ProfileTemplatesView.vue'
import TrackerView from '../views/TrackerView.vue'
import SettingsView from '../views/SettingsView.vue'

const routes = [
  {
    path: '/',
    name: 'scan-apply',
    component: ScanApplyView
  },
  {
    path: '/templates',
    name: 'templates',
    component: ProfileTemplatesView
  },
  {
    path: '/tracker',
    name: 'tracker',
    component: TrackerView
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
