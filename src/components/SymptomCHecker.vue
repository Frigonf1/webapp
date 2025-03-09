<template>
  <div class="symptom-checker-container">
    <h2 class="text-2xl font-bold mb-4">Symptom Assessment</h2>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Analyzing your symptoms...</p>
    </div>

    <div v-else-if="assessmentResult" class="assessment-result">
      <div :class="['result-header', urgencyColorClass]">
        <h3 class="text-xl font-bold">Assessment Result</h3>
        <p class="urgency-level">Urgency: {{ assessmentResult.urgencyLevel }}</p>
      </div>

      <div class="hospital-recommendation">
        <p v-if="assessmentResult.shouldGoToHospital" class="text-red-600 font-bold">
          Based on your symptoms, you should seek medical attention at a hospital.
        </p>
        <p v-else class="text-green-600 font-bold">
          Based on your symptoms, you may not need to go to the hospital immediately.
        </p>
      </div>

      <div class="full-assessment">
        <h4 class="text-lg font-semibold mt-4">Detailed Assessment</h4>
        <div class="assessment-text whitespace-pre-line">
          {{ assessmentResult.fullAssessment }}
        </div>
      </div>

      <div class="disclaimer mt-6 p-4 bg-gray-100 text-sm">
        <p><strong>Important:</strong> This is not medical advice. When in doubt, always consult a healthcare professional.</p>
      </div>

      <button @click="resetForm" class="btn-primary mt-4">
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
        <label for="gender">Gender</label>
        <select id="gender" v-model="symptomData.gender" class="form-control" required>
          <option value="">Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </div>

      <div class="form-group">
        <label for="primarySymptoms">Primary Symptoms</label>
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
        <label for="duration">How long have you had these symptoms?</label>
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
        <label for="painLevel">Pain Level (1-10)</label>
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
        <label for="medicalConditions">Existing Medical Conditions</label>
        <textarea
            id="medicalConditions"
            v-model="symptomData.medicalConditions"
            class="form-control"
            rows="2"
            placeholder="List any diagnosed conditions (leave blank if none)"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="medications">Current Medications</label>
        <textarea
            id="medications"
            v-model="symptomData.medications"
            class="form-control"
            rows="2"
            placeholder="List medications you're currently taking (leave blank if none)"
        ></textarea>
      </div>

      <div class="form-group">
        <label for="additionalInfo">Additional Information</label>
        <textarea
            id="additionalInfo"
            v-model="symptomData.additionalInfo"
            class="form-control"
            rows="3"
            placeholder="Any other details you think might be relevant"
        ></textarea>
      </div>

      <button type="submit" class="btn-primary" :disabled="loading">
        Assess My Symptoms
      </button>
    </form>
  </div>
</template>

<script>
import GeminiService from '../Gemini.js';

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
      error: null
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
    // Initialize the Gemini service with your API key
    // In production, you should use environment variables for the API key
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
    this.geminiService = new GeminiService(apiKey);
  },
  methods: {
    async submitSymptoms() {
      this.loading = true;
      this.error = null;

      try {
        this.assessmentResult = await this.geminiService.assessSymptoms(this.symptomData);
      } catch (error) {
        this.error = error.message || 'An error occurred during assessment';
        console.error('Assessment error:', error);

        // Provide fallback result on error
        this.assessmentResult = {
          urgencyLevel: 'ERROR',
          shouldGoToHospital: true,
          fullAssessment: 'There was an error processing your symptoms. To be safe, please consult with a healthcare professional.'
        };
      } finally {
        this.loading = false;
      }
    },
    resetForm() {
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

.hospital-recommendation,
.full-assessment,
.disclaimer {
  padding: 1rem;
}

.assessment-text {
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 0.25rem;
  margin-top: 0.5rem;
}
</style>