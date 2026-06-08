#![no_std]
use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, Symbol, symbol_short};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum LoanStatus {
    Requested = 0,
    Active = 1,
    Repaid = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Loan {
    pub id: u32,
    pub borrower: Address,
    pub lender: Option<Address>,
    pub amount: i128,
    pub repaid_amount: i128,
    pub status: LoanStatus,
}

#[contracttype]
pub enum DataKey {
    Loan(u32),
    LoanCount,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    InvalidAmount = 2,
    LoanNotFound = 3,
    NotRequested = 4,
    NotActive = 5,
}

#[contract]
pub struct InventoryFinanceContract;

#[contractimpl]
impl InventoryFinanceContract {
    /// Request a new loan for inventory.
    pub fn request_loan(env: Env, borrower: Address, amount: i128) -> Result<u32, Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let mut count: u32 = env.storage().instance().get(&DataKey::LoanCount).unwrap_or(0);
        count += 1;

        let loan = Loan {
            id: count,
            borrower,
            lender: None,
            amount,
            repaid_amount: 0,
            status: LoanStatus::Requested,
        };

        env.storage().instance().set(&DataKey::Loan(count), &loan);
        env.storage().instance().set(&DataKey::LoanCount, &count);
        
        // Extend TTL to keep the data alive on-chain
        env.storage().instance().extend_ttl(1000, 5000);

        Ok(count)
    }

    /// Fund a requested loan.
    pub fn fund_loan(env: Env, lender: Address, loan_id: u32) -> Result<(), Error> {
        let key = DataKey::Loan(loan_id);
        let mut loan: Loan = env.storage().instance().get(&key).ok_or(Error::LoanNotFound)?;

        if loan.status != LoanStatus::Requested {
            return Err(Error::NotRequested);
        }

        loan.lender = Some(lender);
        loan.status = LoanStatus::Active;

        env.storage().instance().set(&key, &loan);
        Ok(())
    }

    /// Repay part or all of an active loan.
    pub fn repay_loan(env: Env, loan_id: u32, amount: i128) -> Result<i128, Error> {
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let key = DataKey::Loan(loan_id);
        let mut loan: Loan = env.storage().instance().get(&key).ok_or(Error::LoanNotFound)?;

        if loan.status != LoanStatus::Active {
            return Err(Error::NotActive);
        }

        loan.repaid_amount += amount;

        if loan.repaid_amount >= loan.amount {
            loan.status = LoanStatus::Repaid;
        }

        env.storage().instance().set(&key, &loan);
        Ok(loan.repaid_amount)
    }

    /// Get details of a specific loan.
    pub fn get_loan(env: Env, loan_id: u32) -> Option<Loan> {
        env.storage().instance().get(&DataKey::Loan(loan_id))
    }

    /// Get total number of loans created.
    pub fn get_loan_count(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::LoanCount).unwrap_or(0)
    }
}

mod test;
