function getApiUrl(apiKey) {
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
}

async function geminiRequest(apiKey, body, retries = 3) {
  if (!apiKey) throw new Error('No API key configured. Add your Gemini API key in Settings.')

  const url = getApiUrl(apiKey)
  let lastError = null

  for (let attempt = 0; attempt < retries; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}))
      const msg = errBody?.error?.message || `status ${response.status}`

      if (response.status === 429 && attempt < retries - 1) {
        lastError = msg
        await new Promise(r => setTimeout(r, (attempt + 1) * 2000))
        continue
      }

      throw new Error(`Gemini error: ${msg}`)
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
  throw new Error(`Gemini error: ${lastError || 'Rate limited after retries'}`)
}

export async function parseTextUpdate(apiKey, text, currentAccounts) {
  return geminiRequest(apiKey, {
    contents: [{
      parts: [{
        text: `You are a financial data parser for a Singapore-based FIRE tracker. The user typed a natural language update about their finances. Parse it into a JSON update.

Current account balances:
- CPF OA: ${currentAccounts.cpfOA || 0}
- CPF SA: ${currentAccounts.cpfSA || 0}
- CPF MA: ${currentAccounts.cpfMA || 0}
- Property Value: ${currentAccounts.propertyValue || 0}
- Mortgage Remaining: ${currentAccounts.mortgageRemaining || 0}
- IBKR Portfolio: ${currentAccounts.ibkr || 0}
- Banks: ${JSON.stringify(currentAccounts.banks || [])}

Available fields:
FIRE parameters (top level): currentAge, annualIncome, annualExpenses, monthlyContribution, expectedReturn, withdrawalRate, targetAge
Account balances (nested under "accounts"): cpfOA, cpfSA, cpfMA, propertyValue, mortgageRemaining, ibkr, banks (array of {name, balance})

User input: "${text}"

Return ONLY a JSON object with the fields to update. All numbers plain without $ or commas.
If the user says "add" or "increase", add to the current value.
If the user says "now" or "is" or gives a direct number, treat it as the new value.

Examples:
"IBKR is now 95k" → {"accounts": {"ibkr": 95000}}
"cpf oa went up to 52000" → {"accounts": {"cpfOA": 52000}}
"salary is 120k" → {"annualIncome": 120000}
"DBS savings now 30k" → {"accounts": {"banks": [{"name": "DBS", "balance": 30000}]}}
"added 5k to IBKR" → {"accounts": {"ibkr": ${(currentAccounts.ibkr || 0) + 5000}}}
"mortgage down to 350k" → {"accounts": {"mortgageRemaining": 350000}}

If you cannot understand the input, return: {}`
      }]
    }],
    generationConfig: { temperature: 0.1 }
  })
}

export async function extractFinancials(apiKey, base64Image, mimeType) {
  return geminiRequest(apiKey, {
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
    generationConfig: { temperature: 0.1 }
  })
}
