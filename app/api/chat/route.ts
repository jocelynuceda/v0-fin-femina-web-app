import { generateText, convertToModelMessages } from 'ai'

const SYSTEM_PROMPT = `Eres FinFémina, asistente financiera para mujeres peruanas de 18 a 28 años. 

INSTRUCCIONES:
- Responde siempre en español, de manera clara y amigable
- Evita tecnicismos; si los usas, explícalos brevemente
- Usa soles (S/) para cantidades monetarias
- Menciona bancos peruanos cuando sea relevante: BCP, Interbank, BBVA, Scotiabank
- Menciona apps de pago populares: Yape, Plin
- Mantén tus respuestas concisas: máximo 3 párrafos breves
- Sé empática y motivadora
- Si te preguntan por gastos del usuario, asume: ingresos S/ 1,550/mes, gastos S/ 824/mes

CONTEXTO FINANCIERO PERÚ:
- Tasa promedio de tarjeta de crédito: 70-80% TEA
- Cuentas de ahorro: 0.5-2.5% TEA
- SBS es el regulador financiero
- Evitar prestamistas informales (pueden cobrar hasta 300% interés)

Siempre termina animando a la usuaria a seguir aprendiendo sobre finanzas.`

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
