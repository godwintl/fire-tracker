const API_KEY = 'AIzaSyCGeE3Z_26dOTcc97EXVhuLXIIc2_k69cg'
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`

export async function extractFinancials(base64Image, mimeType) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            text: `Analyze this financial screenshot and extract any relevant numbers. Map them to these fields if you can identify them:

- currentAge: person's current age (number)
- currentSavings: total savings/portfolio/net worth value (number, no $ sign)
- annualIncome: annual income/salary (number, no $ sign)
- annualExpenses: annual expenses/spending (number, no $ sign)
- monthlyContribution: monthly savings/investment contribution (number, no $ sign)
- expectedReturn: expected annual return percentage (number, just the number)
- withdrawalRate: safe withdrawal rate percentage (number, just the number)
- targetAge: target retirement age (number)

Return ONLY a JSON object with the fields you can identify. Only include fields you're confident about. Example: {"currentSavings": 150000, "monthlyContribution": 3000}

If you cannot identify any relevant financial data, return an empty object: {}`
          },
          {
            inlineData: {
              mimeType,
              data: base64Image,
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.1,
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return {}

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return {}
  }
}
