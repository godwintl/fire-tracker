import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

export async function parseTextUpdate(text, currentAccounts) {
  const prompt = `You are a financial data parser for a Singapore-based FIRE tracker. The user typed a natural language update about their finances. Parse it into a JSON update.

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

  const result = await model.generateContent(prompt)
  const responseText = result.response.text()
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return {}

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return {}
  }
}

export async function extractFinancials(base64Image, mimeType) {
  const prompt = `Analyze this financial screenshot and extract any relevant numbers. This is for a Singapore-based FIRE tracker. Map values to these fields:

Account balances (nested under "accounts"):
- cpfOA: CPF Ordinary Account balance (number)
- cpfSA: CPF Special Account balance (number)
- cpfMA: CPF Medisave Account balance (number)
- propertyValue: property/home market value (number)
- mortgageRemaining: outstanding mortgage/home loan (number)
- ibkr: Interactive Brokers / investment portfolio value (number)
- banks: array of {name: string, balance: number} for bank accounts

FIRE parameters (top level):
- currentAge, annualIncome, annualExpenses, monthlyContribution, expectedReturn, withdrawalRate, targetAge

Return ONLY a JSON object with fields you can confidently identify. All numbers should be plain numbers.
If you cannot identify any relevant financial data, return: {}`

  const result = await model.generateContent([
    prompt,
    { inlineData: { mimeType, data: base64Image } }
  ])
  const responseText = result.response.text()
  const jsonMatch = responseText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return {}

  try {
    return JSON.parse(jsonMatch[0])
  } catch {
    return {}
  }
}
