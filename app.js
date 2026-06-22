// app.js
// Decision Support System (DSS) Core Engine

let applicants = [...sampleApplicants];
let selectedId = applicants[0]?.id || null;
let currentFilter = "all";
let searchQuery = "";

// Policy Threshold State (init from sliders)
let policy = {
  maxDTI: 45,
  maxLTV: 80,
  minAutoApprove: 700,
  minManualReview: 600
};

// Chart instances
let scatterChartInstance = null;
let distributionChartInstance = null;
let featureImportanceChartInstance = null;

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  initSliders();
  initSearchAndFilters();
  initDSSCalculator();
  
  // Pre-load the first applicant into the form
  if (applicants.length > 0) {
    selectedId = applicants[0].id;
    loadApplicantIntoForm(applicants[0]);
  }
  
  renderDashboard(true); // pass true to init charts
});

// Setup sliders and sync display values
function initSliders() {
  const sliderIds = ["maxDTI", "maxLTV", "minAutoApprove", "minManualReview"];
  sliderIds.forEach(id => {
    const slider = document.getElementById(id);
    const valueDisplay = document.getElementById(`${id}-val`);
    
    if (slider && valueDisplay) {
      // Set initial value from default policy state
      slider.value = policy[id];
      valueDisplay.textContent = id.includes("DTI") || id.includes("LTV") ? `${policy[id]}%` : policy[id];
      
      // Update value display and state dynamically as slider moves
      slider.addEventListener("input", (e) => {
        let value = parseInt(e.target.value);
        
        // Enforce safety constraints
        if (id === "minAutoApprove") {
          const minReviewSlider = document.getElementById("minManualReview");
          const minReview = parseInt(minReviewSlider.value);
          if (value <= minReview) {
            value = minReview + 10;
            slider.value = value;
          }
        } else if (id === "minManualReview") {
          const minApproveSlider = document.getElementById("minAutoApprove");
          const minApprove = parseInt(minApproveSlider.value);
          if (value >= minApprove) {
            value = minApprove - 10;
            slider.value = value;
          }
        }
        
        policy[id] = value;
        valueDisplay.textContent = id.includes("DTI") || id.includes("LTV") ? `${value}%` : value;
        renderDashboard(false); // update charts and live status instantly
      });
    }
  });
}

// Evaluate individual applicant using current policy thresholds
function evaluateApplicant(app) {
  const income = parseFloat(app.monthlyIncome) || 0;
  const debts = parseFloat(app.existingDebts) || 0;
  const loan = parseFloat(app.loanAmount) || 0;
  const property = parseFloat(app.propertyValue) || 0;
  const score = parseInt(app.creditScore) || 300;

  const dti = income > 0 ? parseFloat(((debts / income) * 100).toFixed(1)) : 0;
  const ltv = property > 0 ? parseFloat(((loan / property) * 100).toFixed(1)) : 0;
  
  const dtiPass = dti <= policy.maxDTI;
  const ltvPass = ltv <= policy.maxLTV;
  
  let creditStatus = "neutral";
  if (score >= policy.minAutoApprove) {
    creditStatus = "pass";
  } else if (score >= policy.minManualReview) {
    creditStatus = "warning";
  } else {
    creditStatus = "fail";
  }
  
  let status = "Manual Review";
  let reason = "";

  if (creditStatus === "fail") {
    status = "Deny";
    reason = `Credit Score of ${score} is below the policy minimum of ${policy.minManualReview}.`;
  } else if (!dtiPass && !ltvPass) {
    status = "Deny";
    reason = `Critical risk: Both Debt-to-Income (${dti}%) and Loan-to-Value (${ltv}%) ratios exceed max thresholds.`;
  } else if (dtiPass && ltvPass && creditStatus === "pass") {
    status = "Approve";
    reason = "All underwriting checks passed successfully: high credit score, low DTI, and solid property collateral.";
  } else {
    status = "Manual Review";
    const triggers = [];
    if (!dtiPass) triggers.push(`DTI (${dti}%) exceeds max ${policy.maxDTI}%`);
    if (!ltvPass) triggers.push(`LTV (${ltv}%) exceeds max ${policy.maxLTV}%`);
    if (creditStatus === "warning") triggers.push(`Credit Score (${score}) is in review range (${policy.minManualReview}-${policy.minAutoApprove})`);
    reason = `Triggered for manual review due to: ${triggers.join("; ")}.`;
  }
  
  return {
    ...app,
    dti,
    ltv,
    dtiPass,
    ltvPass,
    creditStatus,
    status,
    reason
  };
}

