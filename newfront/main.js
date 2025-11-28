let accounts = JSON.parse(localStorage.getItem("accounts")) || [];
let entries = JSON.parse(localStorage.getItem("entries")) || [];

const pages = document.querySelectorAll(".page");

// Navigation
document.querySelector("#nav-accounts").onclick = () => showPage("section-accounts");
document.querySelector("#nav-entry").onclick = () => showPage("section-entry");
document.querySelector("#nav-ledger").onclick = () => showPage("section-ledger");
document.querySelector("#nav-trial").onclick = () => showPage("section-trial");
document.querySelector("#nav-financial").onclick = () => showPage("section-financial");
document.querySelector("#nav-users").onclick = () => showPage("section-users-list");
document.querySelector("#nav-finyear").onclick = () => showPage("section-financial-year");
document.querySelector("#nav-yearclose").onclick = () => showPage("section-year-close");
document.querySelector("#nav-journal").onclick = () => showPage("section-journal");
document.querySelector("#nav-reports").onclick = () => showPage("section-expenses-faculty");
document.querySelector("#nav-search").onclick = () => showPage("section-search");

function showPage(id) {
  pages.forEach(p => {
    p.style.display = "none";
    p.classList.remove("active");
  });
  const page = document.getElementById(id);
  if (page) {
    page.style.display = "block";
    page.classList.add("active");
  }
  if (id === "section-ledger") renderLedger();
  if (id === "section-trial") renderTrialBalance();
  if (id === "section-entry") updateAccountOptions();
}

// ===== الحسابات =====
document.getElementById("form-account").onsubmit = e => {
  e.preventDefault();
  const form = e.target;
  
  const acc = {
    id: Date.now(),
    code: form.code.value.trim(),
    name: form.name.value.trim(),
    opening_balance: parseFloat(form.opening_balance.value),
    balance_type: form.balance_type.value
  };
  
  accounts.push(acc);
  localStorage.setItem("accounts", JSON.stringify(accounts));
  form.reset();
  renderAccounts();
  updateAccountOptions();
  alert("✅ تم حفظ الحساب بنجاح");
};

