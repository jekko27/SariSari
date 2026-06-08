Sari-Sari Finance

  Community-driven micro-inventory financing for sari-sari stores using Soroban smart contracts.

  Problem
  Sari-sari store owners in the Philippines often operate on thin daily margins. When wholesalers offer bulk
  discounts, store owners lack the upfront capital to take advantage of them, forcing them to buy "tingi"
  (individual units) at higher prices. This creates a cycle where the smallest businesses pay the highest prices for  inventory. Sari-Sari Finance solves this by providing instant, short-term liquidity through community lending.

  How It Works
   1. Store Owners post a loan request (e.g., 5,000 credits) specifically for bulk inventory purchases.
   2. Community Lenders (neighbors or local investors) browse the marketplace and fund requests they want to
      support.
   3. The Smart Contract locks the agreement and manages the state of the loan on-chain.
   4. Store Owners make daily micro-repayments from their sales. A visual progress bar tracks their path to full
      repayment.

  How It Uses Stellar
   - Soroban Smart Contracts: All loan logic, status tracking, and repayment accounting are handled by a custom Rust     contract.
   - Atomic Transactions: Ensures that funding and state changes happen simultaneously, preventing "double-funding"
     or state mismatches.
   - Fast Finality & Low Fees: Critical for the Philippines market where micro-repayments (e.g., 50 PHP) would be
     eaten up by fees on other blockchains like Ethereum. Stellar allows for high-frequency, low-value transactions
     that mirror real-world sari-sari sales.

  Track
  Track 2: Financial Inclusion & Everyday Payments

  Tech Stack
   - Framework: Next.js 15 (TypeScript) + Tailwind CSS
   - Stellar SDK: @stellar/stellar-sdk v12.1.0
   - Contract Language: Rust (Soroban SDK v22.0.11)
   - Wallet: Freighter Browser Extension

  Setup & Run
  To run this project locally, follow these steps:

    1 # 1. Clone the repository
    2 git clone [your-repo-link]
    3 cd StellarX-Workshop-PUP-May-2026-main
    4
    5 # 2. Setup the Rust Toolchain (if deploying contract)
    6 rustup target add wasm32v1-none
    7
    8 # 3. Setup Frontend
    9 cd web
   10 npm install
   11
   12 # 4. Environment Variables
   13 # Create a .env.local file in the /web directory with:
   14 NEXT_PUBLIC_CONTRACT_ID=CCHFOOJNORENPPZ4UVGVR3L5UGOQFZQXGJWPGPBIS3KCYL4HT3X2RKEJ
   15
   16 # 5. Run the dev server
   17 npm run dev

  Network Details
   - Network: Stellar Testnet
   - RPC URL: https://soroban-testnet.stellar.org
   - Contract ID: CCHFOOJNORENPPZ4UVGVR3L5UGOQFZQXGJWPGPBIS3KCYL4HT3X2RKEJ
   - Network Passphrase: Test SDF Network ; September 2015

  Team
   - Jekko Asong — @jekko27

  License
  MIT
