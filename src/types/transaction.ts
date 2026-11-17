export type TransactionType = 'IN' | 'OUT';

export type TransactionCategory =
  | 'Paybill'
  | 'Buy Goods (Till)'
  | 'Send Money (P2P)'
  | 'Received Money (P2P)'
  | 'Airtime & Bundles'
  | 'Cash Withdrawal'
  | 'Bank Transfer / Deposit'
  | 'Fuliza / Loan'
  | 'Utility / Bills'
  | 'M-Pesa Tariff / Fee'
  | 'Reversal'
  | 'Other';

export type BudgetBucket = 'Needs' | 'Wants' | 'Savings / Debt';

export interface Transaction {
  id: string;
  receiptNo: string;
  dateTime: Date;
  details: string;
  rawDetails: string;
  type: TransactionType;
  category: TransactionCategory;
  budgetBucket: BudgetBucket;
  counterparty: string;
  amount: number;
  balance: number;
  isWeekend: boolean;
  isNight: boolean;
}

export interface StatementMetadata {
  customerName?: string;
  phoneNumber?: string;
  statementPeriod?: string;
  reportedTotalIn?: number;
  reportedTotalOut?: number;
  openingBalance?: number;
  closingBalance?: number;
}

export interface MonthlyMetric {
  monthKey: string;
  monthLabel: string;
  totalIn: number;
  totalOut: number;
  netSavings: number;
  savingsRate: number;
  txCount: number;
  avgDailySpend: number;
  topSpend: { counterparty: string; amount: number };
}

export interface DayInsight {
  worstDay: {
    date: string;
    dateFormatted: string;
    totalSpent: number;
    txCount: number;
    biggestTxCounterparty: string;
    biggestTxAmount: number;
  } | null;
  bestDay: {
    date: string;
    dateFormatted: string;
    netGain: number;
    totalIn: number;
    totalOut: number;
  } | null;
  zeroSpendDaysCount: number;
  busiestDayOfWeek: {
    dayName: string;
    totalSpent: number;
    percentage: number;
  };
  dailyTrend: {
    date: string;
    dateFormatted: string;
    in: number;
    out: number;
    net: number;
    cumulativeSavings: number;
  }[];
  dayOfWeekBreakdown: {
    dayName: string;
    dayIndex: number;
    totalSpent: number;
    count: number;
  }[];
}

export interface FinancialHealthMetrics {
  score: number;
  grade: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention';
  savingsRate: number;
  totalIn: number;
  totalOut: number;
  netSavings: number;
  totalFulizaSpent: number;
  totalFulizaBorrowed: number;
  estimatedTariffFees: number;
  airtimeMicroSpendTotal: number;
  airtimeCount: number;
  weekendSpendTotal: number;
  weekdaySpendTotal: number;
  weekendSpendPercentage: number;
  avgDailySpend: number;
  top20SpendsTotal: number;
  top20PercentageOfTotal: number;
  topCounterparties: { name: string; totalAmount: number; count: number; category: TransactionCategory }[];
  categoryBreakdown: { category: TransactionCategory; total: number; count: number; percentage: number }[];
  budgetBreakdown: {
    needs: number;
    needsPercentage: number;
    wants: number;
    wantsPercentage: number;
    savings: number;
    savingsPercentage: number;
  };
  monthlyMetrics: MonthlyMetric[];
  dayInsights: DayInsight;
  recommendations: string[];
}
