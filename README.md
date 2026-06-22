# CrediCheck: Credit Risk Decision Support System

CrediCheck is a decision support system (DSS) built to evaluate banking loan applications in real-time. It leverages custom underwriting rules (Debt-to-Income and Loan-to-Value ratio limits) alongside a Machine Learning Random Forest risk classifier trained on historical credit records to assess risk profiles and output actionable recommendations (Approve, Manual Review, or Deny).

---

## 🚀 Features

*   **Interactive Analyst Sandbox**: Adjust underwriting parameters (Max DTI, Max LTV, Credit Score ranges) dynamically using sliders and see immediate impacts on approval rates.
*   **Real-time Analytics Charts**: Visual mapping of risk boundaries (DTI vs LTV scatter plots) and portfolio distribution metrics rendered using Chart.js.
*   **Searchable Applicant Queue**: Search, sort, and filter candidate profiles instantly.
*   **Machine Learning Model Insights**: Evaluates features (`cibil_score`, `income_annum`, `loan_amount`, etc.) and trains a Random Forest Classifier to score risk with a stratified accuracy of **98.41%**.

---

## 📁 Repository Structure

```text
├── index.html                  # Main interactive banking dashboard UI
├── app.js                      # Underwriting decision logic and chart integrations
├── style.css                   # Professional glassmorphism styling
├── sample_data.js              # Mock database profiles for demonstration
├── vercel.json                 # Deploy configuration for Vercel
├── .gitignore                  # Git tracking exclusions
├── processed_applicants.json   # Exported applicant data from python pipeline
├── loan_approval_dataset.csv   # Reference dataset
└── backend/
    ├── requirements.txt        # Python backend library dependencies
    ├── preprocess.py           # Kaggle dataset cleaner & feature engineer
    ├── train.py                # Random Forest ML model trainer
    └── eda_notebook.ipynb      # Jupyter notebook for exploratory data analysis
```

---

## 💻 Getting Started

### 1. Run the Web Dashboard Locally
Start a local HTTP server in the project directory:
```bash
python -m http.server 8000
```
Open your browser and navigate to: **http://localhost:8000**

### 2. Preprocess the Data & Train the ML Model
Install the required packages and run the scripts:
```bash
pip install -r backend/requirements.txt
python backend/preprocess.py
python backend/train.py
```
*   `preprocess.py` cleans headers and generates `processed_applicants.json`.
*   `train.py` trains the Random Forest model and prints the model evaluation report.
