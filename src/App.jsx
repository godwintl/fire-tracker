import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { calculateFIRE } from './fire'
import { signInWithGoogle, signOutUser, onAuthChange, saveInputs, subscribeToInputs, saveApiKey, subscribeToApiKey } from './firebase'
import InputPanel from './components/InputPanel'
import AccountsPanel from './components/AccountsPanel'
import MetricCard from './components/MetricCard'
import ProgressRing from './components/ProgressRing'
import ProjectionChart from './components/ProjectionChart'
import MilestoneTimeline from './components/MilestoneTimeline'
import ScreenshotUpload from './components/ScreenshotUpload'
import QuickUpdate from './components/QuickUpdate'

const DEFAULT_ACCOUNTS = {
  cpfOA: 0,
  cpfSA: 0,
  cpfMA: 0,
  propertyValue: 0,
  mortgageRemaining: 0,
  ibkr: 0,
  banks: [{ name: 'DBS', balance: 0 }],
}

const DEFAULT_INPUTS = {
  currentAge: 28,
  annualIncome: 100000,
  annualExpenses: 40000,
  monthlyContribution: 3000,
  expectedReturn: 7,
  withdrawalRate: 4,
  targetAge: 65,
  accounts: DEFAULT_ACCOUNTS,
}

function computeNetWorth(accounts) {
  if (!accounts) return 0
  const cpf = (accounts.cpfOA || 0) + (accounts.cpfSA || 0) + (accounts.cpfMA || 0)
  const housing = Math.max(0, (accounts.propertyValue || 0) - (accounts.mortgageRemaining || 0))
  const ibkr = accounts.ibkr || 0
  const banks = (accounts.banks || []).reduce((sum, b) => sum + (b.balance || 0), 0)
  return cpf + housing + ibkr + banks
}

