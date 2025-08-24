import React, { useState, useEffect } from 'react';
import { LoadingScreen } from '@/components/LoadingScreen';
import { EmergencyRecorder } from '@/components/EmergencyRecorder';
import { EmergencyClassification, type EmergencyClassification as EmergencyClassificationType } from '@/components/EmergencyClassification';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, RefreshCw, AlertTriangle, Globe, Phone, Shield, Clock, Mic, Volume2, Brain } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import heroImage from '@/assets/nigerian-ai-hero.jpg';

interface EmergencyState {
  isRecording: boolean;
  transcript: string;
  classification: EmergencyClassificationType | null;
  isProcessing: boolean;
  audioResponse: string | null;
  location: GeolocationCoordinates | null;
  sessionId: string;
  error: string | null;
  systemStatus: 'operational' | 'degraded' | 'error';
  currentLanguage: 'english' | 'pidgin';
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [emergencyState, setEmergencyState] = useState<EmergencyState>({
    isRecording: false,
    transcript: '',
    classification: null,
    isProcessing: false,
    audioResponse: null,
    location: null,
    sessionId: '',
    error: null,
    systemStatus: 'operational',
    currentLanguage: 'english'
  });

  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize session and get location
  useEffect(() => {
    if (!isLoading) {
      initializeEmergencySession();
    }
  }, [isLoading]);

