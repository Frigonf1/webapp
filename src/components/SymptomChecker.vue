<template>
  <div class="symptom-checker-container">
    <h2 class="text-2xl font-bold mb-4">Évaluation des symptômes</h2>

    <div v-if="apiKeyMissing" class="api-key-warning">
      <div class="p-4 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700">
        <h3 class="font-bold">API Key Not Configured</h3>
        <p>The Google Gemini API key is missing or invalid. Please configure it in your environment variables.</p>
        <code class="block mt-2 p-2 bg-gray-100">VITE_GEMINI_API_KEY=your_api_key_here</code>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Analyse...</p>
    </div>

    <div v-else-if="error" class="error-container p-4 bg-red-100 border-l-4 border-red-500 text-red-700 mb-4">
      <h3 class="font-bold">Error</h3>
      <p>{{ error }}</p>
      <button @click="resetForm" class="mt-4 px-4 py-2 bg-red-500 text-white rounded">
        Try Again
      </button>
    </div>

    <div v-else-if="assessmentResult" class="assessment-result">
      <div :class="['result-header', urgencyColorClass]">
        <h3 class="text-xl font-bold">Assessment Result</h3>
        <p class="urgency-level">Urgency: {{ assessmentResult.urgencyLevel }}</p>
      </div>

      <div class="hospital-recommendation p-4">
        <p v-if="assessmentResult.shouldGoToHospital" class="text-red-600 font-bold">
          Based on your symptoms, you should seek medical attention at a hospital.
        </p>
        <p v-else class="text-green-600 font-bold">
          Based on your symptoms, you may not need to go to the hospital immediately.
        </p>
      </div>

      <div class="full-assessment p-4">
        <h4 class="text-lg font-semibold mt-2">Detailed Assessment</h4>
        <div class="assessment-text whitespace-pre-line p-4 bg-gray-50 rounded mt-2">
          {{ assessmentResult.fullAssessment }}
        </div>
      </div>

      <div class="disclaimer mt-4 p-4 bg-gray-100 text-sm">
        <p><strong>Important:</strong> This is not medical advice. When in doubt, always consult a healthcare professional.</p>
      </div>

      <button @click="resetForm" class="btn-primary mt-4 mx-4 mb-4">
        Start New Assessment
      </button>
    </div>

    <form v-else @submit.prevent="submitSymptoms" class="symptom-form">
      <div class="form-group">
        <label for="age">Age</label>
        <input
            type="number"
            id="age"
            v-model="symptomData.age"
            class="form-control"
            required
        />
      </div>

      <div class="form-group">
        <label for="gender">Sexe</label>
        <select id="gender" v-model="symptomData.gender" class="form-control" required>
          <option value="">Sélectionner le sexe</option>
          <option value="Male">Homme</option>
          <option value="Female">Femme</option>
          <option value="Other">Autre</option>
          <option value="Prefer not to say">Je préfère ne pas le dire</option>
        </select>
      </div>

      <div class="form-group">
        <label for="primarySymptoms">Symptômes principaux</label>
        <textarea
            id="primarySymptoms"
            v-model="symptomData.primarySymptoms"
            class="form-control"
            rows="3"
            placeholder="Describe your main symptoms in detail"
            required
        ></textarea>
      </div>

      <div class="form-group">
        <label for="duration">Depuis combien de temps avez vous ces symptômes?</label>
        <input
            type="text"
            id="duration"
            v-model="symptomData.duration"
            class="form-control"
            placeholder="e.g., 2 days, 1 week, etc."
            required
        />
      </div>

      <div class="form-group">
        <label for="painLevel">Échelle de douleur (1-10)</label>
        <div class="pain-slider">
          <input
              type="range"
              id="painLevel"
              v-model.number="symptomData.painLevel"
              min="1"
              max="10"
              class="form-control"
          />
          <span class="pain-value">{{ symptomData.painLevel }}</span>
        </div>
      </div>

      <div class="form-group">
        <label for="medicalConditions">Conditions de santé existantes</label>
        <textarea
            id="medicalConditions"
            v-model="symptomData.medicalConditions"
            class="form-control"
            rows="2"
            placeholder="List any diagnosed conditions (leave blank if none)"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="medications">Prise de médicaments</label>
        <textarea
            id="medications"
            v-model="symptomData.medications"
            class="form-control"
            rows="2"
            placeholder="List medications you're currently taking (leave blank if none)"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="additionalInfo">Informations additionnelles</label>
        <textarea
            id="additionalInfo"
            v-model="symptomData.additionalInfo"
            class="form-control"
            rows="3"
            placeholder="Any other details you think might be relevant"
        ></textarea>
      </div>

      <button type="submit" class="btn-primary" :disabled="loading || apiKeyMissing">
        Évaluer ma condition
      </button>
    </form>
  </div>
