# Kipochi (Pocket / Wallet) 👛

> **A privacy-first, in-browser financial intelligence tool that turns dense Safaricom M-Pesa statements into actionable spending insights, habit audits, and cash flow intelligence.**

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](https://opensource.org/licenses/MIT)
[![Privacy: 100% Client-Side](https://img.shields.io/badge/Privacy-100%25%20Client--Side-green.svg)](#privacy--security)

---

## 📖 About Kipochi

**Kipochi** (Swahili for *wallet* or *pouch*) is designed to give you clarity over your mobile money. While official Safaricom statements are 60+ pages of dense tabular rows, Kipochi instantly transforms them into an intuitive financial dashboard—uncovering your largest spends, hidden fee leaks, weekend lifestyle surges, and overall financial health.

**100% Client-Side Privacy:** Your PDF statements and Safaricom passwords never leave your browser. All decryption, table parsing, and analytics execute locally on your machine via Web Workers.

---

## ✨ Features

- **🔐 Encrypted PDF Decryption:** Automatically decrypts Safaricom statements using your SMS passcode (e.g. `3215M`) or National ID.
- **⚡ Dual Searchable Grids:**
  - **Amount Out (Spends):** Ordered by default from **highest to lowest**, searchable by recipient, Till, Paybill, or Receipt No.
  - **Amount In (Income):** High-to-low sorted list of income, deposits, and MMF withdrawals.
- **🔥 Top 20 Highest Spends:** Ranked leaderboard highlighting the major lump-sum outflows shaping your finances.
- **📈 Monthly & Trend Analytics:**
  - **Performance Line Graph:** Interactive toggle between daily Inflow vs Outflow and cumulative wealth retention curve.
  - **Worst & Best Day:** Pinpoints your peak spend day and highest surplus day.
  - **Zero-Spend Frugal Days:** Celebrates days where you spent KES 0.00.
  - **Weekly Rhythm:** Friday-to-Sunday weekend surge vs weekday spending patterns.
- **🕵️ Hidden Leaks & Friction Auditor:**
  - Actual Safaricom withdrawal charges tracked line-by-line.
  - Overdraft & Fuliza facility fee cost tracker.
  - Micro-spending trap: identifies fragmented airtime top-ups ($\le\text{KES } 300$).
- **⚖️ 50 / 30 / 20 Budget Analyzer:** Automatically categorizes outflows into Needs (50%), Wants (30%), and Savings / Debt (20%).
- **❤️ Financial Wellness Score (0–100):** Algorithmic health grade paired with personalized recommendations.

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **UI Framework:** Mantine v7 (`@mantine/core`, `@mantine/hooks`, `@mantine/dropzone`, `@mantine/notifications`)
- **Visualizations:** Recharts & Mantine Charts
- **PDF Engine:** `pdfjs-dist` (local worker bundled with Vite)
- **Data Export:** SheetJS (`xlsx`)

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/your-username/kipochi.git
cd kipochi
npm install
```

### 2. Run Locally
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Build for Production
```bash
npm run build
npm run preview
```
