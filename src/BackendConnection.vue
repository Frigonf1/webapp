<template>
  <div id="app">
    <h1>{{ greeting }}</h1>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      greeting: '',
    };
  },
  mounted() {
    this.fetchGreeting();
  },
  methods: {
    async fetchGreeting() {
      try {
        const response = await axios.get('http://localhost:8080/api/greeting');
        this.greeting = response.data;
      } catch (error) {
        console.error('Error fetching greeting:', error);
      }
    },
  },
};
</script>

<style>
/* Add your styles here */
</style>
