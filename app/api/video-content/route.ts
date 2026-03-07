import { generateText } from 'ai'

export async function POST(req: Request) {
  try {
    const { videoTitle, videoCategory, videoTip, userMode } = await req.json()

    const modeInstruction = userMode === 'cercano' 
      ? 'Usa un tono de amiga cercana, tutea, usa expresiones como "bestie", "chica", "mira", "te cuento".'
      : 'Usa un tono profesional pero cálido, directo y claro.'

    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      system: `Eres Femi de FinFémina. Creas contenido educativo financiero para mujeres peruanas jóvenes (18–28). Tu estilo es: cálido, empoderador, sin tecnicismos, con ejemplos de la vida real peruana (menciona soles, Yape, Wong, BCP, etc.). ${modeInstruction}

RESPONDE ÚNICAMENTE con un JSON válido, sin texto adicional, sin backticks, con esta estructura exacta:
{
  "title": "título del video (max 50 chars)",
  "duration": "X min X seg",
  "slides": [
    {
      "emoji": "emoji único representativo",
      "headline": "concepto clave en máx 8 palabras, impactante",
      "body": "explicación en 2–3 oraciones simples, con ejemplo peruano real",
      "tip": "tip práctico de 1 oración"
    }
  ],
  "keyTakeaway": "la conclusión más importante en 1 oración empoderada",
  "relatedTopics": ["tema1", "tema2", "tema3"]
}
Genera exactamente 4 slides que fluyan como una historia: introducción → qué es → cómo te afecta → qué hacer.`,
      prompt: `Genera el contenido para este video: "${videoTitle}". Categoría: ${videoCategory}. Tip base: "${videoTip}".`,
      maxOutputTokens: 1000,
    })

    // Parse the JSON response
    try {
      const content = JSON.parse(result.text)
      return Response.json(content)
    } catch {
      // If parsing fails, return a structured fallback
      return Response.json({
        title: videoTitle,
        duration: '2 min',
        slides: [
          { emoji: '📚', headline: '¿Qué aprenderás hoy?', body: videoTip, tip: 'Toma notas si te ayuda' },
          { emoji: '💡', headline: 'Concepto clave', body: `${videoTitle} es fundamental para tu educación financiera.`, tip: 'Guarda este concepto' },
          { emoji: '💰', headline: '¿Cómo te afecta?', body: 'Entender este tema te ayudará a tomar mejores decisiones con tu dinero.', tip: 'Aplícalo hoy mismo' },
          { emoji: '🚀', headline: '¿Qué hacer ahora?', body: 'Completa el quiz para ganar puntos y reforzar lo aprendido.', tip: '¡Tú puedes!' },
        ],
        keyTakeaway: videoTip,
        relatedTopics: ['Ahorro', 'Presupuesto', 'Crédito'],
      })
    }
  } catch (error) {
    console.error('Video content API error:', error)
    return Response.json(
      { error: 'Failed to generate video content' },
      { status: 500 }
    )
  }
}
