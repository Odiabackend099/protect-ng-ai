-- =============================================
-- 🇳🇬 PROTECT.NG CROSSAI - COMPLETE DATABASE SETUP
-- Federal-Grade Emergency Response System
-- =============================================

-- ===== EXTENSIONS =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ===== MAIN TABLES =====

-- Emergency logs table - Core emergency interaction storage
CREATE TABLE emergency_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Session & Call Information
  session_id text NOT NULL,
  call_reference text UNIQUE NOT NULL,
  
  -- Caller Information
  caller_phone text,
  caller_name text,
  caller_username text,
  
  -- Location Data
  location jsonb,
  location_point geometry(POINT, 4326),
  
  -- Emergency Classification
  emergency_type text NOT NULL CHECK (emergency_type IN (
    'FIRE_OUTBREAK',
    'MEDICAL_EMERGENCY', 
    'ARMED_ROBBERY',
    'TRAFFIC_ACCIDENT',
    'BUILDING_COLLAPSE',
    'FLOODING',
    'KIDNAPPING',
    'DOMESTIC_VIOLENCE',
    'MENTAL_HEALTH_CRISIS',
    'GENERAL_EMERGENCY'
  )),
  
  severity text NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
  
  -- Content & Processing
  transcription text NOT NULL,
  original_audio_url text,
  response_message text NOT NULL,
  immediate_actions jsonb,
  
  -- AI & Processing Metadata
  ai_confidence numeric(3,2) CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
  ai_model_used text DEFAULT 'claude-sonnet-4-20250514',
  processing_time_ms integer,
  language_detected text,
  keywords jsonb,
  caller_emotional_state text,
  
  -- Technical Metadata
  claude_success boolean DEFAULT true,
  fallback_used boolean DEFAULT false,
  tts_success boolean DEFAULT true,
  client_ip inet,
  user_agent text,
  platform text DEFAULT 'web',
  
  -- Status & Workflow
  status text DEFAULT 'processed' CHECK (status IN (
    'processed', 'dispatched', 'responding', 'resolved', 'false_alarm', 'follow_up_needed'
  )),
  
  dispatched_to text,
  response_time_estimate text,
  actual_response_time interval,
  resolution_notes text,
  
  -- Timestamps
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  dispatched_at timestamp with time zone,
  resolved_at timestamp with time zone,
  
  -- Data Retention (NDPR Compliance)
  data_retention_expiry timestamp with time zone DEFAULT (now() + interval '2 years'),
  
  -- Audit Fields
  created_by uuid,
  updated_by uuid
);

-- Error logs table
CREATE TABLE error_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id text,
  request_id text,
  error_type text NOT NULL,
  error_code text,
  error_message text NOT NULL,
  error_stack text,
  request_data jsonb,
  request_url text,
  request_method text,
  client_ip inet,
  user_agent text,
  api_endpoint text,
  severity text DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  category text,
  resolved boolean DEFAULT false,
  resolution_notes text,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  timestamp timestamp with time zone DEFAULT now()
);

-- Session audit trail
CREATE TABLE session_audit_trail (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id text NOT NULL,
  step_number integer,
  event_type text NOT NULL,
  event_description text,
  event_data jsonb,
  duration_ms integer,
  success boolean DEFAULT true,
  error_message text,
  client_ip inet,
  user_agent text,
  timestamp timestamp with time zone DEFAULT now()
);

-- System configuration
CREATE TABLE system_config (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key text UNIQUE NOT NULL,
  config_value jsonb NOT NULL,
  description text,
  category text,
  is_active boolean DEFAULT true,
  requires_admin boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Emergency services directory
CREATE TABLE emergency_services (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name text NOT NULL,
  service_type text NOT NULL,
  primary_phone text,
  secondary_phone text,
  email text,
  state text,
  lga text,
  coverage_area jsonb,
  coverage_polygon geometry(POLYGON, 4326),
  capabilities jsonb,
  response_time_estimate text,
  availability_hours text DEFAULT '24/7',
  api_endpoint text,
  api_key_reference text,
  is_active boolean DEFAULT true,
  last_verified timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ===== INDEXES =====
CREATE INDEX idx_emergency_logs_session_id ON emergency_logs(session_id);
CREATE INDEX idx_emergency_logs_created_at ON emergency_logs(created_at DESC);
CREATE INDEX idx_emergency_logs_emergency_type ON emergency_logs(emergency_type);
CREATE INDEX idx_emergency_logs_severity ON emergency_logs(severity);
CREATE INDEX idx_emergency_logs_status ON emergency_logs(status);
CREATE INDEX idx_emergency_logs_caller_phone ON emergency_logs(caller_phone);
CREATE INDEX idx_emergency_logs_call_reference ON emergency_logs(call_reference);

CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp DESC);
CREATE INDEX idx_error_logs_session_id ON error_logs(session_id);
CREATE INDEX idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_severity ON error_logs(severity);

CREATE INDEX idx_audit_trail_session_id ON session_audit_trail(session_id);
CREATE INDEX idx_audit_trail_timestamp ON session_audit_trail(timestamp DESC);

-- ===== FUNCTIONS & TRIGGERS =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_emergency_logs_updated_at 
    BEFORE UPDATE ON emergency_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at 
    BEFORE UPDATE ON system_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergency_services_updated_at 
    BEFORE UPDATE ON emergency_services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate call reference
CREATE OR REPLACE FUNCTION generate_call_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.call_reference IS NULL THEN
        NEW.call_reference := 'NG-' || NEW.session_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_call_reference_trigger
    BEFORE INSERT ON emergency_logs
    FOR EACH ROW EXECUTE FUNCTION generate_call_reference();

-- ===== RLS POLICIES =====
ALTER TABLE emergency_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_services ENABLE ROW LEVEL SECURITY;

-- Allow public access for emergency functionality
CREATE POLICY "Public can insert emergency_logs" ON emergency_logs
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage emergency_logs" ON emergency_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Public can view emergency_services" ON emergency_services
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage all tables" ON error_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage audit_trail" ON session_audit_trail
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage system_config" ON system_config
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ===== INITIAL DATA =====
INSERT INTO system_config (config_key, config_value, description, category) VALUES
('emergency_contacts', '{"primary": "112", "police": "199", "fire": "199", "medical": "199"}', 'Default emergency contact numbers', 'emergency_contacts'),
('ai_settings', '{"model": "claude-sonnet-4-20250514", "max_tokens": 800, "temperature": 0.1}', 'AI model configuration', 'ai_settings'),
('supported_languages', '["english", "pidgin", "hausa", "yoruba", "igbo"]', 'Supported languages for the system', 'app_settings');

INSERT INTO emergency_services (service_name, service_type, primary_phone, state, coverage_area, capabilities) VALUES
('Nigeria Emergency Management Agency', 'general', '112', 'Federal', '{"nationwide": true}', '["general_emergency", "disaster_management", "coordination"]'),
('Nigeria Police Force', 'police', '199', 'Federal', '{"nationwide": true}', '["crime", "security", "public_order"]'),
('Federal Fire Service', 'fire', '199', 'Federal', '{"nationwide": true}', '["fire", "rescue", "hazmat"]');