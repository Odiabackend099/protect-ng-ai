import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      sessionId,
      transcript,
      classification,
      location,
      processingTime,
      languageDetected,
      clientInfo
    } = await req.json();

    if (!sessionId || !transcript || !classification) {
      throw new Error('Missing required fields');
    }

    console.log(`[${sessionId}] Logging emergency to database`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log the emergency
    const { data, error } = await supabase
      .from('emergency_logs')
      .insert({
        session_id: sessionId,
        transcription: transcript,
        emergency_type: classification.emergency_type,
        severity: classification.severity,
        response_message: classification.response_message,
        immediate_actions: classification.immediate_actions,
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          address: location.address || `${location.latitude}, ${location.longitude}`
        } : null,
        ai_confidence: classification.confidence_score,
        ai_model_used: 'gpt-4o-mini',
        processing_time_ms: processingTime,
        language_detected: languageDetected || classification.language_detected,
        claude_success: true,
        fallback_used: false,
        tts_success: true,
        client_ip: clientInfo?.ip,
        user_agent: clientInfo?.userAgent,
        platform: 'web',
        status: 'processed'
      })
      .select();

    if (error) {
      console.error(`[${sessionId}] Database error:`, error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`[${sessionId}] Emergency logged successfully with ID: ${data[0].id}`);

    // Log audit trail
    await supabase
      .from('session_audit_trail')
      .insert({
        session_id: sessionId,
        event_type: 'emergency_logged',
        event_description: 'Emergency successfully classified and logged',
        event_data: {
          emergency_type: classification.emergency_type,
          severity: classification.severity,
          processing_time_ms: processingTime
        },
        duration_ms: processingTime,
        success: true,
        client_ip: clientInfo?.ip,
        user_agent: clientInfo?.userAgent
      });

    return new Response(
      JSON.stringify({
        success: true,
        emergencyId: data[0].id,
        callReference: data[0].call_reference
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Emergency logging error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});