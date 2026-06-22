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
  initAddForm();
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
        renderDashboard(false); // update charts without recreating structures
      });
    }
  });
}

// Evaluate individual applicant using current policy thresholds
function evaluateApplicant(app) {
  const dti = parseFloat(((app.existingDebts / app.monthlyIncome) * 100).toFixed(1));
  const ltv = parseFloat(((app.loanAmount / app.propertyValue) * 100).toFixed(1));
  
  const dtiPass = dti <= policy.maxDTI;
  const ltvPass = ltv <= policy.maxLTV;
  
  let creditStatus = "neutral";
  if (app.creditScore >= policy.minAutoApprove) {
    creditStatus = "pass";
  } else if (app.creditScore >= policy.minManualReview) {
    creditStatus = "warning";
  } else {
    creditStatus = "fail";
  }
  
  let status = "Manual Review";
  let reason = "";

  if (creditStatus === "fail") {
    status = "Deny";
    reason = `Credit Score of ${app.creditScore} is below the policy minimum of ${policy.minManualReview}.`;
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
    if (creditStatus === "warning") triggers.push(`Credit Score (${app.creditScore}) is in review range (${policy.minManualReview}-${policy.minAutoApprove})`);
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

// Handle Add Applicant Modal
function initAddForm() {
  const addBtn = document.getElementById("add-applicant-btn");
  const modal = document.getElementById("add-modal");
  const closeModal = document.getElementById("close-modal");
  const cancelModal = document.getElementById("cancel-modal");
  const form = document.getElementById("add-applicant-form");
  
  if (addBtn && modal) {
    addBtn.addEventListener("click", () => modal.classList.add("open"));
  }
  
  const closeActions = [closeModal, cancelModal];
  closeActions.forEach(btn => {
    if (btn) {
      btn.addEventListener("click", () => modal.classList.remove("open"));
    }
  });
  
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const newApp = {
        id: `APP-0${applicants.length + 1}`,
        name: document.getElementById("form-name").value,
        monthlyIncome: parseFloat(document.getElementById("form-income").value),
        existingDebts: parseFloat(document.getElementById("form-debts").value),
        loanAmount: parseFloat(document.getElementById("form-loan").value),
        propertyValue: parseFloat(document.getElementById("form-property").value),
        creditScore: parseInt(document.getElementById("form-credit").value),
        gender: document.getElementById("form-gender").value,
        education: document.getElementById("form-education").value,
        selfEmployed: document.getElementById("form-employed").value
      };
      
      applicants.unshift(newApp);
      selectedId = newApp.id; // automatically select the newly added applicant
      
      modal.classList.remove("open");
      form.reset();
      
      renderDashboard(false);
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
  
  // 5. Render Detail Card
  renderDetailCard(evaluatedList);
  
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
  
  // Update class of selected row
  const rows = document.querySelectorAll(".table-row");
  rows.forEach(row => {
    row.classList.remove("selected");
  });
  
  // Refresh detail view
  renderDashboard(false);
};

// Render applicant report and checklists
function renderDetailCard(evaluatedList) {
  const app = evaluatedList.find(a => a.id === selectedId);
  const detailContainer = document.getElementById("detail-card-container");
  
  if (!detailContainer) return;
  if (!app) {
    detailContainer.innerHTML = `<p class="table-empty">Select an applicant to view detailed credit risk analysis.</p>`;
    return;
  }
  
  const statusClass = app.status === "Approve" ? "approve" : app.status === "Manual Review" ? "review" : "deny";
  
  const dtiBarClass = app.dtiPass ? "pass" : (app.dti <= policy.maxDTI + 10 ? "warning" : "fail");
  const ltvBarClass = app.ltvPass ? "pass" : (app.ltv <= policy.maxLTV + 10 ? "warning" : "fail");
  const scoreBarClass = app.creditStatus === "pass" ? "pass" : (app.creditStatus === "warning" ? "warning" : "fail");
  
  const scoreProgressPct = Math.min(100, Math.max(0, ((app.creditScore - 300) / 550) * 100));
  
  detailContainer.innerHTML = `
    <div class="detail-card" style="grid-column: span 2; border-top: 4px solid var(--color-${statusClass});">
      <h3>
        <span>Risk Assessment Report &mdash; <strong>${app.name}</strong></span>
        <span class="status-badge ${statusClass}">${app.status}</span>
      </h3>
      
      <div class="detail-layout">
        <!-- Profile Column -->
        <div style="display:flex; flex-direction:column; gap:1.25rem;">
          <div class="detail-grid">
            <div class="detail-item">
              <span>Applicant Name</span>
              <span>${app.name}</span>
            </div>
            <div class="detail-item mono-val">
              <span>Applicant ID</span>
              <span>${app.id}</span>
            </div>
            <div class="detail-item mono-val">
              <span>Monthly Income</span>
              <span>$${app.monthlyIncome.toLocaleString()}</span>
            </div>
            <div class="detail-item mono-val">
              <span>Existing Debts</span>
              <span>$${app.existingDebts.toLocaleString()}</span>
            </div>
            <div class="detail-item mono-val">
              <span>Requested Loan</span>
              <span>$${app.loanAmount.toLocaleString()}</span>
            </div>
            <div class="detail-item mono-val">
              <span>Collateral Value</span>
              <span>$${app.propertyValue.toLocaleString()}</span>
            </div>
            <div class="detail-item">
              <span>Education</span>
              <span>${app.education}</span>
            </div>
            <div class="detail-item">
              <span>Self Employed</span>
              <span>${app.selfEmployed}</span>
            </div>
          </div>
          
          <div style="margin-top:0.5rem; padding: 1rem; border-radius:var(--radius-md); background: rgba(255,255,255,0.03); border:1px solid var(--border-light);">
            <span style="font-size:0.75rem; font-weight:600; text-transform:uppercase; color:var(--text-secondary); display:block; margin-bottom:0.35rem;">Decision Narrative</span>
            <p style="font-size:0.875rem; line-height:1.5; color:var(--text-primary); font-style:italic;">"${app.reason}"</p>
          </div>
        </div>
        
        <!-- Risk Parameters Ratios Column -->
        <div class="ratio-progress-container">
          <h4 style="font-family:'Space Grotesk', sans-serif; font-size:0.95rem; font-weight:600; color:#fff; border-bottom:1px dashed var(--border-light); padding-bottom:0.25rem;">Key Financial Ratios & Credit Profile</h4>
          
          <!-- Debt-to-Income Progress -->
          <div class="progress-bar-group">
            <div class="progress-labels">
              <span>Debt-to-Income (DTI)</span>
              <span>${app.dti}% <span style="color:var(--text-secondary); font-size:0.75rem;">(Max: ${policy.maxDTI}%)</span></span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${dtiBarClass}" style="width: ${Math.min(100, app.dti)}%"></div>
              <div class="threshold-marker" style="left: ${policy.maxDTI}%"></div>
            </div>
          </div>
          
          <!-- Loan-to-Value Progress -->
          <div class="progress-bar-group">
            <div class="progress-labels">
              <span>Loan-to-Value (LTV)</span>
              <span>${app.ltv}% <span style="color:var(--text-secondary); font-size:0.75rem;">(Max: ${policy.maxLTV}%)</span></span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${ltvBarClass}" style="width: ${Math.min(100, app.ltv)}%"></div>
              <div class="threshold-marker" style="left: ${policy.maxLTV}%"></div>
            </div>
          </div>
          
          <!-- Credit Score Progress -->
          <div class="progress-bar-group">
            <div class="progress-labels">
              <span>Credit Score (CIBIL / FICO)</span>
              <span>${app.creditScore} <span style="color:var(--text-secondary); font-size:0.75rem;">(Ranges: ${policy.minManualReview}-${policy.minAutoApprove})</span></span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${scoreBarClass}" style="width: ${scoreProgressPct}%"></div>
              <div class="threshold-marker" style="left: ${((policy.minManualReview - 300) / 550) * 100}%"></div>
              <div class="threshold-marker" style="left: ${((policy.minAutoApprove - 300) / 550) * 100}%"></div>
            </div>
          </div>
          
          <!-- Decision Rules Checklist -->
          <div class="decision-checklist">
            <div class="check-item ${app.dtiPass ? 'pass' : 'fail'}">
              <div class="check-icon">${app.dtiPass ? '✓' : '✗'}</div>
              <div class="check-details">
                <span>DTI Ratio &le; ${policy.maxDTI}%</span>
                <span>Calculated: ${app.dti}%</span>
              </div>
            </div>
            
            <div class="check-item ${app.ltvPass ? 'pass' : 'fail'}">
              <div class="check-icon">${app.ltvPass ? '✓' : '✗'}</div>
              <div class="check-details">
                <span>LTV Ratio &le; ${policy.maxLTV}%</span>
                <span>Calculated: ${app.ltv}%</span>
              </div>
            </div>
            
            <div class="check-item ${app.creditStatus === 'pass' ? 'pass' : (app.creditStatus === 'warning' ? 'neutral' : 'fail')}">
              <div class="check-icon">${app.creditStatus === 'pass' ? '✓' : (app.creditStatus === 'warning' ? '!' : '✗')}</div>
              <div class="check-details">
                <span>Credit Score &ge; ${policy.minAutoApprove}</span>
                <span>Score: ${app.creditScore}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

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
