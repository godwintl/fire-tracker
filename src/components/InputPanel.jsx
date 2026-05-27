import { useState } from 'react'

const FIELDS = [
  { key: 'currentAge', label: 'Current Age', min: 18, max: 80, step: 1, prefix: '', suffix: ' yrs' },
  { key: 'currentSavings', label: 'Current Savings', min: 0, max: 5000000, step: 1000, prefix: '$', suffix: '' },
  { key: 'annualIncome', label: 'Annual Income', min: 0, max: 1000000, step: 1000, prefix: '$', suffix: '' },
  { key: 'annualExpenses', label: 'Annual Expenses', min: 0, max: 500000, step: 1000, prefix: '$', suffix: '' },
  { key: 'monthlyContribution', label: 'Monthly Contribution', min: 0, max: 50000, step: 100, prefix: '$', suffix: '' },
  { key: 'expectedReturn', label: 'Expected Return', min: 0, max: 15, step: 0.5, prefix: '', suffix: '%' },
  { key: 'withdrawalRate', label: 'Withdrawal Rate', min: 2, max: 6, step: 0.25, prefix: '', suffix: '%' },
  { key: 'targetAge', label: 'Target Retirement Age', min: 30, max: 80, step: 1, prefix: '', suffix: ' yrs' },
]

export { FIELDS }

function formatDisplay(value, field) {
  if (field.prefix === '$') return `$${Number(value).toLocaleString('en-US')}`
  if (field.suffix === '%') return `${value}%`
  return `${value}${field.suffix}`
}

function EditableValue({ value, field, onChange }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const startEdit = () => {
    setDraft(String(value))
    setEditing(true)
  }

  const commit = () => {
    const num = parseFloat(draft)
    if (!isNaN(num)) {
      const clamped = Math.min(Math.max(num, field.min), field.max)
      onChange(field.key, clamped)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        type="number"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit() }}
        autoFocus
        className="w-24 text-right text-sm font-mono text-white bg-gray-700 border border-orange-500 rounded px-2 py-0.5 outline-none"
        min={field.min}
        max={field.max}
        step={field.step}
      />
    )
  }

  return (
    <button
      onClick={startEdit}
      className="text-sm font-mono text-white hover:text-orange-400 transition-colors cursor-text border-b border-dashed border-gray-600 hover:border-orange-400"
      title="Click to edit"
    >
      {formatDisplay(value, field)}
    </button>
  )
}

export default function InputPanel({ inputs, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
      {FIELDS.map((field) => (
        <div key={field.key}>
          <div className="flex justify-between items-baseline mb-2">
            <label className="text-sm text-gray-300" htmlFor={field.key}>
              {field.label}
            </label>
            <EditableValue value={inputs[field.key]} field={field} onChange={onChange} />
          </div>
          <input
            id={field.key}
            type="range"
            min={field.min}
            max={field.max}
            step={field.step}
            value={inputs[field.key]}
            onChange={(e) => onChange(field.key, Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>{field.prefix}{field.min.toLocaleString()}{field.suffix}</span>
            <span>{field.prefix}{field.max.toLocaleString()}{field.suffix}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
