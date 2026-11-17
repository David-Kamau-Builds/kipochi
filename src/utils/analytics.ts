import { DayInsight, FinancialHealthMetrics, MonthlyMetric, Transaction } from '../types/transaction';

/**
 * Approximate Safaricom M-Pesa Tariff Fee for a given transaction amount.
 * Based on Safaricom standard consumer tariff bands.
 */
export function estimateTariffFee(amount: number, category: string): number {
  if (category === 'Airtime & Bundles' || category === 'Buy Goods (Till)' || category === 'Reversal') {
    return 0; // Till & Airtime are free for customer
  }

  if (category === 'Cash Withdrawal') {
    if (amount <= 100) return 11;
    if (amount <= 500) return 29;
    if (amount <= 1000) return 29;
    if (amount <= 1500) return 29;
    if (amount <= 2500) return 35;
    if (amount <= 3500) return 69;
    if (amount <= 5000) return 69;
    if (amount <= 7500) return 87;
    if (amount <= 10000) return 115;
    if (amount <= 15000) return 167;
    if (amount <= 20000) return 185;
    if (amount <= 35000) return 197;
    if (amount <= 50000) return 278;
    return 309;
  }

  // P2P / Paybill transfer charges
  if (amount <= 100) return 0;
  if (amount <= 500) return 7;
  if (amount <= 1000) return 13;
  if (amount <= 1500) return 23;
  if (amount <= 2500) return 33;
  if (amount <= 3500) return 53;
  if (amount <= 5000) return 57;
  if (amount <= 7500) return 78;
  if (amount <= 10000) return 90;
  if (amount <= 15000) return 100;
  if (amount <= 20000) return 105;
  return 108;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function computeFinancialHealthMetrics(transactions: Transaction[]): FinancialHealthMetrics {
  const spends = transactions.filter((t) => t.type === 'OUT');
  const incomes = transactions.filter((t) => t.type === 'IN');

  const totalIn = incomes.reduce((sum, t) => sum + t.amount, 0);
  const totalOut = spends.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIn - totalOut;
  const savingsRate = totalIn > 0 ? Math.max(0, (netSavings / totalIn) * 100) : 0;

  // Fuliza / Overdrafts
  const fulizaTransactions = transactions.filter((t) => t.category === 'Fuliza / Loan');
  const totalFulizaSpent = fulizaTransactions
    .filter((t) => t.type === 'OUT')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalFulizaBorrowed = fulizaTransactions
    .filter((t) => t.type === 'IN')
    .reduce((sum, t) => sum + t.amount, 0);

  // Airtime micro-spends (transactions <= 300)
  const airtimeSpends = spends.filter((t) => t.category === 'Airtime & Bundles');
  const airtimeMicroSpendTotal = airtimeSpends
    .filter((t) => t.amount <= 300)
    .reduce((sum, t) => sum + t.amount, 0);
  const airtimeCount = airtimeSpends.length;

  // Tariff friction fees (Use actual statement charges if present, otherwise estimate)
  const actualRecordedFees = spends
    .filter((t) => t.category === 'M-Pesa Tariff / Fee' || t.details.toLowerCase().includes('withdrawal charge'))
    .reduce((sum, t) => sum + t.amount, 0);

  const estimatedTariffFees =
    actualRecordedFees > 0
      ? actualRecordedFees
      : spends.reduce((sum, t) => sum + estimateTariffFee(t.amount, t.category), 0);

  // Weekend vs Weekday
  let weekendSpendTotal = 0;
  let weekdaySpendTotal = 0;
  for (const t of spends) {
    if (t.isWeekend) {
      weekendSpendTotal += t.amount;
    } else {
      weekdaySpendTotal += t.amount;
    }
  }
  const weekendSpendPercentage = totalOut > 0 ? (weekendSpendTotal / totalOut) * 100 : 0;

  // Calculate day range
  let avgDailySpend = 0;
  if (transactions.length > 0) {
    const dates = transactions.map((t) => t.dateTime.getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const days = Math.max(1, Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)));
    avgDailySpend = totalOut / days;
  }

  // Top 20 spends
  const sortedSpends = [...spends].sort((a, b) => b.amount - a.amount);
  const top20 = sortedSpends.slice(0, 20);
  const top20SpendsTotal = top20.reduce((sum, t) => sum + t.amount, 0);
  const top20PercentageOfTotal = totalOut > 0 ? (top20SpendsTotal / totalOut) * 100 : 0;

  // Top Counterparties
  const counterpartyMap: Record<string, { totalAmount: number; count: number; category: any }> = {};
  for (const t of spends) {
    const name = t.counterparty || 'Unknown';
    if (!counterpartyMap[name]) {
      counterpartyMap[name] = { totalAmount: 0, count: 0, category: t.category };
    }
    counterpartyMap[name].totalAmount += t.amount;
    counterpartyMap[name].count += 1;
  }
  const topCounterparties = Object.entries(counterpartyMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10);

  // Category Breakdown
  const catMap: Record<string, { total: number; count: number }> = {};
  for (const t of spends) {
    if (!catMap[t.category]) {
      catMap[t.category] = { total: 0, count: 0 };
    }
    catMap[t.category].total += t.amount;
    catMap[t.category].count += 1;
  }
  const categoryBreakdown = Object.entries(catMap)
    .map(([category, data]) => ({
      category: category as any,
      total: data.total,
      count: data.count,
      percentage: totalOut > 0 ? (data.total / totalOut) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // 50/30/20 Budget Breakdown
  let needs = 0;
  let wants = 0;
  let savings = 0;
  for (const t of spends) {
    if (t.budgetBucket === 'Needs') needs += t.amount;
    else if (t.budgetBucket === 'Wants') wants += t.amount;
    else savings += t.amount;
  }
  const budgetBreakdown = {
    needs,
    needsPercentage: totalOut > 0 ? (needs / totalOut) * 100 : 0,
    wants,
    wantsPercentage: totalOut > 0 ? (wants / totalOut) * 100 : 0,
    savings,
    savingsPercentage: totalOut > 0 ? (savings / totalOut) * 100 : 0,
  };

  // ==========================================
  // 1. PER-MONTH ANALYTICS
  // ==========================================
  const monthMap: Record<
    string,
    {
      inTotal: number;
      outTotal: number;
      txs: Transaction[];
    }
  > = {};

  for (const t of transactions) {
    const y = t.dateTime.getFullYear();
    const m = String(t.dateTime.getMonth() + 1).padStart(2, '0');
    const key = `${y}-${m}`;
    if (!monthMap[key]) {
      monthMap[key] = { inTotal: 0, outTotal: 0, txs: [] };
    }
    if (t.type === 'IN') {
      monthMap[key].inTotal += t.amount;
    } else {
      monthMap[key].outTotal += t.amount;
    }
    monthMap[key].txs.push(t);
  }

  const sortedMonthKeys = Object.keys(monthMap).sort();
  const monthlyMetrics: MonthlyMetric[] = sortedMonthKeys.map((key) => {
    const data = monthMap[key];
    const [yearStr, monthStr] = key.split('-');
    const mIndex = parseInt(monthStr, 10) - 1;
    const monthLabel = `${MONTH_NAMES[mIndex]} ${yearStr}`;

    const monthSpends = data.txs.filter((t) => t.type === 'OUT');
    let topSpend = { counterparty: 'None', amount: 0 };
    if (monthSpends.length > 0) {
      const sortedM = [...monthSpends].sort((a, b) => b.amount - a.amount);
      topSpend = { counterparty: sortedM[0].counterparty, amount: sortedM[0].amount };
    }

    const net = data.inTotal - data.outTotal;
    const rate = data.inTotal > 0 ? Math.max(0, (net / data.inTotal) * 100) : 0;

    return {
      monthKey: key,
      monthLabel,
      totalIn: data.inTotal,
      totalOut: data.outTotal,
      netSavings: net,
      savingsRate: rate,
      txCount: data.txs.length,
      avgDailySpend: data.outTotal / 30,
      topSpend,
    };
  });

  // ==========================================
  // 2. DAILY AGGREGATIONS, WORST & BEST DAYS
  // ==========================================
  const dailyMap: Record<
    string,
    {
      date: string;
      inAmount: number;
      outAmount: number;
      spends: Transaction[];
      allTxs: Transaction[];
    }
  > = {};

  // Track day of week totals (0 = Sunday, 1 = Monday, ...)
  const dayOfWeekTotals: { totalSpent: number; count: number }[] = Array(7)
    .fill(0)
    .map(() => ({ totalSpent: 0, count: 0 }));

  for (const t of transactions) {
    const dateStr = t.dateTime.toISOString().substring(0, 10);
    if (!dailyMap[dateStr]) {
      dailyMap[dateStr] = { date: dateStr, inAmount: 0, outAmount: 0, spends: [], allTxs: [] };
    }
    if (t.type === 'IN') {
      dailyMap[dateStr].inAmount += t.amount;
    } else {
      dailyMap[dateStr].outAmount += t.amount;
      dailyMap[dateStr].spends.push(t);

      const dIndex = t.dateTime.getDay();
      dayOfWeekTotals[dIndex].totalSpent += t.amount;
      dayOfWeekTotals[dIndex].count += 1;
    }
    dailyMap[dateStr].allTxs.push(t);
  }

  // Find Worst Day (Highest Outflow / Spending)
  let worstDay: DayInsight['worstDay'] = null;
  let maxSpent = -1;

  // Find Best Day (Highest Net Positive Cash Flow)
  let bestDay: DayInsight['bestDay'] = null;
  let maxNetGain = -Infinity;

  for (const [dateStr, dayData] of Object.entries(dailyMap)) {
    // Worst Day Check
    if (dayData.outAmount > maxSpent) {
      maxSpent = dayData.outAmount;
      const biggestTx = [...dayData.spends].sort((a, b) => b.amount - a.amount)[0];
      const d = new Date(dateStr + 'T00:00:00');
      worstDay = {
        date: dateStr,
        dateFormatted: `${d.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`,
        totalSpent: dayData.outAmount,
        txCount: dayData.spends.length,
        biggestTxCounterparty: biggestTx ? biggestTx.counterparty : 'None',
        biggestTxAmount: biggestTx ? biggestTx.amount : 0,
      };
    }

    // Best Day Check (Highest net savings / income surplus)
    const netDay = dayData.inAmount - dayData.outAmount;
    if (netDay > maxNetGain && dayData.inAmount > 0) {
      maxNetGain = netDay;
      const d = new Date(dateStr + 'T00:00:00');
      bestDay = {
        date: dateStr,
        dateFormatted: `${d.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}`,
        netGain: netDay,
        totalIn: dayData.inAmount,
        totalOut: dayData.outAmount,
      };
    }
  }

  // Build Chronological Daily Trend for Line Graph
  const sortedDates = Object.keys(dailyMap).sort();
  let cumulative = 0;
  const dailyTrend = sortedDates.map((dateStr) => {
    const day = dailyMap[dateStr];
    const net = day.inAmount - day.outAmount;
    cumulative += net;
    const d = new Date(dateStr + 'T00:00:00');
    return {
      date: dateStr,
      dateFormatted: `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`,
      in: day.inAmount,
      out: day.outAmount,
      net,
      cumulativeSavings: cumulative,
    };
  });

  // Calculate Zero Spend Days within the statement span
  let zeroSpendDaysCount = 0;
  if (sortedDates.length > 1) {
    const start = new Date(sortedDates[0]).getTime();
    const end = new Date(sortedDates[sortedDates.length - 1]).getTime();
    const totalCalendarDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    const activeSpendDaysCount = Object.values(dailyMap).filter((d) => d.outAmount > 0).length;
    zeroSpendDaysCount = Math.max(0, totalCalendarDays - activeSpendDaysCount);
  }

  // Day of Week Breakdown
  const dayOfWeekBreakdown = DAY_NAMES.map((dayName, idx) => ({
    dayName,
    dayIndex: idx,
    totalSpent: dayOfWeekTotals[idx].totalSpent,
    count: dayOfWeekTotals[idx].count,
  }));

  const busiest = [...dayOfWeekBreakdown].sort((a, b) => b.totalSpent - a.totalSpent)[0];
  const busiestDayOfWeek = {
    dayName: busiest ? busiest.dayName : 'None',
    totalSpent: busiest ? busiest.totalSpent : 0,
    percentage: totalOut > 0 && busiest ? (busiest.totalSpent / totalOut) * 100 : 0,
  };

  const dayInsights: DayInsight = {
    worstDay,
    bestDay,
    zeroSpendDaysCount,
    busiestDayOfWeek,
    dailyTrend,
    dayOfWeekBreakdown,
  };

  // Score Calculation (0-100)
  let scorePillarSavings = Math.min(30, (savingsRate / 20) * 30);
  const fulizaRatio = totalOut > 0 ? totalFulizaSpent / totalOut : 0;
  let scorePillarDebt = Math.max(0, 25 - fulizaRatio * 100);
  const feeRatio = totalOut > 0 ? estimatedTariffFees / totalOut : 0;
  let scorePillarFees = Math.max(0, 20 - feeRatio * 300);
  const wantsRatio = totalOut > 0 ? wants / totalOut : 0;
  let scorePillarWants = wantsRatio <= 0.3 ? 25 : Math.max(0, 25 - (wantsRatio - 0.3) * 50);

  const rawScore = Math.round(scorePillarSavings + scorePillarDebt + scorePillarFees + scorePillarWants);
  const score = Math.max(10, Math.min(100, rawScore));

  let grade: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention' = 'Fair';
  if (score >= 80) grade = 'Excellent';
  else if (score >= 65) grade = 'Good';
  else if (score >= 45) grade = 'Fair';
  else grade = 'Needs Attention';

  // Actionable Prescriptive Recommendations
  const recommendations: string[] = [];

  if (worstDay && totalOut > 0 && (worstDay.totalSpent / totalOut) > 0.25) {
    recommendations.push(
      `Your single heaviest spend day was ${worstDay.dateFormatted} (KES ${worstDay.totalSpent.toLocaleString()}), representing ${(
        (worstDay.totalSpent / totalOut) *
        100
      ).toFixed(1)}% of all period outflows. Plan ahead for lump-sum bills.`
    );
  }

  if (busiestDayOfWeek.percentage > 25) {
    recommendations.push(
      `${busiestDayOfWeek.dayName}s represent ${busiestDayOfWeek.percentage.toFixed(1)}% of your total weekly spending (KES ${busiestDayOfWeek.totalSpent.toLocaleString()}). Be extra conscious of impulsive payments on ${busiestDayOfWeek.dayName}s.`
    );
  }

  if (totalFulizaSpent > 0) {
    recommendations.push(
      `You paid KES ${totalFulizaSpent.toLocaleString()} on Fuliza overdrafts. Try setting up an emergency float in a Money Market Fund (MMF) or SACCO to avoid high daily facility fees.`
    );
  }

  if (airtimeCount > 10 && airtimeMicroSpendTotal > 1000) {
    recommendations.push(
      `You made ${airtimeCount} individual airtime/data purchases totaling KES ${airtimeMicroSpendTotal.toLocaleString()}. Switch to a scheduled monthly Postpay or Tunukiwa bundle to save up to 25%.`
    );
  }

  if (estimatedTariffFees > 1500) {
    recommendations.push(
      `Estimated Safaricom tariff fees: KES ${estimatedTariffFees.toLocaleString()}. Consolidate multiple small withdrawals and P2P transfers into fewer larger batch transactions to cut tariff friction.`
    );
  }

  if (weekendSpendPercentage > 45) {
    recommendations.push(
      `Weekend spending accounts for ${weekendSpendPercentage.toFixed(1)}% of your total outflows. Review Friday-Sunday dining and entertainment expenses to curb lifestyle inflation.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      'Outstanding financial discipline! Your spending aligns well with the 50/30/20 guideline with negligible debt drag.'
    );
  }

  return {
    score,
    grade,
    savingsRate,
    totalIn,
    totalOut,
    netSavings,
    totalFulizaSpent,
    totalFulizaBorrowed,
    estimatedTariffFees,
    airtimeMicroSpendTotal,
    airtimeCount,
    weekendSpendTotal,
    weekdaySpendTotal,
    weekendSpendPercentage,
    avgDailySpend,
    top20SpendsTotal,
    top20PercentageOfTotal,
    topCounterparties,
    categoryBreakdown,
    budgetBreakdown,
    monthlyMetrics,
    dayInsights,
    recommendations,
  };
}
