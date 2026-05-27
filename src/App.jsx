import { useMemo } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { calculateFIRE } from './fire'
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
  const [inputs, setInputs] = useLocalStorage('fire-inputs', DEFAULT_INPUTS)

  const results = useMemo(() => calculateFIRE(inputs), [inputs])

  const updateField = (field, value) => {
    setInputs(prev => ({ ...prev, [field]: value }))
  }

  const fmt = (n) => n != null ? n.toLocaleString('en-US') : '—'
  const fmtCurrency = (n) => n != null ? `$${n.toLocaleString('en-US')}` : '—'

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="sticky top-0 z-20 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label="fire">🔥</span>
          <h1 className="text-lg font-bold tracking-tight text-white">FIRE Dashboard</h1>
          <span className="ml-auto text-xs text-gray-500">Financial Independence, Retire Early</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Progress + Key Metrics */}
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

        {/* Input Panel */}
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
