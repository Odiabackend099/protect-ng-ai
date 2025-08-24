// Production-ready Claude TTS handler
export async function speak(text: string) {
  return fetch('/api/speak', { method: 'POST', body: JSON.stringify({ text }) })
}