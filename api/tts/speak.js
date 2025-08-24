// api/tts/speak.js - Nigerian TTS proxy endpoint
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const ttsUrl = process.env.TTS_BASE_URL || "https://odiadev-tts-plug-n-play.onrender.com";
    const apiKey = process.env.TTS_API_KEY || "";
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    const text = (url.searchParams.get("text") || "").slice(0, 500);
    const voice = url.searchParams.get("voice") || "nigerian-female";
    
    if (!text) {
      return res.status(400).json({
        error: "Text parameter required",
        example: "/api/tts/speak?text=Hello&voice=nigerian-female"
      });
    }

    console.log(` TTS Request: "${text}" with voice: ${voice}`);

    const ttsResponse = await fetch(
      `${ttsUrl}/speak?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}`,
      {
        headers: {
          'User-Agent': 'Protect.NG-TTS-Proxy/2.0',
          ...(apiKey && { 'x-api-key': apiKey })
        },
        signal: AbortSignal.timeout ? AbortSignal.timeout(30000) : undefined
      }
    );

    if (!ttsResponse.ok) {
      console.log(` TTS Error: ${ttsResponse.status}`);
      return res.status(ttsResponse.status).json({
        error: "TTS service error",
        status: ttsResponse.status,
        message: await ttsResponse.text()
      });
    }

    const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
    
    res.setHeader("Content-Type", ttsResponse.headers.get("content-type") || "audio/wav");
    res.setHeader("Content-Length", audioBuffer.length);
    res.setHeader("Cache-Control", "public, max-age=300");
    
    console.log(` TTS Success: ${audioBuffer.length} bytes`);
    res.status(200).send(audioBuffer);
    
  } catch (error) {
    console.error("TTS Error:", error);
    res.status(500).json({
      error: "TTS generation failed",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