function renderAccounts() {
  const tbody = document.querySelector("#tbl-accounts tbody");
  tbody.innerHTML = "";
  accounts.forEach((acc, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${acc.code}</td>
      <td>${acc.name}</td>
      <td>${acc.opening_balance.toFixed(2)}</td>
      <td>${acc.balance_type}</td>
      <td>
        <button onclick="editAccount(${idx})" class="small-btn">✏️ تعديل</button>
        <button onclick="deleteAccount(${idx})" class="small-btn">🗑️ حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editAccount(idx) {
  const acc = accounts[idx];
  const form = document.getElementById("form-account");
  form.code.value = acc.code;
  form.name.value = acc.name;
  form.opening_balance.value = acc.opening_balance;
  form.balance_type.value = acc.balance_type;
  
  const oldSubmit = form.onsubmit;
  form.onsubmit = e => {
    e.preventDefault();
    accounts.splice(idx, 1);
    oldSubmit.call(form, { target: form, preventDefault: () => {} });
    form.onsubmit = oldSubmit;
  };
  
  showPage("section-accounts");
  window.scrollTo(0, 0);
}

function deleteAccount(idx) {
  if (confirm("هل تريد حذف هذا الحساب؟")) {
    accounts.splice(idx, 1);
    localStorage.setItem("accounts", JSON.stringify(accounts));
    renderAccounts();
    updateAccountOptions();
  }
}

function updateAccountOptions() {
  const opts = accounts.map(a => `<option value="${a.code}">${a.name} (${a.code})</option>`).join('');
  document.querySelectorAll('.account-debit, .account-credit').forEach(s => {
    s.innerHTML = `<option value="">-- اختر حساب --</option>${opts}`;
  });
}

// ===== تنسيق مركز التكلفة =====
function formatCostCenter(code) {
  if (!code || code.length < 8) return 'N/A';
  return `${code.substring(0, 2)}-${code.substring(2, 4)}-${code.substring(4, 6)}-${code.substring(6, 8)}`;
}

// ===== القيود =====
function createTransactionRow(entryCode) {
  const div = document.createElement('div');
  div.className = 'transaction';
  
  const opts = accounts.map(a => `<option value="${a.code}">${a.name} (${a.code})</option>`).join('');
  
  div.innerHTML = `
    <label style="flex: 1 1 160px;">الحساب المدين
      <select class="account-debit" required>
        <option value="">-- اختر --</option>${opts}
      </select>
      <div class="cost-center-input-group debit-cc-group" style="display:none;">
        <label><span>ح</span><input type="text" class="debit-cc-1" maxlength="2" placeholder="00" /></label>
        <label><span>ك</span><input type="text" class="debit-cc-2" maxlength="2" placeholder="00" /></label>
        <label><span>ب</span><input type="text" class="debit-cc-3" maxlength="2" placeholder="00" /></label>
        <label><span>خ</span><input type="text" class="debit-cc-4" maxlength="2" placeholder="00" /></label>
      </div>
    </label>
    <label style="flex: 1 1 160px;">الحساب الدائن
      <select class="account-credit" required>
        <option value="">-- اختر --</option>${opts}
      </select>
      <div class="cost-center-input-group credit-cc-group" style="display:none;">
        <label><span>ح</span><input type="text" class="credit-cc-1" maxlength="2" placeholder="00" /></label>
        <label><span>ك</span><input type="text" class="credit-cc-2" maxlength="2" placeholder="00" /></label>
        <label><span>ب</span><input type="text" class="credit-cc-3" maxlength="2" placeholder="00" /></label>
        <label><span>خ</span><input type="text" class="credit-cc-4" maxlength="2" placeholder="00" /></label>
      </div>
    </label>
    <label style="flex: 1 1 120px;">المبلغ
      <input type="number" step="0.01" class="amount" required />
    </label>
    <label style="flex: 1 1 140px;">البيان
      <input type="text" class="description" placeholder="بيان العملية" required />
    </label>
    <label style="flex: 1 1 110px;">كود القيد
      <input type="text" class="entry-code" value="${entryCode}" readonly />
    </label>
    <button type="button" class="remove-transaction btn">✖</button>
  `;
  
  const debitSelect = div.querySelector('.account-debit');
  const creditSelect = div.querySelector('.account-credit');
  const debitCCGroup = div.querySelector('.debit-cc-group');
  const creditCCGroup = div.querySelector('.credit-cc-group');

  debitSelect.onchange = () => {
    debitCCGroup.style.display = debitSelect.value ? 'flex' : 'none';
  };

  creditSelect.onchange = () => {
    creditCCGroup.style.display = creditSelect.value ? 'flex' : 'none';
  };

  div.querySelector('.remove-transaction').onclick = () => div.remove();

  return div;
}

document.getElementById("form-entry").onsubmit = e => {
  e.preventDefault();
  
  const date = document.querySelector('input[name="entry_date"]').value;
  const entryCode = document.querySelector('input[name="entry_code"]').value;

  if (!date || !entryCode) {
    alert('❌ يجب تعبئة التاريخ ورقم القيد');
    return;
  }

  const transactions = [];
  let sumDebit = 0;
  let sumCredit = 0;

  document.querySelectorAll('.transaction').forEach(tr => {
    const debit = tr.querySelector('.account-debit').value;
    const credit = tr.querySelector('.account-credit').value;
    const amount = parseFloat(tr.querySelector('.amount').value);
    const description = tr.querySelector('.description').value;
    
    const debitCC = (tr.querySelector('.debit-cc-1').value || "00") + 
                    (tr.querySelector('.debit-cc-2').value || "00") +
                    (tr.querySelector('.debit-cc-3').value || "00") +
                    (tr.querySelector('.debit-cc-4').value || "00");
    
    const creditCC = (tr.querySelector('.credit-cc-1').value || "00") + 
                     (tr.querySelector('.credit-cc-2').value || "00") +
                     (tr.querySelector('.credit-cc-3').value || "00") +
                     (tr.querySelector('.credit-cc-4').value || "00");

    if (!debit || !credit || !amount || !description || debitCC.length < 8 || creditCC.length < 8) {
      alert('❌ جميع الحقول مطلوبة (الحساب المدين والدائن والمبلغ والبيان ومركز التكلفة)');
      return;
    }

    transactions.push({
      debit_account: debit,
      debit_cost_center: debitCC,
      credit_account: credit,
      credit_cost_center: creditCC,
      amount,
      description
    });

    sumDebit += amount;
    sumCredit += amount;
  });

  if (transactions.length === 0) {
    alert('❌ يجب إضافة عملية واحدة على الأقل');
    return;
  }

  if (Math.abs(sumDebit - sumCredit) > 0.01) {
    alert(`❌ عدم التوازن! 
    مجموع المدين: ${sumDebit.toFixed(2)}
    مجموع الدائن: ${sumCredit.toFixed(2)}
    الفرق: ${Math.abs(sumDebit - sumCredit).toFixed(2)}`);
    return;
  }

  const entryData = {
    id: Date.now(),
    entry_date: date,
    entry_code: entryCode,
    transactions
  };

  entries.push(entryData);
  localStorage.setItem('entries', JSON.stringify(entries));

  alert('✅ تم حفظ القيد بنجاح برقم: ' + entryCode);
  document.getElementById('form-entry').reset();
  document.getElementById('transactions-container').innerHTML = '';
  renderEntries();
};

document.getElementById('add-transaction').onclick = () => {
  const entryCode = document.querySelector('input[name="entry_code"]').value;
  if (!entryCode) {
    alert('❌ يجب إدخال رقم القيد أولاً');
    return;
  }
  document.getElementById('transactions-container').appendChild(createTransactionRow(entryCode));
};

document.getElementById('transactions-container').addEventListener('click', e => {
  if (e.target.classList.contains('remove-transaction')) {
    e.target.closest('.transaction').remove();
  }
});

function renderEntries() {
  const tbody = document.querySelector('#tbl-entries tbody');
  tbody.innerHTML = '';

  entries.forEach((entry, entryIdx) => {
    entry.transactions.forEach((tr, trIdx) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${entry.entry_date}</td>
        <td>${tr.debit_account}</td>
        <td>${formatCostCenter(tr.debit_cost_center)}</td>
        <td>${tr.credit_account}</td>
        <td>${formatCostCenter(tr.credit_cost_center)}</td>
        <td>${tr.amount.toFixed(2)}</td>
        <td>${tr.description}</td>
        <td>${entry.entry_code}</td>
        <td>
          <button onclick="editEntry(${entryIdx}, ${trIdx})" class="small-btn">✏️</button>
          <button onclick="deleteEntry(${entryIdx}, ${trIdx})" class="small-btn">🗑️</button>
        </td>
      `;
      tbody.appendChild(row);
    });
    
    const gapRow = document.createElement('tr');
    gapRow.innerHTML = '<td colspan="9" style="height:15px; border:none;"></td>';
    tbody.appendChild(gapRow);
  });
}

function editEntry(entryIdx, trIdx) {
  alert('⚠️ خاصية التعديل ستكون متاحة قريباً');
}

function deleteEntry(entryIdx, trIdx) {
  if (confirm('هل تريد حذف هذه العملية؟')) {
    entries[entryIdx].transactions.splice(trIdx, 1);
    if (entries[entryIdx].transactions.length === 0) {
      entries.splice(entryIdx, 1);
    }
    localStorage.setItem('entries', JSON.stringify(entries));
    renderEntries();
  }
}

// ===== دفتر الأستاذ =====
function renderLedger() {
  const tbody = document.querySelector('#tbl-ledger tbody');
  tbody.innerHTML = '';

  accounts.forEach(acc => {
    let debit = 0, credit = 0;
    entries.forEach(entry => {
      entry.transactions.forEach(tr => {
        if (tr.debit_account === acc.code) debit += tr.amount;
        if (tr.credit_account === acc.code) credit += tr.amount;
      });
    });

    const finalBalance = acc.opening_balance + debit - credit;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${acc.code}</td>
      <td>${acc.name}</td>
      <td>${acc.opening_balance.toFixed(2)}</td>
      <td>${debit.toFixed(2)}</td>
      <td>${credit.toFixed(2)}</td>
      <td>${finalBalance.toFixed(2)}</td>
      <td>${acc.balance_type}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ===== ميزان المراجعة =====
function renderTrialBalance() {
  const tbody = document.querySelector('#tbl-trial tbody');
  tbody.innerHTML = '';

  accounts.forEach(acc => {
    let debit = 0, credit = 0;
    entries.forEach(entry => {
      entry.transactions.forEach(tr => {
        if (tr.debit_account === acc.code) debit += tr.amount;
        if (tr.credit_account === acc.code) credit += tr.amount;
      });
    });

    const opening_d = acc.balance_type === 'مدين' ? acc.opening_balance : 0;
    const opening_c = acc.balance_type === 'دائن' ? acc.opening_balance : 0;
    const final = acc.opening_balance + debit - credit;
    const final_d = final > 0 ? final : 0;
    const final_c = final < 0 ? Math.abs(final) : 0;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${acc.name}</td>
      <td>${opening_d.toFixed(2)}</td>
      <td>${opening_c.toFixed(2)}</td>
      <td>${debit.toFixed(2)}</td>
      <td>${credit.toFixed(2)}</td>
      <td>${(opening_d + debit).toFixed(2)}</td>
      <td>${(opening_c + credit).toFixed(2)}</td>
      <td>${final_d.toFixed(2)}</td>
      <td>${final_c.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// التهيئة الأولية
document.addEventListener('DOMContentLoaded', () => {
  renderAccounts();
  renderEntries();
  showPage("section-accounts");
});
