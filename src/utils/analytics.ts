import {
  DayInsight,
  FinancialHealthMetrics,
  MonthlyMetric,
  RecurringBill,
  RunwayInsight,
  SocialContact,
  StatutoryRecord,
  TimeOfDayInsight,
  Transaction,
} from '../types/transaction';

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
  const monthMap: Record<string, { inTotal: number; outTotal: number; txs: Transaction[] }> = {};

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

  // ==========================================
  // 3. RECURRING BILLS & SUBSCRIPTIONS RADAR
  // ==========================================
  const billMap: Record<string, { totalPaid: number; count: number; dates: string[]; category: string }> = {};
  for (const t of spends) {
    const lower = (t.details + ' ' + t.counterparty).toLowerCase();
    const isLikelyRecurring =
      t.category === 'Paybill' ||
      t.category === 'Utility / Bills' ||
      lower.includes('kplc') ||
      lower.includes('fibre') ||
      lower.includes('internet') ||
      lower.includes('water') ||
      lower.includes('rent') ||
      lower.includes('netflix') ||
      lower.includes('spotify') ||
      lower.includes('dstv') ||
      lower.includes('insurance');

    if (isLikelyRecurring) {
      const name = t.counterparty;
      if (!billMap[name]) {
        billMap[name] = { totalPaid: 0, count: 0, dates: [], category: t.category };
      }
      billMap[name].totalPaid += t.amount;
      billMap[name].count += 1;
      billMap[name].dates.push(t.dateTime.toISOString().substring(0, 10));
    }
  }

  const recurringBills: RecurringBill[] = Object.entries(billMap)
    .map(([name, d]) => ({
      name,
      category: d.category,
      averageAmount: d.totalPaid / d.count,
      totalPaid: d.totalPaid,
      frequency: d.count,
      lastPaidDate: d.dates.sort().reverse()[0],
    }))
    .sort((a, b) => b.totalPaid - a.totalPaid);

  // ==========================================
  // 4. P2P RELATIONSHIP & SOCIAL NET MATRIX
  // ==========================================
  const contactMap: Record<string, { sent: number; received: number; count: number }> = {};
  for (const t of transactions) {
    if (t.category === 'Send Money (P2P)' || t.category === 'Received Money (P2P)') {
      const name = t.counterparty;
      if (!name || name === 'P2P Sender' || name === 'P2P Recipient') continue;
      if (!contactMap[name]) {
        contactMap[name] = { sent: 0, received: 0, count: 0 };
      }
      if (t.type === 'OUT') {
        contactMap[name].sent += t.amount;
      } else {
        contactMap[name].received += t.amount;
      }
      contactMap[name].count += 1;
    }
  }

  const socialContacts: SocialContact[] = Object.entries(contactMap)
    .map(([name, d]) => {
      const netFlow = d.received - d.sent;
      let relationshipType: 'Beneficiary' | 'Contributor' | 'Reciprocal' = 'Reciprocal';
      if (netFlow < -500) relationshipType = 'Beneficiary';
      else if (netFlow > 500) relationshipType = 'Contributor';

      return {
        name,
        sentTotal: d.sent,
        receivedTotal: d.received,
        netFlow,
        txCount: d.count,
        relationshipType,
      };
    })
    .sort((a, b) => b.sentTotal + b.receivedTotal - (a.sentTotal + a.receivedTotal))
    .slice(0, 15);

  // ==========================================
  // 5. TIME OF DAY & LATE-NIGHT IMPULSE TAX
  // ==========================================
  let morningTotal = 0, morningCount = 0;
  let workdayTotal = 0, workdayCount = 0;
  let eveningTotal = 0, eveningCount = 0;
  let lateNightTotal = 0, lateNightCount = 0;

  for (const t of spends) {
    const hour = t.dateTime.getHours();
    if (hour >= 6 && hour < 11) {
      morningTotal += t.amount;
      morningCount += 1;
    } else if (hour >= 11 && hour < 17) {
      workdayTotal += t.amount;
      workdayCount += 1;
    } else if (hour >= 17 && hour < 22) {
      eveningTotal += t.amount;
      eveningCount += 1;
    } else {
      lateNightTotal += t.amount;
      lateNightCount += 1;
    }
  }

  const timeOfDayInsights: TimeOfDayInsight = {
    morning: { total: morningTotal, count: morningCount, percentage: totalOut > 0 ? (morningTotal / totalOut) * 100 : 0 },
    workday: { total: workdayTotal, count: workdayCount, percentage: totalOut > 0 ? (workdayTotal / totalOut) * 100 : 0 },
    evening: { total: eveningTotal, count: eveningCount, percentage: totalOut > 0 ? (eveningTotal / totalOut) * 100 : 0 },
    lateNight: { total: lateNightTotal, count: lateNightCount, percentage: totalOut > 0 ? (lateNightTotal / totalOut) * 100 : 0 },
  };

  // ==========================================
  // 6. ECITIZEN & STATUTORY TAX FILING RECORDS
  // ==========================================
  const statutoryMap: Record<string, { type: any; recipient: string; totalAmount: number; receipts: any[] }> = {};
  for (const t of spends) {
    const lower = (t.details + ' ' + t.counterparty).toLowerCase();
    let type: any = null;
    if (lower.includes('ecitizen') || lower.includes('222222')) type = 'eCitizen';
    else if (lower.includes('kra') || lower.includes('572572')) type = 'KRA';
    else if (lower.includes('nssf')) type = 'NSSF';
    else if (lower.includes('nhif') || lower.includes('shif')) type = 'SHIF/NHIF';

    if (type) {
      if (!statutoryMap[type]) {
        statutoryMap[type] = { type, recipient: t.counterparty, totalAmount: 0, receipts: [] };
      }
      statutoryMap[type].totalAmount += t.amount;
      statutoryMap[type].receipts.push({
        receiptNo: t.receiptNo,
        date: t.dateTime.toISOString().substring(0, 10),
        amount: t.amount,
        details: t.details,
      });
    }
  }
  const statutoryRecords: StatutoryRecord[] = Object.values(statutoryMap);

  // ==========================================
  // 7. EMERGENCY RUNWAY & CASH VELOCITY BUFFER
  // ==========================================
  const sortedByTimeDesc = [...transactions].sort((a, b) => b.dateTime.getTime() - a.dateTime.getTime());
  const closingBalance =
    sortedByTimeDesc.length > 0 && sortedByTimeDesc[0].balance > 0
      ? sortedByTimeDesc[0].balance
      : Math.max(0, totalIn - totalOut);
  const runwayDays = avgDailySpend > 0 ? Math.round(closingBalance / avgDailySpend) : 999;
  let status: 'Healthy' | 'Moderate' | 'Critical' = 'Healthy';
  if (runwayDays < 10) status = 'Critical';
  else if (runwayDays < 30) status = 'Moderate';

  const runwayInsight: RunwayInsight = {
    closingBalance,
    avgDailyBurn: avgDailySpend,
    runwayDays,
    status,
  };

  // ==========================================
  // SCORE & RECOMMENDATIONS
  // ==========================================
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

  const recommendations: string[] = [];

  if (timeOfDayInsights.lateNight.percentage > 15) {
    recommendations.push(
      `Late-Night spending (10 PM – 5 AM) accounts for ${timeOfDayInsights.lateNight.percentage.toFixed(1)}% of your expenses (KES ${timeOfDayInsights.lateNight.total.toLocaleString()}). Curbing late-night nightlife and rideshare surges will yield immediate savings.`
    );
  }

  if (runwayInsight.status === 'Critical') {
    recommendations.push(
      `Your current liquid balance covers approximately ${runwayDays} days of average spending. Prioritize depositing a 1-month living buffer into an MMF or SACCO.`
    );
  }

  if (worstDay && totalOut > 0 && worstDay.totalSpent / totalOut > 0.25) {
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
    recurringBills,
    socialContacts,
    timeOfDayInsights,
    statutoryRecords,
    runwayInsight,
    recommendations,
  };
}
