export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const text = (url.searchParams.get("text") || "").slice(0, 500);
    const voice = url.searchParams.get("voice") || "nigerian-female";
    if (!text) { res.status(400).json({ error: "text required" }); return; }

    const base = process.env.TTS_BASE_URL || "https://odiadev-tts-plug-n-play.onrender.com";
    const rr = await fetch(`${base}/speak?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voice)}`);
    const buf = Buffer.from(await rr.arrayBuffer());

    res.setHeader("content-type", rr.headers.get("content-type") || "audio/wav");
    res.setHeader("cache-control", "no-store");
    res.status(rr.ok ? 200 : rr.status).send(buf);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
