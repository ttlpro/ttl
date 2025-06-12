const BaseStorage = require('./base-storage');
const { log, error } = require('../logger');

class TaskStorage extends BaseStorage {
    /**
     * Get all tasks
     */
    async getAllTasks() {
        try {
            log(`
                SELECT * FROM tasks 
                ORDER BY createdAt DESC
            `);
            
            const stmt = this.db.prepare(`
                SELECT * FROM tasks 
                ORDER BY createdAt DESC
            `);
            
            const tasks = stmt.all().map(task => ({
                ...task,
                enabled: Boolean(task.enabled),
                // Keep as ISO strings for IPC compatibility
                lastRun: task.lastRun,
                nextRun: task.nextRun,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt
            }));
            
            log(`✅ Successfully read ${tasks.length} tasks from SQLite`);
            return { success: true, data: this.serializeForIPC(tasks) };
        } catch (err) {
            error('❌ Error reading tasks from SQLite:', err);
            return { success: false, error: err.message, data: [] };
        }
    }

    /**
     * Add new task
     */
    async addTask(taskData) {
        try {
            const taskId = this.generateId();
            const now = new Date().toISOString();
            
            const stmt = this.db.prepare(`
                INSERT INTO tasks (
                    id, name, handler, interval, enabled, status,
                    lastRun, nextRun, runCount, errorCount, lastError,
                    createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            stmt.run(
                taskId,
                taskData.name,
                taskData.handler,
                taskData.interval,
                taskData.enabled ? 1 : 0,
                'idle',
                null,
                null,
                0,
                0,
                null,
                now,
                now
            );
            
            log(`✅ Added task: ${taskData.name}`);
            return { success: true, id: taskId };
        } catch (err) {
            error('Error adding task:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Update task
     */
    async updateTask(taskId, updates) {
        try {
            const now = new Date().toISOString();
            
            const setFields = [];
            const values = [];
            
            for (const [key, value] of Object.entries(updates)) {
                if (key === 'enabled') {
                    setFields.push(`${key} = ?`);
                    values.push(value ? 1 : 0);
                } else if (key === 'lastRun' || key === 'nextRun') {
                    setFields.push(`${key} = ?`);
                    values.push(value ? value : null);
                } else {
                    setFields.push(`${key} = ?`);
                    values.push(value);
                }
            }
            
            if (setFields.length === 0) {
                return { success: true };
            }
            
            setFields.push('updatedAt = ?');
            values.push(now);
            values.push(taskId);
            
            const sql = `UPDATE tasks SET ${setFields.join(', ')} WHERE id = ?`;
            const stmt = this.db.prepare(sql);
            
            const result = stmt.run(...values);
            
            if (result.changes > 0) {
                log(`✅ Updated task ${taskId}`);
                return { success: true };
            } else {
                return { success: false, error: 'Task not found' };
            }
        } catch (err) {
            error('Error updating task:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Delete task
     */
    async deleteTask(taskId) {
        try {
            const stmt = this.db.prepare(`DELETE FROM tasks WHERE id = ?`);
            const result = stmt.run(taskId);
            
            if (result.changes > 0) {
                log(`✅ Deleted task ${taskId}`);
                return { success: true };
            } else {
                return { success: false, error: 'Task not found' };
            }
        } catch (err) {
            error('Error deleting task:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Get task by ID
     */
    async getTaskById(taskId) {
        try {
            const stmt = this.db.prepare(`SELECT * FROM tasks WHERE id = ?`);
            const task = stmt.get(taskId);
            
            if (task) {
                return {
                    ...task,
                    enabled: Boolean(task.enabled),
                    lastRun: task.lastRun,
                    nextRun: task.nextRun,
                    createdAt: task.createdAt,
                    updatedAt: task.updatedAt
                };
            }
            
            return null;
        } catch (err) {
            error('Error getting task by ID:', err);
            return null;
        }
    }

    /**
     * Get tasks by status
     */
    async getTasksByStatus(status) {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM tasks 
                WHERE status = ? 
                ORDER BY createdAt DESC
            `);
            
            const tasks = stmt.all(status).map(task => ({
                ...task,
                enabled: Boolean(task.enabled),
                lastRun: task.lastRun,
                nextRun: task.nextRun,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt
            }));
            
            return this.serializeForIPC(tasks);
        } catch (err) {
            error('Error getting tasks by status:', err);
            return [];
        }
    }

