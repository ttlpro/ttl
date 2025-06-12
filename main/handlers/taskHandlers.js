const { ipcMain } = require('electron');
const TaskManager = require('../../lib/task-manager');
const { log, error } = require('../../lib/logger');

// Khởi tạo task manager instance
let taskManagerInstance = null;

const taskHandlers = (storageManager) => {
  // Lazy initialization của task manager với storageManager
  if (!taskManagerInstance) {
    taskManagerInstance = new TaskManager(storageManager);
  }

  return {
    /**
     * Lấy tất cả tasks
     */
    'get-all-tasks': async (event) => {
      try {
        const tasks = await taskManagerInstance.getAllTasks();
        return { success: true, data: tasks };
      } catch (err) {
        console.error('Error getting tasks:', err);
        return { success: false, message: err.message };
      }
    },

    /**
     * Thêm task mới
     */
    'add-task': async (event, taskData) => {
      try {
        const task = await taskManagerInstance.addTask(taskData);
        return { success: true, data: task };
      } catch (err) {
        console.error('Error adding task:', err);
        return { success: false, message: err.message };
      }
    },

    /**
     * Cập nhật task
     */
    'update-task': async (event, taskId, updates) => {
      try {
        const task = await taskManagerInstance.updateTask(taskId, updates);
        return { success: true, data: task };
      } catch (err) {
        console.error('Error updating task:', err);
        return { success: false, message: err.message };
      }
    },

    /**
     * Xóa task
     */
    'delete-task': async (event, taskId) => {
      try {
        await taskManagerInstance.deleteTask(taskId);
        return { success: true };
      } catch (err) {
        console.error('Error deleting task:', err);
        return { success: false, message: err.message };
      }
    },

    /**
     * Bắt đầu task
     */
    'start-task': async (event, taskId) => {
      try {
        await taskManagerInstance.startTask(taskId);
        return { success: true };
      } catch (err) {
        error('Error starting task:', err);
        return { success: false, message: err.message };
      }
    },

    /**
     * Dừng task
     */
    'stop-task': async (event, taskId) => {
      try {
        taskManagerInstance.stopTask(taskId);
        return { success: true };
      } catch (err) {
        error('Error stopping task:', err);
        return { success: false, message: err.message };
      }
    },

    /**
     * Chạy task ngay lập tức
     */
    'run-task-now': async (event, taskId) => {
      try {
        await taskManagerInstance.runTaskNow(taskId);
        return { success: true };
      } catch (err) {
        error('Error running task:', err);
        return { success: false, message: err.message };
      }
    },

    /**
     * Lấy danh sách handlers có sẵn
     */
    'get-available-handlers': async (event) => {
      try {
        const handlers = taskManagerInstance.getAvailableHandlers();
        return { success: true, data: handlers };
      } catch (err) {
        error('Error getting handlers:', err);
        return { success: false, message: err.message };
      }
    },

    /**
     * Toggle task
     */
    'toggle-task': async (event, taskId, enabled) => {
      try {
        const result = await storageManager.toggleTask(taskId, enabled);
        return result;
      } catch (err) {
        console.error('Error toggling task:', err);
        return { success: false, error: err.message };
      }
    },

    /**
     * Lấy thông tin thống kê của task
     */
    'get-task-stats': async (event) => {
      try {
        const result = await storageManager.getTaskStats();
        return result;
      } catch (err) {
        console.error('Error getting task stats:', err);
        return { success: false, error: err.message };
      }
    },


  }
}

// Cleanup khi shutdown
process.on('beforeExit', () => {
  if (taskManagerInstance) {
    taskManagerInstance.cleanup();
  }
});



module.exports = taskHandlers; 