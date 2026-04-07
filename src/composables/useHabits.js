import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { showDeleteConfirm } from '../utils/confirm.js'
import { getHabits, addHabit as addHabitToStorage, updateHabit, deleteHabit as deleteHabitFromStorage } from '../services/storage.js'

/**
 * 习惯管理组合式函数
 * @returns {Object} 习惯相关的方法和状态
 */
export const useHabits = () => {
  const habits = ref([])
  const showAddForm = ref(false)
  const editingHabit = ref(null)

  // 加载习惯数据
  const loadHabits = async () => {
    try {
      const loadedHabits = await getHabits()
      habits.value = loadedHabits
    } catch (error) {
      console.error('[ERROR] Failed to load habits:', error)
    }
  }

  // 添加或更新习惯
  const handleAddHabit = async (habit) => {
    try {
      if (editingHabit.value) {
        // 编辑模式
        await updateHabit(editingHabit.value.id, habit)
      } else {
        // 添加模式
        await addHabitToStorage(habit)
      }
      await loadHabits()
      showAddForm.value = false
      editingHabit.value = null
    } catch (error) {
      console.error('[ERROR] Failed to save habit:', error)
      throw error
    }
  }

  // 开始编辑习惯
  const startEditHabit = (habit) => {
    editingHabit.value = habit
    showAddForm.value = true
  }

  // 取消编辑
  const cancelEditHabit = () => {
    showAddForm.value = false
    editingHabit.value = null
  }

  // 删除习惯
  const handleDeleteHabit = async (id) => {
    const confirmed = await showDeleteConfirm({
      title: 'Delete Habit?',
      message: 'This will permanently delete the habit and all its check-in records. This action cannot be undone.',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    })

    if (confirmed) {
      try {
        await deleteHabitFromStorage(id)
        await loadHabits()
        ElMessage({
          type: 'success',
          message: 'Habit deleted successfully',
        })
      } catch (error) {
        console.error('[ERROR] Failed to delete habit:', error)
        ElMessage({
          type: 'error',
          message: 'Failed to delete habit',
        })
      }
    }
  }

  return {
    habits,
    showAddForm,
    editingHabit,
    loadHabits,
    handleAddHabit,
    startEditHabit,
    cancelEditHabit,
    handleDeleteHabit
  }
}
