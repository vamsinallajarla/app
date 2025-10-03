// Tab Navigation
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(tc => tc.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// Utility functions for LocalStorage
function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}
function setData(key, arr) {
  localStorage.setItem(key, JSON.stringify(arr));
}

// Render Lists
function renderList(type) {
  const ul = document.getElementById(`${type}-list`);
  const items = getData(type);
  ul.innerHTML = '';
  items.forEach((item, idx) => {
    let str = '';
    if (type === 'income') {
      str = `<strong>${item.source}</strong> — ₹${item.amount} — ${item.date}`;
    } else if (type === 'expense') {
      str = `<strong>${item.category}</strong> — ₹${item.amount} — ${item.date}`;
    } else if (type === 'asset') {
      str = `<strong>${item.name}</strong> — ₹${item.value} — ${item.date}`;
    } else if (type === 'liability') {
      str = `<strong>${item.name}</strong> — ₹${item.value} — ${item.date}`;
    } else if (type === 'investment') {
      str = `<strong>${item.name}</strong> (${item.type}) — ₹${item.amount} — ${item.date}`;
    } else if (type === 'personal') {
      str = `Aadhar: ${item.aadhar}, PAN: ${item.pan}, Tax: ${item.tax || ''}`;
    } else if (type === 'bank') {
      str = `<strong>${item.bankName}</strong> — ${item.accountNumber} (${item.accountType}) — IFSC: ${item.ifsc}`;
    } else if (type === 'card') {
      str = `<strong>${item.bank}</strong> — ${item.cardNumber}, Limit: ₹${item.limit}, Expiry: ${item.expiry}`;
    }
    ul.innerHTML += `<li>${str} <span>
      <button onclick="editItem('${type}',${idx})">Edit</button>
      <button onclick="deleteItem('${type}',${idx})">Delete</button>
      </span></li>`;
  });
}

// Form Handlers
const formTypes = ['income','expense','asset','liability','investment','personal','bank','card'];
formTypes.forEach(type => {
  const form = document.getElementById(type + '-form');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const inputs = form.querySelectorAll('input,select');
    const newItem = {};
    inputs.forEach(inp => {
      newItem[inp.name] = inp.value;
    });
    let arr = getData(type);
    if (form.querySelector('[name="id"]').value) {
      arr[form.querySelector('[name="id"]').value] = newItem;
    } else {
      arr.push(newItem);
    }
    setData(type, arr);
    form.reset();
    form.querySelector('[name="id"]').value = '';
    form.querySelector(`#${type}-cancel`).style.display = 'none';
    renderList(type);
    updateDashboard();
  });

  form.querySelector(`#${type}-cancel`).addEventListener('click', function() {
    form.reset();
    form.querySelector('[name="id"]').value = '';
    form.querySelector(`#${type}-cancel`).style.display = 'none';
  });

  renderList(type);
});

// Edit and Delete
window.editItem = function(type, idx) {
  const arr = getData(type);
  const form = document.getElementById(type + '-form');
  Object.keys(arr[idx]).forEach(k => {
    if (form[k]) form[k].value = arr[idx][k];
  });
  form.querySelector('[name="id"]').value = idx;
  form.querySelector(`#${type}-cancel`).style.display = '';
};

window.deleteItem = function(type, idx) {
  let arr = getData(type);
  arr.splice(idx,1);
  setData(type, arr);
  renderList(type);
  updateDashboard();
};

// Dashboard update including charts
function updateDashboard() {
  const assets = getData('asset').reduce((acc, v) => acc + Number(v.value || 0), 0);
  const liabilities = getData('liability').reduce((acc, v) => acc + Number(v.value || 0), 0);
  const netWorth = assets - liabilities;

  document.getElementById('net-worth-value').textContent = '₹' + netWorth.toLocaleString();
  document.getElementById('assets-summary').textContent = '₹' + assets.toLocaleString();
  document.getElementById('liabilities-summary').textContent = '₹' + liabilities.toLocaleString();

  const monthlyExpenses = getData('expense').reduce((acc, v) => acc + Number(v.amount || 0), 0);
  const emergencyFund = monthlyExpenses * 4; // 4 months emergency cushion

  document.getElementById('emergency-fund-value').textContent = '₹' + emergencyFund.toLocaleString();

  const income = getData('income').reduce((acc, v) => acc + Number(v.amount || 0), 0);
  document.getElementById('monthly-surplus-value').textContent = '₹' + (income - monthlyExpenses).toLocaleString();

  updateCharts(income, monthlyExpenses, assets, liabilities, netWorth);
}

function updateCharts(income,expense,assets,liabilities,netWorth) {
  if(window.incomeChart) window.incomeChart.destroy();
  if(window.assetsChart) window.assetsChart.destroy();
  if(window.netWorthChart) window.netWorthChart.destroy();

  window.incomeChart = new Chart(document.getElementById('incomeExpensesChart').getContext('2d'), {
    type: 'pie',
    data: {
      labels: ['Income','Expense'],
      datasets: [{
        data: [income, expense],
        backgroundColor: ['#6eb1fc','#ec5367'],
      }]
    },
    options: {responsive:true, plugins:{legend:{display:false}}}
  });

  window.assetsChart = new Chart(document.getElementById('assetsLiabilitiesChart').getContext('2d'), {
    type: 'doughnut',
    data: {
      labels: ['Assets','Liabilities'],
      datasets: [{
        data: [assets,liabilities],
        backgroundColor: ['#73e8bf','#ffe16e'],
      }]
    },
    options:{responsive:true, plugins:{legend:{display:false}}}
  });

  const trend = [netWorth-50000, netWorth-30000, netWorth-10000, netWorth];
  window.netWorthChart = new Chart(document.getElementById('netWorthTrendChart').getContext('2d'), {
    type: 'line',
    data: {
      labels: ['Q1','Q2','Q3','Current'],
      datasets: [{
        label: 'Net Worth',
        data: trend,
        borderColor: '#385aef',
        fill: false,
        tension: 0.2
      }]
    },
    options:{responsive:true, plugins:{legend:{display:false}}}
  });
}

// Initialization
updateDashboard();