// Search and filtering controls setup
function initSearchAndFilters() {
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      renderDashboard(false);
    });
  }
  
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderDashboard(false);
    });
  });
}

// Get applicant form data from inputs
function getFormData() {
  return {
    name: document.getElementById("calc-name").value,
    monthlyIncome: parseFloat(document.getElementById("calc-income").value) || 0,
    existingDebts: parseFloat(document.getElementById("calc-debts").value) || 0,
    loanAmount: parseFloat(document.getElementById("calc-loan").value) || 0,
    propertyValue: parseFloat(document.getElementById("calc-property").value) || 0,
    creditScore: parseInt(document.getElementById("calc-credit").value) || 300,
    selfEmployed: document.getElementById("calc-employed").value,
    education: document.getElementById("calc-education").value,
    gender: document.getElementById("calc-gender").value
  };
}

// Populate input form with applicant values
function loadApplicantIntoForm(app) {
  if (!app) return;
  document.getElementById("calc-name").value = app.name || "";
  document.getElementById("calc-income").value = app.monthlyIncome || "";
  document.getElementById("calc-debts").value = app.existingDebts || "";
  document.getElementById("calc-loan").value = app.loanAmount || "";
  document.getElementById("calc-property").value = app.propertyValue || "";
  document.getElementById("calc-credit").value = app.creditScore || "650";
  document.getElementById("calc-employed").value = app.selfEmployed || "No";
  document.getElementById("calc-education").value = app.education || "Graduate";
  document.getElementById("calc-gender").value = app.gender || "Male";
}

// Update Live Underwriting Decision Card
function updateLiveDecisionCard() {
  const currentApp = getFormData();
  const evaluation = evaluateApplicant(currentApp);
  
  // Update calculated outputs
  document.getElementById("live-dti").textContent = `${evaluation.dti}%`;
  document.getElementById("live-ltv").textContent = `${evaluation.ltv}%`;
  
  // Update status badge
  const recBadge = document.getElementById("live-status-recommendation");
  if (recBadge) {
    recBadge.textContent = evaluation.status.toUpperCase();
    recBadge.className = "live-status-badge";
    if (evaluation.status === "Approve") {
      recBadge.classList.add("status-approve");
    } else if (evaluation.status === "Manual Review") {
      recBadge.classList.add("status-review");
    } else {
      recBadge.classList.add("status-deny");
    }
  }
  
  // Update narrative explanation
  const reasonText = document.getElementById("live-decision-reason");
  if (reasonText) {
    reasonText.textContent = evaluation.reason;
  }
  
  // Update checklist icons and classes
  const chkDti = document.getElementById("chk-dti");
  const chkLtv = document.getElementById("chk-ltv");
  const chkCredit = document.getElementById("chk-credit");
  
  if (chkDti) {
    if (evaluation.dtiPass) {
      chkDti.className = "live-check-item pass";
      chkDti.querySelector(".chk-icon").textContent = "✓";
    } else {
      chkDti.className = "live-check-item fail";
      chkDti.querySelector(".chk-icon").textContent = "✗";
    }
  }
  
  if (chkLtv) {
    if (evaluation.ltvPass) {
      chkLtv.className = "live-check-item pass";
      chkLtv.querySelector(".chk-icon").textContent = "✓";
    } else {
      chkLtv.className = "live-check-item fail";
      chkLtv.querySelector(".chk-icon").textContent = "✗";
    }
  }
  
  if (chkCredit) {
    if (evaluation.creditStatus === "pass") {
      chkCredit.className = "live-check-item pass";
      chkCredit.querySelector(".chk-icon").textContent = "✓";
    } else if (evaluation.creditStatus === "warning") {
      chkCredit.className = "live-check-item warning";
      chkCredit.querySelector(".chk-icon").textContent = "!";
    } else {
      chkCredit.className = "live-check-item fail";
      chkCredit.querySelector(".chk-icon").textContent = "✗";
    }
  }
}

