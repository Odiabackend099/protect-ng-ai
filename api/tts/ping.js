// api/tts/ping.js - Fixed version with timeout handling
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const startTime = Date.now();
  
  try {
    const ttsUrl = process.env.TTS_BASE_URL || "https://odiadev-tts-plug-n-play.onrender.com";
    const apiKey = process.env.TTS_API_KEY || "";
    
    console.log(` Pinging TTS service: ${ttsUrl}`);

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('TTS service timeout')), 5000);
    });

    const fetchPromise = fetch(`${ttsUrl}/health`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Protect.NG-TTS-Checker/2.0',
        'Accept': 'application/json',
        ...(apiKey && { 'x-api-key': apiKey })
      },
      signal: AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
    });

    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    let responseData;
    try {
      responseData = response.ok ? await response.json() : { 
        error: `HTTP ${response.status}`,
        statusText: response.statusText 
      };
    } catch (parseError) {
      responseData = { 
        error: 'Invalid JSON response',
        rawResponse: await response.text().catch(() => 'Unable to read response')
      };
    }

    const processingTime = Date.now() - startTime;
    const result = {
      ok: response.ok,
      status: response.status,
      target: ttsUrl,
      data: responseData,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`
    };

    console.log(`${response.ok ? '' : ''} TTS ping: ${processingTime}ms`);
    
    res.setHeader("content-type", "application/json");
    res.setHeader("cache-control", "no-cache");
    res.status(200).json(result);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(' TTS ping error:', error.message);
    
    const errorResponse = {
      ok: false,
      status: 0,
      target: process.env.TTS_BASE_URL || "https://odiadev-tts-plug-n-play.onrender.com",
      data: { error: error.message },
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`,
      fallback: true
    };

    res.setHeader("content-type", "application/json");
    res.setHeader("cache-control", "no-cache");
    res.status(200).json(errorResponse);
  }
}
