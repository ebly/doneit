import { ElMessageBox } from 'element-plus'

/**
 * 显示删除确认对话框
 * @param {Object} options - 配置选项
 * @param {string} options.title - 对话框标题
 * @param {string} options.message - 确认消息
 * @param {string} options.confirmButtonText - 确认按钮文字
 * @param {string} options.cancelButtonText - 取消按钮文字
 * @returns {Promise<boolean>} - 用户是否确认
 */
export const showDeleteConfirm = async (options = {}) => {
  try {
    await ElMessageBox.confirm(
      options.message || 'Are you sure you want to delete this item?',
      options.title || 'Delete',
      {
        confirmButtonText: options.confirmButtonText || 'Delete',
        cancelButtonText: options.cancelButtonText || 'Cancel',
        type: 'warning',
      }
    )
    return true
  } catch {
    return false
  }
}

/**
 * 显示通用确认对话框
 * @param {Object} options - 配置选项
 * @param {string} options.title - 对话框标题
 * @param {string} options.message - 确认消息
 * @param {string} options.confirmButtonText - 确认按钮文字
 * @param {string} options.cancelButtonText - 取消按钮文字
 * @param {string} options.type - 对话框类型 (success, info, warning, error)
 * @returns {Promise<boolean>} - 用户是否确认
 */
export const showConfirm = async (options = {}) => {
  try {
    await ElMessageBox.confirm(
      options.message || 'Are you sure?',
      options.title || 'Confirm',
      {
        confirmButtonText: options.confirmButtonText || 'Confirm',
        cancelButtonText: options.cancelButtonText || 'Cancel',
        type: options.type || 'info',
      }
    )
    return true
  } catch {
    return false
  }
}
