<template>
  <div class="waiting-queue">
    <!-- Login/Authentication Section -->
    <div v-if="!isAuthenticated" class="authentication-panel">
      <h2>Patient Queue Access</h2>
      <div class="auth-tabs">
        <button
            @click="authMode = 'login'"
            :class="['auth-tab', { active: authMode === 'login' }]"
        >
          Login
        </button>
        <button
            @click="authMode = 'register'"
            :class="['auth-tab', { active: authMode === 'register' }]"
        >
          Register
        </button>
      </div>

      <!-- Login Form -->
      <form v-if="authMode === 'login'" @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label for="patientId">Patient ID</label>
          <input
              id="patientId"
              v-model="credentials.patientId"
              type="text"
              placeholder="Enter your patient ID"
              required
          />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input
              id="password"
              v-model="credentials.password"
              type="password"
              placeholder="Enter your password"
              required
          />
        </div>
        <button type="submit" class="btn-primary">Login</button>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </form>

      <!-- Registration Form -->
      <form v-else @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label for="regPatientId">Patient ID</label>
          <input
              id="regPatientId"
              v-model="registration.patientId"
              type="text"
              placeholder="Enter your patient ID"
              required
          />
        </div>
        <div class="form-group">
          <label for="regName">Full Name</label>
          <input
              id="regName"
              v-model="registration.name"
              type="text"
              placeholder="Enter your full name"
              required
          />
        </div>
        <div class="form-group">
          <label for="regPassword">Password</label>
          <input
              id="regPassword"
              v-model="registration.password"
              type="password"
              placeholder="Create a password"
              required
          />
        </div>
        <div class="form-group">
          <label for="regPhone">Phone Number</label>
          <input
              id="regPhone"
              v-model="registration.phone"
              type="tel"
              placeholder="Enter your phone number"
              required
          />
        </div>
        <button type="submit" class="btn-primary">Register</button>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </form>
    </div>

    <!-- Queue Information Display (when authenticated) -->
    <div v-else class="queue-dashboard">
      <div class="patient-header">
        <div>
          <h2>Welcome, {{ patientInfo.name }}</h2>
          <p>Patient ID: {{ patientInfo.patientId }}</p>
        </div>
        <button @click="logout" class="btn-secondary">Logout</button>
      </div>

      <!-- Patient status card -->
      <div class="status-card">
        <div class="status-icon" :class="statusClass">
          <i :class="statusIcon"></i>
        </div>
        <div class="status-info">
          <h3>{{ statusMessage }}</h3>
          <p v-if="patientInfo.priority">Priority Level: {{ priorityLabel }}</p>
          <p v-if="estimatedWaitTime">
            Estimated Wait Time: <span class="time">{{ estimatedWaitTime }}</span>
          </p>
          <p v-if="patientsAhead">
            Patients Ahead: <span class="count">{{ patientsAhead }}</span>
          </p>
          <div v-if="shouldShowArrivalTime" class="arrival-time">
            <p>Suggested Arrival Time: <strong>{{ suggestedArrivalTime }}</strong></p>
          </div>
        </div>
      </div>

      <!-- Queue visualization -->
      <div class="queue-status">
        <h3>Current Queue Status</h3>
        <div class="queue-progress">
          <div class="queue-bar">
            <div
                class="queue-position"
                :style="{ width: queueProgressPercentage + '%' }"
            ></div>
          </div>
          <div class="queue-labels">
            <span>Start</span>
            <span>Your Position</span>
            <span>Being Treated</span>
          </div>
        </div>
      </div>

      <!-- Notifications section -->
      <div class="notifications-panel">
        <h3>Notifications</h3>
        <div v-if="notifications.length" class="notification-list">
          <div v-for="(notification, index) in notifications" :key="index" class="notification-item">
            <div class="notification-time">{{ formatNotificationTime(notification.timestamp) }}</div>
            <div class="notification-content">{{ notification.message }}</div>
          </div>
        </div>
        <p v-else class="no-notifications">No new notifications</p>
        <div class="notification-settings">
          <label>
            <input type="checkbox" v-model="notificationPreferences.sms" />
            Receive SMS notifications
          </label>
          <label>
            <input type="checkbox" v-model="notificationPreferences.email" />
            Receive email notifications
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'WaitingQueue',
  data() {
    return {
      isAuthenticated: false,
      authMode: 'login',
      errorMessage: '',

      // Login credentials
      credentials: {
        patientId: '',
        password: ''
      },

      // Registration data
      registration: {
        patientId: '',
        name: '',
        password: '',
        phone: ''
      },

      // Patient info from server
      patientInfo: {
        patientId: '',
        name: '',
        priority: null,
        queuePosition: null,
        estimatedTime: null,
        status: 'waiting' // 'waiting', 'ready', 'being_treated', 'completed'
      },

      // Queue data
      queueData: {
        totalPatients: 0,
        averageWaitTime: 0,
        currentlyServing: 0
      },

      // Notifications
      notifications: [],

      // User preferences
      notificationPreferences: {
        sms: true,
        email: false
      },

      // For polling updates
      pollingInterval: null
    };
  },
  computed: {
    // Format estimated wait time from minutes to hours and minutes
    estimatedWaitTime() {
      if (!this.patientInfo.estimatedTime) return '';

      const minutes = this.patientInfo.estimatedTime;
      if (minutes < 60) {
        return `${minutes} minutes`;
      }

      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMinutes > 0 ? `and ${remainingMinutes} minutes` : ''}`;
    },

    // Number of patients ahead in the queue
    patientsAhead() {
      return this.patientInfo.queuePosition > 0 ? this.patientInfo.queuePosition - 1 : 0;
    },

    // Calculate queue progress percentage
    queueProgressPercentage() {
      if (!this.patientInfo.queuePosition || !this.queueData.totalPatients) return 0;

      // Reverse the percentage (lower position = higher percentage)
      const progress = (1 - (this.patientInfo.queuePosition / this.queueData.totalPatients)) * 100;
      return Math.min(Math.max(progress, 0), 100); // Ensure it's between 0-100
    },

    // Status message based on patient status
    statusMessage() {
      switch(this.patientInfo.status) {
        case 'waiting':
          return 'You are in the waiting queue';
        case 'ready':
          return 'Please proceed to the hospital now';
        case 'being_treated':
          return 'You are currently being treated';
        case 'completed':
          return 'Your treatment has been completed';
        default:
          return 'Status unknown';
      }
    },

    // CSS class for status icon
    statusClass() {
      switch(this.patientInfo.status) {
        case 'waiting': return 'status-waiting';
        case 'ready': return 'status-ready';
        case 'being_treated': return 'status-active';
        case 'completed': return 'status-complete';
        default: return '';
      }
    },

    // Icon for status
    statusIcon() {
      switch(this.patientInfo.status) {
        case 'waiting': return 'fas fa-clock';
        case 'ready': return 'fas fa-walking';
        case 'being_treated': return 'fas fa-user-md';
        case 'completed': return 'fas fa-check-circle';
        default: return 'fas fa-question-circle';
      }
    },

    // Convert priority number to text label
    priorityLabel() {
      switch(this.patientInfo.priority) {
        case 1: return 'Critical (Level 1)';
        case 2: return 'High (Level 2)';
        case 3: return 'Medium (Level 3)';
        case 4: return 'Low (Level 4)';
        case 5: return 'Non-urgent (Level 5)';
        default: return `Unknown (${this.patientInfo.priority})`;
      }
    },

    // Determine if we should show arrival time
    shouldShowArrivalTime() {
      return this.patientInfo.status === 'waiting' &&
          this.patientInfo.estimatedTime &&
          this.patientInfo.estimatedTime > 30;
    },

    // Calculate suggested arrival time
    suggestedArrivalTime() {
      if (!this.patientInfo.estimatedTime) return '';

      const now = new Date();
      // Arrive 15 minutes before estimated treatment time
      const arrivalTime = new Date(now.getTime() + (this.patientInfo.estimatedTime - 15) * 60000);

      return arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  },
  methods: {
    // Handle login form submission
    async handleLogin() {
      try {
        this.errorMessage = '';
        const response = await axios.post('/api/auth/login', this.credentials);
        this.handleAuthSuccess(response.data);
      } catch (error) {
        console.error('Login error:', error);
        this.errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      }
    },

    // Handle registration form submission
    async handleRegister() {
      try {
        this.errorMessage = '';
        const response = await axios.post('/api/auth/register', this.registration);
        this.handleAuthSuccess(response.data);
      } catch (error) {
        console.error('Registration error:', error);
        this.errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      }
    },

    // Handle successful authentication
    handleAuthSuccess(data) {
      localStorage.setItem('token', data.token);
      this.patientInfo = {
        patientId: data.patientId,
        name: data.name,
        priority: data.priority,
        queuePosition: data.queuePosition,
        estimatedTime: data.estimatedTime,
        status: data.status
      };
      this.isAuthenticated = true;

      // Set up polling for updates
      this.startPolling();

      // Get initial notifications
      this.fetchNotifications();

      // Save notification preferences
      this.saveNotificationPreferences();
    },

    // Logout function
    logout() {
      localStorage.removeItem('token');
      this.isAuthenticated = false;
      this.stopPolling();

      // Reset forms
      this.credentials = { patientId: '', password: '' };
      this.errorMessage = '';
    },

    // Start polling for queue updates
    startPolling() {
      this.pollingInterval = setInterval(this.fetchQueueStatus, 30000); // Poll every 30 seconds
      this.fetchQueueStatus(); // Fetch immediately
    },

    // Stop polling
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval);
        this.pollingInterval = null;
      }
    },

    // Fetch current queue status
    async fetchQueueStatus() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.logout();
          return;
        }

        const response = await axios.get('/api/queue/status', {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Update patient info
        this.patientInfo = {
          ...this.patientInfo,
          priority: response.data.priority,
          queuePosition: response.data.queuePosition,
          estimatedTime: response.data.estimatedTime,
          status: response.data.status
        };

        // Update queue data
        this.queueData = {
          totalPatients: response.data.totalPatients,
          averageWaitTime: response.data.averageWaitTime,
          currentlyServing: response.data.currentlyServing
        };

        // Check for new notifications
        if (response.data.hasNewNotifications) {
          this.fetchNotifications();
        }

      } catch (error) {
        console.error('Error fetching queue status:', error);
        if (error.response?.status === 401) {
          this.logout(); // Token expired or invalid
        }
      }
    },

    // Fetch notifications
    async fetchNotifications() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get('/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });

        this.notifications = response.data.notifications;
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    },

    // Format notification timestamp
    formatNotificationTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    // Save notification preferences
    async saveNotificationPreferences() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        await axios.post('/api/notifications/preferences', this.notificationPreferences, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Error saving notification preferences:', error);
      }
    }
  },
  mounted() {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get initial data
      this.fetchQueueStatus();
    }

    // Add event listener for beforeunload to stop polling
    window.addEventListener('beforeunload', this.stopPolling);
  },
  beforeDestroy() {
    // Clean up polling when component is destroyed
    this.stopPolling();
    window.removeEventListener('beforeunload', this.stopPolling);
  },
  watch: {
    // Watch for changes in notification preferences
    'notificationPreferences': {
      handler() {
        this.saveNotificationPreferences();
      },
      deep: true
    }
  }
};
</script>

<style scoped>
.waiting-queue {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* Authentication Section */
.authentication-panel {
  max-width: 500px;
  margin: 0 auto;
  padding: 2rem;
}

.auth-tabs {
  display: flex;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.auth-tab {
  padding: 0.75rem 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: var(--secondary-color);
}

.auth-tab.active {
  color: var(--primary-color);
  border-bottom: 2px solid var(--primary-color);
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  color: var(--dark-text);
}

.form-group input {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.25rem;
  font-size: 1rem;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
}

.btn-secondary {
  background-color: var(--secondary-color);
  color: white;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.error-message {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

/* Queue Dashboard */
.queue-dashboard {
  padding: 2rem;
}

.patient-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.status-card {
  display: flex;
  background-color: #f8fafc;
  border-radius: 0.5rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  margin-right: 1.5rem;
  flex-shrink: 0;
}

.status-waiting {
  background-color: #facc15;
  color: #854d0e;
}

.status-ready {
  background-color: #22c55e;
  color: #166534;
}

.status-active {
  background-color: #3b82f6;
  color: #1e3a8a;
}

.status-complete {
  background-color: #a3e635;
  color: #3f6212;
}

.status-info {
  flex-grow: 1;
}

.status-info h3 {
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
}

.status-info p {
  margin-bottom: 0.5rem;
  color: var(--secondary-color);
}

.status-info .time,
.status-info .count {
  font-weight: 700;
  color: var(--dark-text);
}

.arrival-time {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #f0fdfa;
  border-left: 3px solid #0d9488;
  border-radius: 0.25rem;
}

.queue-status {
  margin-bottom: 2rem;
}

.queue-progress {
  margin-top: 1rem;
}

.queue-bar {
  width: 100%;
  height: 1rem;
  background-color: #e2e8f0;
  border-radius: 1rem;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.queue-position {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 1rem;
  transition: width 0.5s ease;
}

.queue-labels {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--secondary-color);
}

.notifications-panel {
  background-color: #f8fafc;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.notification-list {
  margin: 1rem 0;
  max-height: 200px;
  overflow-y: auto;
}

.notification-item {
  padding: 0.75rem;
  border-bottom: 1px solid var(--border-color);
  display: flex;
}

.notification-time {
  flex-shrink: 0;
  width: 80px;
  color: var(--secondary-color);
  font-size: 0.875rem;
}

.notification-content {
  flex-grow: 1;
}

.no-notifications {
  text-align: center;
  color: var(--secondary-color);
  padding: 1rem;
}

.notification-settings {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
}

@media (max-width: 768px) {
  .status-card {
    flex-direction: column;
  }

  .status-icon {
    margin-right: 0;
    margin-bottom: 1rem;
  }

  .notification-settings {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>