// Gemini.js - Integration with Google Gemini AI for symptom assessment

/**
 * Service for interacting with Google Gemini AI API
 * Used for evaluating patient symptoms and providing healthcare guidance
 */
class GeminiService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }

    /**
     * Assesses patient symptoms and returns recommendation
     * @param {Object} symptomData - Patient symptom information
     * @returns {Promise} - Assessment results from Gemini
     */
    async assessSymptoms(symptomData) {
        try {
            // Format the prompt for Gemini with appropriate medical context
            const prompt = this.formatSymptomPrompt(symptomData);

            // Call the Gemini API
            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return this.processGeminiResponse(data);
        } catch (error) {
            console.error('Gemini assessment error:', error);
            throw error;
        }
    }

    /**
     * Formats patient symptoms into a structured prompt for Gemini
     * @param {Object} symptomData - Patient symptoms and information
     * @returns {String} - Formatted prompt for Gemini
     */
    formatSymptomPrompt(symptomData) {
        return `
You are a medical triage assistant helping to determine if a patient should go to the hospital based on their symptoms.
Your goal is to provide a preliminary assessment only - NOT a diagnosis.

IMPORTANT: Always err on the side of caution. When in doubt, recommend the patient seek medical attention.

Patient Information:
- Age: ${symptomData.age || 'Not provided'}
- Gender: ${symptomData.gender || 'Not provided'}
- Primary symptoms: ${symptomData.primarySymptoms || 'Not provided'}
- Symptom duration: ${symptomData.duration || 'Not provided'}
- Pain level (1-10): ${symptomData.painLevel || 'Not provided'}
- Existing medical conditions: ${symptomData.medicalConditions || 'None'}
- Current medications: ${symptomData.medications || 'None'}
- Additional notes: ${symptomData.additionalInfo || 'None'}

Based only on this information, provide an assessment with these components:
1. RECOMMENDATION: Clearly state if the patient should:
   - URGENT: Seek immediate emergency care (call emergency services)
   - HIGH: Go to the hospital/emergency room promptly
   - MEDIUM: Schedule a same-day or urgent care appointment
   - LOW: Schedule a regular appointment with primary care
   - SELF-CARE: Manage symptoms at home with self-care

2. REASONING: Brief explanation for your recommendation

3. IMPORTANT WARNINGS: List any red flag symptoms that would require immediate medical attention

Remember that this is not a diagnosis but a preliminary assessment to help with triage decisions.
`;
    }

    /**
     * Processes and extracts the assessment from Gemini's response
     * @param {Object} response - Raw response from Gemini API
     * @returns {Object} - Structured assessment data
     */
    processGeminiResponse(response) {
        try {
            // Extract the text response from Gemini
            const rawText = response.candidates[0].content.parts[0].text;

            // Parse the recommendation level from the response text
            let urgencyLevel = 'UNKNOWN';
            if (rawText.includes('URGENT')) urgencyLevel = 'URGENT';
            else if (rawText.includes('HIGH')) urgencyLevel = 'HIGH';
            else if (rawText.includes('MEDIUM')) urgencyLevel = 'MEDIUM';
            else if (rawText.includes('LOW')) urgencyLevel = 'LOW';
            else if (rawText.includes('SELF-CARE')) urgencyLevel = 'SELF-CARE';

            return {
                rawResponse: rawText,
                urgencyLevel: urgencyLevel,
                shouldGoToHospital: urgencyLevel === 'URGENT' || urgencyLevel === 'HIGH',
                fullAssessment: rawText,
            };
        } catch (error) {
            console.error('Error processing Gemini response:', error);
            return {
                urgencyLevel: 'ERROR',
                shouldGoToHospital: true, // Default to cautious approach on errors
                fullAssessment: 'There was an error processing your symptoms. To be safe, please consult with a healthcare professional.',
            };
        }
    }
}

export default GeminiService;