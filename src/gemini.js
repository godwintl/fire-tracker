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
            text: `Analyze this financial screenshot and extract any relevant numbers. This is for a Singapore-based FIRE tracker. Map values to these fields:

FIRE parameters:
- currentAge: person's current age (number)
- annualIncome: annual income/salary (number)
- annualExpenses: annual expenses/spending (number)
- monthlyContribution: monthly savings/investment contribution (number)
- expectedReturn: expected annual return percentage (number)
- withdrawalRate: safe withdrawal rate percentage (number)
- targetAge: target retirement age (number)

Account balances (nested under "accounts"):
- cpfOA: CPF Ordinary Account balance (number)
- cpfSA: CPF Special Account balance (number)
- cpfMA: CPF Medisave Account balance (number)
- propertyValue: property/home market value (number)
- mortgageRemaining: outstanding mortgage/home loan (number)
- ibkr: Interactive Brokers / investment portfolio value (number)
- banks: array of {name: string, balance: number} for bank accounts

Return ONLY a JSON object with fields you can confidently identify. All numbers should be plain numbers without $ signs or commas.

Example for a CPF screenshot: {"accounts": {"cpfOA": 45000, "cpfSA": 32000, "cpfMA": 18000}}
Example for a brokerage screenshot: {"accounts": {"ibkr": 85000}}
Example for a bank screenshot: {"accounts": {"banks": [{"name": "DBS", "balance": 25000}]}}
Example for income info: {"annualIncome": 96000, "monthlyContribution": 3500}

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
