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
  | 'Statutory / Tax / eCitizen'
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

export interface RecurringBill {
  name: string;
  category: string;
  averageAmount: number;
  totalPaid: number;
  frequency: number;
  lastPaidDate: string;
}

export interface SocialContact {
  name: string;
  sentTotal: number;
  receivedTotal: number;
  netFlow: number; // received - sent
  txCount: number;
  relationshipType: 'Beneficiary' | 'Contributor' | 'Reciprocal';
}

export interface TimeOfDayInsight {
  morning: { total: number; count: number; percentage: number }; // 6 AM - 11 AM
  workday: { total: number; count: number; percentage: number }; // 11 AM - 5 PM
  evening: { total: number; count: number; percentage: number }; // 5 PM - 10 PM
  lateNight: { total: number; count: number; percentage: number }; // 10 PM - 5 AM ("Late Night Tax")
}

export interface StatutoryRecord {
  type: 'KRA' | 'eCitizen' | 'NSSF' | 'SHIF/NHIF' | 'Government / License';
  recipient: string;
  totalAmount: number;
  receipts: { receiptNo: string; date: string; amount: number; details: string }[];
}

export interface RunwayInsight {
  closingBalance: number;
  avgDailyBurn: number;
  runwayDays: number;
  status: 'Healthy' | 'Moderate' | 'Critical';
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
  recurringBills: RecurringBill[];
  socialContacts: SocialContact[];
  timeOfDayInsights: TimeOfDayInsight;
  statutoryRecords: StatutoryRecord[];
  runwayInsight: RunwayInsight;
  recommendations: string[];
}
