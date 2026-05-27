export function calculateFIRE({
  currentAge,
  currentSavings,
  annualIncome,
  annualExpenses,
  monthlyContribution,
  expectedReturn,
  withdrawalRate,
  targetAge,
}) {
  const fireNumber = annualExpenses / (withdrawalRate / 100)
  const monthlySavings = monthlyContribution
  const monthlyReturn = expectedReturn / 100 / 12

  const projections = []
  let balance = currentSavings
  let fireAge = null

  for (let year = 0; year <= Math.max(targetAge - currentAge, 50); year++) {
    const age = currentAge + year

    if (year > 0) {
      for (let m = 0; m < 12; m++) {
        balance = balance * (1 + monthlyReturn) + monthlySavings
      }
    }

    projections.push({
      age,
      year,
      balance: Math.round(balance),
      fireNumber: Math.round(fireNumber),
    })

    if (fireAge === null && balance >= fireNumber) {
      fireAge = age
    }

    if (age >= targetAge + 20) break
  }

  const savingsRate = annualIncome > 0
    ? ((monthlyContribution * 12) / annualIncome) * 100
    : 0

  const yearsToFIRE = fireAge !== null ? fireAge - currentAge : null
  const coastFIRENumber = fireNumber / Math.pow(1 + expectedReturn / 100, targetAge - currentAge)

  return {
    fireNumber: Math.round(fireNumber),
    fireAge,
    yearsToFIRE,
    savingsRate: Math.round(savingsRate * 10) / 10,
    projections,
    coastFIRENumber: Math.round(coastFIRENumber),
    currentProgress: Math.min((currentSavings / fireNumber) * 100, 100),
  }
}
