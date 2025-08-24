// api/health.js - Fixed version with proper error handling
export default async function handler(req, res) {
  // Set CORS headers immediately
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const healthData = {
      status: "healthy",
      service: "Protect.NG CrossAI Emergency Response",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
      region: process.env.VERCEL_REGION || "auto",
      ready: true
    };

    console.log(` Health check successful: ${healthData.service}`);
    
    res.setHeader("content-type", "application/json");
    res.setHeader("cache-control", "no-cache");
    res.status(200).json(healthData);
    
  } catch (error) {
    console.error(' Health check error:', error);
    
    res.setHeader("content-type", "application/json");
    res.status(503).json({
      status: "degraded",
      service: "Protect.NG CrossAI Emergency Response",
      timestamp: new Date().toISOString(),
      error: error.message,
      ready: false
    });
  }
}
