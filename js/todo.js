/**
 * RecallFlow Todo Module
 * Handles creating, rendering, deleting, priority tags filtering,
 * and integration with Pomodoro timer.
 */

class TodoModule {
    constructor() {
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        // Setup Form Submissions
        const taskForm = document.getElementById('add-task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => this.handleAddTask(e));
        }

        // Setup filter buttons
        const filterBtns = document.querySelectorAll('.todo-filters .filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFilter = btn.getAttribute('data-filter');
                this.renderTasks();
            });
        });

        // Set default due date to tomorrow
        const dateInput = document.getElementById('task-due-date');
        if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.value = tomorrow.toISOString().split('T')[0];
        }

        this.renderTasks();
    }

    handleAddTask(e) {
        e.preventDefault();

        const title = document.getElementById('task-title-input').value.trim();
        const description = document.getElementById('task-desc-input').value.trim();
        const subject = document.getElementById('task-subject-input').value.trim() || 'General';
        const priority = document.getElementById('task-priority-input').value;
        const dueDate = document.getElementById('task-due-date').value;
        const estimatedPomodoros = parseInt(document.getElementById('task-pomodoros-input').value) || 2;

        if (!title || !dueDate) {
            window.app.showToast("Task title and due date are required!", "danger");
            return;
        }

        const newTask = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            title,
            description,
            subject,
            priority,
            dueDate,
            estimatedPomodoros,
            completedPomodoros: 0,
            completed: false
        };

        window.app.state.tasks.push(newTask);
        window.app.saveState();

        // Reset and close
        e.target.reset();
        
        // Re-set default date to tomorrow
        const dateInput = document.getElementById('task-due-date');
        if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.value = tomorrow.toISOString().split('T')[0];
        }

        window.app.closeModal('modal-add-task');
        if (window.audioManager) window.audioManager.playClick();
        window.app.showToast("Task created successfully!");
        this.renderTasks();
        
        // Update pomodoro tasks list if active
        if (window.pomodoroModule) {
            window.pomodoroModule.updateTasksDropdown();
        }
    }

    toggleTask(taskId) {
        const task = window.app.state.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            window.app.saveState();
            
            if (window.audioManager) {
                if (task.completed) {
                    window.audioManager.playCheck();
                    if (window.confettiManager) window.confettiManager.burst(50); // slight mini burst
                } else {
                    window.audioManager.playClick();
                }
            } else {
                window.app.playNotificationSound();
            }
            
            window.app.showToast(task.completed ? "Task completed! Great job!" : "Task marked active.");
            this.renderTasks();
            
            // Sync dashboard tasks
            window.app.renderDashboardTasks();
        }
    }

    deleteTask(taskId) {
        window.app.state.tasks = window.app.state.tasks.filter(t => t.id !== taskId);
        window.app.saveState();
        if (window.audioManager) window.audioManager.playClick();
        window.app.showToast("Task deleted.", "info");
        this.renderTasks();
        
        // Update pomodoro tasks list if active
        if (window.pomodoroModule) {
            if (window.pomodoroModule.activeTaskId === taskId) {
                window.pomodoroModule.activeTaskId = null;
            }
            window.pomodoroModule.updateTasksDropdown();
        }
        
        // Sync dashboard tasks
        window.app.renderDashboardTasks();
    }

    startPomoForTask(taskId) {
        if (window.pomodoroModule) {
            window.pomodoroModule.activeTaskId = taskId;
            window.app.switchView('pomodoro');
            window.app.showToast("Task linked to your Focus Timer!");
        }
    }

    renderTasks() {
        const listWrapper = document.getElementById('todo-items-list');
        if (!listWrapper) return;

        // Apply filters
        let filteredTasks = window.app.state.tasks;
        if (this.currentFilter === 'pending') {
            filteredTasks = filteredTasks.filter(t => !t.completed);
        } else if (this.currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(t => t.completed);
        } else if (this.currentFilter === 'priority-high') {
            filteredTasks = filteredTasks.filter(t => t.priority === 'high');
        } else if (this.currentFilter === 'priority-medium') {
            filteredTasks = filteredTasks.filter(t => t.priority === 'medium');
        } else if (this.currentFilter === 'priority-low') {
            filteredTasks = filteredTasks.filter(t => t.priority === 'low');
        }

        // Sort: Active first, then high priority, then due date
        filteredTasks.sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            const priorities = { high: 3, medium: 2, low: 1 };
            if (priorities[b.priority] !== priorities[a.priority]) {
                return priorities[b.priority] - priorities[a.priority];
            }
            return new Date(a.dueDate) - new Date(b.dueDate);
        });

        // Update counts
        const allCount = window.app.state.tasks.length;
        const pendingCount = window.app.state.tasks.filter(t => !t.completed).length;
        const completedCount = allCount - pendingCount;

        const countAll = document.getElementById('count-all-tasks');
        const countPending = document.getElementById('count-pending-tasks');
        const countCompleted = document.getElementById('count-completed-tasks');

        if (countAll) countAll.textContent = allCount;
        if (countPending) countPending.textContent = pendingCount;
        if (countCompleted) countCompleted.textContent = completedCount;

        if (filteredTasks.length === 0) {
            listWrapper.innerHTML = `
                <div style="text-align:center; padding:3rem 1.5rem; color:var(--color-text-muted);">
                    <i data-feather="check-circle" style="width:48px; height:48px; margin-bottom:1rem; opacity:0.5;"></i>
                    <p style="font-weight:600;">No tasks found matching this filter.</p>
                </div>
            `;
            if (window.feather) window.feather.replace();
            return;
        }

        listWrapper.innerHTML = filteredTasks.map(task => {
            const formattedDate = new Date(task.dueDate).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
            });
            const pomoGoal = `${task.completedPomodoros}/${task.estimatedPomodoros} pomos`;
            
            return `
                <div class="todo-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                    <div class="todo-left">
                        <div class="todo-checkbox" onclick="window.todoModule.toggleTask('${task.id}')">
                            <i data-feather="check"></i>
                        </div>
                        <div class="todo-details">
                            <span class="todo-title">${task.title}</span>
                            <div class="todo-meta">
                                <div class="todo-meta-item">
                                    <i data-feather="calendar" style="width:12px; height:12px;"></i>
                                    <span>Due ${formattedDate}</span>
                                </div>
                                <div class="todo-meta-item">
                                    <i data-feather="clock" style="width:12px; height:12px;"></i>
                                    <span>${pomoGoal}</span>
                                </div>
                                ${task.description ? `
                                    <div class="todo-meta-item" title="${task.description}">
                                        <i data-feather="info" style="width:12px; height:12px;"></i>
                                        <span style="max-width:180px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">${task.description}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="todo-right">
                        <span class="todo-subject-tag">${task.subject}</span>
                        <span class="badge badge-${task.priority}">${task.priority}</span>
                        <div class="todo-actions">
                            ${!task.completed ? `
                                <button class="action-btn pomodoro" title="Focus on Task" onclick="window.todoModule.startPomoForTask('${task.id}')">
                                    <i data-feather="play"></i>
                                </button>
                            ` : ''}
                            <button class="action-btn delete" title="Delete Task" onclick="window.todoModule.deleteTask('${task.id}')">
                                <i data-feather="trash-2"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        if (window.feather) {
            window.feather.replace();
        }
    }
}

// Instantiate todo module
window.todoModule = new TodoModule();