// Setup live calculations and control actions for the DSS calculator
function initDSSCalculator() {
  const formFields = [
    "calc-name", "calc-income", "calc-debts", 
    "calc-loan", "calc-property", "calc-credit",
    "calc-employed", "calc-education", "calc-gender"
  ];
  
  formFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", updateLiveDecisionCard);
      el.addEventListener("change", updateLiveDecisionCard);
    }
  });
  
  // Save / Update button click
  const saveBtn = document.getElementById("save-applicant-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      const name = document.getElementById("calc-name").value.trim();
      if (!name) {
        alert("Please enter a valid applicant name.");
        return;
      }
      
      const currentData = getFormData();
      
      if (selectedId) {
        // Update existing applicant
        const index = applicants.findIndex(a => a.id === selectedId);
        if (index !== -1) {
          applicants[index] = {
            ...applicants[index],
            ...currentData,
            id: selectedId
          };
        }
      } else {
        // Create brand new applicant
        const nextNum = applicants.length + 1;
        const newId = `APP-${nextNum < 10 ? '00' : nextNum < 100 ? '0' : ''}${nextNum}`;
        const newApp = {
          ...currentData,
          id: newId
        };
        applicants.unshift(newApp);
        selectedId = newId;
      }
      
      renderDashboard(false);
    });
  }
  
  // Clear / New button click
  const clearBtn = document.getElementById("clear-applicant-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      selectedId = null;
      document.getElementById("calc-name").value = "";
      document.getElementById("calc-income").value = "";
      document.getElementById("calc-debts").value = "";
      document.getElementById("calc-loan").value = "";
      document.getElementById("calc-property").value = "";
      document.getElementById("calc-credit").value = "650";
      document.getElementById("calc-employed").value = "No";
      document.getElementById("calc-education").value = "Graduate";
      document.getElementById("calc-gender").value = "Male";
      
      // Remove selected formatting in queue table
      const rows = document.querySelectorAll(".table-row");
      rows.forEach(row => row.classList.remove("selected"));
      
      updateLiveDecisionCard();
    });
  }
}

// Render Dashboard (Updates elements, tables, summaries, and charts)
function renderDashboard(initCharts = false) {
  // 1. Evaluate all applicants using dynamic policy
  const evaluatedList = applicants.map(app => evaluateApplicant(app));
  
  // 2. Calculate summary statistics
  calculateStats(evaluatedList);
  
  // 3. Apply search query and status filter
  let filteredList = evaluatedList;
  if (searchQuery) {
    filteredList = filteredList.filter(app => app.name.toLowerCase().includes(searchQuery) || app.id.toLowerCase().includes(searchQuery));
  }
  if (currentFilter !== "all") {
    const filterStatusStr = currentFilter === "approve" ? "Approve" : currentFilter === "review" ? "Manual Review" : "Deny";
    filteredList = filteredList.filter(app => app.status === filterStatusStr);
  }
  
  // 4. Render Table
  renderTable(filteredList);
  
  // 5. Update Live decision panel
  updateLiveDecisionCard();
  
  // 6. Update Charts
  updateCharts(evaluatedList, initCharts);
}

