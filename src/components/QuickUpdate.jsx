import { useState } from 'react'
import { parseTextUpdate } from '../gemini'

const EXAMPLES = [
  'IBKR is now 95k',
  'CPF OA went up to 52000',
  'DBS savings now 30k',
  'salary is 120k per year',
  'mortgage down to 350k',
  'added 5k to IBKR',
]

export default function QuickUpdate({ accounts, onApply }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return

    setError(null)
    setResult(null)

    const parsed = parseTextUpdate(null, text.trim(), accounts)

    if (Object.keys(parsed).length === 0) {
      setError("Couldn't understand that. Try something like \"IBKR is now 85k\".")
    } else {
      onApply(parsed)
      setResult(text.trim())
      setText('')
      setTimeout(() => setResult(null), 3000)
    }
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='e.g. "IBKR is now 95k"'
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-orange-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shrink-0"
        >
          Update
        </button>
      </form>

      {/* Quick examples */}
      {!error && !result && (
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setText(ex)}
              className="text-xs text-gray-500 hover:text-orange-400 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-full px-2.5 py-1 transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2">
          <span className="text-red-400 text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-xs text-red-400 hover:text-red-300">
            Dismiss
          </button>
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-sm text-emerald-400">
          Updated: "{result}"
        </div>
      )}
    </div>
  )
}
