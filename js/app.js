/**
 * RecallFlow Application Controller
 * Handles SPA View Routing, Theme Toggling, LocalStorage State, Notification Toasts,
 * and Web Audio API synthesized alert systems.
 */

class AppController {
    constructor() {
        this.state = {
            tasks: [],
            pomodoroStats: {
                sessionsCompleted: 0
            },
            quizzes: [],
            flashcardDecks: [],
            theme: 'dark',
            themePreset: 'aurora',
            cardsReviewedTotal: 0,
            pomodoroHistory: {}
        };

        // Initialize state, views, and global event listeners
        this.init();
    }

    init() {
        this.loadState();
        this.setupTheme();
        this.setupRouting();
        this.setupModals();
        this.setupNotificationPermission();
        this.setupAudioSettingsUI();
        this.setupKeyboardShortcuts();
        
        // Initial setup for icons
        if (window.feather) {
            window.feather.replace();
        }

        // Redraw chart on window resize
        window.addEventListener('resize', () => {
            const dashView = document.getElementById('view-dashboard');
            if (dashView && dashView.classList.contains('active')) {
                this.renderWeeklyChart();
            }
        });

        // Setup a background interval to check for quiz study reminders every 30 seconds
        setInterval(() => this.checkReviewReminders(), 30000);
        setTimeout(() => this.checkReviewReminders(), 2000); // Check shortly after loading
    }

    // --- State Persistence ---
    loadState() {
        let storedState = localStorage.getItem('recallflow_state');
        if (!storedState) {
            // Fallback & Migrate from AuraStudy
            storedState = localStorage.getItem('aurastudy_state');
            if (storedState) {
                localStorage.setItem('recallflow_state', storedState);
            }
        }
        if (storedState) {
            try {
                this.state = JSON.parse(storedState);
                // Ensure defaults for any new properties
                if (!this.state.pomodoroStats) this.state.pomodoroStats = { sessionsCompleted: 0 };
                if (!this.state.cardsReviewedTotal) this.state.cardsReviewedTotal = 0;
                if (!this.state.pomodoroHistory) this.state.pomodoroHistory = {};
                if (!this.state.themePreset) this.state.themePreset = 'aurora';
            } catch (e) {
                console.error("Failed to parse stored state. Resetting to defaults.", e);
            }
        }
    }

    saveState() {
        localStorage.setItem('recallflow_state', JSON.stringify(this.state));
        this.updateDashboardStats();
    }

