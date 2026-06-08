'use client';
import { useState, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import ConnectWallet from '@/components/ConnectWallet';
import FundAccount from '@/components/FundAccount';
import AddTrustline from '@/components/AddTrustline';
import BalanceCard from '@/components/BalanceCard';
import InventoryFinance from '@/components/InventoryFinance';

export default function Home() {
  const wallet = useWallet();
  const { publicKey, connecting } = wallet;
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <main className="min-h-screen w-full bg-emerald-50">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-12 flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-black text-emerald-900 tracking-tight">
              Sari-Sari Finance
            </h1>
            <p className="mt-2 text-2xl font-medium text-emerald-700">
              Community capital for your neighborhood store.
            </p>
          </div>
          <div className="scale-125">
            <ConnectWallet {...wallet} />
          </div>
        </header>

        {!publicKey && !connecting && (
          <div className="rounded-3xl border-4 border-emerald-200 bg-white py-20 text-center shadow-xl">
            <p className="mb-6 text-3xl font-bold text-gray-700">
              Grow your store today.
            </p>
            <p className="text-xl text-gray-500">
              Connect your wallet to request or fund inventory.
            </p>
          </div>
        )}

        {publicKey && (
          <>
            <BalanceCard publicKey={publicKey} refreshKey={refreshKey} />
            
            <div className="mt-8">
              <InventoryFinance publicKey={publicKey} />
            </div>

            <button
              onClick={refresh}
              className="mt-8 w-full text-xl font-bold text-emerald-600 underline hover:text-emerald-800"
            >
              Refresh Balance
            </button>
          </>
        )}

        <footer className="mt-20 border-t-4 border-emerald-100 pt-10 text-center">
          <p className="text-xl font-bold text-emerald-300">
            Powered by Stellar • Financial Inclusion for All
          </p>
        </footer>
      </div>
    </main>
  );
}
