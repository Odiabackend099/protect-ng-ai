import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EMERGENCY_TYPES = {
  'fire': 'FIRE_OUTBREAK',
  'medical': 'MEDICAL_EMERGENCY',
  'robbery': 'ARMED_ROBBERY',
  'accident': 'TRAFFIC_ACCIDENT',
  'collapse': 'BUILDING_COLLAPSE',
  'flood': 'FLOODING',
  'kidnap': 'KIDNAPPING',
  'violence': 'DOMESTIC_VIOLENCE',
  'mental': 'MENTAL_HEALTH_CRISIS',
  'general': 'GENERAL_EMERGENCY'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, location, sessionId, language = 'english' } = await req.json();
    
    if (!transcript) {
      throw new Error('Transcript is required');
    }

    const startTime = Date.now();
    console.log(`[${sessionId}] Classifying emergency: "${transcript.substring(0, 100)}..."`);

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const prompt = `You are CrossAI, Nigeria's federal emergency response AI system. Analyze this emergency call and respond with ONLY a valid JSON object.

EMERGENCY CALL: "${transcript}"
LOCATION: ${location || 'Unknown location'}
LANGUAGE: ${language}

Classify this emergency and respond with this EXACT JSON structure:
{
  "emergency_type": "FIRE_OUTBREAK|MEDICAL_EMERGENCY|ARMED_ROBBERY|TRAFFIC_ACCIDENT|BUILDING_COLLAPSE|FLOODING|KIDNAPPING|DOMESTIC_VIOLENCE|MENTAL_HEALTH_CRISIS|GENERAL_EMERGENCY",
  "severity": "CRITICAL|HIGH|MEDIUM|LOW",
  "location": "${location || 'Unknown location'}",
  "response_message": "Clear, actionable emergency response in simple Nigerian English",
  "immediate_actions": ["Action 1", "Action 2", "Action 3"],
  "confidence_score": 0.95,
  "language_detected": "${language}",
  "estimated_response_time": "3-5 minutes",
  "emergency_services": ["Nigeria Police Force: 199", "Federal Fire Service: 199", "Emergency: 112"]
}

Guidelines:
- Use Nigerian context and emergency services
- Keep response_message under 200 words
- Use simple, clear language
- Include specific immediate actions
- Confidence score between 0.1-1.0
- Response time based on emergency type and location`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are CrossAI, Nigeria\'s emergency response AI. Respond only with valid JSON.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`[${sessionId}] OpenAI classification error:`, error);
      throw new Error(error.error?.message || 'Failed to classify emergency');
    }

    const result = await response.json();
    const classification = result.choices[0].message.content;
    
    let parsedClassification;
    try {
      parsedClassification = JSON.parse(classification);
    } catch (parseError) {
      console.error(`[${sessionId}] Failed to parse AI response:`, classification);
      
      // Fallback classification
      parsedClassification = {
        emergency_type: 'GENERAL_EMERGENCY',
        severity: 'HIGH',
        location: location || 'Unknown location',
        response_message: 'Emergency situation detected. Help is being dispatched to your location.',
        immediate_actions: [
          'Stay calm and ensure your safety',
          'Remain at your current location if safe',
          'Emergency services have been alerted'
        ],
        confidence_score: 0.5,
        language_detected: language,
        estimated_response_time: '5-10 minutes',
        emergency_services: ['Emergency: 112', 'Police: 199', 'Fire Service: 199']
      };
    }

    const processingTime = Date.now() - startTime;
    console.log(`[${sessionId}] Emergency classified as ${parsedClassification.emergency_type} with ${parsedClassification.severity} severity in ${processingTime}ms`);

    return new Response(
      JSON.stringify({
        classification: parsedClassification,
        processingTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Emergency classification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});