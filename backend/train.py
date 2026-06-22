# train.py
# Trains a credit scoring machine learning classifier on the Kaggle Loan Approval dataset.
# Evaluates classification metrics and outlines the decision boundary comparison between the ML model and rule-based system.

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import preprocess

def main():
    csv_filename = "loan_approval_dataset.csv"
    if not os.path.exists(csv_filename) and os.path.exists(os.path.join("..", csv_filename)):
        csv_filename = os.path.join("..", csv_filename)
        
    if not os.path.exists(csv_filename):
        print("Dataset CSV not found. Running preprocessor to generate synthetic dataset...")
        preprocess.main()
        
    # Read the dataset
    print(f"Loading data for modeling from {csv_filename}...")
    df = pd.read_csv(csv_filename)
    
    # Strip whitespace from headers and string columns
    df.columns = [col.strip() for col in df.columns]
    for col in df.select_dtypes(include='object').columns:
        df[col] = df[col].str.strip()
        
    # Feature Engineering
    print("Performing feature engineering for machine learning...")
    # Calculate Loan-to-Asset Ratios (LTV estimate)
    df['ltv_ratio'] = df['loan_amount'] / np.maximum(1, df['residential_assets_value'])
    # Total Assets to Loan Ratio
    df['total_assets'] = df['residential_assets_value'] + df['commercial_assets_value'] + df['luxury_assets_value'] + df['bank_asset_value']
    df['assets_to_loan'] = df['total_assets'] / np.maximum(1, df['loan_amount'])
    
    # Encode categorical columns
    df['is_graduate'] = df['education'].apply(lambda x: 1 if x == 'Graduate' else 0)
    df['is_self_employed'] = df['self_employed'].apply(lambda x: 1 if x == 'Yes' else 0)
    
    # Target variable: Mapped to binary integer (Approved = 1, Rejected = 0)
    df['target'] = df['loan_status'].apply(lambda x: 1 if x == 'Approved' else 0)
    
    # Feature matrix X and target vector y
    feature_cols = [
        'cibil_score', 'income_annum', 'loan_amount', 'loan_term', 
        'ltv_ratio', 'assets_to_loan', 'is_graduate', 'is_self_employed'
    ]
    
    X = df[feature_cols]
    y = df['target']
    
    print(f"Features list: {feature_cols}")
    print(f"Total dataset size: {X.shape}")
    
    # Split train and test
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)
    print(f"Training subset size: {X_train.shape}")
    print(f"Testing subset size: {X_test.shape}")
    
    # Train Random Forest Classifier
    print("Training Random Forest Classifier model...")
    clf = RandomForestClassifier(n_estimators=100, max_depth=8, random_state=42)
    clf.fit(X_train, y_train)
    
    # Evaluation
    y_pred = clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print("\n" + "="*50)
    print("MODEL PERFORMANCE REPORT")
    print("="*50)
    print(f"Model Accuracy: {accuracy*100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Rejected', 'Approved']))
    
    print("Confusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"True Negative (Actual Rejected, Predicted Rejected): {cm[0][0]}")
    print(f"False Positive (Actual Rejected, Predicted Approved): {cm[0][1]}")
    print(f"False Negative (Actual Approved, Predicted Rejected): {cm[1][0]}")
    print(f"True Positive (Actual Approved, Predicted Approved): {cm[1][1]}")
    print("="*50)
    
    # Feature Importances
    importances = clf.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    print("\nFEATURE IMPORTANCES:")
    for f in range(X.shape[1]):
        print(f"{f+1}. {feature_cols[indices[f]]}: {importances[indices[f]]*100:.2f}%")
    print("="*50)

if __name__ == '__main__':
    main()
