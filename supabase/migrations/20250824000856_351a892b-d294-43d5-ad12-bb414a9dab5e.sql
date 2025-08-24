-- Fix remaining function search path issue
CREATE OR REPLACE FUNCTION generate_call_reference()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.call_reference IS NULL THEN
        NEW.call_reference := 'NG-' || NEW.session_id;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql'
SET search_path = public;