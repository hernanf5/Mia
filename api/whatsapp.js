import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TYPE_LABEL = { income: 'Ingreso', fixed: 'Gasto fijo', variable: 'Variable' }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed')
  }

  try {
    const params = await parseBody(req)

    if (!validTwilioSignature(req, params)) {
      return res.status(403).send('Invalid signature')
    }

    const body = (params.Body ?? '').trim()
    const from = params.From ?? ''
    const messageSid = params.MessageSid ?? ''

    const { data: waUser } = await supabase
      .from('whatsapp_users')
      .select('user_id')
      .eq('phone', from)
      .maybeSingle()

    if (!waUser) {
      return twiml(res, '❌ No estás registrado en Mia. Registrá tu número desde la app.')
    }

    const command = body.toUpperCase()
    if (command === 'SI') return confirmPending(res, from)
    if (command === 'NO') return cancelPending(res, from)
    return newExpense(res, { body, from, messageSid, userId: waUser.user_id })
  } catch (err) {
    console.error('whatsapp webhook error:', err)
    // Twilio reintenta si no recibe 200 — siempre responder OK
    return twiml(res, '⚠️ Hubo un error procesando tu mensaje. Intentá de nuevo.')
  }
}

async function confirmPending(res, from) {
  const { data: pending } = await supabase
    .from('pending_transactions')
    .select('*')
    .eq('user_phone', from)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!pending) {
    return twiml(res, 'No hay ningún gasto pendiente de confirmación.')
  }

  const amount = pending.type === 'income'
    ? Math.abs(pending.amount)
    : -Math.abs(pending.amount)

  const { error } = await supabase.from('transactions').insert({
    amount,
    description: pending.description,
    date: new Date().toISOString().slice(0, 10),
    category_id: pending.category_id,
    is_checked: pending.type === 'fixed',
    user_id: pending.user_id,
  })

  if (error) {
    console.error('insert transaction error:', error)
    return twiml(res, '⚠️ No se pudo guardar el gasto. Intentá de nuevo.')
  }

  await supabase.from('pending_transactions').delete().eq('id', pending.id)
  return twiml(res, '✅ Gasto guardado en Mia!')
}

async function cancelPending(res, from) {
  await supabase.from('pending_transactions').delete().eq('user_phone', from)
  return twiml(res, '❌ Gasto cancelado.')
}

async function newExpense(res, { body, from, messageSid, userId }) {
  // Anti-duplicados: Twilio reintenta webhooks — si ya procesamos este SID, silencio
  const { data: dup } = await supabase
    .from('pending_transactions')
    .select('id')
    .eq('message_sid', messageSid)
    .maybeSingle()

  if (dup) return twiml(res)

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, type')
    .eq('user_id', userId)

  const parsed = await interpretMessage(body, categories ?? [])

  if (!parsed || parsed.error || !parsed.amount) {
    return twiml(res, '❓ No entendí ese mensaje. Intentá con algo como: gasté 500 en supermercado')
  }

  const { error } = await supabase.from('pending_transactions').insert({
    user_phone: from,
    amount: Math.abs(parsed.amount),
    description: parsed.description,
    type: parsed.type,
    category_id: parsed.category_id,
    message_sid: messageSid,
    user_id: userId,
  })

  if (error) {
    // 23505 = unique violation en message_sid → reintento de Twilio, no responder de nuevo
    if (error.code === '23505') return twiml(res)
    console.error('insert pending error:', error)
    return twiml(res, '⚠️ No se pudo registrar el gasto. Intentá de nuevo.')
  }

  const category = (categories ?? []).find(c => c.id === parsed.category_id)
  const lines = [
    '💰 Registré:',
    `Monto: $${Math.abs(parsed.amount)}`,
    `Descripción: ${parsed.description}`,
    `Tipo: ${TYPE_LABEL[parsed.type] ?? parsed.type}`,
    category ? `Categoría: ${category.name}` : null,
    '',
    'Respondé SI para confirmar o NO para cancelar.',
  ].filter(l => l !== null)

  return twiml(res, lines.join('\n'))
}

async function interpretMessage(message, categories) {
  const catList = categories
    .map(c => `- ${c.id} | ${c.name} | ${c.type}`)
    .join('\n')

  const prompt = `Sos un parser de gastos personales. Interpretá este mensaje de WhatsApp y devolvé SOLO un JSON, sin explicaciones ni markdown.

Mensaje: "${message}"

Categorías disponibles del usuario (id | nombre | tipo):
${catList}

Formato de respuesta si entendés el mensaje:
{"amount": <número positivo>, "description": "<descripción corta>", "type": "<income|fixed|variable>", "category_id": "<id de la categoría que mejor coincida, o null>"}

El type debe coincidir con el tipo de la categoría elegida. Si el mensaje habla de un ingreso (cobré, me pagaron), usá una categoría income. Si no podés interpretar el mensaje como un movimiento de dinero:
{"error": "no entendido"}`

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      max_tokens: 256,
    }),
  })

  const data = await response.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  const clean = text.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(clean)
  } catch {
    return { error: 'no entendido' }
  }
}

async function parseBody(req) {
  let raw = req.body
  if (raw && typeof raw === 'object') return raw
  if (typeof raw !== 'string') {
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    raw = Buffer.concat(chunks).toString('utf8')
  }
  return Object.fromEntries(new URLSearchParams(raw))
}

function validTwilioSignature(req, params) {
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!token) return true // sin token configurado no se puede validar

  const url = `https://${req.headers.host}${req.url}`
  const data = url + Object.keys(params).sort().map(k => k + params[k]).join('')
  const expected = crypto.createHmac('sha1', token).update(data).digest('base64')
  const signature = req.headers['x-twilio-signature'] ?? ''

  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function twiml(res, message) {
  res.setHeader('Content-Type', 'text/xml')
  const inner = message ? `<Message>${escapeXml(message)}</Message>` : ''
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<Response>${inner}</Response>`)
}

function escapeXml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
