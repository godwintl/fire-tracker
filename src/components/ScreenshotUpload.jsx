import { useState, useRef } from 'react'
import { extractFinancials } from '../gemini'
import { FIELDS } from './InputPanel'

const FIELD_LABELS = Object.fromEntries(FIELDS.map(f => [f.key, f.label]))

export default function ScreenshotUpload({ onApply }) {
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
        const result = await extractFinancials(base64, file.type)

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

  const fmtValue = (key, val) => {
    const field = FIELDS.find(f => f.key === key)
    if (!field) return val
    if (field.prefix === '$') return `$${Number(val).toLocaleString('en-US')}`
    if (field.suffix === '%') return `${val}%`
    return `${val}${field.suffix}`
  }

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
              Works with brokerage statements, banking apps, salary slips, etc.
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
      {status === 'review' && extracted && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-300">Extracted Values</h3>
            {preview && (
              <img src={preview} alt="Screenshot" className="w-10 h-10 rounded object-cover border border-gray-700" />
            )}
          </div>
          <div className="space-y-2">
            {Object.entries(extracted).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center text-sm">
                <span className="text-gray-400">{FIELD_LABELS[key] || key}</span>
                <span className="text-white font-mono">{fmtValue(key, val)}</span>
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
