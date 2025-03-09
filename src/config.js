// config.js - Application configuration

// Get API key from environment variables
const getGeminiApiKey = () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
        console.warn('WARNING: Gemini API key not configured. Get your key from https://ai.google.dev/ and add it to .env file.');
        return '';
    }

    return apiKey;
};

// API configuration
export const apiConfig = {
    gemini: {
        apiKey: getGeminiApiKey(),
        modelVersion: 'gemini-1.5-pro', // Using the latest Gemini model
        apiEndpoint: 'https://generativelanguage.googleapis.com/v1/models'
    }
};

// Feature flags
export const featureFlags = {
    enableDebugMode: import.meta.env.MODE === 'development',
    enableMockResponses: false // Set to true to use mock responses instead of real API calls
};

export default {
    apiConfig,
    featureFlags
};