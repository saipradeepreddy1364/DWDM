# preprocess.py
# Preprocessing script to clean and map Kaggle's Loan Approval Prediction Dataset to CrediCheck variables.
# Direct link to dataset: https://www.kaggle.com/datasets/architvarshney/loan-approval-prediction-dataset

import os
import pandas as pd
import numpy as np
import json

def generate_mock_kaggle_data():
    """Generates synthetic data matching the Kaggle dataset schema if the user hasn't downloaded it yet."""
    print("Kaggle 'loan_approval_dataset.csv' not found. Generating a mock dataset for training demonstration...")
    np.random.seed(42)
    n_samples = 1000
    
    cibil_scores = np.random.randint(300, 900, n_samples)
    income_annum = np.random.randint(200000, 9900000, n_samples)
    
    # Loan amount is typically correlated with income
    loan_amount = (income_annum * np.random.uniform(0.1, 0.6, n_samples)).astype(int)
    
    # Asset values
    res_assets = (income_annum * np.random.uniform(0.5, 3.0, n_samples)).astype(int)
    com_assets = (income_annum * np.random.uniform(0.2, 1.5, n_samples)).astype(int)
    lux_assets = (income_annum * np.random.uniform(0.5, 2.5, n_samples)).astype(int)
    bank_assets = (income_annum * np.random.uniform(0.1, 1.0, n_samples)).astype(int)
    
    # Decisions are mostly driven by CIBIL and asset ratios
    loan_status = []
    for i in range(n_samples):
        # Approximate boundary
        ltv = loan_amount[i] / max(1, res_assets[i])
        if cibil_scores[i] < 550:
            status = " Rejected"
        elif ltv > 0.90 and cibil_scores[i] < 680:
            status = " Rejected"
        else:
            status = " Approved"
        loan_status.append(status)
        
    df = pd.DataFrame({
        'loan_id': range(1, n_samples + 1),
        ' no_of_dependents': np.random.randint(0, 6, n_samples),
        ' education': np.random.choice([' Graduate', ' Not Graduate'], n_samples),
        ' self_employed': np.random.choice([' Yes', ' No'], n_samples),
        ' income_annum': income_annum,
        ' loan_amount': loan_amount,
        ' loan_term': np.random.choice([2, 4, 6, 8, 10, 12, 14, 16, 18, 20], n_samples),
        ' cibil_score': cibil_scores,
        ' residential_assets_value': res_assets,
        ' commercial_assets_value': com_assets,
        ' luxury_assets_value': lux_assets,
        ' bank_asset_value': bank_assets,
        ' loan_status': loan_status
    })
    
    df.to_csv("loan_approval_dataset.csv", index=False)
    print("Created mock file 'loan_approval_dataset.csv' successfully.")

def main():
    # Look for the dataset in current and parent directory
    csv_filename = "loan_approval_dataset.csv"
    if not os.path.exists(csv_filename) and os.path.exists(os.path.join("..", csv_filename)):
        csv_filename = os.path.join("..", csv_filename)
        
    if not os.path.exists(csv_filename):
        generate_mock_kaggle_data()
        
    print(f"Loading raw dataset from {csv_filename}...")
    df = pd.read_csv(csv_filename)
    
    # Clean whitespace in column headers (the raw Kaggle dataset has leading spaces in column names!)
    df.columns = [col.strip() for col in df.columns]
    for col in df.select_dtypes(include='object').columns:
        df[col] = df[col].str.strip()
        
    print(f"Dataset columns detected: {list(df.columns)}")
    print(f"Total records loaded: {len(df)}")
    
    # DERIVING CrediCheck DSS PARAMETERS
    print("Performing feature engineering for CrediCheck dashboard...")
    
    # 1. Monthly income
    df['monthly_income'] = (df['income_annum'] / 12).round(2)
    
    # 2. Existing Debts: Estimate realistic debts using income and credit score correlations
    # Higher credit scores typically correlate with lower debt burdens relative to income.
    np.random.seed(42)
    debt_factor = 0.20 + 0.35 * (1.0 - (df['cibil_score'] - 300) / 600.0) + np.random.uniform(-0.08, 0.08, len(df))
    debt_factor = np.clip(debt_factor, 0.05, 0.75) # bounds between 5% and 75% DTI
    df['existing_debts'] = (df['monthly_income'] * debt_factor).round(2)
    
    # 3. Property value: residential assets is the direct property collateral representation
    df['property_value'] = df['residential_assets_value']
    
    # Let's map key fields into an easy-to-use JSON export
    export_df = pd.DataFrame({
        'id': df['loan_id'].apply(lambda x: f"APP-{x:03d}"),
        'name': df['loan_id'].apply(lambda x: f"Applicant {x}"),
        'monthlyIncome': df['monthly_income'],
        'existingDebts': df['existing_debts'],
        'loanAmount': df['loan_amount'],
        'propertyValue': df['property_value'],
        'creditScore': df['cibil_score'],
        'education': df['education'],
        'selfEmployed': df['self_employed']
    })
    
    # Export a slice of 200 records to load in frontend dynamically if needed
    json_path = "processed_applicants.json"
    export_df.head(200).to_json(json_path, orient='records', indent=2)
    print(f"Preprocessed data exported successfully to '{json_path}'.")
    
if __name__ == '__main__':
    main()
