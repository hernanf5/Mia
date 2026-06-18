export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { metrics, prevMetrics, month, year } = req.body

  const prompt = `Sos un asistente financiero personal. Analizá este reporte mensual y dá exactamente 3 consejos concretos y breves en español.

Mes analizado: ${month}/${year}

DATOS DEL MES ACTUAL:
- Ingresos: $${metrics.totalIncome}
- Gastos fijos pagados: $${metrics.totalFixedPaid}
- Gastos fijos pendientes: $${metrics.totalFixedPending}
- Gastos variables: $${metrics.totalVariable}
- Disponible: $${metrics.available}
- Top categorías de gasto: ${metrics.byCategory.slice(0, 3).map(c => `${c.name} $${c.amount.toFixed(0)}`).join(', ')}

${prevMetrics ? `COMPARACIÓN CON MES ANTERIOR:
- Ingresos: ${metrics.totalIncome > prevMetrics.totalIncome ? '+' : ''}${(metrics.totalIncome - prevMetrics.totalIncome).toFixed(0)}
- Gastos variables: ${metrics.totalVariable > prevMetrics.totalVariable ? '+' : ''}${(metrics.totalVariable - prevMetrics.totalVariable).toFixed(0)}
- Disponible: ${metrics.available > prevMetrics.available ? '+' : ''}${(metrics.available - prevMetrics.available).toFixed(0)}` : ''}

Respondé SOLO con un JSON array de 3 strings, sin explicaciones ni formato adicional. Ejemplo:
["Consejo 1", "Consejo 2", "Consejo 3"]`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 512,
      })
    })

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content ?? '[]'
    const clean = text.replace(/```json|```/g, '').trim()
    const advice = JSON.parse(clean)

    return res.status(200).json({ advice })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error generando consejos' })
  }
}