// Calculate summary numbers and averages
function calculateStats(list) {
  const counts = { Approve: 0, "Manual Review": 0, Deny: 0 };
  let totalDTI = 0;
  let totalLTV = 0;
  let totalScore = 0;
  
  list.forEach(app => {
    counts[app.status]++;
    totalDTI += app.dti;
    totalLTV += app.ltv;
    totalScore += app.creditScore;
  });
  
  const total = list.length || 1;
  
  // Update HTML elements
  document.getElementById("count-approve").textContent = counts["Approve"];
  document.getElementById("count-review").textContent = counts["Manual Review"];
  document.getElementById("count-deny").textContent = counts["Deny"];
  
  document.getElementById("avg-dti").textContent = `${(totalDTI / total).toFixed(1)}%`;
  document.getElementById("avg-ltv").textContent = `${(totalLTV / total).toFixed(1)}%`;
  document.getElementById("avg-score").textContent = Math.round(totalScore / total);
}

// Render applicant list in table
function renderTable(list) {
  const tbody = document.getElementById("applicants-tbody");
  if (!tbody) return;
  
  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="table-empty">
          <svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z"/></svg>
          <p>No applicants match the current search or filters.</p>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = list.map(app => {
    const isSelected = app.id === selectedId;
    const statusClass = app.status === "Approve" ? "approve" : app.status === "Manual Review" ? "review" : "deny";
    
    return `
      <tr class="table-row ${isSelected ? 'selected' : ''}" onclick="selectApplicant('${app.id}')">
        <td style="font-weight:600; color:#fff;">${app.id}</td>
        <td>${app.name}</td>
        <td class="num-cell">$${app.monthlyIncome.toLocaleString()}</td>
        <td class="num-cell">$${app.loanAmount.toLocaleString()}</td>
        <td class="num-cell">${app.creditScore}</td>
        <td class="num-cell">${app.dti}%</td>
        <td class="num-cell">${app.ltv}%</td>
        <td><span class="status-badge ${statusClass}">${app.status}</span></td>
      </tr>
    `;
  }).join("");
}

// Handle row selection
window.selectApplicant = function(id) {
  selectedId = id;
  const app = applicants.find(a => a.id === id);
  if (app) {
    loadApplicantIntoForm(app);
  }
  
  // Update class of selected row
  const rows = document.querySelectorAll(".table-row");
  rows.forEach(row => {
    if (row.querySelector("td").textContent === id) {
      row.classList.add("selected");
    } else {
      row.classList.remove("selected");
    }
  });
  
  // Refresh detail view
  renderDashboard(false);
};

// Chart.js Visualizations updating dynamically
function updateCharts(list, init = false) {
  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') return;
  
  // Data prep for Scatter Chart (DTI vs LTV)
  const colors = {
    "Approve": "#10b981",
    "Manual Review": "#f59e0b",
    "Deny": "#ef4444"
  };
  
  const scatterData = list.map(app => ({
    x: app.dti,
    y: app.ltv,
    label: app.name,
    status: app.status
  }));
  
  // 1. Render/Update Scatter Chart
  const ctxScatter = document.getElementById("scatter-chart");
  if (ctxScatter) {
    if (init || !scatterChartInstance) {
      if (scatterChartInstance) scatterChartInstance.destroy();
      scatterChartInstance = new Chart(ctxScatter, {
        type: 'scatter',
        data: {
          datasets: [{
            label: 'Applicants',
            data: scatterData,
            pointBackgroundColor: scatterData.map(d => colors[d.status]),
            pointBorderColor: 'rgba(255, 255, 255, 0.1)',
            pointRadius: 6,
            pointHoverRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const pt = context.raw;
                  return `${pt.label} (${pt.status}) | DTI: ${pt.x}%, LTV: ${pt.y}%`;
                }
              }
            }
          },
          scales: {
            x: {
              title: { display: true, text: 'Debt-to-Income (DTI) %', color: '#9ca3af' },
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#9ca3af' },
              min: 0,
              max: 100
            },
            y: {
              title: { display: true, text: 'Loan-to-Value (LTV) %', color: '#9ca3af' },
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#9ca3af' },
              min: 0,
              max: 120
            }
          }
        }
      });
    } else {
      // Direct update of data
      scatterChartInstance.data.datasets[0].data = scatterData;
      scatterChartInstance.data.datasets[0].pointBackgroundColor = scatterData.map(d => colors[d.status]);
      scatterChartInstance.update('none'); // silent update
    }
  }
  
  // Data prep for Distribution Doughnut
  const distCounts = { "Approve": 0, "Manual Review": 0, "Deny": 0 };
  list.forEach(app => distCounts[app.status]++);
  const distData = [distCounts["Approve"], distCounts["Manual Review"], distCounts["Deny"]];
  
  // 2. Render/Update Distribution Chart
  const ctxDist = document.getElementById("distribution-chart");
  if (ctxDist) {
    if (init || !distributionChartInstance) {
      if (distributionChartInstance) distributionChartInstance.destroy();
      distributionChartInstance = new Chart(ctxDist, {
        type: 'doughnut',
        data: {
          labels: ['Approved', 'Manual Review', 'Denied'],
          datasets: [{
            data: distData,
            backgroundColor: [colors["Approve"], colors["Manual Review"], colors["Deny"]],
            borderWidth: 1,
            borderColor: '#111827'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#9ca3af', font: { family: 'Outfit', size: 11 } }
            }
          },
          cutout: '65%'
        }
      });
    } else {
      distributionChartInstance.data.datasets[0].data = distData;
      distributionChartInstance.update('none');
    }
  }
}

