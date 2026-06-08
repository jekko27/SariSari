import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  Account,
  rpc,
  nativeToScVal,
  scValToNative,
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE, CONTRACT_ID } from './stellar';

const READ_SOURCE = 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';

export enum LoanStatus {
  Requested = 0,
  Active = 1,
  Repaid = 2,
}

export interface Loan {
  id: number;
  borrower: string;
  lender?: string;
  amount: number;
  repaid_amount: number;
  status: LoanStatus;
}

export function contractConfigured(): boolean {
  return Boolean(CONTRACT_ID);
}

/** Read get_loan_count() */
export async function readLoanCount(): Promise<number> {
  const contract = new Contract(CONTRACT_ID);
  const source = new Account(READ_SOURCE, '0');

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('get_loan_count'))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) {
    return 0;
  }

  return Number(scValToNative(sim.result.retval) as number);
}

/** Read get_loan(loan_id) */
export async function readLoan(loan_id: number): Promise<Loan | null> {
  const contract = new Contract(CONTRACT_ID);
  const source = new Account(READ_SOURCE, '0');

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call('get_loan', nativeToScVal(loan_id, { type: 'u32' })))
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim) || !sim.result) {
    return null;
  }

  const res = scValToNative(sim.result.retval);
  if (!res) return null;

  return {
    id: Number(res.id),
    borrower: res.borrower,
    lender: res.lender,
    amount: Number(res.amount),
    repaid_amount: Number(res.repaid_amount),
    status: res.status as LoanStatus,
  };
}

/** Build XDR for request_loan(borrower, amount) */
export async function buildRequestLoanXDR(
  borrower: string,
  amount: number,
): Promise<string> {
  const contract = new Contract(CONTRACT_ID);
  const account = await server.getAccount(borrower);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'request_loan',
        nativeToScVal(borrower, { type: 'address' }),
        nativeToScVal(BigInt(Math.trunc(amount)), { type: 'i128' }),
      ),
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error('Loan request simulation failed.');
  }

  return rpc.assembleTransaction(tx, sim).build().toXDR();
}

/** Build XDR for fund_loan(lender, loan_id) */
export async function buildFundLoanXDR(
  lender: string,
  loan_id: number,
): Promise<string> {
  const contract = new Contract(CONTRACT_ID);
  const account = await server.getAccount(lender);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'fund_loan',
        nativeToScVal(lender, { type: 'address' }),
        nativeToScVal(loan_id, { type: 'u32' }),
      ),
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error('Loan funding simulation failed.');
  }

  return rpc.assembleTransaction(tx, sim).build().toXDR();
}

/** Build XDR for repay_loan(loan_id, amount) */
export async function buildRepayLoanXDR(
  user: string,
  loan_id: number,
  amount: number,
): Promise<string> {
  const contract = new Contract(CONTRACT_ID);
  const account = await server.getAccount(user);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      contract.call(
        'repay_loan',
        nativeToScVal(loan_id, { type: 'u32' }),
        nativeToScVal(BigInt(Math.trunc(amount)), { type: 'i128' }),
      ),
    )
    .setTimeout(30)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!rpc.Api.isSimulationSuccess(sim)) {
    throw new Error('Loan repayment simulation failed.');
  }

  return rpc.assembleTransaction(tx, sim).build().toXDR();
}