  const initializeEmergencySession = async () => {
    try {
      // Generate unique session ID
      const sessionId = `NG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      setEmergencyState(prev => ({
        ...prev,
        sessionId
      }));

      // Request location permission
      await requestLocationPermission();
      
      // Request microphone permission early
      await requestMicrophonePermission();
      
      setHasInitialized(true);
      
      toast({
        title: "🇳🇬 Protect.NG CrossAI Ready",
        description: "Emergency response system initialized. Press the red button to report an emergency.",
      });

    } catch (error) {
      console.error('Initialization error:', error);
      setEmergencyState(prev => ({
        ...prev,
        error: 'System initialization failed. Please refresh the page.',
        systemStatus: 'error'
      }));
    }
  };

  const requestLocationPermission = async () => {
    try {
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
          });
        });

        setEmergencyState(prev => ({
          ...prev,
          location: position.coords
        }));
        
        setLocationPermissionGranted(true);
        
        toast({
          title: "Location Detected",
          description: `Location: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
        });
      }
    } catch (error) {
      console.error('Location permission error:', error);
      toast({
        title: "Location Access Denied",
        description: "Location services are disabled. Emergency services will use fallback location methods.",
        variant: "destructive"
      });
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      toast({
        title: "Microphone Ready",
        description: "Voice recording is enabled for emergency calls.",
      });
    } catch (error) {
      console.error('Microphone permission error:', error);
      toast({
        title: "Microphone Access Required",
        description: "Please enable microphone access to use voice emergency reporting.",
        variant: "destructive"
      });
    }
  };

  const handleTranscriptionComplete = (transcript: string, audioBlob?: Blob) => {
    setEmergencyState(prev => ({
      ...prev,
      transcript,
      isProcessing: true
    }));
  };

  const handleClassificationComplete = (classification: EmergencyClassificationType) => {
    setEmergencyState(prev => ({
      ...prev,
      classification,
      isProcessing: false
    }));

    // Log emergency to session audit trail
    logEmergencyEvent('classification_completed', {
      emergency_type: classification.emergency_type,
      severity: classification.severity,
      confidence: classification.confidence_score
    });
  };

  const handleLanguageChange = (language: 'english' | 'pidgin') => {
    setEmergencyState(prev => ({
      ...prev,
      currentLanguage: language
    }));
    
    toast({
      title: "Language Changed",
      description: `Emergency system now set to ${language === 'pidgin' ? 'Nigerian Pidgin' : 'English'}`,
    });
  };

  const resetEmergencySession = () => {
    setEmergencyState(prev => ({
      ...prev,
      transcript: '',
      classification: null,
      isProcessing: false,
      audioResponse: null,
      error: null
    }));
    
    toast({
      title: "New Emergency Session",
      description: "Ready to report a new emergency.",
    });
  };

  const logEmergencyEvent = (eventType: string, eventData: any) => {
    console.log(`[${emergencyState.sessionId}] ${eventType}:`, eventData);
    // In production, this would send to your backend audit trail
  };

  const callEmergencyNumber = (number: string) => {
    if (typeof window !== 'undefined' && 'href' in window.location) {
      window.location.href = `tel:${number}`;
    }
  };

  const handleLoadComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen onLoadComplete={handleLoadComplete} />;
  }

  if (!hasInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-green-900">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto"></div>
          <h2 className="text-white text-xl font-semibold">🇳🇬 Initializing Emergency System...</h2>
          <p className="text-white/70">Setting up secure connection and permissions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Hero Background with Nigerian AI Avatar */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `linear-gradient(rgba(30, 58, 138, 0.85), rgba(30, 64, 175, 0.85)), url(${heroImage})` 
        }}
      />
      
      {/* Floating Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/ee1ba5ca-a89e-4ae8-8243-df29c8f79b2c.png" 
                alt="Nigeria Emergency Shield" 
                className="h-10 w-10 animate-pulse"
              />
              <div>
                <h1 className="text-white font-bold text-lg tracking-tight">
                  🇳🇬 Protect.NG CrossAI
                </h1>
                <p className="text-white/70 text-xs hidden sm:block">
                  When seconds count, we listen
                </p>
              </div>
            </div>

            {/* System Controls */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${emergencyState.systemStatus === 'operational' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="text-white/80 text-sm font-medium">
                  {emergencyState.systemStatus.toUpperCase()}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleLanguageChange(emergencyState.currentLanguage === 'english' ? 'pidgin' : 'english')}
                className="flex items-center space-x-2"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {emergencyState.currentLanguage === 'english' ? 'English' : 'Pidgin'}
                </span>
              </Button>

              <div className="hidden md:flex flex-col items-end">
                <span className="text-white font-mono text-sm">
                  {currentTime.toLocaleTimeString('en-GB', { hour12: false })}
                </span>
                <span className="text-white/70 text-xs">
                  {currentTime.toLocaleDateString('en-GB')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Scrolling Content */}
      <main className="relative z-10 pt-20">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            
            {/* Main Title */}
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white text-shadow-federal leading-tight">
                🇳🇬 Federal Emergency
                <br />
                <span className="text-green-400">CrossAI Response</span>
              </h1>
              <p className="text-xl sm:text-2xl text-white/90 font-medium">
                Nigeria's AI-Powered Emergency Classification & Response Platform
              </p>
              <p className="text-lg text-white/80 max-w-2xl mx-auto">
                Advanced artificial intelligence analyzes emergency calls in real-time, 
                classifies threats, and dispatches appropriate federal response teams within seconds.
              </p>
            </div>

            {/* System Status Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in delay-200">
              <Badge 
                variant="outline" 
                className={`text-lg px-4 py-2 ${emergencyState.systemStatus === 'operational' ? 'border-green-500 text-green-400 bg-green-500/10' : 'border-red-500 text-red-400 bg-red-500/10'}`}
              >
                <Shield className="h-4 w-4 mr-2" />
                System {emergencyState.systemStatus.toUpperCase()}
              </Badge>
              
              {emergencyState.location && (
                <Badge variant="outline" className="text-lg px-4 py-2 border-blue-500 text-blue-400 bg-blue-500/10">
                  <MapPin className="h-4 w-4 mr-2" />
                  Location Ready
                </Badge>
              )}
              
              <Badge variant="outline" className="text-lg px-4 py-2 border-purple-500 text-purple-400 bg-purple-500/10">
                <Brain className="h-4 w-4 mr-2" />
                AI Ready
              </Badge>

              <Badge variant="outline" className="text-lg px-4 py-2 border-orange-500 text-orange-400 bg-orange-500/10">
                <Mic className="h-4 w-4 mr-2" />
                Voice Ready
              </Badge>
            </div>

            {/* Emergency Call Button */}
            <div className="animate-fade-in delay-300">
              <EmergencyRecorder
                onTranscriptionComplete={handleTranscriptionComplete}
                isProcessing={emergencyState.isProcessing}
                currentLanguage={emergencyState.currentLanguage}
              />
            </div>
          </div>
        </section>

        {/* Error Display */}
        {emergencyState.error && (
          <section className="px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
            <div className="max-w-4xl mx-auto">
              <Card className="p-6 bg-red-500/20 border-red-500/50 backdrop-blur-sm">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                  <div className="flex-1">
                    <p className="text-red-200 text-lg">{emergencyState.error}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={initializeEmergencySession}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </Card>
            </div>
          </section>
        )}

        {/* Emergency Classification Results */}
        {emergencyState.transcript && (
          <section className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
              <EmergencyClassification
                transcript={emergencyState.transcript}
                location={emergencyState.location}
                sessionId={emergencyState.sessionId}
                currentLanguage={emergencyState.currentLanguage}
                onClassificationComplete={handleClassificationComplete}
              />
            </div>
          </section>
        )}

        {/* New Emergency Button */}
        {emergencyState.classification && (
          <section className="px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto text-center">
              <Button
                variant="federal"
                size="xl"
                onClick={resetEmergencySession}
                className="animate-fade-in"
              >
                <RefreshCw className="h-6 w-6 mr-3" />
                Report New Emergency
              </Button>
            </div>
          </section>
        )}

        {/* System Features */}
        <section className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20 text-center hover-scale">
                <div className="mb-4">
                  <Brain className="h-12 w-12 mx-auto text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">🤖 AI Classification</h3>
                <p className="text-white/80">
                  Advanced AI analyzes emergency calls in real-time and determines the most appropriate response based on voice patterns, keywords, and context.
                </p>
              </Card>

              <Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20 text-center hover-scale">
                <div className="mb-4">
                  <Clock className="h-12 w-12 mx-auto text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">⚡ Rapid Response</h3>
                <p className="text-white/80">
                  Emergency services are notified within 3-5 seconds of call classification. Federal response teams are dispatched immediately to your location.
                </p>
              </Card>

              <Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20 text-center hover-scale">
                <div className="mb-4">
                  <Shield className="h-12 w-12 mx-auto text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">🔒 Federal Security</h3>
                <p className="text-white/80">
                  Bank-grade encryption, NDPR compliance, and federal security protocols ensure your emergency data is protected and secure.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Emergency Fallback Numbers */}
        <section className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto">
            <Card className="p-8 bg-red-500/20 border-red-500/50 backdrop-blur-sm">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center space-x-2">
                  <Phone className="h-6 w-6 text-red-400" />
                  <h3 className="text-2xl font-bold text-white">Emergency Fallback Numbers</h3>
                </div>
                <p className="text-red-200 text-lg">
                  If this AI system is unavailable, call these numbers directly for immediate assistance
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="bg-white/10 rounded-2xl p-6">
                    <div className="text-center space-y-3">
                      <div className="text-white font-bold text-4xl">112</div>
                      <div className="text-white/90 font-semibold text-xl">General Emergency</div>
                      <div className="text-white/70">All emergencies nationwide</div>
                      <Button
                        variant="emergency"
                        size="lg"
                        onClick={() => callEmergencyNumber('112')}
                        className="w-full text-xl"
                      >
                        CALL 112 NOW
                      </Button>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-2xl p-6">
                    <div className="text-center space-y-3">
                      <div className="text-white font-bold text-4xl">199</div>
                      <div className="text-white/90 font-semibold text-xl">Police/Fire/Medical</div>
                      <div className="text-white/70">Direct specialized services</div>
                      <Button
                        variant="emergency"
                        size="lg"
                        onClick={() => callEmergencyNumber('199')}
                        className="w-full text-xl"
                      >
                        CALL 199 NOW
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Footer Information */}
        <footer className="px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-white/70" />
                    <span className="text-white/70">Session ID:</span>
                    <span className="text-white font-mono">{emergencyState.sessionId}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-white/70" />
                    <span className="text-white/70">Started:</span>
                    <span className="text-white">{currentTime.toLocaleTimeString()}</span>
                  </div>
                </div>
                
                <div className="text-white/70 text-center">
                  <p>🇳🇬 Federal Republic of Nigeria Emergency Response System</p>
                  <p className="text-xs text-white/50 mt-1">Powered by <span className="text-white font-semibold">ODIA.dev</span></p>
                </div>
              </div>
            </Card>

            <div className="text-center space-y-2 mt-8">
              <p className="text-white/40 text-xs">
                This system is monitored 24/7 for your safety and security
              </p>
              <p className="text-white/30 text-xs">
                Emergency data is handled in compliance with NDPR and international standards
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
