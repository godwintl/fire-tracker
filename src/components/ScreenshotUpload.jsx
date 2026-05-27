import { useState, useRef } from 'react'
import { extractFinancials } from '../gemini'

const ACCOUNT_LABELS = {
  cpfOA: 'CPF OA',
  cpfSA: 'CPF SA',
  cpfMA: 'CPF MA',
  propertyValue: 'Property Value',
  mortgageRemaining: 'Mortgage Remaining',
  ibkr: 'IBKR Portfolio',
}

const PARAM_LABELS = {
  currentAge: 'Current Age',
  annualIncome: 'Annual Income',
  annualExpenses: 'Annual Expenses',
  monthlyContribution: 'Monthly Contribution',
  expectedReturn: 'Expected Return',
  withdrawalRate: 'Withdrawal Rate',
  targetAge: 'Target Age',
}

function flattenExtracted(data) {
  const rows = []

  for (const [key, val] of Object.entries(data)) {
    if (key === 'accounts' && typeof val === 'object') {
      for (const [aKey, aVal] of Object.entries(val)) {
        if (aKey === 'banks' && Array.isArray(aVal)) {
          for (const bank of aVal) {
            rows.push({ label: bank.name || 'Bank', value: bank.balance, type: 'account' })
          }
        } else {
          rows.push({ label: ACCOUNT_LABELS[aKey] || aKey, value: aVal, type: 'account' })
        }
      }
    } else {
      rows.push({ label: PARAM_LABELS[key] || key, value: val, type: 'param' })
    }
  }

  return rows
}

function fmtValue(val, label) {
  if (typeof val !== 'number') return String(val)
  if (label.includes('Return') || label.includes('Rate')) return `${val}%`
  if (label.includes('Age')) return String(val)
  return `$${val.toLocaleString('en-US')}`
}

export default function ScreenshotUpload({ onApply, apiKey }) {
  const [status, setStatus] = useState('idle')
  const [preview, setPreview] = useState(null)
  const [extracted, setExtracted] = useState(null)
  const [error, setError] = useState(null)
  const fileRef = useRef()

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return

    setError(null)
    setExtracted(null)
    setStatus('processing')

    const reader = new FileReader()
    reader.onload = async (e) => {
      const dataUrl = e.target.result
      setPreview(dataUrl)

      try {
        const base64 = dataUrl.split(',')[1]
        const result = await extractFinancials(apiKey, base64, file.type)

        if (Object.keys(result).length === 0) {
          setError('No financial data found in this screenshot.')
          setStatus('idle')
        } else {
          setExtracted(result)
          setStatus('review')
        }
      } catch (err) {
        setError(`Failed to analyze: ${err.message}`)
        setStatus('idle')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    handleFile(file)
  }

  const applyValues = () => {
    if (extracted) {
      onApply(extracted)
      setStatus('applied')
      setTimeout(() => {
        setStatus('idle')
        setPreview(null)
        setExtracted(null)
      }, 2000)
    }
  }

  const reset = () => {
    setStatus('idle')
    setPreview(null)
    setExtracted(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const rows = extracted ? flattenExtracted(extracted) : []

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => status !== 'processing' && fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          status === 'processing'
            ? 'border-orange-500/50 bg-orange-500/5'
            : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/50'
        }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {status === 'processing' ? (
          <div className="space-y-2">
            <div className="inline-block w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-orange-400">Analyzing screenshot with Gemini...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-3xl">📸</div>
            <p className="text-sm text-gray-400">
              Drop a screenshot here or tap to upload
            </p>
            <p className="text-xs text-gray-600">
              CPF statements, IBKR portfolio, bank apps, salary slips, etc.
            </p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
          <span className="text-red-400 text-sm">{error}</span>
          <button onClick={reset} className="ml-auto text-xs text-red-400 hover:text-red-300 shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* Review extracted values */}
      {status === 'review' && rows.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-300">Extracted Values</h3>
            {preview && (
              <img src={preview} alt="Screenshot" className="w-10 h-10 rounded object-cover border border-gray-700" />
            )}
          </div>
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-gray-400 flex items-center gap-2">
                  {row.type === 'account' && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 inline-block" />}
                  {row.label}
                </span>
                <span className="text-white font-mono">{fmtValue(row.value, row.label)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={applyValues}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              Apply Values
            </button>
            <button
              onClick={reset}
              className="px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm py-2 rounded-lg transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Applied confirmation */}
      {status === 'applied' && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
          <span className="text-emerald-400 text-sm">Values applied successfully!</span>
        </div>
      )}
    </div>
  )
}
