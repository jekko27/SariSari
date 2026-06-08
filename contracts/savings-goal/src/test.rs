#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

fn setup(env: &Env) -> (InventoryFinanceContractClient, Address, Address) {
    let contract_id = env.register_contract(None, InventoryFinanceContract);
    let client = InventoryFinanceContractClient::new(env, &contract_id);
    
    let borrower = Address::generate(env);
    let lender = Address::generate(env);
    
    (client, borrower, lender)
}

#[test]
fn test_loan_lifecycle() {
    let env = Env::default();
    let (client, borrower, lender) = setup(&env);

    // 1. Request Loan
    let loan_id = client.request_loan(&borrower, &1000);
    assert_eq!(loan_id, 1);
    assert_eq!(client.get_loan_count(), 1);

    let loan = client.get_loan(&loan_id).unwrap();
    assert_eq!(loan.amount, 1000);
    assert_eq!(loan.status, LoanStatus::Requested);
    assert_eq!(loan.borrower, borrower);
    assert_eq!(loan.lender, None);

    // 2. Fund Loan
    client.fund_loan(&lender, &loan_id);
    let loan = client.get_loan(&loan_id).unwrap();
    assert_eq!(loan.status, LoanStatus::Active);
    assert_eq!(loan.lender, Some(lender));

    // 3. Partial Repayment
    let repaid = client.repay_loan(&loan_id, &400);
    assert_eq!(repaid, 400);
    let loan = client.get_loan(&loan_id).unwrap();
    assert_eq!(loan.repaid_amount, 400);
    assert_eq!(loan.status, LoanStatus::Active);

    // 4. Final Repayment
    client.repay_loan(&loan_id, &600);
    let loan = client.get_loan(&loan_id).unwrap();
    assert_eq!(loan.repaid_amount, 1000);
    assert_eq!(loan.status, LoanStatus::Repaid);
}

#[test]
#[should_panic(expected = "HostError: Error(Contract, #2)")]
fn test_invalid_amount() {
    let env = Env::default();
    let (client, borrower, _) = setup(&env);
    client.request_loan(&borrower, &-100);
}

#[test]
#[should_panic(expected = "HostError: Error(Contract, #4)")]
fn test_fund_already_active() {
    let env = Env::default();
    let (client, borrower, lender) = setup(&env);
    let loan_id = client.request_loan(&borrower, &1000);
    client.fund_loan(&lender, &loan_id);
    client.fund_loan(&lender, &loan_id); // Should fail
}
