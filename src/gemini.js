// ── Local text parser (no API needed) ──

const ACCOUNT_ALIASES = [
  { keys: ['cpf oa', 'cpfoa', 'ordinary account', 'oa'], field: 'cpfOA' },
  { keys: ['cpf sa', 'cpfsa', 'special account', 'sa'], field: 'cpfSA' },
  { keys: ['cpf ma', 'cpfma', 'medisave', 'ma'], field: 'cpfMA' },
  { keys: ['property', 'house', 'home value', 'hdb', 'condo'], field: 'propertyValue' },
  { keys: ['mortgage', 'home loan', 'housing loan'], field: 'mortgageRemaining' },
  { keys: ['ibkr', 'interactive brokers', 'ib', 'brokerage', 'investment', 'portfolio', 'stocks'], field: 'ibkr' },
]

const PARAM_ALIASES = [
  { keys: ['salary', 'income', 'annual income', 'yearly income', 'pay'], field: 'annualIncome' },
  { keys: ['expense', 'spending', 'annual expense', 'yearly expense'], field: 'annualExpenses' },
  { keys: ['contribution', 'monthly contribution', 'monthly saving', 'monthly invest'], field: 'monthlyContribution' },
  { keys: ['return', 'expected return', 'annual return'], field: 'expectedReturn' },
  { keys: ['withdrawal', 'withdrawal rate', 'swr'], field: 'withdrawalRate' },
  { keys: ['age'], field: 'currentAge' },
  { keys: ['target age', 'retire age', 'retirement age'], field: 'targetAge' },
]

function parseNumber(str) {
  if (!str) return null
  let s = str.replace(/[$,\s]/g, '').toLowerCase()
  let multiplier = 1
  if (s.endsWith('m')) { multiplier = 1000000; s = s.slice(0, -1) }
  else if (s.endsWith('k')) { multiplier = 1000; s = s.slice(0, -1) }
  const n = parseFloat(s)
  return isNaN(n) ? null : Math.round(n * multiplier)
}

function matchField(text, aliases) {
  const lower = text.toLowerCase()
  for (const alias of aliases) {
    for (const key of alias.keys) {
      if (lower.includes(key)) return alias.field
    }
  }
  return null
}

function isBankName(text, currentAccounts) {
  const lower = text.toLowerCase()
  const knownBanks = ['dbs', 'ocbc', 'uob', 'posb', 'sc', 'standard chartered', 'hsbc', 'citi', 'citibank', 'maybank', 'grab', 'trust', 'chocolate', 'mari', 'syfe', 'endowus', 'stashaway']
  const existing = (currentAccounts.banks || []).map(b => b.name.toLowerCase())
  return knownBanks.find(b => lower.includes(b)) || existing.find(b => lower.includes(b))
}

export function parseTextUpdate(_apiKey, text, currentAccounts) {
  const lower = text.toLowerCase()

  // Extract the number from the text
  const numMatch = text.match(/[\$]?\s*[\d,]+\.?\d*\s*[kKmM]?/)
  const value = numMatch ? parseNumber(numMatch[0]) : null

  if (value === null) return {}

  // Check if it's an "add" / "increase" operation
  const isAdd = /\b(add|added|increase|increased|put in|deposited|contributed|top.?up)\b/i.test(lower)

  // Check account fields first (more specific)
  const accountField = matchField(text, ACCOUNT_ALIASES)
  if (accountField) {
    const current = currentAccounts[accountField] || 0
    return { accounts: { [accountField]: isAdd ? current + value : value } }
  }

  // Check if it's a bank account
  const bankMatch = isBankName(text, currentAccounts)
  if (bankMatch) {
    const bankName = bankMatch.charAt(0).toUpperCase() + bankMatch.slice(1).toUpperCase()
    const displayName = bankName.length <= 4 ? bankName : bankMatch.charAt(0).toUpperCase() + bankMatch.slice(1)
    const existing = (currentAccounts.banks || []).find(b => b.name.toLowerCase() === bankMatch.toLowerCase())
    const currentBal = existing?.balance || 0
    return {
      accounts: {
        banks: [{ name: existing?.name || displayName, balance: isAdd ? currentBal + value : value }]
      }
    }
  }

  // Check FIRE parameter fields
  const paramField = matchField(text, PARAM_ALIASES)
  if (paramField) {
    return { [paramField]: value }
  }

  return {}
}

// ── Gemini vision API (only used for screenshot OCR) ──

function getApiUrl(apiKey) {
  return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
}

export async function extractFinancials(apiKey, base64Image, mimeType) {
  if (!apiKey) throw new Error('No API key configured. Add your Gemini API key in Settings.')

  const url = getApiUrl(apiKey)

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          {
            text: `Analyze this financial screenshot and extract any relevant numbers. This is for a Singapore-based FIRE tracker. Map values to these fields:

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
          },
          { inlineData: { mimeType, data: base64Image } }
        ]
      }],
      generationConfig: { temperature: 0.1 }
    }),
  })

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    const msg = errBody?.error?.message || `status ${response.status}`
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
