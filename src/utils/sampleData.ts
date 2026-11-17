import { StatementMetadata, Transaction } from '../types/transaction';
import { categorizeTransaction } from './categorizer';

export function getSampleMpesaTransactions(): { transactions: Transaction[]; metadata: StatementMetadata } {
  const metadata: StatementMetadata = {
    customerName: 'DEMO USER (SAMPLE)',
    phoneNumber: '254700***000',
    statementPeriod: '01 Jan 2024 - 31 Mar 2024',
    reportedTotalIn: 245000,
    reportedTotalOut: 198500,
    openingBalance: 12450,
    closingBalance: 58950,
  };

  const rawRows: {
    receipt: string;
    date: string;
    details: string;
    type: 'IN' | 'OUT';
    amount: number;
    balance: number;
  }[] = [
    // Income
    { receipt: 'QK10AA9182', date: '2024-01-25 09:30:15', details: 'Funds received from 254722000111 - ACME CORP SALARY', type: 'IN', amount: 120000, balance: 132450 },
    { receipt: 'QK28BB3821', date: '2024-02-25 09:15:00', details: 'Funds received from 254722000111 - ACME CORP SALARY', type: 'IN', amount: 120000, balance: 145200 },
    { receipt: 'QK15CC4910', date: '2024-01-14 16:45:22', details: 'Funds received from 254711334455 - Peter Ndungu Freelance', type: 'IN', amount: 5000, balance: 18450 },

    // Spends - Top Spends (Rent, Bank transfer, School)
    { receipt: 'QK12DD0011', date: '2024-01-26 11:20:00', details: 'Pay Bill to 522522 - KCB Bank Acc. 102938475 - Rent Payment', type: 'OUT', amount: 45000, balance: 87450 },
    { receipt: 'QK29EE1122', date: '2024-02-26 11:15:00', details: 'Pay Bill to 522522 - KCB Bank Acc. 102938475 - Rent Payment', type: 'OUT', amount: 45000, balance: 100200 },
    { receipt: 'QK14FF2233', date: '2024-01-08 14:10:05', details: 'Pay Bill to 303030 - St Andrews School Fees Acc. STD-948', type: 'OUT', amount: 28000, balance: 35000 },
    { receipt: 'QK20GG3344', date: '2024-02-10 16:00:00', details: 'Pay Bill to 247247 - Equity Bank Acc. 018273645 - Emergency Fund', type: 'OUT', amount: 20000, balance: 65000 },

    // Supermarket & Groceries (Buy Goods)
    { receipt: 'QK05HH4455', date: '2024-01-27 18:30:10', details: 'Merchant Payment to 123456 - Naivas Supermarket Westlands', type: 'OUT', amount: 14500, balance: 72950 },
    { receipt: 'QK22II5566', date: '2024-02-27 19:10:00', details: 'Merchant Payment to 654321 - Carrefour Sarit Centre', type: 'OUT', amount: 12300, balance: 87900 },
    { receipt: 'QK09JJ6677', date: '2024-03-05 17:40:20', details: 'Buy Goods to 789123 - Quickmart Supermarket Kilimani', type: 'OUT', amount: 8400, balance: 79500 },

    // Utilities
    { receipt: 'QK03KK7788', date: '2024-01-05 08:20:00', details: 'Pay Bill to 888880 - KPLC Prepaid Acc. 14238596041', type: 'OUT', amount: 3500, balance: 42000 },
    { receipt: 'QK18LL8899', date: '2024-02-04 08:15:00', details: 'Pay Bill to 888880 - KPLC Prepaid Acc. 14238596041', type: 'OUT', amount: 3500, balance: 68000 },
    { receipt: 'QK07MM9900', date: '2024-01-07 10:05:00', details: 'Pay Bill to 150001 - Safaricom Home Fibre Acc. 0712345678', type: 'OUT', amount: 4000, balance: 38000 },
    { receipt: 'QK25NN0011', date: '2024-02-07 10:00:00', details: 'Pay Bill to 150001 - Safaricom Home Fibre Acc. 0712345678', type: 'OUT', amount: 4000, balance: 64000 },

    // Weekend Leisure & Dining (Wants)
    { receipt: 'QK06OO1122', date: '2024-01-27 21:45:00', details: 'Buy Goods to 445566 - The Alchemist Bar & Grill', type: 'OUT', amount: 6500, balance: 66450 },
    { receipt: 'QK23PP2233', date: '2024-02-17 22:15:00', details: 'Buy Goods to 998877 - Brew Bistro Rooftop Lounge', type: 'OUT', amount: 8200, balance: 79700 },
    { receipt: 'QK11QQ3344', date: '2024-03-02 20:30:00', details: 'Buy Goods to 332211 - CJ Restaurant Karen', type: 'OUT', amount: 4600, balance: 74900 },
    { receipt: 'QK19RR4455', date: '2024-03-16 15:20:00', details: 'Buy Goods to 554433 - Artcaffe Coffee & Bakery', type: 'OUT', amount: 3200, balance: 71700 },

    // Fuel
    { receipt: 'QK08SS5566', date: '2024-01-10 07:45:00', details: 'Buy Goods to 776655 - Shell Petrol Station Service', type: 'OUT', amount: 5000, balance: 33000 },
    { receipt: 'QK26TT6677', date: '2024-02-12 08:00:00', details: 'Buy Goods to 887766 - TotalEnergies Petrol Station', type: 'OUT', amount: 5000, balance: 59000 },

    // P2P Transfers
    { receipt: 'QK04UU7788', date: '2024-01-06 12:30:00', details: 'Customer Transfer to 254722998877 - Grace Wanjiru Upcountry', type: 'OUT', amount: 5000, balance: 37000 },
    { receipt: 'QK16VV8899', date: '2024-02-02 14:10:00', details: 'Customer Transfer to 254733445566 - James Mwangi Brother', type: 'OUT', amount: 4000, balance: 64000 },

    // Fuliza / Overdrafts
    { receipt: 'QK02WW9900', date: '2024-01-04 15:20:00', details: 'Fuliza M-Pesa facility fee & loan repayment', type: 'OUT', amount: 1850, balance: 40150 },
    { receipt: 'QK21XX0011', date: '2024-02-05 16:30:00', details: 'Fuliza M-Pesa facility fee & loan repayment', type: 'OUT', amount: 2450, balance: 65550 },

    // Airtime Micro-Spends (Fragmented)
    { receipt: 'QK01YY1122', date: '2024-01-02 08:10:00', details: 'Airtime Purchase of KES 200 for 0712345678', type: 'OUT', amount: 200, balance: 42000 },
    { receipt: 'QK13ZZ2233', date: '2024-01-15 19:25:00', details: 'Airtime Purchase of KES 150 for 0712345678', type: 'OUT', amount: 150, balance: 18300 },
    { receipt: 'QK17AA3344', date: '2024-02-03 21:05:00', details: 'Airtime Purchase of KES 300 for 0712345678', type: 'OUT', amount: 300, balance: 63700 },
    { receipt: 'QK24BB4455', date: '2024-02-20 11:40:00', details: 'Airtime Purchase of KES 250 for 0712345678', type: 'OUT', amount: 250, balance: 79450 },
    { receipt: 'QK27CC5566', date: '2024-03-01 10:15:00', details: 'Airtime Purchase of KES 500 for 0712345678', type: 'OUT', amount: 500, balance: 78950 },
    { receipt: 'QK30DD6677', date: '2024-03-10 18:50:00', details: 'Airtime Purchase of KES 100 for 0712345678', type: 'OUT', amount: 100, balance: 71600 },

    // Cash Withdrawals at Agent
    { receipt: 'QK10EE7788', date: '2024-01-20 13:10:00', details: 'Customer Withdrawal at Agent 284910 - Kimbo Super Agent', type: 'OUT', amount: 7000, balance: 11450 },
    { receipt: 'QK28FF8899', date: '2024-02-24 12:45:00', details: 'Customer Withdrawal at Agent 192837 - Westlands Mall Agent', type: 'OUT', amount: 5000, balance: 74450 },
  ];

  const transactions: Transaction[] = rawRows.map((r, idx) => {
    const dateTime = new Date(r.date.replace(' ', 'T'));
    const dayOfWeek = dateTime.getDay();
    const hour = dateTime.getHours();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || (dayOfWeek === 5 && hour >= 17);
    const isNight = hour >= 20 || hour <= 5;

    const categorization = categorizeTransaction(r.details, r.type, r.amount);

    return {
      id: `tx-${idx + 1}`,
      receiptNo: r.receipt,
      dateTime,
      details: r.details,
      rawDetails: r.details,
      type: r.type,
      category: categorization.category,
      budgetBucket: categorization.budgetBucket,
      counterparty: categorization.counterparty,
      amount: r.amount,
      balance: r.balance,
      isWeekend,
      isNight,
    };
  });

  return { transactions, metadata };
}