</template>

<script>
import GeminiService from '../Gemini.js';
import GeminiMockService from '../GeminiMockService.js';
import { apiConfig, featureFlags } from '../config.js';

export default {
  name: 'SymptomChecker',
  data() {
    return {
      geminiService: null,
      symptomData: {
        age: '',
        gender: '',
        primarySymptoms: '',
        duration: '',
        painLevel: 5,
        medicalConditions: '',
        medications: '',
        additionalInfo: ''
      },
      assessmentResult: null,
      loading: false,
      error: null,
      apiKeyMissing: false,
      usingMockService: false
    };
  },
  computed: {
    urgencyColorClass() {
      if (!this.assessmentResult) return '';

      const level = this.assessmentResult.urgencyLevel;
      if (level === 'URGENT') return 'bg-red-600 text-white';
      if (level === 'HIGH') return 'bg-orange-500 text-white';
      if (level === 'MEDIUM') return 'bg-yellow-500';
      if (level === 'LOW') return 'bg-blue-500 text-white';
      if (level === 'SELF-CARE') return 'bg-green-500 text-white';
      return 'bg-gray-500 text-white';
    }
  },
  created() {
    // Get API key from config
    const apiKey = apiConfig.gemini.apiKey;

    // Check if we need to use mock service
    if (!apiKey || featureFlags.enableMockResponses) {
      console.warn('Using mock Gemini service for testing');
      this.geminiService = new GeminiMockService();
      this.usingMockService = true;

      if (!apiKey) {
        this.apiKeyMissing = true;
      }
    } else {
      // Use real service with API key
      this.geminiService = new GeminiService(apiKey);
    }
  },
  methods: {
    async submitSymptoms() {
      // Reset previous errors and results
      this.error = null;
      this.loading = true;

      try {
        // If mock service is not enabled but API key is missing, show error
        if (this.apiKeyMissing && !this.usingMockService) {
          throw new Error('Gemini API key is not configured. Please add it to your environment variables.');
        }

        console.log('Submitting symptoms for assessment:', this.symptomData);
        this.assessmentResult = await this.geminiService.assessSymptoms(this.symptomData);
        console.log('Assessment result:', this.assessmentResult);

        // Additional validation of the result
        if (!this.assessmentResult || this.assessmentResult.urgencyLevel === 'ERROR') {
          throw new Error('Failed to get a valid assessment result');
        }
      } catch (error) {
        console.error('Error during symptom assessment:', error);
        this.error = error.message || 'An unexpected error occurred during symptom assessment';

        // Clear the result if there was an error
        this.assessmentResult = null;
      } finally {
        this.loading = false;
      }
    },
    resetForm() {
      // Reset the form data
      this.symptomData = {
        age: '',
        gender: '',
        primarySymptoms: '',
        duration: '',
        painLevel: 5,
        medicalConditions: '',
        medications: '',
        additionalInfo: ''
      };

      // Clear results and errors
      this.assessmentResult = null;
      this.error = null;
    }
  }
};
</script>

<style scoped>
.symptom-checker-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.symptom-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 600;
}

.form-control {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
}

.pain-slider {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pain-value {
  font-weight: bold;
  min-width: 2rem;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.25rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background-color: #2563eb;
}

.btn-primary:disabled {
  background-color: #93c5fd;
  cursor: not-allowed;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.assessment-result {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.result-header {
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.api-key-warning {
  margin-bottom: 1rem;
}

.error-container {
  margin-bottom: 1rem;
}
</style>