    /**
     * Get enabled tasks
     */
    async getEnabledTasks() {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM tasks 
                WHERE enabled = 1 
                ORDER BY createdAt DESC
            `);
            
            const tasks = stmt.all().map(task => ({
                ...task,
                enabled: Boolean(task.enabled),
                lastRun: task.lastRun,
                nextRun: task.nextRun,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt
            }));
            
            return this.serializeForIPC(tasks);
        } catch (err) {
            error('Error getting enabled tasks:', err);
            return [];
        }
    }

    /**
     * Update task status
     */
    async updateTaskStatus(taskId, status, lastError = null) {
        try {
            const updates = { 
                status: status,
                lastRun: new Date().toISOString()
            };
            
            if (status === 'failed' && lastError) {
                updates.lastError = lastError;
                // Increment error count
                const task = await this.getTaskById(taskId);
                if (task) {
                    updates.errorCount = (task.errorCount || 0) + 1;
                }
            } else if (status === 'completed') {
                // Increment run count
                const task = await this.getTaskById(taskId);
                if (task) {
                    updates.runCount = (task.runCount || 0) + 1;
                }
            }
            
            return await this.updateTask(taskId, updates);
        } catch (err) {
            error('Error updating task status:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Set task next run time
     */
    async setTaskNextRun(taskId, nextRunTime) {
        try {
            return await this.updateTask(taskId, { 
                nextRun: nextRunTime ? nextRunTime : null 
            });
        } catch (err) {
            error('Error setting task next run:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Enable/disable task
     */
    async toggleTask(taskId, enabled) {
        try {
            const updates = { enabled: Boolean(enabled) };
            
            // If disabling, clear next run time
            if (!enabled) {
                updates.nextRun = null;
                updates.status = 'idle';
            }
            
            return await this.updateTask(taskId, updates);
        } catch (err) {
            error('Error toggling task:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Get task statistics
     */
    async getTaskStats() {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN enabled = 1 THEN 1 ELSE 0 END) as enabled,
                    SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
                    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
                    SUM(runCount) as totalRuns,
                    SUM(errorCount) as totalErrors
                FROM tasks
            `);
            
            const stats = stmt.get();
            return this.serializeForIPC({
                total: stats.total || 0,
                enabled: stats.enabled || 0,
                disabled: (stats.total || 0) - (stats.enabled || 0),
                running: stats.running || 0,
                failed: stats.failed || 0,
                idle: (stats.total || 0) - (stats.running || 0) - (stats.failed || 0),
                totalRuns: stats.totalRuns || 0,
                totalErrors: stats.totalErrors || 0
            });
        } catch (err) {
            error('Error getting task stats:', err);
            return this.serializeForIPC({
                total: 0, enabled: 0, disabled: 0, running: 0, 
                failed: 0, idle: 0, totalRuns: 0, totalErrors: 0
            });
        }
    }

    /**
     * Clear task errors
     */
    async clearTaskErrors(taskId) {
        try {
            return await this.updateTask(taskId, {
                errorCount: 0,
                lastError: null,
                status: 'idle'
            });
        } catch (err) {
            error('Error clearing task errors:', err);
            return { success: false, error: err.message };
        }
    }

    /**
     * Reset task counters
     */
    async resetTaskCounters(taskId) {
        try {
            return await this.updateTask(taskId, {
                runCount: 0,
                errorCount: 0,
                lastError: null,
                lastRun: null,
                nextRun: null,
                status: 'idle'
            });
        } catch (err) {
            error('Error resetting task counters:', err);
            return { success: false, error: err.message };
        }
    }
}

module.exports = TaskStorage; 