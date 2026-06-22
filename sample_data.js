// sample_data.js
// Realistic pre-populated mock dataset representing loan applicants for the DSS CrediCheck dashboard
// These values mirror distributions typically found in the Kaggle Loan Approval dataset.

const sampleApplicants = [
  {
    id: "APP-001",
    name: "Alex Mercer",
    monthlyIncome: 8500,
    existingDebts: 2900,
    loanAmount: 180000,
    propertyValue: 260000,
    creditScore: 745,
    gender: "Male",
    education: "Graduate",
    selfEmployed: "No"
  },
  {
    id: "APP-002",
    name: "Sarah Jenkins",
    monthlyIncome: 12000,
    existingDebts: 3600,
    loanAmount: 320000,
    propertyValue: 450000,
    creditScore: 680,
    gender: "Female",
    education: "Graduate",
    selfEmployed: "Yes"
  },
  {
    id: "APP-003",
    name: "Michael Chang",
    monthlyIncome: 4500,
    existingDebts: 2400,
    loanAmount: 150000,
    propertyValue: 190000,
    creditScore: 580,
    gender: "Male",
    education: "Not Graduate",
    selfEmployed: "No"
  },
  {
    id: "APP-004",
    name: "Emily Rodriguez",
    monthlyIncome: 9500,
    existingDebts: 4100,
    loanAmount: 280000,
    propertyValue: 330000,
    creditScore: 710,
    gender: "Female",
    education: "Graduate",
    selfEmployed: "No"
  },
  {
    id: "APP-005",
    name: "David Vance",
    monthlyIncome: 6200,
    existingDebts: 1800,
    loanAmount: 120000,
    propertyValue: 210000,
    creditScore: 810,
    gender: "Male",
    education: "Graduate",
    selfEmployed: "No"
  },
  {
    id: "APP-006",
    name: "Jessica Taylor",
    monthlyIncome: 15000,
    existingDebts: 7200,
    loanAmount: 480000,
    propertyValue: 550000,
    creditScore: 640,
    gender: "Female",
    education: "Graduate",
    selfEmployed: "Yes"
  },
  {
    id: "APP-007",
    name: "Robert Downey",
    monthlyIncome: 3800,
    existingDebts: 2100,
    loanAmount: 90000,
    propertyValue: 110000,
    creditScore: 590,
    gender: "Male",
    education: "Not Graduate",
    selfEmployed: "No"
  },
  {
    id: "APP-008",
    name: "Amanda Ross",
    monthlyIncome: 11200,
    existingDebts: 3100,
    loanAmount: 220000,
    propertyValue: 380000,
    creditScore: 790,
    gender: "Female",
    education: "Graduate",
    selfEmployed: "No"
  },
  {
    id: "APP-009",
    name: "Daniel Kim",
    monthlyIncome: 7000,
    existingDebts: 3200,
    loanAmount: 240000,
    propertyValue: 280000,
    creditScore: 675,
    gender: "Male",
    education: "Graduate",
    selfEmployed: "No"
  },
  {
    id: "APP-010",
    name: "Rachel Green",
    monthlyIncome: 8000,
    existingDebts: 4500,
    loanAmount: 290000,
    propertyValue: 310000,
    creditScore: 550,
    gender: "Female",
    education: "Graduate",
    selfEmployed: "No"
  },
  {
    id: "APP-011",
    name: "James Watson",
    monthlyIncome: 14200,
    existingDebts: 4800,
    loanAmount: 390000,
    propertyValue: 600000,
    creditScore: 730,
    gender: "Male",
    education: "Graduate",
    selfEmployed: "No"
  },
  {
    id: "APP-012",
    name: "Lisa Kudrow",
    monthlyIncome: 5300,
    existingDebts: 1500,
    loanAmount: 180000,
    propertyValue: 200000,
    creditScore: 620,
    gender: "Female",
    education: "Not Graduate",
    selfEmployed: "No"
  },
  {
    id: "APP-013",
    name: "Thomas Shelby",
    monthlyIncome: 20000,
    existingDebts: 5000,
    loanAmount: 600000,
    propertyValue: 900000,
    creditScore: 820,
    gender: "Male",
    education: "Graduate",
    selfEmployed: "Yes"
  },
  {
    id: "APP-014",
    name: "Elena Rostova",
    monthlyIncome: 9000,
    existingDebts: 3900,
    loanAmount: 250000,
    propertyValue: 320000,
    creditScore: 690,
    gender: "Female",
    education: "Graduate",
    selfEmployed: "No"
  },
  {
    id: "APP-015",
    name: "Marcus Aurelius",
    monthlyIncome: 6500,
    existingDebts: 3400,
    loanAmount: 190000,
    propertyValue: 210000,
    creditScore: 605,
    gender: "Male",
    education: "Graduate",
    selfEmployed: "No"
  },
  {
    id: "APP-016",
    name: "Emma Watson",
    monthlyIncome: 10500,
    existingDebts: 2500,
    loanAmount: 420000,
    propertyValue: 500000,
    creditScore: 760,
    gender: "Female",
    education: "Graduate",
    selfEmployed: "No"
  },
  {
    id: "APP-017",
    name: "Bruce Wayne",
    monthlyIncome: 45000,
    existingDebts: 5000,
    loanAmount: 1500000,
    propertyValue: 3500000,
    creditScore: 850,
    gender: "Male",
    education: "Graduate",
    selfEmployed: "Yes"
  },
  {
    id: "APP-018",
    name: "Peter Parker",
    monthlyIncome: 3200,
    existingDebts: 1800,
    loanAmount: 110000,
    propertyValue: 120000,
    creditScore: 610,
    gender: "Male",
    education: "Not Graduate",
    selfEmployed: "Yes"
  },
  {
    id: "APP-019",
    name: "Diana Prince",
    monthlyIncome: 18000,
    existingDebts: 4000,
    loanAmount: 500000,
    propertyValue: 750000,
    creditScore: 780,
    gender: "Female",
    education: "Graduate",
    selfEmployed: "No"
  },
  {
    id: "APP-020",
    name: "Tony Stark",
    monthlyIncome: 50000,
    existingDebts: 28000,
    loanAmount: 4000000,
    propertyValue: 4500000,
    creditScore: 450,
    gender: "Male",
    education: "Graduate",
    selfEmployed: "Yes"
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = sampleApplicants;
}