function App() {
  const [user, setUser] = useState(undefined)
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)
  const [authError, setAuthError] = useState(null)
  const [geminiKey, setGeminiKey] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const isRemoteUpdate = useRef(false)

  useEffect(() => onAuthChange(setUser), [])

  useEffect(() => {
    if (!user?.uid) return
    return subscribeToInputs(user.uid, (data) => {
      isRemoteUpdate.current = true
      setInputs(prev => ({
        ...DEFAULT_INPUTS,
        ...data,
        accounts: { ...DEFAULT_ACCOUNTS, ...(data.accounts || {}) },
      }))
    })
  }, [user?.uid])

  useEffect(() => {
    if (!user?.uid) return
    return subscribeToApiKey(user.uid, setGeminiKey)
  }, [user?.uid])

  const updateField = useCallback((field, value) => {
    setInputs(prev => {
      const next = { ...prev, [field]: value }
      if (user?.uid) saveInputs(user.uid, next)
      return next
    })
  }, [user?.uid])

  const updateAccounts = useCallback((accounts) => {
    setInputs(prev => {
      const next = { ...prev, accounts }
      if (user?.uid) saveInputs(user.uid, next)
      return next
    })
  }, [user?.uid])

  useEffect(() => {
    if (isRemoteUpdate.current) {
      isRemoteUpdate.current = false
      return
    }
  }, [inputs])

  const applyExtracted = useCallback((extracted) => {
    setInputs(prev => {
      const { accounts: extractedAccounts, ...rest } = extracted
      let next = { ...prev, ...rest }

      if (extractedAccounts) {
        const prevAccounts = prev.accounts || DEFAULT_ACCOUNTS
        const mergedAccounts = { ...prevAccounts }

        for (const [key, val] of Object.entries(extractedAccounts)) {
          if (key === 'banks' && Array.isArray(val)) {
            const existing = mergedAccounts.banks || []
            for (const newBank of val) {
              const idx = existing.findIndex(b => b.name.toLowerCase() === newBank.name.toLowerCase())
              if (idx >= 0) {
                existing[idx] = { ...existing[idx], balance: newBank.balance }
              } else {
                existing.push(newBank)
              }
            }
            mergedAccounts.banks = existing
          } else {
            mergedAccounts[key] = val
          }
        }
        next.accounts = mergedAccounts
      }

      if (user?.uid) saveInputs(user.uid, next)
      return next
    })
  }, [user?.uid])

  const netWorth = useMemo(() => computeNetWorth(inputs.accounts), [inputs.accounts])

  const fireInputs = useMemo(() => ({
    ...inputs,
    currentSavings: netWorth,
  }), [inputs, netWorth])

  const results = useMemo(() => calculateFIRE(fireInputs), [fireInputs])

  const fmt = (n) => n != null ? n.toLocaleString('en-US') : '—'
  const fmtCurrency = (n) => n != null ? `$${n.toLocaleString('en-US')}` : '—'

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  const handleSignIn = async () => {
    try {
      setAuthError(null)
      await signInWithGoogle()
    } catch (err) {
      setAuthError(err.message)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <span className="text-5xl block mb-4">🔥</span>
          <h1 className="text-2xl font-bold text-white mb-2">FIRE Dashboard</h1>
          <p className="text-gray-400 text-sm">Financial Independence, Retire Early</p>
        </div>
        {authError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-sm text-red-400">
            {authError}
          </div>
        )}
        <button
          onClick={handleSignIn}
          className="flex items-center gap-3 bg-white text-gray-800 font-medium px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label="fire">🔥</span>
          <h1 className="text-lg font-bold tracking-tight text-white">FIRE Dashboard</h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:inline">{user.email}</span>
            <button
              onClick={() => setShowSettings(s => !s)}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              {showSettings ? 'Close' : 'Settings'}
            </button>
            <button
              onClick={signOutUser}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {showSettings && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800 space-y-3">
            <h2 className="text-sm font-semibold text-gray-400">Settings</h2>
            <div>
              <label className="text-sm text-gray-300 block mb-1">Gemini API Key</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-orange-500"
                />
                <button
                  onClick={() => { saveApiKey(user.uid, geminiKey); setShowSettings(false) }}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">Get a free key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" className="text-orange-400 hover:underline">Google AI Studio</a>. Stored securely in your Firebase database.</p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Progress + Key Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 bg-gray-900 rounded-2xl p-6 flex flex-col items-center justify-center border border-gray-800">
            <ProgressRing progress={results.currentProgress} />
            <p className="mt-3 text-sm text-gray-400">FIRE Progress</p>
            <p className="text-xs text-gray-500 mt-1">
              {fmtCurrency(netWorth)} / {fmtCurrency(results.fireNumber)}
            </p>
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <MetricCard
              label="FIRE Number"
              value={fmtCurrency(results.fireNumber)}
              sub={`${inputs.withdrawalRate}% withdrawal rate`}
              color="text-orange-400"
            />
            <MetricCard
              label="FIRE Age"
              value={results.fireAge != null ? fmt(results.fireAge) : 'N/A'}
              sub={results.yearsToFIRE != null ? `${results.yearsToFIRE} years to go` : 'Increase savings'}
              color="text-emerald-400"
            />
            <MetricCard
              label="Savings Rate"
              value={`${results.savingsRate}%`}
              sub={`${fmtCurrency(inputs.monthlyContribution * 12)}/yr saved`}
              color="text-amber-400"
            />
            <MetricCard
              label="Coast FIRE"
              value={fmtCurrency(results.coastFIRENumber)}
              sub={netWorth >= results.coastFIRENumber ? 'Achieved!' : 'Amount needed today'}
              color={netWorth >= results.coastFIRENumber ? 'text-emerald-400' : 'text-sky-400'}
            />
          </div>
        </section>

        {/* Quick Update */}
        <section className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Quick Update</h2>
          <QuickUpdate accounts={inputs.accounts || DEFAULT_ACCOUNTS} onApply={applyExtracted} />
        </section>

        {/* Net Worth Breakdown */}
        <section className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Net Worth Breakdown</h2>
          <AccountsPanel accounts={inputs.accounts || DEFAULT_ACCOUNTS} onChange={updateAccounts} />
        </section>

        {/* Projection Chart */}
        <section className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Net Worth Projection</h2>
          <ProjectionChart projections={results.projections} fireNumber={results.fireNumber} fireAge={results.fireAge} />
        </section>

        {/* Milestones */}
        <section className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Milestones</h2>
          <MilestoneTimeline projections={results.projections} fireNumber={results.fireNumber} currentAge={inputs.currentAge} />
        </section>

        {/* FIRE Parameters */}
        <section className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">FIRE Parameters</h2>
          <InputPanel inputs={inputs} onChange={updateField} />
        </section>

        {/* Screenshot Import */}
        <section className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Import from Screenshot</h2>
          <ScreenshotUpload onApply={applyExtracted} apiKey={geminiKey} />
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-gray-600 border-t border-gray-800">
        All calculations are estimates. This is not financial advice.
      </footer>
    </div>
  )
}

export default App
