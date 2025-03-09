<template>
  <div class="waiting-queue-container">
    <h2 class="text-2xl font-bold mb-4">File d'attente</h2>

    <div class="queue-status-container mb-6">
      <div class="queue-image-container mb-4">
        <img :src="fileAttentePng" alt="File d'attente" class="queue-image rounded shadow-md">
      </div>

      <div class="status-panel p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700">
        <h3 class="font-bold">Statut du service</h3>
        <div class="flex justify-between items-center mt-2">
          <div>
            <p><span class="font-semibold">Niveau d'occupation:</span> Normal</p>
            <p><span class="font-semibold">Temps d'attente estimé:</span> 20 minutes</p>
          </div>
          <div class="status-indicator bg-green-500 text-white px-3 py-1 rounded-full text-sm">
            Ouvert
          </div>
        </div>
      </div>
    </div>

    <div class="patient-list-container bg-white p-4 rounded shadow-sm">
      <h3 class="text-xl font-semibold mb-3">Patients en attente</h3>

      <div class="overflow-x-auto">
        <table class="min-w-full bg-white">
          <thead>
          <tr class="bg-gray-100 text-gray-600 text-left text-sm uppercase">
            <th class="py-3 px-4 font-semibold">Position</th>
            <th class="py-3 px-4 font-semibold">Identifiant</th>
            <th class="py-3 px-4 font-semibold">Niveau d'urgence</th>
            <th class="py-3 px-4 font-semibold">Temps d'attente</th>
          </tr>
          </thead>
          <tbody class="text-gray-600 text-sm">
          <tr v-for="(patient, index) in patients" :key="patient.id" :class="{'bg-blue-50': patient.isCurrent}">
            <td class="py-3 px-4 border-b">{{ index + 1 }}</td>
            <td class="py-3 px-4 border-b">{{ patient.id }}</td>
            <td class="py-3 px-4 border-b">
                <span :class="getUrgencyClass(patient.urgencyLevel)">
                  {{ getUrgencyLabel(patient.urgencyLevel) }}
                </span>
            </td>
            <td class="py-3 px-4 border-b">{{ patient.waitTime }} minutes</td>
          </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 p-3 bg-gray-50 text-sm rounded">
        <p><strong>Note:</strong> Les temps d'attente sont estimatifs et peuvent varier en fonction de la gravité des cas.</p>
      </div>
    </div>
  </div>
</template>

<script>
import fileAttentePng from '../FileAttente.png';

export default {
  name: 'WaitingQueue',
  data() {
    return {
      fileAttentePng,
      patients: [
        { id: 'P-3821', urgencyLevel: 3, waitTime: 5, isCurrent: false },
        { id: 'P-3822', urgencyLevel: 2, waitTime: 15, isCurrent: true },
        { id: 'P-3823', urgencyLevel: 1, waitTime: 25, isCurrent: false },
        { id: 'P-3824', urgencyLevel: 2, waitTime: 20, isCurrent: false },
        { id: 'P-3825', urgencyLevel: 1, waitTime: 30, isCurrent: false },
      ]
    };
  },
  methods: {
    getUrgencyLabel(level) {
      const labels = {
        1: 'Basse',
        2: 'Moyenne',
        3: 'Élevée'
      };
      return labels[level] || 'Inconnue';
    },
    getUrgencyClass(level) {
      const classes = {
        1: 'px-2 py-1 rounded-full text-xs bg-green-100 text-green-800',
        2: 'px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800',
        3: 'px-2 py-1 rounded-full text-xs bg-red-100 text-red-800'
      };
      return classes[level] || 'px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800';
    }
  }
};
</script>

<style scoped>
.waiting-queue-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.queue-image-container {
  display: flex;
  justify-content: center;
}

.queue-image {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
}

@media (min-width: 768px) {
  .queue-status-container {
    display: flex;
    gap: 1.5rem;
    align-items: center;
  }

  .queue-image-container {
    flex: 1;
    margin-bottom: 0;
  }

  .status-panel {
    flex: 1;
  }
}
</style>