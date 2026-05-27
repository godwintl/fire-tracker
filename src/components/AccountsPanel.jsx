import { useState } from 'react'

function EditableAmount({ value, onChange, label }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const start = () => {
    setDraft(String(value))
    setEditing(true)
  }

  const commit = () => {
    const num = parseFloat(draft)
    if (!isNaN(num) && num >= 0) onChange(num)
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
        className="w-full text-right text-sm font-mono text-white bg-gray-700 border border-orange-500 rounded px-2 py-1.5 outline-none"
        min="0"
        aria-label={label}
      />
    )
  }

  return (
    <button
      onClick={start}
      className="text-sm font-mono text-white hover:text-orange-400 transition-colors cursor-text border-b border-dashed border-gray-600 hover:border-orange-400"
      title="Click to edit"
    >
      ${Number(value).toLocaleString('en-US')}
    </button>
  )
}

function AccountGroup({ title, icon, children, subtotal, subtotalColor = 'text-white' }) {
  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h3 className="text-sm font-semibold text-gray-300">{title}</h3>
        <span className={`ml-auto text-sm font-mono font-bold ${subtotalColor}`}>
          ${Number(subtotal).toLocaleString('en-US')}
        </span>
      </div>
      <div className="space-y-2">
        {children}
      </div>
    </div>
  )
}

function AccountRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-gray-400">{label}</span>
      <EditableAmount value={value} onChange={onChange} label={label} />
    </div>
  )
}

export default function AccountsPanel({ accounts, onChange }) {
  const updateAccount = (key, val) => {
    onChange({ ...accounts, [key]: val })
  }

  const updateBank = (index, field, val) => {
    const banks = [...(accounts.banks || [])]
    banks[index] = { ...banks[index], [field]: val }
    onChange({ ...accounts, banks })
  }

  const addBank = () => {
    const banks = [...(accounts.banks || []), { name: 'New Account', balance: 0 }]
    onChange({ ...accounts, banks })
  }

  const removeBank = (index) => {
    const banks = (accounts.banks || []).filter((_, i) => i !== index)
    onChange({ ...accounts, banks })
  }

  const renameBank = (index, name) => {
    const banks = [...(accounts.banks || [])]
    banks[index] = { ...banks[index], name }
    onChange({ ...accounts, banks })
  }

  const cpfTotal = (accounts.cpfOA || 0) + (accounts.cpfSA || 0) + (accounts.cpfMA || 0)
  const housingEquity = Math.max(0, (accounts.propertyValue || 0) - (accounts.mortgageRemaining || 0))
  const banksTotal = (accounts.banks || []).reduce((sum, b) => sum + (b.balance || 0), 0)
  const totalNetWorth = cpfTotal + housingEquity + (accounts.ibkr || 0) + banksTotal

  return (
    <div className="space-y-4">
      {/* Total */}
      <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-300">Total Net Worth</span>
        <span className="text-xl font-bold font-mono text-orange-400">
          ${totalNetWorth.toLocaleString('en-US')}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* CPF */}
        <AccountGroup title="CPF" icon="🏛️" subtotal={cpfTotal} subtotalColor="text-emerald-400">
          <AccountRow label="Ordinary (OA)" value={accounts.cpfOA || 0} onChange={(v) => updateAccount('cpfOA', v)} />
          <AccountRow label="Special (SA)" value={accounts.cpfSA || 0} onChange={(v) => updateAccount('cpfSA', v)} />
          <AccountRow label="Medisave (MA)" value={accounts.cpfMA || 0} onChange={(v) => updateAccount('cpfMA', v)} />
        </AccountGroup>

        {/* Housing */}
        <AccountGroup title="Housing" icon="🏠" subtotal={housingEquity} subtotalColor="text-sky-400">
          <AccountRow label="Property Value" value={accounts.propertyValue || 0} onChange={(v) => updateAccount('propertyValue', v)} />
          <AccountRow label="Mortgage Remaining" value={accounts.mortgageRemaining || 0} onChange={(v) => updateAccount('mortgageRemaining', v)} />
          <div className="pt-1 border-t border-gray-700/50 flex justify-between text-xs">
            <span className="text-gray-500">Equity</span>
            <span className="text-sky-400 font-mono">${housingEquity.toLocaleString('en-US')}</span>
          </div>
        </AccountGroup>

        {/* IBKR */}
        <AccountGroup title="IBKR Investments" icon="📈" subtotal={accounts.ibkr || 0} subtotalColor="text-purple-400">
          <AccountRow label="Portfolio Value" value={accounts.ibkr || 0} onChange={(v) => updateAccount('ibkr', v)} />
        </AccountGroup>

        {/* Banks */}
        <AccountGroup title="Bank Savings" icon="🏦" subtotal={banksTotal} subtotalColor="text-amber-400">
          {(accounts.banks || []).map((bank, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={bank.name}
                onChange={(e) => renameBank(i, e.target.value)}
                className="text-sm text-gray-400 bg-transparent border-none outline-none w-24 truncate hover:text-gray-300 focus:text-white"
              />
              <div className="flex-1 flex justify-end">
                <EditableAmount value={bank.balance || 0} onChange={(v) => updateBank(i, 'balance', v)} label={bank.name} />
              </div>
              {(accounts.banks || []).length > 1 && (
                <button
                  onClick={() => removeBank(i)}
                  className="text-gray-600 hover:text-red-400 text-xs ml-1 transition-colors"
                  title="Remove"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addBank}
            className="w-full text-xs text-gray-500 hover:text-orange-400 border border-dashed border-gray-700 hover:border-orange-500/50 rounded-lg py-1.5 transition-colors"
          >
            + Add Bank Account
          </button>
        </AccountGroup>
      </div>
    </div>
  )
}
