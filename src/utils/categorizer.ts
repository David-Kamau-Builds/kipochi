import { BudgetBucket, TransactionCategory, TransactionType } from '../types/transaction';

interface CategorizationResult {
  category: TransactionCategory;
  budgetBucket: BudgetBucket;
  counterparty: string;
}

export function categorizeTransaction(
  details: string,
  type: TransactionType,
  amount: number
): CategorizationResult {
  const text = details.trim();
  const lower = text.toLowerCase();

  // 1. Withdrawal Charge (Separate row in Safaricom statements)
  if (lower === 'withdrawal charge' || lower.includes('withdrawal charge')) {
    return {
      category: 'M-Pesa Tariff / Fee',
      budgetBucket: 'Needs',
      counterparty: 'Safaricom Withdrawal Charge',
    };
  }

  // 2. Unit Trust / Money Market Fund (e.g. "Unit Trust Withdraw From 4145555 - ZIIDI MMF by M-PESA\UnitTrust")
  if (lower.includes('unit trust') || lower.includes('mmf') || lower.includes('money market')) {
    const utMatch = text.match(/Unit Trust Withdraw From\s+([^-]+?)\s*-\s*([^by\\]+?)(?:\s+by|\s*\\|\s*$)/i);
    const name = utMatch && utMatch[2] ? utMatch[2].trim() : 'Unit Trust / MMF';
    return {
      category: 'Bank Transfer / Deposit',
      budgetBucket: 'Savings / Debt',
      counterparty: `${name} (Unit Trust / MMF)`,
    };
  }

  // 3. Fuliza & M-Shwari / Loans
  if (lower.includes('fuliza') || lower.includes('overdraft') || lower.includes('facility fee') || lower.includes('m-shwari loan')) {
    return {
      category: 'Fuliza / Loan',
      budgetBucket: 'Savings / Debt',
      counterparty: 'Safaricom Fuliza / Overdraft',
    };
  }

  // 4. Airtime & Data Bundles (e.g. "Customer Bundle Purchase to 244441SAFARICOM POSTPAID BUNDLES by - 254741***185 DAVID KIBE")
  if (lower.includes('airtime') || lower.includes('bundle') || lower.includes('safaricom offer') || lower.includes('postpaid bundles')) {
    let counterparty = 'Safaricom Airtime / Bundles';
    const bundleMatch = text.match(/Bundle Purchase to\s+(?:\d+)?([A-Za-z\s]+?)(?:\s+by\s*-\s*|\s*$)/i);
    if (bundleMatch && bundleMatch[1].trim()) {
      counterparty = bundleMatch[1].trim();
    }
    return {
      category: 'Airtime & Bundles',
      budgetBucket: amount > 500 ? 'Needs' : 'Wants',
      counterparty,
    };
  }

  // 5. Reversals
  if (lower.includes('reversal') || lower.includes('reversed')) {
    return {
      category: 'Reversal',
      budgetBucket: 'Needs',
      counterparty: 'M-Pesa Reversal',
    };
  }

  // 6. Cash Withdrawals at Agent Till (e.g. "Customer Withdrawal At Agent Till 354317 - Gelglobal bidan communications Agg")
  if (lower.includes('customer withdrawal at agent') || (lower.includes('withdraw') && type === 'OUT')) {
    const agentMatch = text.match(/Withdraw(?:al)?\s+(?:at|from)\s+(?:Agent(?:\s+Till)?\s+)?([^-]+?)(?:\s*-\s*(.+))?$/i);
    let counterparty = 'M-Pesa Agent Withdrawal';
    if (agentMatch) {
      counterparty = agentMatch[2] ? agentMatch[2].trim() : agentMatch[1].trim();
    }
    return {
      category: 'Cash Withdrawal',
      budgetBucket: 'Needs',
      counterparty,
    };
  }

  // 7. Paybill Transactions
  if (lower.includes('pay bill') || lower.includes('paybill')) {
    let bucket: BudgetBucket = 'Needs';
    if (lower.includes('bet') || lower.includes('sportpesa') || lower.includes('betika') || lower.includes('1xbet') || lower.includes('mozzart')) {
      bucket = 'Wants';
    } else if (lower.includes('bank') || lower.includes('sacco') || lower.includes('equity') || lower.includes('kcb') || lower.includes('co-op') || lower.includes('stanbic') || lower.includes('cic')) {
      bucket = 'Savings / Debt';
    }

    const match = text.match(/Pay\s*Bill\s+to\s+([^-]+?)(?:\s*-\s*([^-]+?))?(?:\s+Acc\.|\s+Account|\s*$)/i);
    let counterparty = 'Paybill Merchant';
    if (match) {
      if (match[2]) {
        counterparty = `${match[1].trim()} (${match[2].trim()})`;
      } else {
        counterparty = match[1].trim();
      }
    }

    return {
      category: 'Paybill',
      budgetBucket: bucket,
      counterparty,
    };
  }

  // 8. Buy Goods / Till (e.g. "Merchant Payment Online to 4284725 - KENNEDY KAMAU MBUGUA" or "Customer Payment to Small Business to - 254705***499 Rodgers Keragori")
  if (lower.includes('customer payment to small business') || lower.includes('small business')) {
    const match = text.match(/Customer Payment to Small Business to\s*(?:-\s*)?(?:254\S*|\d\S*)?\s*(.+)/i);
    const counterparty = match && match[1] ? match[1].trim() : 'Small Business Till';
    return {
      category: 'Buy Goods (Till)',
      budgetBucket: 'Wants',
      counterparty,
    };
  }

  if (lower.includes('buy goods') || lower.includes('merchant payment') || lower.includes('till')) {
    const match = text.match(/(?:Merchant Payment(?:\s+Online)?|Buy Goods)\s+(?:to|at)\s+([^-]+?)(?:\s*-\s*(.+))?$/i);
    let counterparty = 'Merchant / Till';
    if (match) {
      counterparty = match[2] ? match[2].trim() : match[1].trim();
    }

    let bucket: BudgetBucket = 'Wants';
    if (
      lower.includes('supermarket') ||
      lower.includes('naivas') ||
      lower.includes('carrefour') ||
      lower.includes('quickmart') ||
      lower.includes('chandarana') ||
      lower.includes('pharmacy') ||
      lower.includes('chemist') ||
      lower.includes('hospital') ||
      lower.includes('clinic') ||
      lower.includes('petrol') ||
      lower.includes('total') ||
      lower.includes('rubis') ||
      lower.includes('shell')
    ) {
      bucket = 'Needs';
    }

    return {
      category: 'Buy Goods (Till)',
      budgetBucket: bucket,
      counterparty,
    };
  }

  // 9. P2P Send / Received Money (e.g. "Customer Transfer to - 254715***078 ADAM TABU")
  if (type === 'IN') {
    const match = text.match(/received from\s*(?:-\s*)?(?:254\S*|\d\S*)?\s*(.+)/i);
    const counterparty = match ? match[1].trim() : 'P2P Sender';
    return {
      category: 'Received Money (P2P)',
      budgetBucket: 'Savings / Debt',
      counterparty,
    };
  } else {
    const match = text.match(/(?:Customer Transfer|Send Money|Transfer)\s+to\s*(?:-\s*)?(?:254\S*|\d\S*)?\s*(.+)/i);
    const counterparty = match ? match[1].trim() : 'P2P Recipient';
    return {
      category: 'Send Money (P2P)',
      budgetBucket: 'Wants',
      counterparty,
    };
  }
}
