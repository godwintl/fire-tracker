import { useMemo } from 'react'

export default function ProjectionChart({ projections, fireNumber, fireAge }) {
  const chartData = useMemo(() => {
    const maxBalance = Math.max(...projections.map(p => p.balance), fireNumber)
    const maxValue = maxBalance * 1.1
    return { maxValue, points: projections }
  }, [projections, fireNumber])

  const { maxValue, points } = chartData
  if (points.length < 2) return null

  const width = 800
  const height = 300
  const padLeft = 60
  const padRight = 20
  const padTop = 20
  const padBottom = 40
  const chartW = width - padLeft - padRight
  const chartH = height - padTop - padBottom

  const xScale = (i) => padLeft + (i / (points.length - 1)) * chartW
  const yScale = (v) => padTop + chartH - (v / maxValue) * chartH

  const balancePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(p.balance).toFixed(1)}`)
    .join(' ')

  const areaPath = balancePath +
    ` L ${xScale(points.length - 1).toFixed(1)} ${yScale(0).toFixed(1)}` +
    ` L ${xScale(0).toFixed(1)} ${yScale(0).toFixed(1)} Z`

  const fireLineY = yScale(fireNumber)

  const yTicks = []
  const tickCount = 5
  for (let i = 0; i <= tickCount; i++) {
    const val = (maxValue / tickCount) * i
    yTicks.push({ val, y: yScale(val) })
  }

  const xTicks = []
  const xStep = Math.max(1, Math.floor(points.length / 6))
  for (let i = 0; i < points.length; i += xStep) {
    xTicks.push({ age: points[i].age, x: xScale(i) })
  }

  const fmtShort = (n) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
    return `$${n}`
  }

  return (
    <div className="overflow-x-auto -mx-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px]" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padLeft} x2={width - padRight} y1={t.y} y2={t.y} stroke="#1f2937" strokeWidth="1" />
            <text x={padLeft - 8} y={t.y + 4} textAnchor="end" fill="#6b7280" fontSize="11" fontFamily="system-ui">
              {fmtShort(t.val)}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {xTicks.map((t, i) => (
          <text key={i} x={t.x} y={height - 8} textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="system-ui">
            {t.age}
          </text>
        ))}

        {/* Area fill */}
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Balance line */}
        <path d={balancePath} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* FIRE line */}
        <line
          x1={padLeft} x2={width - padRight}
          y1={fireLineY} y2={fireLineY}
          stroke="#10b981" strokeWidth="1.5" strokeDasharray="6 4"
        />
        <text x={width - padRight} y={fireLineY - 6} textAnchor="end" fill="#10b981" fontSize="11" fontFamily="system-ui">
          FIRE: {fmtShort(fireNumber)}
        </text>

        {/* FIRE age marker */}
        {fireAge != null && (() => {
          const idx = points.findIndex(p => p.age === fireAge)
          if (idx < 0) return null
          const cx = xScale(idx)
          const cy = yScale(points[idx].balance)
          return (
            <g>
              <line x1={cx} x2={cx} y1={cy} y2={yScale(0)} stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
              <circle cx={cx} cy={cy} r="5" fill="#10b981" />
              <circle cx={cx} cy={cy} r="8" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.5" />
            </g>
          )
        })()}

        {/* Axis label */}
        <text x={width / 2} y={height - 0} textAnchor="middle" fill="#4b5563" fontSize="10" fontFamily="system-ui">
          Age
        </text>
      </svg>
    </div>
  )
}
