/**
 * RecallFlow Flashcards Module
 * Implements 3D card flipping, deck/card authoring,
 * Leitner/SM2-spaced repetition rating algorithms, and dashboard hooks.
 */

class FlashcardModule {
    constructor() {
        this.activeDeck = null;
        this.cardsToStudy = [];
        this.currentCardIdx = 0;
        this.isFlipped = false;

        this.init();
    }

    init() {
        this.setupPrepopulatedDecks();

        // Deck form listeners
        const deckForm = document.getElementById('create-deck-form');
        if (deckForm) {
            deckForm.addEventListener('submit', (e) => this.handleCreateDeck(e));
        }

        const addCardRowBtn = document.getElementById('add-card-row-btn');
        if (addCardRowBtn) {
            addCardRowBtn.addEventListener('click', () => this.addCardRowToBuilder());
        }

        // Flashcard interaction listeners
        const cardEl = document.getElementById('flashcard-element');
        if (cardEl) {
            cardEl.addEventListener('click', () => this.flipCard());
        }

        const revealBtn = document.getElementById('reveal-card-btn');
        if (revealBtn) {
            revealBtn.addEventListener('click', () => this.revealCard());
        }

        const quitBtn = document.getElementById('quit-study-btn');
        if (quitBtn) {
            quitBtn.addEventListener('click', () => this.quitStudy());
        }

        const restartBtn = document.getElementById('study-restart-btn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.startStudy(this.activeDeck));
        }

        const exitBtn = document.getElementById('study-finish-exit-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => this.showDecksList());
        }

        // Spaced Repetition rating buttons
        const ratingButtons = document.querySelectorAll('#spaced-rep-buttons-container .rep-btn');
        ratingButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rating = btn.getAttribute('data-rating');
                this.handleCardRating(rating);
            });
        });

        this.renderDecksGrid();
    }

    // --- Pre-populate Sample Deck ---
    setupPrepopulatedDecks() {
        const defaultDecks = [
            {
                id: 'deck_default_webdev',
                title: 'Web Design & Performance Concepts',
                lastStudied: null,
                cards: [
                    {
                        question: "What is the purpose of the CSS 'backdrop-filter' property?",
                        answer: "It applies graphical effects (like blur or color shift) to the area behind an element. Frequently used to design 'glassmorphism' panels.",
                        interval: 1,
                        ease: 2.5,
                        nextReview: new Date().toISOString()
                    },
                    {
                        question: "What does 'box-sizing: border-box' accomplish in CSS?",
                        answer: "It includes padding and borders in the element's total declared width and height, preventing layout breakage when styling elements.",
                        interval: 1,
                        ease: 2.5,
                        nextReview: new Date().toISOString()
                    },
                    {
                        question: "Compare LocalStorage and SessionStorage persistence levels.",
                        answer: "LocalStorage persists indefinitely until explicitly cleared. SessionStorage is scoped to the page tab and gets deleted when the tab/window is closed.",
                        interval: 1,
                        ease: 2.5,
                        nextReview: new Date().toISOString()
                    },
                    {
                        question: "What is an Immediately Invoked Function Expression (IIFE) in JavaScript?",
                        answer: "A function that executes as soon as it is defined. Commonly used to create local scope and prevent variables polluting the global namespace.",
                        interval: 1,
                        ease: 2.5,
                        nextReview: new Date().toISOString()
                    },
                    {
                        question: "What benefit does the 'defer' script tag attribute offer over 'async'?",
                        answer: "It guarantees that scripts execute in the exact order they are declared, and only after the HTML document parsing is completely finished.",
                        interval: 1,
                        ease: 2.5,
                        nextReview: new Date().toISOString()
                    }
                ]
            }
        ];

        if (window.app.state.flashcardDecks.length === 0) {
            window.app.state.flashcardDecks = defaultDecks;
            window.app.saveState();
        }
    }

    // --- Render Deck Cards Grid ---
    renderDecksGrid() {
        const container = document.getElementById('decks-grid-container');
        if (!container) return;

        if (window.app.state.flashcardDecks.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align:center; padding:3rem; color:var(--color-text-muted);" class="glass-panel">
                    <i data-feather="layers" style="width:48px; height:48px; margin-bottom:1rem; opacity:0.5;"></i>
                    <p style="font-weight:600;">No decks created yet. Add a new deck to start memorizing!</p>
                </div>
            `;
            if (window.feather) window.feather.replace();
            return;
        }

        const now = new Date();

        container.innerHTML = window.app.state.flashcardDecks.map(deck => {
            const total = deck.cards.length;
            const dueCount = deck.cards.filter(c => new Date(c.nextReview) <= now).length;
            
            const studyLabel = dueCount > 0 ? `Study Due (${dueCount})` : "Practice All";

            return `
                <div class="glass-card deck-card">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:start;">
                            <span class="todo-subject-tag">Flashcard Deck</span>
                            ${dueCount > 0 ? '<span class="badge badge-high" style="font-size:0.65rem;">Cards Due</span>' : `<span class="badge badge-low" style="font-size:0.65rem; color:var(--color-text-muted); border-color:var(--border-glass);">All Reviewed</span>`}
                        </div>
                        <h4 class="deck-title" style="margin-top:0.75rem;">${deck.title}</h4>
                        <div class="deck-count">${total} Cards Total</div>
                    </div>
                    <div class="deck-actions">
                        <button class="btn btn-primary" onclick="window.flashcardModule.startStudyById('${deck.id}')" style="flex:1; padding:0.5rem 1rem; font-size:0.8rem;">
                            <i data-feather="play"></i> ${studyLabel}
                        </button>
                        <button class="btn btn-secondary btn-icon" onclick="window.flashcardModule.deleteDeck('${deck.id}')" style="width:32px; height:32px; flex-shrink:0;">
                            <i data-feather="trash-2" style="width:14px; height:14px;"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (window.feather) window.feather.replace();
    }

    deleteDeck(deckId) {
        window.app.state.flashcardDecks = window.app.state.flashcardDecks.filter(d => d.id !== deckId);
        window.app.saveState();
        if (window.audioManager) window.audioManager.playClick();
        window.app.showToast("Deck deleted.", "info");
        this.renderDecksGrid();
        window.app.renderDashboardReviews();
    }

    // --- Create Deck Dynamic Modal builder ---
    resetBuilder() {
        const container = document.getElementById('deck-cards-builder-list');
        if (container) {
            container.innerHTML = '';
            // Add 2 blank rows initially
            this.addCardRowToBuilder();
            this.addCardRowToBuilder();
        }
    }

    addCardRowToBuilder() {
        const container = document.getElementById('deck-cards-builder-list');
        if (!container) return;

        const rowIdx = container.children.length;
        const row = document.createElement('div');
        row.className = 'form-row';
        row.style.marginBottom = '0.75rem';
        row.innerHTML = `
            <div style="flex-grow:1; display:grid; grid-template-columns: 1fr 1fr; gap:0.5rem;">
                <input type="text" class="form-control card-question-input" placeholder="Question #${rowIdx + 1}" required>
                <input type="text" class="form-control card-answer-input" placeholder="Answer #${rowIdx + 1}" required>
            </div>
            <button type="button" class="action-btn delete" onclick="this.closest('.form-row').remove();" style="margin-left: 0.5rem; align-self: center;">
                <i data-feather="trash-2" style="width:14px; height:14px;"></i>
            </button>
        `;
        
        container.appendChild(row);
        if (window.feather) window.feather.replace();
    }

    handleCreateDeck(e) {
        e.preventDefault();

        const title = document.getElementById('deck-title-input').value.trim();
        const rows = document.querySelectorAll('#deck-cards-builder-list .form-row');

        if (rows.length === 0) {
            window.app.showToast("At least 1 card is required!", "danger");
            return;
        }

        const cards = [];
        let isValid = true;

        rows.forEach(row => {
            const question = row.querySelector('.card-question-input').value.trim();
            const answer = row.querySelector('.card-answer-input').value.trim();

            if (!question || !answer) {
                isValid = false;
                return;
            }

            cards.push({
                question,
                answer,
                interval: 1,
                ease: 2.5,
                nextReview: new Date().toISOString()
            });
        });

        if (!isValid) {
            window.app.showToast("All cards must have a question and an answer!", "danger");
            return;
        }

        const newDeck = {
            id: 'deck_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            title,
            lastStudied: null,
            cards
        };

        window.app.state.flashcardDecks.push(newDeck);
        window.app.saveState();

        e.target.reset();
        window.app.closeModal('modal-create-deck');
        window.app.showToast("Deck created successfully!");
        this.renderDecksGrid();
        window.app.renderDashboardReviews();
    }

    // --- Flashcard Study Execution ---
    startStudyById(deckId) {
        const deck = window.app.state.flashcardDecks.find(d => d.id === deckId);
        if (deck) {
            this.startStudy(deck);
        }
    }

    startStudy(deck) {
        this.activeDeck = deck;
        const now = new Date();

        // Spaced Repetition check: filter cards due, or study all if nothing due
        const dueCards = deck.cards.filter(c => new Date(c.nextReview) <= now);
        this.cardsToStudy = dueCards.length > 0 ? dueCards : deck.cards;

        if (this.cardsToStudy.length === 0) {
            window.app.showToast("This deck contains no cards to review!", "warning");
            return;
        }

        this.currentCardIdx = 0;

        // Toggle SPA screen view panels
        document.getElementById('decks-list-panel').classList.remove('active');
        document.getElementById('deck-finished-panel').classList.remove('active');
        document.getElementById('deck-study-panel').classList.add('active');

        document.getElementById('study-deck-title').textContent = deck.title;

        this.showCard();
    }

    showCard() {
        this.isFlipped = false;
        
        // Reset card wrapper flipped class
        const cardWrapper = document.getElementById('flashcard-element');
        if (cardWrapper) cardWrapper.classList.remove('flipped');

        // Show question side details
        const card = this.cardsToStudy[this.currentCardIdx];
        document.getElementById('flashcard-question-text').textContent = card.question;
        document.getElementById('flashcard-answer-text').textContent = card.answer;
        document.getElementById('study-progress-text').textContent = `Card ${this.currentCardIdx + 1} of ${this.cardsToStudy.length}`;

        // Reset control buttons
        document.getElementById('reveal-card-btn').style.display = 'block';
        document.getElementById('spaced-rep-buttons-container').classList.remove('active');
    }

    flipCard() {
        const cardWrapper = document.getElementById('flashcard-element');
        if (cardWrapper) {
            this.isFlipped = !this.isFlipped;
            if (window.audioManager) window.audioManager.playFlip();
            if (this.isFlipped) {
                cardWrapper.classList.add('flipped');
                this.revealControls();
            } else {
                cardWrapper.classList.remove('flipped');
            }
        }
    }

    revealCard() {
        const cardWrapper = document.getElementById('flashcard-element');
        if (cardWrapper && !this.isFlipped) {
            this.isFlipped = true;
            if (window.audioManager) window.audioManager.playFlip();
            cardWrapper.classList.add('flipped');
            this.revealControls();
        }
    }

    revealControls() {
        // Toggle action buttons
        document.getElementById('reveal-card-btn').style.display = 'none';
        document.getElementById('spaced-rep-buttons-container').classList.add('active');
    }

    handleCardRating(rating) {
        const card = this.cardsToStudy[this.currentCardIdx];
        
        // --- Spaced Repetition (SuperMemo SM2 simplified variant) ---
        if (rating === 'hard') {
            card.interval = 1;
            card.ease = Math.max(1.3, card.ease - 0.2);
        } else if (rating === 'medium') {
            // Keep interval steady or expand slowly
            card.interval = Math.ceil(card.interval * card.ease);
        } else if (rating === 'easy') {
            card.ease = card.ease + 0.15;
            card.interval = Math.ceil(card.interval * card.ease * 1.5);
        }

        // Set next review date
        const reviewDate = new Date();
        reviewDate.setDate(reviewDate.getDate() + card.interval);
        card.nextReview = reviewDate.toISOString();

        // Increment stats
        window.app.state.cardsReviewedTotal++;
        window.app.saveState();
        
        if (window.audioManager) {
            if (rating === 'easy') {
                window.audioManager.playCheck();
            } else {
                window.audioManager.playClick();
            }
        } else {
            window.app.playNotificationSound();
        }

        // Advance card index
        this.currentCardIdx++;
        
        if (this.currentCardIdx < this.cardsToStudy.length) {
            this.showCard();
        } else {
            // Study Session Finished!
            this.activeDeck.lastStudied = new Date().toISOString();
            window.app.saveState();
            this.showFinishedScreen();
        }
    }

    showFinishedScreen() {
        document.getElementById('deck-study-panel').classList.remove('active');
        document.getElementById('deck-finished-panel').classList.add('active');
        if (window.audioManager) window.audioManager.playSuccessChime();
        if (window.confettiManager) window.confettiManager.burst(120);
    }

    quitStudy() {
        window.app.showConfirm(
            "Quit Study Session?",
            "Are you sure you want to stop studying? Your progress for reviewed cards will be saved, but session stats will stop.",
            (confirmed) => {
                if (confirmed) {
                    this.showDecksList();
                }
            }
        );
    }

    showDecksList() {
        document.getElementById('deck-study-panel').classList.remove('active');
        document.getElementById('deck-finished-panel').classList.remove('active');
        document.getElementById('decks-list-panel').classList.add('active');
        this.renderDecksGrid();
        window.app.renderDashboardReviews();
    }
}

// Instantiate Flashcards module
window.flashcardModule = new FlashcardModule();