    // --- SPA View Routing ---
    setupRouting() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.getAttribute('data-view');
                this.switchView(view);
            });
        });
        
        // Handle views deep links or initial loads
        this.switchView('dashboard');
    }

    switchView(viewId) {
        // Deactivate all views
        document.querySelectorAll('.app-view').forEach(view => {
            view.classList.remove('active');
        });
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Activate selected view
        const targetView = document.getElementById(`view-${viewId}`);
        const targetNavItem = document.querySelector(`.nav-item[data-view="${viewId}"]`);

        if (targetView) {
            targetView.classList.add('active');
        }
        if (targetNavItem) {
            targetNavItem.classList.add('active');
        }

        // Update titles & subtitles
        const titles = {
            dashboard: { title: "Dashboard", subtitle: "Welcome back! Let's accomplish your goals today." },
            todo: { title: "Task Planner", subtitle: "Stay organized and track what needs to be done." },
            pomodoro: { title: "Focus Room", subtitle: "Block out distractions using the Pomodoro technique." },
            quizzes: { title: "Recall Quizzes", subtitle: "Practice retrieval testing to retain knowledge." },
            flashcards: { title: "Spaced Flashcards", subtitle: "Review terms using Leitner system card decks." }
        };

        if (titles[viewId]) {
            document.getElementById('view-title').textContent = titles[viewId].title;
            document.getElementById('view-subtitle').textContent = titles[viewId].subtitle;
        }

        // Trigger updates in respective views when routing to them
        if (viewId === 'dashboard') {
            this.updateDashboardStats();
            this.renderDashboardTasks();
            this.renderDashboardReviews();
            this.renderWeeklyChart();
        } else if (viewId === 'todo' && window.todoModule) {
            window.todoModule.renderTasks();
        } else if (viewId === 'pomodoro' && window.pomodoroModule) {
            window.pomodoroModule.updateTasksDropdown();
            window.pomodoroModule.syncTimerWithGlobal();
        } else if (viewId === 'quizzes' && window.quizModule) {
            window.quizModule.showQuizzesList();
            window.quizModule.renderQuizzesGrid();
        } else if (viewId === 'flashcards' && window.flashcardModule) {
            window.flashcardModule.showDecksList();
            window.flashcardModule.renderDecksGrid();
        }

        if (window.feather) {
            window.feather.replace();
        }
    }

    // --- Theme Management ---
    setupTheme() {
        const toggleBtn = document.getElementById('theme-toggle');
        const root = document.documentElement;

        // Apply loaded theme
        root.setAttribute('data-theme', this.state.theme || 'dark');
        this.updateThemeButton();

        toggleBtn.addEventListener('click', () => {
            const currentTheme = root.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            root.setAttribute('data-theme', newTheme);
            this.state.theme = newTheme;
            this.saveState();
            this.updateThemeButton();
            
            if (window.audioManager) window.audioManager.playClick();
            // Pulse backgrounds color values
            this.showToast(`Switched to ${newTheme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
        });

        // Setup theme presets dots
        const dots = document.querySelectorAll('.theme-dots .theme-dot');
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                const preset = dot.getAttribute('data-theme-preset');
                dots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                
                root.setAttribute('data-theme-preset', preset);
                this.state.themePreset = preset;
                this.saveState();
                
                if (window.audioManager) window.audioManager.playClick();
                this.showToast(`Switched to ${preset.charAt(0).toUpperCase() + preset.slice(1)} Theme`, 'info');
            });
        });

        // Load active preset dots on start
        const loadedPreset = this.state.themePreset || 'aurora';
        root.setAttribute('data-theme-preset', loadedPreset);
        const activeDot = document.querySelector(`.theme-dots .theme-dot[data-theme-preset="${loadedPreset}"]`);
        if (activeDot) {
            dots.forEach(d => d.classList.remove('active'));
            activeDot.classList.add('active');
        }
    }

    updateThemeButton() {
        const icon = document.getElementById('theme-icon');
        const text = document.getElementById('theme-text');
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        if (icon && text) {
            if (isDark) {
                icon.setAttribute('data-feather', 'sun');
                text.textContent = "Light Mode";
            } else {
                icon.setAttribute('data-feather', 'moon');
                text.textContent = "Dark Mode";
            }
            if (window.feather) window.feather.replace();
        }
    }

    // --- Dynamic Stats Calculations ---
    updateDashboardStats() {
        // 1. Task Done counter
        const totalTasks = this.state.tasks.length;
        const completedTasks = this.state.tasks.filter(t => t.completed).length;
        const taskVal = document.getElementById('stat-tasks-completed');
        if (taskVal) taskVal.textContent = `${completedTasks}/${totalTasks}`;

        // 2. Pomodoro Count
        const pomoVal = document.getElementById('stat-pomo-sessions');
        if (pomoVal) pomoVal.textContent = this.state.pomodoroStats.sessionsCompleted || 0;

        // 3. Quiz average accuracy
        const accuracies = this.state.quizzes
            .filter(q => q.accuracyHistory && q.accuracyHistory.length > 0)
            .map(q => q.accuracyHistory[q.accuracyHistory.length - 1]);
        
        let avgAccuracy = 0;
        if (accuracies.length > 0) {
            avgAccuracy = Math.round(accuracies.reduce((a, b) => a + b, 0) / accuracies.length);
        }
        const accuracyVal = document.getElementById('stat-quiz-accuracy');
        if (accuracyVal) accuracyVal.textContent = `${avgAccuracy}%`;

        // 4. Flashcards reviewed total
        const cardsVal = document.getElementById('stat-cards-reviewed');
        if (cardsVal) cardsVal.textContent = this.state.cardsReviewedTotal || 0;
    }

    renderDashboardTasks() {
        const container = document.getElementById('dash-tasks-list');
        if (!container) return;

        // Render top 3 pending/in-progress tasks
        const pendingTasks = this.state.tasks
            .filter(t => !t.completed)
            .sort((a, b) => {
                // High priority first, then due date
                const priorities = { high: 3, medium: 2, low: 1 };
                if (priorities[b.priority] !== priorities[a.priority]) {
                    return priorities[b.priority] - priorities[a.priority];
                }
                return new Date(a.dueDate) - new Date(b.dueDate);
            })
            .slice(0, 3);

        if (pendingTasks.length === 0) {
            container.innerHTML = `<div class="no-active-task">No urgent tasks remaining. Great job!</div>`;
            return;
        }

        container.innerHTML = pendingTasks.map(task => {
            const formattedDate = new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            return `
                <div class="dash-item upcoming-task-item">
                    <div style="display:flex; flex-direction:column; gap:0.15rem;">
                        <span style="font-weight:600; font-size:0.9rem;">${task.title}</span>
                        <div style="display:flex; align-items:center; gap:0.5rem; font-size:0.75rem; color:var(--color-text-muted);">
                            <span><i data-feather="calendar" style="width:12px; height:12px; vertical-align:middle;"></i> ${formattedDate}</span>
                            <span class="todo-subject-tag">${task.subject}</span>
                        </div>
                    </div>
                    <span class="badge badge-${task.priority}">${task.priority}</span>
                </div>
            `;
        }).join('');

        if (window.feather) window.feather.replace();
    }

    renderDashboardReviews() {
        const container = document.getElementById('dash-reviews-list');
        if (!container) return;

        const dueReviews = [];
        const now = new Date();

        // Check Quizzes
        this.state.quizzes.forEach(quiz => {
            const nextDue = new Date(quiz.nextReviewDue);
            if (nextDue <= now) {
                dueReviews.push({
                    type: 'Quiz',
                    title: quiz.title,
                    dueTime: nextDue,
                    icon: 'help-circle'
                });
            }
        });

        // Check Flashcard Decks (due if there are cards inside whose nextReview <= now)
        this.state.flashcardDecks.forEach(deck => {
            const dueCards = deck.cards.filter(c => new Date(c.nextReview) <= now).length;
            if (dueCards > 0) {
                dueReviews.push({
                    type: 'Flashcards',
                    title: `${deck.title} (${dueCards} cards due)`,
                    dueTime: new Date(), // Just label as now
                    icon: 'layers'
                });
            }
        });

        if (dueReviews.length === 0) {
            container.innerHTML = `<div class="no-active-task">All caught up! No scheduled reviews due.</div>`;
            return;
        }

        container.innerHTML = dueReviews.map(item => `
            <div class="dash-item due-alert-item" style="cursor:pointer;" onclick="app.switchView('${item.type === 'Quiz' ? 'quizzes' : 'flashcards'}')">
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <i data-feather="${item.icon}" style="color:var(--color-warning); width:18px; height:18px;"></i>
                    <span style="font-weight:600; font-size:0.9rem;">${item.title}</span>
                </div>
                <span class="badge badge-medium">${item.type}</span>
            </div>
        `).join('');

        if (window.feather) window.feather.replace();
    }

    // --- Spaced Repetition Reminders ---
    checkReviewReminders() {
        const now = new Date();
        
        // Loop over quizzes
        this.state.quizzes.forEach(quiz => {
            const nextDue = new Date(quiz.nextReviewDue);
            // If quiz is due, and we haven't notified the user in this session yet
            if (nextDue <= now && !quiz._notified) {
                quiz._notified = true;
                this.triggerNotification(
                    "Active Recall Reminder!", 
                    `The quiz "${quiz.title}" is ready for review to strengthen retention.`
                );
                this.renderDashboardReviews(); // Redraw dashboard
            }
        });
    }

    // --- Modal Event Binding Utility ---
    setupModals() {
        // Find triggers
        const modalTriggers = [
            { btn: 'add-task-trigger', modal: 'modal-add-task' },
            { btn: 'create-quiz-trigger', modal: 'modal-create-quiz' },
            { btn: 'create-deck-trigger', modal: 'modal-create-deck' }
        ];

        modalTriggers.forEach(t => {
            const btnEl = document.getElementById(t.btn);
            if (btnEl) {
                btnEl.addEventListener('click', () => this.openModal(t.modal));
            }
        });

        // Find closes
        document.querySelectorAll('[data-close-modal]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const openModal = btn.closest('.modal-overlay');
                if (openModal) {
                    this.closeModal(openModal.id);
                }
            });
        });

        // Close on clicking overlay background
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal(overlay.id);
                }
            });
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            
            // If it's the quiz builder modal, reset dynamic questions
            if (modalId === 'modal-create-quiz' && window.quizModule) {
                window.quizModule.resetBuilder();
            }
            // If it's the deck creator modal, reset dynamic cards
            if (modalId === 'modal-create-deck' && window.flashcardModule) {
                window.flashcardModule.resetBuilder();
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // --- Custom Notifications Engine (Toasts & Web Notifications) ---
    setupNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            // Quietly request notification permission
            setTimeout(() => {
                Notification.requestPermission();
            }, 5000);
        }
    }

    triggerNotification(title, message) {
        // Try Native OS Notifications first if supported/permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(title, {
                    body: message,
                    icon: '/favicon.ico' // fallback
                });
            } catch (e) {
                console.error("Failed to show native notification", e);
            }
        }
        
        // Always show Toast fallback inside the app
        this.showToast(`${title}: ${message}`, 'warning');
        this.playNotificationSound();
    }

    showToast(message, type = 'success') {
        const root = document.getElementById('toast-root');
        if (!root) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'check-circle',
            info: 'info',
            warning: 'alert-triangle',
            danger: 'x-circle'
        };

        toast.innerHTML = `
            <i data-feather="${icons[type]}"></i>
            <div class="toast-message">${message}</div>
            <span class="toast-close">&times;</span>
        `;

        root.appendChild(toast);
        if (window.feather) window.feather.replace();

        // Click close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        // Auto remove
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s reverse forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    // --- Web Audio API Synth Alarm ---
    playNotificationSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Triple pleasant chiming tone
            const playTone = (freq, time, duration) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, time);
                
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
                
                osc.start(time);
                osc.stop(time + duration);
            };

            const now = audioCtx.currentTime;
            playTone(523.25, now, 0.4);       // C5
            playTone(659.25, now + 0.15, 0.4);  // E5
            playTone(783.99, now + 0.3, 0.6);   // G5
        } catch (e) {
            console.warn("Audio Context playback failed or blocked.", e);
        }
    }
    
    playTimerEndSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const now = audioCtx.currentTime;
            
            // Rising focus accomplishment buzzer sound
            const playTone = (freq, time, duration, type='triangle') => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = type;
                osc.frequency.setValueAtTime(freq, time);
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.2, time + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
                osc.start(time);
                osc.stop(time + duration);
            };

            playTone(440, now, 0.3); // A4
            playTone(554.37, now + 0.2, 0.3); // C#5
            playTone(659.25, now + 0.4, 0.5); // E5
            playTone(880, now + 0.6, 0.8, 'sine'); // A5
        } catch (e) {
            console.warn("Audio timer end sound failed to play", e);
        }
    }

    showConfirm(title, message, callback) {
        const modal = document.getElementById('modal-confirm');
        const titleEl = document.getElementById('confirm-title');
        const messageEl = document.getElementById('confirm-message');
        const okBtn = document.getElementById('confirm-ok-btn');
        const cancelBtn = document.getElementById('confirm-cancel-btn');
        const closeBtn = modal ? modal.querySelector('.modal-close') : null;

        if (!modal || !titleEl || !messageEl || !okBtn || !cancelBtn) {
            const result = confirm(message);
            callback(result);
            return;
        }

        titleEl.textContent = title;
        messageEl.textContent = message;

        modal.classList.add('active');

        const cleanupAndClose = (result) => {
            modal.classList.remove('active');
            // Remove listeners by cloning nodes
            okBtn.replaceWith(okBtn.cloneNode(true));
            cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            if (closeBtn) closeBtn.replaceWith(closeBtn.cloneNode(true));
            callback(result);
        };

        // Re-get elements after cloning to bind fresh event listeners
        const newOkBtn = document.getElementById('confirm-ok-btn');
        const newCancelBtn = document.getElementById('confirm-cancel-btn');
        const newCloseBtn = modal.querySelector('.modal-close');

        newOkBtn.addEventListener('click', () => cleanupAndClose(true));
        newCancelBtn.addEventListener('click', () => cleanupAndClose(false));
        if (newCloseBtn) {
            newCloseBtn.addEventListener('click', () => cleanupAndClose(false));
        }

        const outsideClickListener = (e) => {
            if (e.target === modal) {
                modal.removeEventListener('click', outsideClickListener);
                cleanupAndClose(false);
            }
        };
        modal.addEventListener('click', outsideClickListener);
    }

    renderWeeklyChart() {
        const svg = document.getElementById('weekly-chart-svg');
        if (!svg) return;
        svg.innerHTML = ''; // clear

        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const now = new Date();
        const last7Days = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dayStr = d.toISOString().split('T')[0];
            last7Days.push({
                label: daysOfWeek[d.getDay()],
                dateStr: dayStr,
                count: this.state.pomodoroHistory[dayStr] || 0
            });
        }

        // Max count for scaling
        const maxCount = Math.max(...last7Days.map(d => d.count), 4); // base scaling is at least 4 pomos

        const containerWidth = svg.clientWidth || 600;
        const containerHeight = svg.clientHeight || 160;
        
        const paddingLeft = 30;
        const paddingRight = 10;
        const paddingTop = 15;
        const paddingBottom = 20;

        const chartWidth = containerWidth - paddingLeft - paddingRight;
        const chartHeight = containerHeight - paddingTop - paddingBottom;

        // Draw horizontal grid lines and labels
        const gridLinesCount = 4;
        for (let i = 0; i <= gridLinesCount; i++) {
            const yVal = paddingTop + (chartHeight / gridLinesCount) * i;
            const value = Math.round(maxCount - (maxCount / gridLinesCount) * i);
            
            // Draw grid line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', paddingLeft);
            line.setAttribute('y1', yVal);
            line.setAttribute('x2', containerWidth - paddingRight);
            line.setAttribute('y2', yVal);
            line.setAttribute('class', 'chart-grid-line');
            svg.appendChild(line);

            // Draw value text
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', paddingLeft - 8);
            text.setAttribute('y', yVal + 4);
            text.setAttribute('text-anchor', 'end');
            text.setAttribute('class', 'chart-axis-text');
            text.textContent = value;
            svg.appendChild(text);
        }

        // Draw bars
        const barCount = last7Days.length;
        const gap = 15;
        const barWidth = (chartWidth - (gap * (barCount - 1))) / barCount;

        last7Days.forEach((day, idx) => {
            const barHeight = (day.count / maxCount) * chartHeight;
            const x = paddingLeft + idx * (barWidth + gap);
            const y = paddingTop + chartHeight - barHeight;

            // Bar rect
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x);
            rect.setAttribute('y', y);
            rect.setAttribute('width', barWidth);
            rect.setAttribute('height', Math.max(2, barHeight)); // minimum height of 2px
            rect.setAttribute('class', 'chart-bar');
            
            // Tooltip title
            const titleNode = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            titleNode.textContent = `${day.label}: ${day.count} Pomos`;
            rect.appendChild(titleNode);
            
            svg.appendChild(rect);

            // Day label text
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x + barWidth / 2);
            text.setAttribute('y', paddingTop + chartHeight + 15);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('class', 'chart-axis-text');
            text.textContent = day.label;
            svg.appendChild(text);
        });
    }

    setupAudioSettingsUI() {
        const audioTrigger = document.getElementById('header-audio-settings');
        if (audioTrigger) {
            audioTrigger.addEventListener('click', () => {
                if (window.audioManager) window.audioManager.playClick();
                this.openModal('modal-audio-settings');
            });
        }

        const shortcutsTrigger = document.getElementById('header-shortcuts-trigger');
        if (shortcutsTrigger) {
            shortcutsTrigger.addEventListener('click', () => {
                if (window.audioManager) window.audioManager.playClick();
                this.openModal('modal-keyboard-shortcuts');
            });
        }

        // Setup audio settings controls
        const muteBtn = document.getElementById('settings-mute-toggle');
        const muteIcon = document.getElementById('mute-btn-icon');
        const masterVol = document.getElementById('settings-master-volume');
        const masterLabel = document.getElementById('settings-master-vol-label');
        const tickingToggle = document.getElementById('settings-ticking-toggle');

        if (muteBtn && window.audioManager) {
            muteBtn.addEventListener('click', () => {
                const currentMute = window.audioManager.isMuted;
                window.audioManager.setMuted(!currentMute);
                if (muteIcon) {
                    muteIcon.setAttribute('data-feather', !currentMute ? 'volume-x' : 'volume-2');
                    if (window.feather) window.feather.replace();
                }
                window.audioManager.playClick();
            });
        }

        if (masterVol && window.audioManager) {
            masterVol.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                window.audioManager.setGlobalVolume(val / 100);
                if (masterLabel) masterLabel.textContent = `${val}%`;
            });
        }

        if (tickingToggle && window.audioManager) {
            tickingToggle.addEventListener('change', (e) => {
                window.audioManager.isTickingEnabled = e.target.checked;
                window.audioManager.playClick();
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Bypass hotkeys inside editable inputs
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
                return;
            }

            const key = e.key.toLowerCase();

            // Navigation hotkeys
            if (key === 'd') { this.switchView('dashboard'); e.preventDefault(); }
            else if (key === 't') { this.switchView('todo'); e.preventDefault(); }
            else if (key === 'p') { this.switchView('pomodoro'); e.preventDefault(); }
            else if (key === 'q') { this.switchView('quizzes'); e.preventDefault(); }
            else if (key === 'f') { this.switchView('flashcards'); e.preventDefault(); }
            // Add Task: N
            else if (key === 'n') { this.openModal('modal-add-task'); e.preventDefault(); }
            // Spacebar: Start/Pause Pomodoro
            else if (e.key === ' ') {
                if (window.pomodoroModule) {
                    window.pomodoroModule.toggleTimer();
                    e.preventDefault();
                }
            }
            // ArrowRight / Enter for Next question / Flashcard flips
            else if (e.key === 'ArrowRight' || e.key === 'Enter') {
                const quizPlay = document.getElementById('quizzes-play-panel');
                if (quizPlay && quizPlay.classList.contains('active')) {
                    if (window.quizModule) window.quizModule.navigateQuestion(1);
                    e.preventDefault();
                }

                const cardStudy = document.getElementById('deck-study-panel');
                if (cardStudy && cardStudy.classList.contains('active')) {
                    if (window.flashcardModule) {
                        if (!window.flashcardModule.isFlipped) {
                            window.flashcardModule.revealCard();
                        }
                    }
                    e.preventDefault();
                }
            }
            // ArrowLeft: previous quiz question
            else if (e.key === 'ArrowLeft') {
                const quizPlay = document.getElementById('quizzes-play-panel');
                if (quizPlay && quizPlay.classList.contains('active')) {
                    if (window.quizModule) window.quizModule.navigateQuestion(-1);
                    e.preventDefault();
                }
            }
            // Flashcard ratings: 1, 2, 3
            else if (key === '1') {
                const cardStudy = document.getElementById('deck-study-panel');
                if (cardStudy && cardStudy.classList.contains('active') && window.flashcardModule.isFlipped) {
                    if (window.flashcardModule) window.flashcardModule.handleCardRating('hard');
                    e.preventDefault();
                }
            }
            else if (key === '2') {
                const cardStudy = document.getElementById('deck-study-panel');
                if (cardStudy && cardStudy.classList.contains('active') && window.flashcardModule.isFlipped) {
                    if (window.flashcardModule) window.flashcardModule.handleCardRating('medium');
                    e.preventDefault();
                }
            }
            else if (key === '3') {
                const cardStudy = document.getElementById('deck-study-panel');
                if (cardStudy && cardStudy.classList.contains('active') && window.flashcardModule.isFlipped) {
                    if (window.flashcardModule) window.flashcardModule.handleCardRating('easy');
                    e.preventDefault();
                }
            }
        });
    }
}

// Instantiate global app controller
window.app = new AppController();
