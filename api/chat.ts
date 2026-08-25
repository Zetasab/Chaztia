import type { VercelRequest, VercelResponse } from '@vercel/node'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'openai/gpt-oss-120b'

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured: missing GROQ_API_KEY' })
  }

  const messages = req.body?.messages as ChatMessage[] | undefined
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing "messages" array in request body' })
  }

  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
      }),
    })

    const data = await groqRes.json()

    if (!groqRes.ok) {
      return res.status(groqRes.status).json({ error: data?.error?.message ?? 'Groq API error' })
    }

    const reply = data?.choices?.[0]?.message?.content ?? ''
    return res.status(200).json({ reply })
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reach Groq API' })
  }
}
