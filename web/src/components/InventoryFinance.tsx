'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  contractConfigured,
  readLoanCount,
  readLoan,
  buildRequestLoanXDR,
  buildFundLoanXDR,
  buildRepayLoanXDR,
  Loan,
  LoanStatus,
} from '@/lib/contract';
import { submitSignedXDR, pollTransaction } from '@/lib/payment';
import { NETWORK_PASSPHRASE } from '@/lib/stellar';

export default function InventoryFinance({ publicKey }: { publicKey: string | null }) {
  const configured = contractConfigured();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(configured);
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState<'borrower' | 'lender'>('borrower');

  const refresh = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    setError('');
    try {
      const count = await readLoanCount();
      const allLoans: Loan[] = [];
      for (let i = 1; i <= count; i++) {
        const loan = await readLoan(i);
        if (loan) allLoans.push(loan);
      }
      setLoans(allLoans.reverse()); // Newest first
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to read loans');
    } finally {
      setLoading(false);
    }
  }, [configured]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRequest = async () => {
    if (!publicKey) return;
    setBusy(true);
    setMsg('');
    setError('');
    try {
      const xdr = await buildRequestLoanXDR(publicKey, Number(amount));
      const freighter = await import('@stellar/freighter-api');
      const signed = await freighter.signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: publicKey,
      });
      if (signed.error) throw new Error('Signing failed');
      const hash = await submitSignedXDR(signed.signedTxXdr);
      await pollTransaction(hash);
      setMsg('Loan request submitted successfully!');
      setAmount('');
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusy(false);
    }
  };

  const handleFund = async (loanId: number) => {
    if (!publicKey) return;
    setBusy(true);
    setMsg('');
    setError('');
    try {
      const xdr = await buildFundLoanXDR(publicKey, loanId);
      const freighter = await import('@stellar/freighter-api');
      const signed = await freighter.signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: publicKey,
      });
      if (signed.error) throw new Error('Signing failed');
      const hash = await submitSignedXDR(signed.signedTxXdr);
      await pollTransaction(hash);
      setMsg('Loan funded! Credits sent to store owner.');
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Funding failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRepay = async (loanId: number, repayAmount: number) => {
    if (!publicKey) return;
    setBusy(true);
    setMsg('');
    setError('');
    try {
      const xdr = await buildRepayLoanXDR(publicKey, loanId, repayAmount);
      const freighter = await import('@stellar/freighter-api');
      const signed = await freighter.signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: publicKey,
      });
      if (signed.error) throw new Error('Signing failed');
      const hash = await submitSignedXDR(signed.signedTxXdr);
      await pollTransaction(hash);
      setMsg('Repayment successful!');
      await refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Repayment failed');
    } finally {
      setBusy(false);
    }
  };

  if (!configured) {
    return (
      <div className="mt-8 rounded-xl border-4 border-dashed border-gray-400 bg-gray-50 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">Inventory Finance Offline</h2>
        <p className="mt-4 text-lg text-gray-600">Deploy the contract to enable community lending.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border-4 border-emerald-900 bg-white p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-black text-emerald-900 uppercase tracking-tight">
          Sari-Sari Inventory Finance
        </h2>
        <div className="flex gap-2 bg-emerald-50 p-1 rounded-xl border-2 border-emerald-200">
          <button
            onClick={() => setRole('borrower')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              role === 'borrower' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Store Owner
          </button>
          <button
            onClick={() => setRole('lender')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              role === 'lender' ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Lender
          </button>
        </div>
      </div>

      {loading && <p className="text-xl text-gray-400 animate-pulse">Loading community data...</p>}

      {publicKey && !loading && (
        <div className="space-y-8">
          {role === 'borrower' && (
            <div className="rounded-xl bg-emerald-50 p-6 border-2 border-emerald-200">
              <h3 className="text-xl font-bold text-emerald-900 mb-4">Request Bulk Inventory Loan</h3>
              <div className="flex gap-4">
                <input
                  type="number"
                  placeholder="Amount (e.g. 5000)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 rounded-lg border-2 border-emerald-300 p-4 text-2xl font-bold focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={handleRequest}
                  disabled={busy || !amount}
                  className="bg-emerald-600 text-white px-8 py-4 rounded-lg font-black text-xl shadow-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy ? '...' : 'REQUEST'}
                </button>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-xl font-bold text-gray-700 mb-4">
              {role === 'borrower' ? 'My Active Loans' : 'Available Funding Opportunities'}
            </h3>
            <div className="space-y-4">
              {loans
                .filter((l) => (role === 'borrower' ? l.borrower === publicKey : l.status === LoanStatus.Requested))
                .map((loan) => (
                  <div key={loan.id} className="border-2 border-gray-200 rounded-xl p-6 hover:border-emerald-300 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm font-bold text-gray-400">LOAN #{loan.id}</p>
                        <p className="text-3xl font-black text-emerald-900">{loan.amount.toLocaleString()} Credits</p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-black uppercase ${
                          loan.status === LoanStatus.Requested
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                            : loan.status === LoanStatus.Active
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                            : 'bg-gray-100 text-gray-700 border border-gray-300'
                        }`}
                      >
                        {LoanStatus[loan.status]}
                      </div>
                    </div>

                    <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden mb-4">
                      <div
                        className="bg-emerald-500 h-full transition-all"
                        style={{ width: `${(loan.repaid_amount / loan.amount) * 100}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <p className="text-gray-600 font-medium">
                        Repaid: <span className="font-bold text-emerald-700">{loan.repaid_amount.toLocaleString()}</span> / {loan.amount.toLocaleString()}
                      </p>
                      {role === 'lender' && loan.status === LoanStatus.Requested && (
                        <button
                          onClick={() => handleFund(loan.id)}
                          disabled={busy}
                          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow hover:bg-emerald-700 disabled:opacity-50"
                        >
                          FUND STORE
                        </button>
                      )}
                      {role === 'borrower' && loan.status === LoanStatus.Active && (
                        <div className="flex gap-2">
                           <button
                            onClick={() => handleRepay(loan.id, 500)}
                            disabled={busy}
                            className="bg-emerald-100 text-emerald-700 border border-emerald-300 px-4 py-2 rounded-lg font-bold hover:bg-emerald-200"
                          >
                            REPAY 500
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              {loans.length === 0 && (
                <p className="text-center py-8 text-gray-400 italic">No loans found in the community.</p>
              )}
            </div>
          </div>
        </div>
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
