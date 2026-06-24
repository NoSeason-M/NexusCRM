<script setup>
import { ref, onMounted } from 'vue'
import { getTodos, updateTodo, deleteTodo } from '@/api/dashboard'
import { formatDate } from '@/utils/format'
import ActivityFormDialog from './ActivityFormDialog.vue'

const emit = defineEmits(['add-todo'])

const todos = ref([])
const loading = ref(false)
const error = ref('')

// 编辑/查看弹窗
const dialogVisible = ref(false)
const editingTodo = ref(null)

async function fetchTodos() {
  loading.value = true
  error.value = ''
  try {
    const res = await getTodos()
    todos.value = res.data
  } catch (e) {
    error.value = e.response?.data?.message || e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

async function handleToggle(todo) {
  const statusMap = { pending: 'in_progress', in_progress: 'completed', completed: 'pending' }
  const newStatus = statusMap[todo.status]
  try {
    await updateTodo(todo.id, { status: newStatus })
    todo.status = newStatus
  } catch {
    // 更新失败保持原样
  }
}

function handleEdit(todo) {
  editingTodo.value = { ...todo }
  dialogVisible.value = true
}

function handleAdd() {
  editingTodo.value = null
  dialogVisible.value = true
}

async function handleDelete(todo) {
  try {
    await deleteTodo(todo.id)
    todos.value = todos.value.filter(t => t.id !== todo.id)
  } catch {
    // ignore
  }
}

function onDialogSuccess() {
  dialogVisible.value = false
  editingTodo.value = null
  fetchTodos()
}

const priorityConfig = {
  high: { label: '高', type: 'danger' },
  medium: { label: '中', type: 'warning' },
  low: { label: '低', type: 'info' }
}

const statusText = {
  pending: '待处理',
  in_progress: '进行中',
  completed: '已完成'
}

onMounted(() => {
  fetchTodos()
})
</script>

<template>
  <div class="todo-list-card">
    <div class="todo-list-header">
      <h3 class="todo-list-title">
        <el-icon><List /></el-icon>
        待办事项
      </h3>
      <el-button type="primary" size="small" @click="handleAdd">
        <el-icon><Plus /></el-icon> 新增待办
      </el-button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="todo-loading">
      <div class="spinner-sm" />
      <span>加载中...</span>
    </div>

    <!-- 错误状态 -->
    <el-alert
      v-else-if="error"
      :title="error"
      type="error"
      show-icon
      closable
      class="todo-error"
    />

    <!-- 待办列表 -->
    <div v-else-if="todos.length === 0" class="todo-empty">
      <el-empty :image-size="60" description="暂无待办事项" />
    </div>

    <div v-else class="todo-items">
      <div
        v-for="todo in todos"
        :key="todo.id"
        class="todo-item"
        :class="{ 'is-completed': todo.status === 'completed' }"
      >
        <el-checkbox
          :model-value="todo.status === 'completed'"
          :indeterminate="todo.status === 'in_progress'"
          @change="handleToggle(todo)"
          class="todo-checkbox"
        />
        <div class="todo-content">
          <div class="todo-title-row">
            <el-tag
              :type="priorityConfig[todo.priority]?.type"
              size="small"
              class="todo-priority"
            >
              {{ priorityConfig[todo.priority]?.label }}
            </el-tag>
            <span class="todo-title" :class="{ done: todo.status === 'completed' }">
              {{ todo.title }}
            </span>
            <el-tag size="small" effect="plain" class="todo-status-tag">
              {{ statusText[todo.status] }}
            </el-tag>
          </div>
          <div class="todo-meta">
            <span class="todo-customer">{{ todo.customerName }}</span>
            <span v-if="todo.dueAt" class="todo-due">
              <el-icon><Clock /></el-icon>
              截止 {{ formatDate(todo.dueAt) }}
            </span>
          </div>
        </div>
        <div class="todo-actions">
          <el-button text size="small" @click="handleEdit(todo)">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button text size="small" type="danger" @click="handleDelete(todo)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <ActivityFormDialog
      v-model:visible="dialogVisible"
      type="todo"
      :edit-data="editingTodo"
      @success="onDialogSuccess"
    />
  </div>
</template>

<style lang="scss" scoped>
.todo-list-card {
  background: $bg-white;
  border-radius: $border-radius-large;
  padding: 20px;
}

.todo-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.todo-list-title {
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}

.todo-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  color: $text-secondary;
  font-size: 14px;
}

.spinner-sm {
  width: 16px;
  height: 16px;
  border: 2px solid $border-lighter;
  border-top-color: $brand-color;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.todo-error {
  margin-bottom: 12px;
}

.todo-empty {
  padding: 20px 0;
}

.todo-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border: 1px solid $border-lighter;
  border-radius: $border-radius-medium;
  transition: background-color 0.2s;

  &:hover {
    background-color: $bg-page;

    .todo-actions {
      opacity: 1;
    }
  }

  &.is-completed {
    background-color: rgba(103, 194, 58, 0.04);
    border-color: $border-light;
  }
}

.todo-checkbox {
  margin-top: 3px;
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.todo-priority {
  flex-shrink: 0;
}

.todo-title {
  font-size: 14px;
  color: $text-primary;
  font-weight: 500;

  &.done {
    text-decoration: line-through;
    color: $text-placeholder;
  }
}

.todo-status-tag {
  font-size: 11px;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 6px;
  font-size: 12px;
  color: $text-secondary;
}

.todo-customer {
  color: $brand-color;
}

.todo-due {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.todo-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
}
</style>
