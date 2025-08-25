export default async function handler(req, res) {
  const base = process.env.TTS_BASE_URL || "https://odiadev-tts-plug-n-play.onrender.com";
  try {
    const r = await fetch(`${base}/health`);
    const data = r.ok ? await r.json() : { status: r.status, statusText: r.statusText };
    res.setHeader("content-type","application/json");
    res.status(200).json({ ok: r.ok, target: base, data });
  } catch (e) {
    res.setHeader("content-type","application/json");
    res.status(200).json({ ok:false, target: base, error: e.message });
  }
}