// Switch between dashboard and ML insights tabs
window.switchTab = function(tabId) {
  const tabLinks = document.querySelectorAll(".tab-link");
  tabLinks.forEach(link => {
    const onclickAttr = link.getAttribute("onclick") || "";
    if (onclickAttr.includes(tabId)) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  const tabs = ["sandbox", "ml-insights"];
  tabs.forEach(tId => {
    const section = document.getElementById(`tab-${tId}`);
    if (section) {
      if (tId === tabId) {
        section.classList.remove("hidden");
      } else {
        section.classList.add("hidden");
      }
    }
  });

  // Resize charts to fit layout transitions
  if (tabId === "sandbox") {
    setTimeout(() => {
      if (scatterChartInstance) scatterChartInstance.resize();
      if (distributionChartInstance) distributionChartInstance.resize();
    }, 60);
  } else if (tabId === "ml-insights") {
    initFeatureImportanceChart();
  }
};

// Chart.js Horizontal Bar Chart for Gini Feature Importances
function initFeatureImportanceChart() {
  const ctx = document.getElementById("feature-importance-chart");
  if (!ctx || typeof Chart === 'undefined') return;
  
  const labels = [
    'Credit Score (CIBIL)',
    'Loan Requested Amount',
    'Annual Income',
    'Assets to Loan Ratio',
    'Loan-to-Value (LTV) Ratio',
    'Loan Tenure (Term)',
    'Education Level',
    'Self Employment Status'
  ];
  const importances = [89.18, 2.72, 2.52, 2.20, 2.11, 0.81, 0.26, 0.20];
  
  if (featureImportanceChartInstance) {
    featureImportanceChartInstance.destroy();
  }
  
  featureImportanceChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Relative Importance %',
        data: importances,
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(6, 182, 212, 0.7)',
          'rgba(6, 182, 212, 0.7)',
          'rgba(6, 182, 212, 0.7)',
          'rgba(6, 182, 212, 0.7)',
          'rgba(156, 163, 175, 0.5)',
          'rgba(156, 163, 175, 0.5)',
          'rgba(156, 163, 175, 0.5)'
        ],
        borderColor: [
          '#6366f1',
          '#06b6d4',
          '#06b6d4',
          '#06b6d4',
          '#06b6d4',
          '#9ca3af',
          '#9ca3af',
          '#9ca3af'
        ],
        borderWidth: 1.5,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.parsed.x.toFixed(2)}% Gini Importance`
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Relative Importance Score %', color: '#9ca3af' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: { color: '#9ca3af' },
          max: 100
        },
        y: {
          grid: { display: false },
          ticks: { color: '#f3f4f6', font: { family: 'Outfit', size: 11, weight: '500' } }
        }
      }
    }
  });
}
