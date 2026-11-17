import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { StatementMetadata, Transaction, TransactionType } from '../types/transaction';
import { categorizeTransaction } from './categorizer';

// Configure pdfjs worker to use the local bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export interface ParseResult {
  transactions: Transaction[];
  metadata: StatementMetadata;
  requiresPassword?: boolean;
}

export class PasswordRequiredError extends Error {
  constructor(message = 'PDF password required') {
    super(message);
    this.name = 'PasswordRequiredError';
  }
}

export class InvalidPasswordError extends Error {
  constructor(message = 'Invalid password provided') {
    super(message);
    this.name = 'InvalidPasswordError';
  }
}

/**
 * Clean numeric string into number e.g. "12,450.00" -> 12450
 */
function parseAmount(val: any): number {
  if (typeof val === 'number') return Math.abs(val);
  if (!val) return 0;
  const cleaned = String(val).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.abs(num);
}

/**
 * Parse date strings commonly seen in M-Pesa statements
 */
function parseDate(dateStr: string): Date {
  const trimmed = dateStr.trim();
  let d = new Date(trimmed.replace(' ', 'T'));
  if (!isNaN(d.getTime())) return d;

  const parts = trimmed.match(/^(\d{2})[/-](\d{2})[/-](\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (parts) {
    const day = parseInt(parts[1], 10);
    const month = parseInt(parts[2], 10) - 1;
    const year = parseInt(parts[3], 10);
    const hour = parts[4] ? parseInt(parts[4], 10) : 0;
    const min = parts[5] ? parseInt(parts[5], 10) : 0;
    const sec = parts[6] ? parseInt(parts[6], 10) : 0;
    return new Date(year, month, day, hour, min, sec);
  }

  return new Date();
}

/**
 * Filter out recurring page headers, stamps, and footer noise
 */
function isNoiseLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return true;
  if (/^Page \d+ of \d+/i.test(trimmed)) return true;
  if (/^DETAILED STATEMENT/i.test(trimmed)) return true;
  if (/^M-PESA STATEMENT/i.test(trimmed)) return true;
  if (/^Receipt No\./i.test(trimmed)) return true;
  if (/^Completion Time/i.test(trimmed)) return true;
  if (/^Disclaimer:/i.test(trimmed)) return true;
  if (/^Approved\s*-\s*\d+/i.test(trimmed)) return true;
  if (/^SUMMARY/i.test(trimmed)) return true;
  if (/^TRANSACTION TYPE/i.test(trimmed)) return true;
  if (/^TOTAL:\s*[0-9,]+/i.test(trimmed)) return true;
  return false;
}

/**
 * Parse an M-Pesa PDF Statement
 */
export async function parseMpesaPdf(fileBuffer: ArrayBuffer, password?: string): Promise<ParseResult> {
  // Defensive clone to avoid detaching the caller's ArrayBuffer
  const bufferCopy = fileBuffer.slice(0);
  const data = new Uint8Array(bufferCopy);

  const loadingTask = pdfjsLib.getDocument({
    data,
    password: password || undefined,
  });

  let pdfDoc: pdfjsLib.PDFDocumentProxy;
  try {
    pdfDoc = await loadingTask.promise;
  } catch (err: any) {
    if (err.name === 'PasswordException') {
      if (err.code === 1 || !password) {
        throw new PasswordRequiredError('Statement is password encrypted.');
      }
      if (err.code === 2) {
        throw new InvalidPasswordError('Incorrect password. Please verify the code Safaricom sent to you.');
      }
    }
    const msg = (err.message || '').toLowerCase();
    if (msg.includes('password')) {
      if (!password) {
        throw new PasswordRequiredError('Statement is password encrypted.');
      }
      throw new InvalidPasswordError('Incorrect password. Please verify the code Safaricom sent to you.');
    }
    throw err;
  }

  const metadata: StatementMetadata = {};
  const allLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group items by vertical position (y coordinate)
    const lineMap: Map<number, { x: number; text: string }[]> = new Map();

    for (const item of textContent.items as any[]) {
      if (!item.str || item.str.trim() === '') continue;
      const y = Math.round(item.transform[5]);
      if (!lineMap.has(y)) {
        lineMap.set(y, []);
      }
      lineMap.get(y)!.push({ x: item.transform[4], text: item.str });
    }

    const sortedY = Array.from(lineMap.keys()).sort((a, b) => b - a);

    for (const y of sortedY) {
      const items = lineMap.get(y)!.sort((a, b) => a.x - b.x);
      const lineText = items.map((i) => i.text).join('   ');
      allLines.push(lineText);
    }
  }

  // Parse Metadata & Summary from the top header lines
  for (const line of allLines.slice(0, 40)) {
    if (line.includes('Customer Name')) {
      const match = line.match(/Customer Name:?\s*([A-Za-z\s]+?)(?:\s{3,}|Approved|Mobile|Email|$)/i);
      if (match) metadata.customerName = match[1].trim();
    }
    if (line.includes('Mobile Number')) {
      const match = line.match(/Mobile Number:?\s*([0-9\s+]+)/i);
      if (match) metadata.phoneNumber = match[1].trim();
    }
    if (line.includes('Statement Period')) {
      const match = line.match(/Statement Period:?\s*([0-9A-Za-z\s-]+?)(?:\s{3,}|Request|Approved|$)/i);
      if (match) metadata.statementPeriod = match[1].trim();
    }
    if (line.match(/^TOTAL:\s*([0-9,]+\.\d{2})\s+([0-9,]+\.\d{2})/i)) {
      const match = line.match(/^TOTAL:\s*([0-9,]+\.\d{2})\s+([0-9,]+\.\d{2})/i);
      if (match) {
        metadata.reportedTotalIn = parseFloat(match[1].replace(/,/g, ''));
        metadata.reportedTotalOut = parseFloat(match[2].replace(/,/g, ''));
      }
    }
  }

  // Regex matching Safaricom receipt code and datetime on the first line of each row
  const receiptRegex = /^\s*([A-Z0-9]{8,14})\s+(\d{4}[/-]\d{2}[/-]\d{2}\s+\d{2}:\d{2}(?::\d{2})?|\d{2}[/-]\d{2}[/-]\d{4}\s+\d{2}:\d{2}(?::\d{2})?)/i;

  const transactions: Transaction[] = [];

  interface PendingTx {
    receiptNo: string;
    dateTimeStr: string;
    type: TransactionType;
    amount: number;
    balance: number;
    lines: string[];
  }

  let currentTx: PendingTx | null = null;

  function flushPendingTx(tx: PendingTx | null) {
    if (!tx) return;
    const fullDetails = tx.lines.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    if (!fullDetails && tx.amount <= 0) return;

    const dateTime = parseDate(tx.dateTimeStr);
    const dayOfWeek = dateTime.getDay();
    const hour = dateTime.getHours();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || (dayOfWeek === 5 && hour >= 17);
    const isNight = hour >= 20 || hour <= 5;

    const catResult = categorizeTransaction(fullDetails, tx.type, tx.amount);

    transactions.push({
      id: `tx-${tx.receiptNo}-${transactions.length + 1}`,
      receiptNo: tx.receiptNo,
      dateTime,
      details: fullDetails || 'M-Pesa Transaction',
      rawDetails: fullDetails,
      type: tx.type,
      category: catResult.category,
      budgetBucket: catResult.budgetBucket,
      counterparty: catResult.counterparty,
      amount: tx.amount,
      balance: tx.balance,
      isWeekend,
      isNight,
    });
  }

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim();
    const match = line.match(receiptRegex);

    if (match) {
      // Flush previous transaction
      flushPendingTx(currentTx);

      const receiptNo = match[1];
      const dateTimeStr = match[2];
      const rest = line.substring(match[0].length).trim();

      // On this first line of the row, Safaricom places:
      // [Details Part 1] + [Completed/Failed/Reversed] + [Paid In or Withdrawn Amount] + [Balance]
      const amtMatch = rest.match(/(?:Completed|Failed|Reversed)?\s*([+-]?[0-9,]+\.\d{2}|[+-]?[0-9,]+)\s+([+-]?[0-9,]+\.\d{2}|[+-]?[0-9,]+)\s*$/i);

      let amount = 0;
      let balance = 0;
      let isOut = true;
      let firstLineDetails = rest;

      if (amtMatch) {
        const rawAmt = amtMatch[1];
        const rawBal = amtMatch[2];
        isOut = rawAmt.startsWith('-');
        amount = Math.abs(parseFloat(rawAmt.replace(/,/g, '')));
        balance = parseFloat(rawBal.replace(/,/g, ''));

        // Strip the status and amounts from the details text
        firstLineDetails = rest
          .replace(/(?:Completed|Failed|Reversed)?\s*([+-]?[0-9,]+\.\d{2}|[+-]?[0-9,]+)\s+([+-]?[0-9,]+\.\d{2}|[+-]?[0-9,]+)\s*$/i, '')
          .trim();
      }

      currentTx = {
        receiptNo,
        dateTimeStr,
        type: isOut ? 'OUT' : 'IN',
        amount,
        balance,
        lines: [firstLineDetails],
      };
    } else if (currentTx) {
      // Subsequent line of the multi-line details cell
      if (!isNoiseLine(line)) {
        currentTx.lines.push(line);
      }
    }
  }

  // Flush final transaction
  flushPendingTx(currentTx);

  return { transactions, metadata };
}

