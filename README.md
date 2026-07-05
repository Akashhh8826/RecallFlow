# ⚡ RecallFlow

**RecallFlow** is a premium, beautifully-designed spaced-repetition study hub that combines neuroscience-backed learning methods (Active Recall, Spaced Repetition) with productivity workflows (Pomodoro, Ambient Soundscapes).

![RecallFlow Banner](assets/banner.png)

## 🌟 Key Features

* **Active Recall Flashcards:** Practice information retrieval with 3D-flipping cards and rate your memory retention.
* **Smart Quiz Maker:** Build custom tests with dynamic scoring and spaced review scheduling.
* **Pomodoro Focus Timer:** Link study sessions to priority tasks and track your work/break cycles visually.
* **Ambient Sound Machine:** Generate client-side binaural beats, brown noise, wind, and rain sounds to achieve flow state—without external dependencies.
* **Dynamic Premium Themes:** Switch between Aurora Glow, Ocean Breeze, Forest Deep, and Sunset Glow styles.
* **Comprehensive Dashboard:** Track daily tasks, weekly study intensity, pomodoro sessions, and pending active recall reviews.
---

## 📸 Screenshots

<div align="center">
  <img src="assets/dashboard.png" width="48%" alt="Dashboard View">
  <img src="assets/timer.png" width="48%" alt="Pomodoro Timer View">
</div>
<div align="center">
  <img src="assets/flashcards.png" width="48%" alt="Flashcards View">
  <img src="assets/quiz.png" width="48%" alt="Quiz View">
</div>

---
## 🧠 Workflows & Architecture

### The Study Lifecycle
RecallFlow encourages a cycle of learning, testing, and focusing.

```mermaid
graph TD
    A[Add Study Material] --> B(Create Flashcards / Quizzes)
    B --> C{Study Session}
    
    C -->|Focus| D[Start Pomodoro Timer]
    D --> E[Enable Ambient Soundscape]
    
    C -->|Review| F[Active Recall Testing]
    F --> G{Rate Difficulty}
    
    G -->|Hard| H[Short Interval Re-test]
    G -->|Easy| I[Long Interval Re-test]
    
    H --> J[Update Local Storage State]
    I --> J
    E --> J
```

### The Pomodoro Focus Engine
Our timer doesn't just tick down; it integrates with your task list and audio environment.

```mermaid
sequenceDiagram
    participant U as User
    participant T as Todo List
    participant P as Pomodoro Module
    participant A as Audio Manager

    U->>T: Create "Study Chapter 4" Task
    U->>P: Link Task & Start 25m Timer
    P->>A: Start "Rainfall" Ambient Audio
    P->>U: Tick... (Focus State)
    P-->>P: Timer Completes
    P->>A: Play Completion Chime & Stop Ambient
    P->>T: Mark Task Completed (Optional)
    P->>U: Confetti Celebration! 🎉
```

---

## 🚀 Getting Started

Since RecallFlow is a client-side Single Page Application (SPA), getting it running is extremely simple.

### Prerequisites
* [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/RecallFlow.git
   cd RecallFlow
   ```

2. **Run the local development server**
   ```bash
   npm start
   ```
   *(This uses `npx http-server` under the hood).*

3. **Open your browser**
   Navigate to `http://localhost:8000` to begin your study session!

---

## 💾 State Persistence
RecallFlow automatically saves all your flashcards, quizzes, and study statistics directly to your browser's `localStorage` (`recallflow_state`). No databases or account sign-ups are required to start being productive.

