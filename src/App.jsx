import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { calculateFIRE } from './fire'
import { signInWithGoogle, signOutUser, onAuthChange, saveInputs, subscribeToInputs } from './firebase'
import InputPanel from './components/InputPanel'
import MetricCard from './components/MetricCard'
import ProgressRing from './components/ProgressRing'
import ProjectionChart from './components/ProjectionChart'
import MilestoneTimeline from './components/MilestoneTimeline'

const DEFAULT_INPUTS = {
  currentAge: 28,
  currentSavings: 50000,
  annualIncome: 100000,
  annualExpenses: 40000,
  monthlyContribution: 3000,
  expectedReturn: 7,
  withdrawalRate: 4,
  targetAge: 65,
}

function App() {
  const [user, setUser] = useState(undefined)
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)
  const isRemoteUpdate = useRef(false)

  useEffect(() => onAuthChange(setUser), [])

  useEffect(() => {
    if (!user?.uid) return
    return subscribeToInputs(user.uid, (data) => {
      isRemoteUpdate.current = true
      setInputs(data)
    })
  }, [user?.uid])

  const updateField = useCallback((field, value) => {
    setInputs(prev => {
      const next = { ...prev, [field]: value }
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

  const results = useMemo(() => calculateFIRE(inputs), [inputs])

  const fmt = (n) => n != null ? n.toLocaleString('en-US') : '—'
  const fmtCurrency = (n) => n != null ? `$${n.toLocaleString('en-US')}` : '—'

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <span className="text-5xl block mb-4">🔥</span>
          <h1 className="text-2xl font-bold text-white mb-2">FIRE Dashboard</h1>
          <p className="text-gray-400 text-sm">Financial Independence, Retire Early</p>
        </div>
        <button
          onClick={signInWithGoogle}
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
              onClick={signOutUser}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 bg-gray-900 rounded-2xl p-6 flex flex-col items-center justify-center border border-gray-800">
            <ProgressRing progress={results.currentProgress} />
            <p className="mt-3 text-sm text-gray-400">FIRE Progress</p>
            <p className="text-xs text-gray-500 mt-1">
              {fmtCurrency(inputs.currentSavings)} / {fmtCurrency(results.fireNumber)}
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
              sub={inputs.currentSavings >= results.coastFIRENumber ? 'Achieved!' : 'Amount needed today'}
              color={inputs.currentSavings >= results.coastFIRENumber ? 'text-emerald-400' : 'text-sky-400'}
            />
          </div>
        </section>

        <section className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Net Worth Projection</h2>
          <ProjectionChart projections={results.projections} fireNumber={results.fireNumber} fireAge={results.fireAge} />
        </section>

        <section className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Milestones</h2>
          <MilestoneTimeline projections={results.projections} fireNumber={results.fireNumber} currentAge={inputs.currentAge} />
        </section>

        <section className="bg-gray-900 rounded-2xl p-4 md:p-6 border border-gray-800">
          <h2 className="text-sm font-semibold text-gray-400 mb-4">Your Numbers</h2>
          <InputPanel inputs={inputs} onChange={updateField} />
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-gray-600 border-t border-gray-800">
        All calculations are estimates. This is not financial advice.
      </footer>
    </div>
  )
}

export default App
