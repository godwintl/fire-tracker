import { useMemo } from 'react'

const MILESTONES = [
  { label: '$100K', value: 100000 },
  { label: '$250K', value: 250000 },
  { label: '$500K', value: 500000 },
  { label: '$1M', value: 1000000 },
  { label: '$2M', value: 2000000 },
]

export default function MilestoneTimeline({ projections, fireNumber, currentAge }) {
  const milestones = useMemo(() => {
    const all = [
      ...MILESTONES.filter(m => m.value < fireNumber * 1.5),
      { label: 'FIRE', value: fireNumber, isFire: true },
    ].sort((a, b) => a.value - b.value)

    return all.map(m => {
      const entry = projections.find(p => p.balance >= m.value)
      return {
        ...m,
        age: entry ? entry.age : null,
        years: entry ? entry.age - currentAge : null,
        reached: entry != null,
      }
    })
  }, [projections, fireNumber, currentAge])

  return (
    <div className="space-y-3">
      {milestones.map((m, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
            m.reached
              ? m.isFire ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-orange-400'
              : 'bg-gray-700'
          }`} />
          <div className="flex-1 flex items-baseline justify-between gap-2 min-w-0">
            <span className={`text-sm font-medium ${m.isFire ? 'text-emerald-400' : 'text-gray-300'}`}>
              {m.label}
            </span>
            <span className="border-b border-dotted border-gray-700 flex-1 min-w-4" />
            <span className="text-sm text-gray-500 flex-shrink-0">
              {m.reached ? (
                m.years === 0 ? 'Now' : `Age ${m.age} (${m.years}yr${m.years !== 1 ? 's' : ''})`
              ) : (
                'Beyond projection'
              )}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
