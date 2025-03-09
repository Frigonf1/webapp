import WaitingQueue from './components/WaitingQueue.vue';

export default {
name: 'App',
components: {
SymptomChecker,
WaitingQueue
},

<template>
  <div class="app-container">
    <header class="app-header">
      <h1 class="app-title">DCrowd Évaluation des symptômes</h1>
      <nav class="app-nav">
        <button
            @click="currentView = 'symptomChecker'"
            :class="['nav-button', { active: currentView === 'symptomChecker' }]"
        >
          Évaluation des symptômes
        </button>
        <button
            @click="currentView = 'waitingQueue'"
            :class="['nav-button', { active: currentView === 'waitingQueue' }]"
        >
          File d'attente
        </button>
      </nav>
    </header>

    <main class="app-content">
      <SymptomChecker v-if="currentView === 'symptomChecker'" />
      <WaitingQueue v-else-if="currentView === 'waitingQueue'" />
    </main>

    <footer class="app-footer">
      <p>&copy; 2025 DCrowd</p>
      <p class="disclaimer">This application is for informational purposes only and does not replace professional medical advice.</p>
    </footer>
  </div>
</template>

<script>
import SymptomChecker from './SymptomChecker.vue';

export default {
  name: 'App',
  components: {
    SymptomChecker
  },
  data() {
    return {
      currentView: 'symptomChecker'
    };
  }
};
</script>

<style>
/* Global styles */
:root {
  --primary-color: #3b82f6;
  --primary-dark: #2563eb;
  --secondary-color: #64748b;
  --light-bg: #f8fafc;
  --dark-text: #1e293b;
  --light-text: #f8fafc;
  --border-color: #e2e8f0;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Arial', sans-serif;
  color: var(--dark-text);
  background-color: var(--light-bg);
  line-height: 1.6;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-header {
  background-color: var(--primary-color);
  color: var(--light-text);
  padding: 1rem 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.app-title {
  font-size: 1.8rem;
  margin-bottom: 1rem;
}

.app-nav {
  display: flex;
  gap: 1rem;
}

.nav-button {
  padding: 0.5rem 1rem;
  background-color: transparent;
  color: var(--light-text);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.nav-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.nav-button.active {
  background-color: var(--light-text);
  color: var(--primary-color);
  font-weight: bold;
}

.app-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.placeholder {
  border: 1px dashed var(--secondary-color);
  padding: 2rem;
  border-radius: 0.5rem;
  text-align: center;
  background-color: white;
}

.app-footer {
  background-color: var(--secondary-color);
  color: var(--light-text);
  padding: 1rem 2rem;
  text-align: center;
}

.disclaimer {
  font-size: 0.8rem;
  margin-top: 0.5rem;
  opacity: 0.8;
}
</style>

