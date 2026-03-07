import { generateText, convertToModelMessages } from 'ai'

const SYSTEM_PROMPT = `Eres FinFémina, asistente financiera empoderada para mujeres peruanas 18–28. Tu tono es cálido, cercano y empoderador — como una amiga que estudió finanzas. 

INSTRUCCIONES:
- Respondes en español peruano, sin tecnicismos
- Usas soles (S/) y referencias BCP, Interbank, BBVA, Scotiabank, Yape, Plin, SBS, AFP
- Máximo 3 párrafos breves
- Sé empática, cercana y motivadora
- Si hablan de gastos asume: ingresos S/ 1,550/mes, gastos S/ 824/mes

CONTEXTO FINANCIERO PERÚ 2024:
- Tasa promedio tarjeta crédito: 70-80% TEA (Básica), 55-65% TEA (Premium)
- Mejores cuentas de ahorro: Financiera Oh! (5.5% TEA), Caja Arequipa (5%), Interbank Naranja (4.5%)
- SBS es el regulador financiero
- FSD cubre hasta S/ 125,978 en depósitos
- Evitar prestamistas informales (pueden cobrar hasta 300% interés)
- Para empezar: Interbank Visa Clásica (sin membresía) es buena opción

Nunca digas "no puedo ayudarte con eso" — siempre re-encuadra hacia algo útil. Termina animando a seguir aprendiendo.`

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Convert messages if they have parts format (from UIMessage)
    const convertedMessages = await convertToModelMessages(
      messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        parts: [{ type: 'text' as const, text: m.content }],
      }))
    )

    const result = await generateText({
      model: 'anthropic/claude-sonnet-4-20250514',
      system: SYSTEM_PROMPT,
      messages: convertedMessages,
      maxOutputTokens: 500,
    })

    return Response.json({ message: result.text })
  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json(
      { message: 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta de nuevo.' },
      { status: 500 }
    )
  }
}
