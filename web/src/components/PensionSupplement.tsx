'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  contractConfigured,
  readPensionBalance,
  buildDepositXDR,
  buildWithdrawXDR,
} from '@/lib/contract';
import { submitSignedXDR, pollTransaction } from '@/lib/payment';
import { NETWORK_PASSPHRASE } from '@/lib/stellar';

export default function PensionSupplement({ publicKey }: { publicKey: string | null }) {
  const configured = contractConfigured();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(configured);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!configured || !publicKey) return;
    setLoading(true);
    setError('');
    try {
      setBalance(await readPensionBalance(publicKey));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to read pension balance');
    } finally {
      setLoading(false);
    }
  }, [configured, publicKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDeposit = async () => {
    if (!publicKey) return;
    setBusy(true);
    setMsg('');
    setError('');
    try {
      const xdr = await buildDepositXDR(publicKey, Number(amount));
      const freighter = await import('@stellar/freighter-api');
      const signed = await freighter.signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: publicKey,
      });
      if (signed.error) {
        throw new Error(
          typeof signed.error === 'string' ? signed.error : 'Signing was rejected',
        );
      }
      const hash = await submitSignedXDR(signed.signedTxXdr);
      await pollTransaction(hash);
      setMsg('Deposit successful! Bonus added.');
      setAmount('');
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Deposit failed');
    } finally {
      setBusy(false);
    }
  };

  const handleWithdraw = async () => {
    if (!publicKey) return;
    setBusy(true);
    setMsg('');
    setError('');
    try {
      const xdr = await buildWithdrawXDR(publicKey, Number(amount));
      const freighter = await import('@stellar/freighter-api');
      const signed = await freighter.signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: publicKey,
      });
      if (signed.error) {
        throw new Error(
          typeof signed.error === 'string' ? signed.error : 'Signing was rejected',
        );
      }
      const hash = await submitSignedXDR(signed.signedTxXdr);
      await pollTransaction(hash);
      setMsg('Withdrawal successful!');
      setAmount('');
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Withdrawal failed');
    } finally {
      setBusy(false);
    }
  };

  if (!configured) {
    return (
      <div className="mt-8 rounded-xl border-4 border-dashed border-gray-400 bg-gray-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Pension System Offline</h2>
        <p className="mt-4 text-lg text-gray-600">
          The system is currently being set up. Please wait for the administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border-4 border-blue-900 bg-white p-8 shadow-2xl">
      <h2 className="mb-6 text-3xl font-black text-blue-900 uppercase tracking-tight">
        My Pension Supplement
      </h2>

      {loading && <p className="text-xl text-gray-400 animate-pulse">Checking records...</p>}

      {!publicKey && (
        <div className="rounded-lg bg-yellow-100 p-6 border-2 border-yellow-400">
          <p className="text-xl font-bold text-yellow-800">
            Please connect your wallet at the top to see your pension.
          </p>
        </div>
      )}

      {publicKey && !loading && balance !== null && (
        <>
          <div className="mb-8 rounded-xl bg-blue-50 p-8 border-2 border-blue-200">
            <p className="text-lg font-bold text-blue-700 uppercase mb-2">Total Pension Balance</p>
            <p className="text-6xl font-black text-blue-900">
              {balance.toLocaleString()} <span className="text-2xl">PHP</span>
            </p>
            <p className="mt-4 text-xl text-emerald-700 font-bold bg-emerald-50 inline-block px-4 py-1 rounded-full border border-emerald-200">
              Includes 10% Government Match
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xl font-bold text-gray-700 mb-2">
                Enter Amount
              </label>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border-4 border-gray-300 p-6 text-4xl font-bold text-blue-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleDeposit}
                disabled={busy || !amount}
                className="rounded-xl bg-emerald-600 py-6 text-2xl font-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {busy ? 'Processing...' : 'DEPOSIT'}
              </button>
              <button
                onClick={handleWithdraw}
                disabled={busy || !amount || (balance < Number(amount))}
                className="rounded-xl bg-red-600 py-6 text-2xl font-black text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {busy ? 'Processing...' : 'WITHDRAW'}
              </button>
            </div>
            
            <p className="text-center text-lg font-medium text-gray-500 italic">
              "Saving today for a brighter tomorrow."
            </p>
          </div>
        </>
      )}

      {msg && (
        <div className="mt-6 rounded-lg bg-emerald-100 p-4 border-2 border-emerald-400">
          <p className="text-xl font-bold text-emerald-800">{msg}</p>
        </div>
      )}
      {error && (
        <div className="mt-6 rounded-lg bg-red-100 p-4 border-2 border-red-400">
          <p className="text-xl font-bold text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