/**
 * Parse an Excel (.xlsx / .xls) statement
 */
export async function parseMpesaExcel(fileBuffer: ArrayBuffer): Promise<ParseResult> {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const metadata: StatementMetadata = {};
  const transactions: Transaction[] = [];

  let headerRowIndex = -1;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rowStr = row.join(' ').toLowerCase();
    if (rowStr.includes('receipt no') && (rowStr.includes('completion time') || rowStr.includes('details'))) {
      headerRowIndex = r;
      break;
    }
  }

  if (headerRowIndex === -1) {
    headerRowIndex = 0;
  }

  const headers = rows[headerRowIndex].map((h) => String(h).trim().toLowerCase());
  const receiptIdx = headers.findIndex((h) => h.includes('receipt'));
  const timeIdx = headers.findIndex((h) => h.includes('time') || h.includes('date'));
  const detailsIdx = headers.findIndex((h) => h.includes('detail'));
  const paidInIdx = headers.findIndex((h) => h.includes('paid in') || h.includes('in') || h.includes('credit'));
  const withdrawnIdx = headers.findIndex((h) => h.includes('withdrawn') || h.includes('out') || h.includes('debit'));
  const balanceIdx = headers.findIndex((h) => h.includes('balance'));

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const receiptNo = receiptIdx !== -1 && row[receiptIdx] ? String(row[receiptIdx]).trim() : `REC-${r}`;
    if (!receiptNo || receiptNo.toLowerCase().includes('total')) continue;

    const dateTimeStr = timeIdx !== -1 && row[timeIdx] ? String(row[timeIdx]) : '';
    const details = detailsIdx !== -1 && row[detailsIdx] ? String(row[detailsIdx]).trim() : '';

    const paidIn = paidInIdx !== -1 ? parseAmount(row[paidInIdx]) : 0;
    const withdrawn = withdrawnIdx !== -1 ? parseAmount(row[withdrawnIdx]) : 0;
    const balance = balanceIdx !== -1 ? parseAmount(row[balanceIdx]) : 0;

    const type: TransactionType = paidIn > 0 ? 'IN' : 'OUT';
    const amount = type === 'IN' ? paidIn : withdrawn;

    if (amount <= 0) continue;

    const dateTime = parseDate(dateTimeStr);
    const dayOfWeek = dateTime.getDay();
    const hour = dateTime.getHours();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || (dayOfWeek === 5 && hour >= 17);
    const isNight = hour >= 20 || hour <= 5;

    const catResult = categorizeTransaction(details, type, amount);

    transactions.push({
      id: `tx-excel-${r}`,
      receiptNo,
      dateTime,
      details,
      rawDetails: details,
      type,
      category: catResult.category,
      budgetBucket: catResult.budgetBucket,
      counterparty: catResult.counterparty,
      amount,
      balance,
      isWeekend,
      isNight,
    });
  }

  return { transactions, metadata };
}

/**
 * Parse a CSV statement
 */
export async function parseMpesaCsv(fileText: string): Promise<ParseResult> {
  const parsed = Papa.parse(fileText, { skipEmptyLines: true });
  const rows = parsed.data as any[][];
  const arrayBuffer = new TextEncoder().encode(fileText).buffer;
  return parseMpesaExcel(arrayBuffer);
}
