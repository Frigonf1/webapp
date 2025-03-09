// GeminiMockService.js - Mock implementation for testing without API key

class GeminiMockService {
    constructor() {
        console.log('Using Gemini Mock Service for testing');
    }

    async assessSymptoms(symptomData) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Determine mock urgency level based on input data
        let urgencyLevel = 'LOW';
        let shouldGoToHospital = false;

        // Simple logic to determine mock urgency based on symptoms and pain level
        const symptoms = (symptomData.primarySymptoms || '').toLowerCase();
        const painLevel = parseInt(symptomData.painLevel) || 0;

        if (
            symptoms.includes('chest pain') ||
            symptoms.includes('difficulty breathing') ||
            symptoms.includes('unconscious') ||
            symptoms.includes('severe bleeding')
        ) {
            urgencyLevel = 'URGENT';
            shouldGoToHospital = true;
        } else if (
            painLevel >= 8 ||
            symptoms.includes('fever') && symptoms.includes('rash') ||
            symptoms.includes('broken') ||
            symptoms.includes('fracture')
        ) {
            urgencyLevel = 'HIGH';
            shouldGoToHospital = true;
        } else if (
            painLevel >= 6 ||
            symptoms.includes('vomiting') ||
            symptoms.includes('dehydration') ||
            symptoms.includes('infection')
        ) {
            urgencyLevel = 'MEDIUM';
            shouldGoToHospital = false;
        } else if (
            painLevel >= 4 ||
            symptoms.includes('pain') ||
            symptoms.includes('discomfort')
        ) {
            urgencyLevel = 'LOW';
            shouldGoToHospital = false;
        } else {
            urgencyLevel = 'SELF-CARE';
            shouldGoToHospital = false;
        }

        return {
            urgencyLevel: urgencyLevel,
            shouldGoToHospital: shouldGoToHospital,
            fullAssessment: this.generateMockAssessment(symptomData, urgencyLevel),
        };
    }

    generateMockAssessment(symptomData, urgencyLevel) {
        // Create a mock assessment based on the input data
        const ageText = symptomData.age ? `You are ${symptomData.age} years old` : 'Your age was not provided';
        const genderText = symptomData.gender ? `a ${symptomData.gender.toLowerCase()} patient` : '';
        const patientDescription = `${ageText}, ${genderText}.`;

        let recommendationText = '';
        let reasoningText = '';
        let warningsText = '';

        switch (urgencyLevel) {
            case 'URGENT':
                recommendationText = 'RECOMMENDATION: URGENT: Seek immediate emergency care (call emergency services)';
                reasoningText = `REASONING: Based on your reported symptoms "${symptomData.primarySymptoms}" and a pain level of ${symptomData.painLevel}/10, this appears to be a potentially serious medical situation requiring immediate attention.`;
                warningsText = 'IMPORTANT WARNINGS: Delay in seeking emergency care could lead to serious complications. Please call emergency services or go to the nearest emergency room immediately.';
                break;
            case 'HIGH':
                recommendationText = 'RECOMMENDATION: HIGH: Go to the hospital/emergency room promptly';
                reasoningText = `REASONING: Your symptoms "${symptomData.primarySymptoms}" with a pain level of ${symptomData.painLevel}/10 indicate a condition that should be evaluated by medical professionals soon.`;
                warningsText = 'IMPORTANT WARNINGS: If your symptoms worsen, such as increased pain, difficulty breathing, or confusion, seek emergency care immediately.';
                break;
            case 'MEDIUM':
                recommendationText = 'RECOMMENDATION: MEDIUM: Schedule a same-day or urgent care appointment';
                reasoningText = `REASONING: Your symptoms "${symptomData.primarySymptoms}" with a pain level of ${symptomData.painLevel}/10 suggest a condition that should be evaluated by a healthcare provider today, but may not require emergency care.`;
                warningsText = 'IMPORTANT WARNINGS: If your symptoms worsen significantly, consider going to the emergency room.';
                break;
            case 'LOW':
                recommendationText = 'RECOMMENDATION: LOW: Schedule a regular appointment with primary care';
                reasoningText = `REASONING: Your symptoms "${symptomData.primarySymptoms}" with a pain level of ${symptomData.painLevel}/10 appear to be mild to moderate and could be addressed during a regular medical appointment.`;
                warningsText = 'IMPORTANT WARNINGS: If your symptoms worsen or persist for more than a few days, consider seeking more immediate care.';
                break;
            default:
                recommendationText = 'RECOMMENDATION: SELF-CARE: Manage symptoms at home with self-care';
                reasoningText = `REASONING: Your symptoms "${symptomData.primarySymptoms}" with a pain level of ${symptomData.painLevel}/10 appear to be mild and likely can be managed with appropriate self-care.`;
                warningsText = 'IMPORTANT WARNINGS: If your symptoms persist beyond 7 days or worsen, please consult with a healthcare provider.';
        }

        return `${patientDescription}\n\n${recommendationText}\n\n${reasoningText}\n\n${warningsText}\n\nThis is a simulated assessment for testing purposes only. In a real situation, always consult with medical professionals.`;
    }
}

export default GeminiMockService;