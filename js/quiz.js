/**
 * RecallFlow Quiz Module
 * Handles creating quizzes, taking quizzes with progress-tracking navigation,
 * pre-populating a 10-question default study quiz, and spaced review rescheduling.
 */

class QuizModule {
    constructor() {
        this.activeQuiz = null;
        this.currentQuestionIdx = 0;
        this.selectedAnswers = []; // Indexes of selected options per question
        this.questionStates = [];   // 'correct' | 'wrong' | 'unanswered' per question
        this.score = 0;

        this.init();
    }

    init() {
        this.setupPrepopulatedQuiz();

        // Modal inputs listeners
        const addQuestionBtn = document.getElementById('add-quiz-question-btn');
        if (addQuestionBtn) {
            addQuestionBtn.addEventListener('click', () => this.addQuestionToBuilder());
        }

        const quizForm = document.getElementById('create-quiz-form');
        if (quizForm) {
            quizForm.addEventListener('submit', (e) => this.handleCreateQuiz(e));
        }

        // Active Quiz Controls
        const quitQuizBtn = document.getElementById('quit-quiz-btn');
        if (quitQuizBtn) {
            quitQuizBtn.addEventListener('click', () => this.quitQuiz());
        }

        const prevBtn = document.getElementById('quiz-prev-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigateQuestion(-1));
        }

        const nextBtn = document.getElementById('quiz-next-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigateQuestion(1));
        }

        // Result screen buttons
        const retryBtn = document.getElementById('result-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => this.startQuiz(this.activeQuiz));
        }

        const finishBtn = document.getElementById('result-finish-btn');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => this.finishAndSaveQuiz());
        }

        this.renderQuizzesGrid();
    }

    // --- Pre-populate Sample 10-Question Quiz ---
    setupPrepopulatedQuiz() {
        const defaultQuizzes = [
            {
                id: 'quiz_default_active_recall',
                title: 'Cognitive Science & Active Recall Basics',
                subject: 'Study Science',
                reviewIntervalDays: 1,
                lastReviewed: null,
                nextReviewDue: new Date().toISOString(),
                accuracyHistory: [],
                questions: [
                    {
                        text: "What is Active Recall and why is it effective?",
                        type: "multiple-choice",
                        options: [
                            "Highlighting text and reading it repeatedly to build visual memory.",
                            "Actively retrieval-testing your memory rather than passively reviewing notes.",
                            "Writing long summaries of textbook chapters without looking at the text.",
                            "Studying in a quiet environment without taking any breaks."
                        ],
                        correctAnswer: 1
                    },
                    {
                        text: "According to Ebbinghaus, what does the 'Forgetting Curve' illustrate?",
                        type: "multiple-choice",
                        options: [
                            "Memories fade exponentially over time if no active review takes place.",
                            "People forget information immediately if they don't use the Pomodoro technique.",
                            "Memory loss is linear and happens at the exact same speed for everyone.",
                            "Visual information is retained twice as long as text-based content."
                        ],
                        correctAnswer: 0
                    },
                    {
                        text: "What is the primary objective of Spaced Repetition?",
                        type: "multiple-choice",
                        options: [
                            "Reviewing study materials as many times as possible in one single night.",
                            "Spacing out your classes over a full academic semester.",
                            "Reviewing material at expanding intervals to trigger recall right before forgetting.",
                            "Dividing your study guides into equal-sized card decks."
                        ],
                        correctAnswer: 2
                    },
                    {
                        text: "What is the typical duration of a single standard work block in the Pomodoro Technique?",
                        type: "multiple-choice",
                        options: [
                            "15 minutes",
                            "25 minutes",
                            "45 minutes",
                            "60 minutes"
                        ],
                        correctAnswer: 1
                    },
                    {
                        text: "Which of the following activities is considered a PASSIVE learning method?",
                        type: "multiple-choice",
                        options: [
                            "Answering test practice questions.",
                            "Explaining a topic out loud to a peer.",
                            "Watching a video lecture without taking active notes.",
                            "Writing flashcards from memory."
                        ],
                        correctAnswer: 2
                    },
                    {
                        text: "What does the Feynman Technique involve?",
                        type: "multiple-choice",
                        options: [
                            "Memorizing formulas using mathematical patterns.",
                            "Explaining a complex topic in simple terms, as if teaching a child.",
                            "Studying for 8 hours straight with intense visualization.",
                            "Linking concepts to visual locations in a imaginary 'mind palace'."
                        ],
                        correctAnswer: 1
                    },
                    {
                        text: "How does sleep impact the consolidation of learned information?",
                        type: "multiple-choice",
                        options: [
                            "Sleep has no impact; study volume is the only factor in retention.",
                            "Sleep strengthens neural pathways and stabilizes memories formed during study.",
                            "Sleep clears working memory, meaning you forget what you learned that day.",
                            "Sleep only helps physical motor skills, not academic concepts."
                        ],
                        correctAnswer: 1
                    },
                    {
                        text: "What is 'Cognitive Load Theory' primarily concerned with?",
                        type: "multiple-choice",
                        options: [
                            "How much weights a brain can physically hold.",
                            "Managing working memory capacity to prevent learning overload.",
                            "Ensuring students study under high pressure to build resilience.",
                            "Increasing the amount of text on a slide to speed up reading."
                        ],
                        correctAnswer: 1
                    },
                    {
                        text: "The 'Leitner System' is a structured method used with which study tool?",
                        type: "multiple-choice",
                        options: [
                            "Mind Maps",
                            "Pomodoro Timers",
                            "Flashcards",
                            "Cornell Notes Sheets"
                        ],
                        correctAnswer: 2
                    },
                    {
                        text: "In spaced repetition, if you answer a question correctly, what should happen to its next review date?",
                        type: "multiple-choice",
                        options: [
                            "It should remain the same.",
                            "It should be shortened (e.g., from 3 days to 1 day).",
                            "It should be extended (e.g., from 3 days to 7 days).",
                            "It should be deleted entirely."
                        ],
                        correctAnswer: 2
                    }
                ]
            }
        ];

        if (window.app.state.quizzes.length === 0) {
            window.app.state.quizzes = defaultQuizzes;
            window.app.saveState();
        }
    }

    // --- Quiz Grid rendering ---
    renderQuizzesGrid() {
        const grid = document.getElementById('quizzes-grid-container');
        if (!grid) return;

        if (window.app.state.quizzes.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--color-text-muted);" class="glass-panel">
                    <i data-feather="help-circle" style="width:48px; height:48px; margin-bottom:1rem; opacity:0.5;"></i>
                    <p style="font-weight:600;">No quizzes created yet. Make one now to start reviewing!</p>
                </div>
            `;
            if (window.feather) window.feather.replace();
            return;
        }

        const now = new Date();

        grid.innerHTML = window.app.state.quizzes.map(quiz => {
            const isDue = new Date(quiz.nextReviewDue) <= now;
            const cardStats = `${quiz.questions.length} Questions`;
            
            // Get last score accuracy
            const lastAccuracy = quiz.accuracyHistory && quiz.accuracyHistory.length > 0
                ? `${quiz.accuracyHistory[quiz.accuracyHistory.length - 1]}%`
                : 'Not taken yet';

            const nextReviewLabel = new Date(quiz.nextReviewDue).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
            });

            return `
                <div class="glass-card quiz-card">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:start;">
                            <span class="todo-subject-tag">${quiz.subject}</span>
                            ${isDue ? '<span class="badge badge-high" style="font-size:0.65rem;">Review Due</span>' : `<span class="badge badge-low" style="font-size:0.65rem; color:var(--color-text-muted); border-color:var(--border-glass);">Next: ${nextReviewLabel}</span>`}
                        </div>
                        <h4 class="quiz-card-title" style="margin-top:0.75rem;">${quiz.title}</h4>
                        <div class="quiz-card-stats">
                            <span><i data-feather="help-circle" style="width:12px; height:12px; vertical-align:middle;"></i> ${cardStats}</span>
                            <span>Score: ${lastAccuracy}</span>
                        </div>
                    </div>
                    <div class="quiz-card-actions">
                        <button class="btn btn-primary" onclick="window.quizModule.startQuizById('${quiz.id}')" style="flex:1; padding:0.5rem 1rem; font-size:0.8rem;">
                            <i data-feather="play"></i> Start Quiz
                        </button>
                        <button class="btn btn-secondary btn-icon" onclick="window.quizModule.deleteQuiz('${quiz.id}')" style="width:32px; height:32px; flex-shrink:0;">
                            <i data-feather="trash-2" style="width:14px; height:14px;"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (window.feather) window.feather.replace();
    }

    deleteQuiz(quizId) {
        window.app.state.quizzes = window.app.state.quizzes.filter(q => q.id !== quizId);
        window.app.saveState();
        if (window.audioManager) window.audioManager.playClick();
        window.app.showToast("Quiz deleted.", "info");
        this.renderQuizzesGrid();
        window.app.renderDashboardReviews();
    }

    // --- Quiz Dynamic Builder Modal ---
    resetBuilder() {
        const builderList = document.getElementById('quiz-questions-builder-list');
        if (builderList) {
            builderList.innerHTML = '';
            // Add initial blank question
            this.addQuestionToBuilder();
        }
    }

    addQuestionToBuilder() {
        const builderList = document.getElementById('quiz-questions-builder-list');
        if (!builderList) return;

        const questionIdx = builderList.children.length;
        const qCard = document.createElement('div');
        qCard.className = 'quiz-question-builder-card';
        qCard.innerHTML = `
            <button type="button" class="action-btn delete remove-question-btn" onclick="this.closest('.quiz-question-builder-card').remove();" title="Remove question">
                <i data-feather="x"></i>
            </button>
            <div class="form-group" style="padding-right: 1.5rem;">
                <label>Question #${questionIdx + 1}</label>
                <input type="text" class="form-control question-text-input" placeholder="e.g. What is the value of Pi?" required>
            </div>
            <div class="form-group">
                <label>Options</label>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem; margin-bottom:0.5rem;">
                    <input type="text" class="form-control question-opt-0" placeholder="Option A" required>
                    <input type="text" class="form-control question-opt-1" placeholder="Option B" required>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem;">
                    <input type="text" class="form-control question-opt-2" placeholder="Option C" required>
                    <input type="text" class="form-control question-opt-3" placeholder="Option D" required>
                </div>
            </div>
            <div class="form-group" style="margin-bottom:0;">
                <label>Correct Answer Index</label>
                <select class="form-control question-correct-select">
                    <option value="0">Option A</option>
                    <option value="1">Option B</option>
                    <option value="2">Option C</option>
                    <option value="3">Option D</option>
                </select>
            </div>
        `;

        builderList.appendChild(qCard);
        if (window.feather) window.feather.replace();
    }

    handleCreateQuiz(e) {
        e.preventDefault();

        const title = document.getElementById('quiz-title-input').value.trim();
        const subject = document.getElementById('quiz-subject-input').value.trim() || 'General';
        
        const questionCards = document.querySelectorAll('.quiz-question-builder-card');
        if (questionCards.length === 0) {
            window.app.showToast("At least 1 question is required!", "danger");
            return;
        }

        const questions = [];
        let isValid = true;

        questionCards.forEach(card => {
            const text = card.querySelector('.question-text-input').value.trim();
            const opt0 = card.querySelector('.question-opt-0').value.trim();
            const opt1 = card.querySelector('.question-opt-1').value.trim();
            const opt2 = card.querySelector('.question-opt-2').value.trim();
            const opt3 = card.querySelector('.question-opt-3').value.trim();
            const correctIndex = parseInt(card.querySelector('.question-correct-select').value);

            if (!text || !opt0 || !opt1 || !opt2 || !opt3) {
                isValid = false;
                return;
            }

            questions.push({
                text,
                type: 'multiple-choice',
                options: [opt0, opt1, opt2, opt3],
                correctAnswer: correctIndex
            });
        });

        if (!isValid) {
            window.app.showToast("Please fill in all questions and options!", "danger");
            return;
        }

        const newQuiz = {
            id: 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            title,
            subject,
            reviewIntervalDays: 1,
            lastReviewed: null,
            nextReviewDue: new Date().toISOString(),
            accuracyHistory: [],
            questions
        };

        window.app.state.quizzes.push(newQuiz);
        window.app.saveState();
        
        e.target.reset();
        window.app.closeModal('modal-create-quiz');
        window.app.showToast("Quiz created successfully!");
        this.renderQuizzesGrid();
        window.app.renderDashboardReviews();
    }

    // --- Quiz Execution / Play Mechanics ---
    startQuizById(quizId) {
        const quiz = window.app.state.quizzes.find(q => q.id === quizId);
        if (quiz) {
            this.startQuiz(quiz);
        }
    }

    startQuiz(quiz) {
        this.activeQuiz = quiz;
        this.currentQuestionIdx = 0;
        this.score = 0;
        this.selectedAnswers = Array(quiz.questions.length).fill(null);
        this.questionStates = Array(quiz.questions.length).fill('unanswered');

        // Swap View Panels
        document.getElementById('quizzes-list-panel').classList.remove('active');
        document.getElementById('quizzes-result-panel').classList.remove('active');
        document.getElementById('quizzes-play-panel').classList.add('active');

        // Set Title
        document.getElementById('play-quiz-title').textContent = quiz.title;

        // Render question progress nodes
        this.renderQuestionNavigator();

        // Show first question
        this.showQuestion();
    }

    renderQuestionNavigator() {
        const nav = document.getElementById('quiz-question-navigator');
        if (!nav) return;

        // Visual header node selection tracker (makes 10+ questions highly readable)
        nav.innerHTML = this.activeQuiz.questions.map((q, idx) => {
            let stateClass = '';
            let style = '';
            
            if (this.questionStates[idx] === 'correct') {
                style = 'background:var(--color-success); border-color:var(--color-success); color:white;';
            } else if (this.questionStates[idx] === 'wrong') {
                style = 'background:var(--color-danger); border-color:var(--color-danger); color:white;';
            } else if (idx === this.currentQuestionIdx) {
                style = 'border-color:var(--color-secondary); color:white; background:rgba(255,255,255,0.06);';
            } else if (this.selectedAnswers[idx] !== null) {
                style = 'background:var(--color-primary-glow); border-color:var(--color-primary); color:white;';
            } else {
                style = 'color:var(--color-text-muted); border-color:var(--border-glass);';
            }

            return `
                <div class="glass-btn" 
                     style="width:30px; height:30px; border-radius:50%; border:1px solid; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:600; cursor:pointer; transition:var(--transition-smooth); ${style}"
                     onclick="window.quizModule.goToQuestion(${idx})">
                    ${idx + 1}
                </div>
            `;
        }).join('');
    }

    goToQuestion(idx) {
        if (idx >= 0 && idx < this.activeQuiz.questions.length) {
            this.currentQuestionIdx = idx;
            this.showQuestion();
        }
    }

    showQuestion() {
        const quiz = this.activeQuiz;
        const q = quiz.questions[this.currentQuestionIdx];

        // Update indicators
        document.getElementById('play-quiz-score-tracker').textContent = `Score: ${this.score} / ${quiz.questions.length}`;
        document.getElementById('play-quiz-questions-tracker').textContent = `Question ${this.currentQuestionIdx + 1} of ${quiz.questions.length}`;

        // Question Details
        const badge = document.getElementById('question-badge');
        if (badge) badge.textContent = `Question ${this.currentQuestionIdx + 1}`;
        document.getElementById('question-text-content').textContent = q.text;

        // Render options list
        const optionsWrapper = document.getElementById('question-options-wrapper');
        optionsWrapper.innerHTML = q.options.map((opt, optIdx) => {
            let extraClass = '';
            
            // Check if already answered
            const selectedOpt = this.selectedAnswers[this.currentQuestionIdx];
            if (selectedOpt !== null) {
                if (optIdx === q.correctAnswer) {
                    extraClass = 'correct'; // Highlight correct in green
                } else if (optIdx === selectedOpt) {
                    extraClass = 'wrong'; // Highlight chosen incorrect in red
                }
            }

            return `
                <div class="quiz-option ${extraClass} ${selectedOpt === optIdx ? 'selected' : ''}" 
                     onclick="window.quizModule.selectOption(${optIdx})">
                    <span style="font-weight:700; margin-right:0.75rem; color:var(--color-primary);">${String.fromCharCode(65 + optIdx)}.</span>
                    <span>${opt}</span>
                </div>
            `;
        }).join('');

        // Progress bar updates
        const fill = document.getElementById('quiz-progress-fill');
        if (fill) {
            const percent = ((this.currentQuestionIdx + 1) / quiz.questions.length) * 100;
            fill.style.width = `${percent}%`;
        }

        // Render navigator state updates
        this.renderQuestionNavigator();

        // Control Prev/Next buttons
        const prevBtn = document.getElementById('quiz-prev-btn');
        const nextBtn = document.getElementById('quiz-next-btn');

        if (prevBtn) prevBtn.disabled = this.currentQuestionIdx === 0;

        if (nextBtn) {
            const isLast = this.currentQuestionIdx === quiz.questions.length - 1;
            if (isLast) {
                nextBtn.innerHTML = `Finish Quiz <i data-feather="check"></i>`;
            } else {
                nextBtn.innerHTML = `Next <i data-feather="arrow-right"></i>`;
            }
            if (window.feather) window.feather.replace();
        }
    }

    selectOption(optionIdx) {
        const quiz = this.activeQuiz;
        const q = quiz.questions[this.currentQuestionIdx];
        
        // If already answered, locked out
        if (this.selectedAnswers[this.currentQuestionIdx] !== null) return;

        this.selectedAnswers[this.currentQuestionIdx] = optionIdx;
        
        const isCorrect = optionIdx === q.correctAnswer;
        if (isCorrect) {
            this.score++;
            this.questionStates[this.currentQuestionIdx] = 'correct';
            window.app.showToast("Correct!", "success");
        } else {
            this.questionStates[this.currentQuestionIdx] = 'wrong';
            window.app.showToast("Incorrect answer.", "danger");
        }

        if (window.audioManager) {
            if (isCorrect) {
                window.audioManager.playCheck();
            } else {
                window.audioManager.playClick();
            }
        } else {
            window.app.playNotificationSound();
        }
        
        this.showQuestion(); // Redraw immediately to apply green/red state coloring
    }

    navigateQuestion(direction) {
        const nextIdx = this.currentQuestionIdx + direction;
        const quiz = this.activeQuiz;

        if (nextIdx >= 0 && nextIdx < quiz.questions.length) {
            this.currentQuestionIdx = nextIdx;
            if (window.audioManager) window.audioManager.playClick();
            this.showQuestion();
        } else if (nextIdx >= quiz.questions.length) {
            // Finished! Go to Results Panel
            this.showQuizResults();
        }
    }

    showQuizResults() {
        // Swap panels
        document.getElementById('quizzes-play-panel').classList.remove('active');
        document.getElementById('quizzes-result-panel').classList.add('active');

        const quiz = this.activeQuiz;
        const accuracy = Math.round((this.score / quiz.questions.length) * 100);

        document.getElementById('result-score-percent').textContent = `${accuracy}%`;
        document.getElementById('result-score-fraction').textContent = `You got ${this.score} out of ${quiz.questions.length} questions correct!`;

        // Trigger premium chimes and particles
        if (accuracy >= 70) {
            if (window.audioManager) window.audioManager.playSuccessChime();
            if (window.confettiManager) window.confettiManager.burst(120);
        } else {
            if (window.audioManager) window.audioManager.playClick();
        }

        // Update score average stats
        quiz.accuracyHistory.push(accuracy);

        // Feedback statement
        const feedbackEl = document.getElementById('result-custom-feedback');
        let feedbackText = "";
        if (accuracy === 100) {
            feedbackText = "Perfect score! Outstanding retention of this material. The neural connections are solid!";
        } else if (accuracy >= 80) {
            feedbackText = "Excellent performance! You have grasped the concepts thoroughly. Continue with spaced reviews.";
        } else if (accuracy >= 50) {
            feedbackText = "Good effort! A few concepts still need focus. Review the questions you got wrong and retry.";
        } else {
            feedbackText = "Focus study recommended. Review the material, configure a flashcard deck, and test yourself again soon.";
        }
        feedbackEl.textContent = feedbackText;

        // Auto selection recommendation for reschedule select
        const rescheduleSelect = document.getElementById('quiz-reschedule-select');
        if (rescheduleSelect) {
            if (accuracy >= 90) {
                rescheduleSelect.value = "7"; // 7 days review spaced out
            } else if (accuracy >= 70) {
                rescheduleSelect.value = "3"; // 3 days review spaced out
            } else {
                rescheduleSelect.value = "1"; // 1 day
            }
        }
    }

    quitQuiz() {
        window.app.showConfirm(
            "Quit Quiz?",
            "Are you sure you want to quit the quiz? Your score will not be saved.",
            (confirmed) => {
                if (confirmed) {
                    this.showQuizzesList();
                    window.app.showToast("Quiz terminated.", "info");
                }
            }
        );
    }

    showQuizzesList() {
        document.getElementById('quizzes-play-panel').classList.remove('active');
        document.getElementById('quizzes-result-panel').classList.remove('active');
        document.getElementById('quizzes-list-panel').classList.add('active');
        this.renderQuizzesGrid();
    }

    finishAndSaveQuiz() {
        // Save rescheduled date
        const quiz = this.activeQuiz;
        const days = parseInt(document.getElementById('quiz-reschedule-select').value) || 1;

        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + days);

        quiz.lastReviewed = new Date().toISOString();
        quiz.nextReviewDue = nextDate.toISOString();
        quiz._notified = false; // Reset warning alert status

        window.app.saveState();
        this.showQuizzesList();
        
        window.app.showToast(`Review interval scheduled in ${days} days!`);
        window.app.renderDashboardReviews(); // Refresh dashboard review alerts
    }
}

// Instantiate Quiz module
window.quizModule = new QuizModule();
