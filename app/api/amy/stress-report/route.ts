import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { score, answers } = body

    console.log("🔎 AMY-Route: Request erhalten:", body)

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      console.error("❌ Kein Anthropic API Key gefunden!")
      return NextResponse.json({ error: "Missing API key" }, { status: 500 })
    }

    // -------------------------------
    // 1) Prompt vorbereiten
    // -------------------------------
    const prompt = `
Du bist AMY, eine medizinische Assistenz-KI von Rhythmologicum.

Erstelle basierend auf folgendem Stress & Resilienz Score eine kurze, laienverständliche Auswertung.

Score: ${score}

Antworten:
${JSON.stringify(answers, null, 2)}

Gib bitte zurück:
- Eine kurze Bewertung (2–3 Sätze)
- 3 klare Empfehlungen (Bullet Points)
- Kein Fachjargon, klare Alltagssprache.
    `.trim()

    // -------------------------------
    // 2) Claude API-Aufruf
    // -------------------------------
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",   // <— DEIN MODELL
        max_tokens: 600,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    })

    console.log("🔎 AMY-Route: Claude-Status:", response.status)

    if (!response.ok) {
      const text = await response.text()
      console.error("❌ Claude-Fehler:", text)
      return NextResponse.json(
        { error: "Fehler beim Aufruf der Claude-API", status: response.status, body: text },
        { status: 500 }
      )
    }

   const result = await response.json()

console.log("🔎 AMY-Route: Claude-Antwort:", result)

const text = result?.content?.[0]?.text ?? "Keine Antwort erhalten."

return NextResponse.json({
  ok: true,
  score,
  reportText: text,   // 🔴 Wichtig: Name so, wie die Result-Page ihn erwartet
  // optional zusätzlich:
  analysis: text,
})


  } catch (error: any) {
    console.error("❌ Unbekannter Fehler in AMY-Route:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
