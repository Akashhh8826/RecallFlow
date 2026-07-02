/**
 * RecallFlow Pomodoro Module
 * Manages Work and Break study cycles, links with active Todo tasks,
 * and visual progress ring UI.
 */

class PomodoroModule {
    constructor() {
        this.modes = {
            work: 25 * 60,      // 25 mins
            short: 5 * 60,     // 5 mins
            long: 15 * 60      // 15 mins
        };
        
        this.currentMode = 'work';
        this.timeLeft = this.modes.work;
        this.duration = this.modes.work;
        this.isRunning = false;
        this.timerId = null;
        this.activeTaskId = null;

        // Circular progress parameters
        this.circumference = 2 * Math.PI * 54; // 339.292

        this.init();
    }

    init() {
        // Grab elements
        this.countdownEl = document.getElementById('timer-countdown');
        this.stateLabelEl = document.getElementById('timer-state-label');
        this.progressRing = document.getElementById('timer-progress');
        this.toggleBtn = document.getElementById('timer-toggle-btn');
        this.toggleText = document.getElementById('timer-toggle-text');
        this.playIcon = document.getElementById('timer-play-icon');
        this.resetBtn = document.getElementById('timer-reset-btn');
        this.skipBtn = document.getElementById('timer-skip-btn');
        this.taskSelect = document.getElementById('pomo-task-select');
        this.taskInfoEl = document.getElementById('pomodoro-task-info');

        // Setup Mode Switch Listeners
        const modeButtons = document.querySelectorAll('.timer-modes .timer-mode-btn');
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const mode = btn.getAttribute('data-mode');
                this.switchMode(mode);
            });
        });

        // Toggle button listener
        if (this.toggleBtn) {
            this.toggleBtn.addEventListener('click', () => this.toggleTimer());
        }

        // Reset button listener
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetTimer());
        }

        // Skip button listener
        if (this.skipBtn) {
            this.skipBtn.addEventListener('click', () => this.skipTimer());
        }

        // Dropdown change listener
        if (this.taskSelect) {
            this.taskSelect.addEventListener('change', (e) => {
                this.activeTaskId = e.target.value || null;
                this.updateActiveTaskUI();
            });
        }

        // Initialize state
        this.updateDisplay();
        this.updateTasksDropdown();
        this.updateActiveTaskUI();

        // Ambient Sound Controls
        const trackBtns = document.querySelectorAll('.ambient-track-btn');
        const eqEl = document.getElementById('ambient-eq');
        const ambientVolSlider = document.getElementById('pomo-ambient-volume');
        const ambientVolLabel = document.getElementById('ambient-vol-label');

        trackBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (!window.audioManager) return;
                const track = btn.getAttribute('data-ambient-track');
                
                if (window.audioManager.activeSoundscape === track && window.audioManager.isPlayingAmbient) {
                    // Turn off
                    window.audioManager.stopAmbient();
                    btn.classList.remove('active');
                    if (eqEl) eqEl.classList.remove('animating');
                } else {
                    // Start track
                    trackBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    window.audioManager.playAmbient(track);
                    if (eqEl) eqEl.classList.add('animating');
                }
            });
        });

        if (ambientVolSlider && window.audioManager) {
            ambientVolSlider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                window.audioManager.setAmbientVolume(val / 100);
                if (ambientVolLabel) ambientVolLabel.textContent = `${val}%`;
            });
        }
    }

    switchMode(mode) {
        this.pauseTimer();
        this.currentMode = mode;
        this.duration = this.modes[mode];
        this.timeLeft = this.duration;
        
        // Update styling
        const labels = {
            work: "Work Block",
            short: "Short Break",
            long: "Long Break"
        };
        if (this.stateLabelEl) this.stateLabelEl.textContent = labels[mode];
        
        // Set dynamic progress stroke colors
        if (this.progressRing) {
            if (mode === 'work') {
                this.progressRing.style.stroke = 'var(--color-primary)';
            } else if (mode === 'short') {
                this.progressRing.style.stroke = 'var(--color-secondary)';
            } else {
                this.progressRing.style.stroke = 'var(--color-success)';
            }
        }

        this.updateDisplay();
    }

    toggleTimer() {
        if (this.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.toggleText.textContent = "Pause";
        this.playIcon.setAttribute('data-feather', 'pause');
        if (window.feather) window.feather.replace();

        this.timerId = setInterval(() => {
            if (window.audioManager) window.audioManager.playTimerTick();
            this.timeLeft--;
            this.updateDisplay();

            if (this.timeLeft <= 0) {
                this.timerFinished();
            }
        }, 1000);

        if (window.audioManager) window.audioManager.playClick();
        window.app.showToast(`Timer started for ${this.currentMode} session!`, 'info');
    }

    pauseTimer() {
        if (!this.isRunning) return;

        this.isRunning = false;
        clearInterval(this.timerId);
        this.timerId = null;
        this.toggleText.textContent = "Start";
        this.playIcon.setAttribute('data-feather', 'play');
        if (window.feather) window.feather.replace();
        
        if (window.audioManager) window.audioManager.playClick();
    }

    resetTimer() {
        this.pauseTimer();
        this.timeLeft = this.duration;
        this.updateDisplay();
        if (window.audioManager) window.audioManager.playClick();
        window.app.showToast("Timer reset.");
    }

    skipTimer() {
        this.pauseTimer();
        this.timerFinished(true);
    }

    timerFinished(skipped = false) {
        clearInterval(this.timerId);
        this.isRunning = false;
        
        if (!skipped) {
            if (window.audioManager) {
                window.audioManager.playAlarmSound();
            } else {
                window.app.playTimerEndSound();
            }
            if (window.confettiManager) {
                window.confettiManager.burst();
            }
            
            // Log Session Stats
            if (this.currentMode === 'work') {
                window.app.state.pomodoroStats.sessionsCompleted++;
                
                // Track daily session history count for stats chart
                const todayStr = new Date().toISOString().split('T')[0];
                window.app.state.pomodoroHistory[todayStr] = (window.app.state.pomodoroHistory[todayStr] || 0) + 1;
                
                // Increment target pomo on linked task
                if (this.activeTaskId) {
                    const task = window.app.state.tasks.find(t => t.id === this.activeTaskId);
                    if (task) {
                        task.completedPomodoros++;
                        window.app.showToast(`Completed a session for task: ${task.title}!`, 'success');
                    }
                } else {
                    window.app.showToast("Completed study session!", 'success');
                }
                
                window.app.saveState();
                
                // Prompt user to take a break
                window.app.triggerNotification(
                    "Session Complete!",
                    "Fantastic work! Time for a well-deserved short break."
                );

                // Auto switch to short break
                this.switchMode('short');
                
                // Switch styling inside mode indicators
                const modeBtns = document.querySelectorAll('.timer-modes .timer-mode-btn');
                modeBtns.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.getAttribute('data-mode') === 'short') btn.classList.add('active');
                });
            } else {
                window.app.showToast("Break completed! Let's get back to work.", 'success');
                window.app.triggerNotification(
                    "Break Complete!",
                    "Ready to focus again? Let's begin the next session."
                );
                
                // Switch back to work
                this.switchMode('work');
                const modeBtns = document.querySelectorAll('.timer-modes .timer-mode-btn');
                modeBtns.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.getAttribute('data-mode') === 'work') btn.classList.add('active');
                });
            }
        } else {
            window.app.showToast("Session skipped.");
            // Auto swap to opposite mode
            const nextMode = this.currentMode === 'work' ? 'short' : 'work';
            this.switchMode(nextMode);
            const modeBtns = document.querySelectorAll('.timer-modes .timer-mode-btn');
            modeBtns.forEach(btn => {
                btn.classList.remove('active');
                if (btn.getAttribute('data-mode') === nextMode) btn.classList.add('active');
            });
        }

        // Clean up UI & sync
        this.toggleText.textContent = "Start";
        this.playIcon.setAttribute('data-feather', 'play');
        if (window.feather) window.feather.replace();
        this.updateActiveTaskUI();
        
        // Sync tasks in todo view
        if (window.todoModule) {
            window.todoModule.renderTasks();
        }
    }

    updateDisplay() {
        const mins = Math.floor(this.timeLeft / 60);
        const secs = this.timeLeft % 60;
        const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (this.countdownEl) this.countdownEl.textContent = formatted;
        
        // Update Dashboard timer preview
        const dashTime = document.getElementById('dash-timer-time');
        const dashLabel = document.getElementById('dash-timer-label');
        if (dashTime) dashTime.textContent = formatted;
        if (dashLabel && this.stateLabelEl) dashLabel.textContent = this.stateLabelEl.textContent;

        // Circular progress stroke-dashoffset updates
        if (this.progressRing) {
            const offset = (this.timeLeft / this.duration) * this.circumference;
            this.progressRing.style.strokeDashoffset = this.circumference - offset;
        }
    }

    updateTasksDropdown() {
        if (!this.taskSelect) return;
        
        const tasks = window.app.state.tasks.filter(t => !t.completed);
        
        this.taskSelect.innerHTML = `
            <option value="">-- No Linked Task (General Session) --</option>
            ${tasks.map(t => `<option value="${t.id}" ${this.activeTaskId === t.id ? 'selected' : ''}>${t.title} [${t.subject}]</option>`).join('')}
        `;
    }

    updateActiveTaskUI() {
        if (!this.taskInfoEl) return;
        
        if (!this.activeTaskId) {
            this.taskInfoEl.innerHTML = `<div class="no-active-task">No task selected. Select a task below to attribute your study session to it.</div>`;
            return;
        }

        const task = window.app.state.tasks.find(t => t.id === this.activeTaskId);
        if (!task) {
            this.activeTaskId = null;
            this.taskInfoEl.innerHTML = `<div class="no-active-task">No task selected. Select a task below to attribute your study session to it.</div>`;
            return;
        }

        this.taskInfoEl.innerHTML = `
            <div class="dash-item active-task-card">
                <div>
                    <div class="task-label">Linked Focus Goal</div>
                    <div class="task-title">${task.title}</div>
                    <p style="font-size:0.75rem; color:var(--color-text-muted); margin-top:0.25rem;">
                        Subject: ${task.subject} | Priority: ${task.priority.toUpperCase()} | Pomos: ${task.completedPomodoros}/${task.estimatedPomodoros} Completed
                    </p>
                </div>
                <button class="action-btn delete" onclick="window.pomodoroModule.clearActiveTask()" title="Unlink Task">
                    <i data-feather="x"></i>
                </button>
            </div>
        `;
        
        if (window.feather) window.feather.replace();
        
        // Sync select element dropdown index
        if (this.taskSelect) {
            this.taskSelect.value = this.activeTaskId;
        }
    }

    clearActiveTask() {
        this.activeTaskId = null;
        this.updateActiveTaskUI();
        if (this.taskSelect) this.taskSelect.value = "";
        window.app.showToast("Task unlinked.");
    }

    syncTimerWithGlobal() {
        this.updateTasksDropdown();
        this.updateActiveTaskUI();
        this.updateDisplay();
    }
}

// Instantiate pomodoro module
window.pomodoroModule = new PomodoroModule();
