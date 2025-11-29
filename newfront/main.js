// ================== التخزين الأساسي ==================

let accounts = JSON.parse(localStorage.getItem("accounts")) || [];
let entries  = JSON.parse(localStorage.getItem("entries"))  || [];

// حفظ في localStorage
function saveAccounts() {
  localStorage.setItem("accounts", JSON.stringify(accounts));
}
function saveEntries() {
  localStorage.setItem("entries", JSON.stringify(entries));
}

// ================== صفحة الحسابات ==================

function initAccountsPage() {
  const form  = document.getElementById("form-account");
  const table = document.querySelector("#tbl-accounts tbody");
  if (!form || !table) return;

  form.onsubmit = (e) => {
    e.preventDefault();

    const acc = {
      id: Date.now(),
      code: form.code.value.trim(),
      name: form.name.value.trim(),
      opening_balance: parseFloat(form.opening_balance.value) || 0,
      balance_type: form.balance_type.value  // "مدين" أو "دائن"
      // ممكن تضيف بعدين: category, note, noteNumber ...
    };

    const editId = form.getAttribute("data-edit-id");
    if (editId) {
      const idx = accounts.findIndex(a => String(a.id) === editId);
      if (idx !== -1) accounts[idx] = acc;
      form.removeAttribute("data-edit-id");
    } else {
      accounts.push(acc);
    }

    saveAccounts();
    form.reset();
    renderAccounts();
    alert("✅ تم حفظ الحساب بنجاح");
  };

  renderAccounts();
}

function renderAccounts() {
  const tbody = document.querySelector("#tbl-accounts tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  accounts.forEach((acc, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${acc.code}</td>
      <td>${acc.name}</td>
      <td>${acc.opening_balance.toFixed(2)}</td>
      <td>${acc.balance_type}</td>
      <td>
        <button type="button" class="small-btn" onclick="editAccount(${idx})">تعديل</button>
        <button type="button" class="small-btn" onclick="deleteAccount(${idx})">حذف</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editAccount(idx) {
  const acc  = accounts[idx];
  const form = document.getElementById("form-account");
  if (!acc || !form) return;

  form.code.value            = acc.code;
  form.name.value            = acc.name;
  form.opening_balance.value = acc.opening_balance;
  form.balance_type.value    = acc.balance_type;

  form.setAttribute("data-edit-id", acc.id);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteAccount(idx) {
  const acc = accounts[idx];
  if (!acc) return;
  if (!confirm(`هل تريد حذف الحساب: ${acc.name} ؟`)) return;

  accounts.splice(idx, 1);
  saveAccounts();
  renderAccounts();
}

// ================== صفحة القيود ==================

function initEntriesPage() {
  const form   = document.getElementById("form-entry");
  const tbody  = document.querySelector("#tbl-entries tbody");
  const addBtn = document.getElementById("add-transaction");

  if (!form || !tbody || !addBtn) return;

  addBtn.onclick = () => {
    const entryCode = form.entry_code.value.trim();
    const entryDate = form.entry_date.value.trim();

    if (!entryDate || !entryCode) {
      alert("❌ لازم تدخل التاريخ و رقم القيد الأول");
      return;
    }

    addTransactionRow(entryCode);
    updateAccountOptionsForEntries();
  };

  form.onsubmit = (e) => {
    e.preventDefault();

    const entryDate = form.entry_date.value.trim();
    const entryCode = form.entry_code.value.trim();

    if (!entryDate || !entryCode) {
      alert("❌ لازم تدخل التاريخ و رقم القيد");
      return;
    }

    const rows = document.querySelectorAll(".transaction-row");
    if (rows.length === 0) {
      alert("❌ لازم تضيف عملية واحدة على الأقل");
      return;
    }

    const transactions = [];
    let totalDebit  = 0;
    let totalCredit = 0;

    for (const row of rows) {
      const debitAccount  = row.querySelector(".debit-account").value;
      const creditAccount = row.querySelector(".credit-account").value;
      const amount        = parseFloat(row.querySelector(".amount").value);
      const desc          = row.querySelector(".description").value.trim();

      const d1 = row.querySelector(".debit-cc-h").value || "00";
      const d2 = row.querySelector(".debit-cc-k").value || "00";
      const d3 = row.querySelector(".debit-cc-b").value || "00";
      const d4 = row.querySelector(".debit-cc-o").value || "00";

      const c1 = row.querySelector(".credit-cc-h").value || "00";
      const c2 = row.querySelector(".credit-cc-k").value || "00";
      const c3 = row.querySelector(".credit-cc-b").value || "00";
      const c4 = row.querySelector(".credit-cc-o").value || "00";

      const debit_cc  = `${d1}-${d2}-${d3}-${d4}`;
      const credit_cc = `${c1}-${c2}-${c3}-${c4}`;

      if (!debitAccount || !creditAccount || !amount || !desc) {
        alert("❌ كل عملية لازم يكون فيها حساب مدين و دائن و مبلغ و بيان");
        return;
      }

      transactions.push({
        debit_account:  debitAccount,
        debit_cc,
        credit_account: creditAccount,
        credit_cc,
        amount,
        description: desc
      });

      totalDebit  += amount;
      totalCredit += amount;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert(`❌ القيد غير متزن 
مجموع المدين: ${totalDebit.toFixed(2)}
مجموع الدائن: ${totalCredit.toFixed(2)}`);
      return;
    }

    const entryObj = {
      id: Date.now(),
      entry_date: entryDate,
      entry_code: entryCode,
      transactions
    };

    entries.push(entryObj);
    saveEntries();
    form.reset();
    document.getElementById("transactions-container").innerHTML = "";
    renderEntries();
    alert("✅ تم حفظ القيد بنجاح");
  };

  renderEntries();
}

function addTransactionRow(entryCode) {
  const container = document.getElementById("transactions-container");
  const row = document.createElement("div");
  row.className = "transaction-row transaction";

  row.innerHTML = `
    <button type="button" class="remove-transaction">✖</button>

    <label>كود القيد
      <input type="text" class="entry-code" value="${entryCode}" readonly />
    </label>

    <label>الحساب المدين
      <select class="debit-account">
        <option value="">-- اختر --</option>
      </select>
      <div class="cost-center-input-group">
        <label>ح <input type="text" maxlength="2" class="debit-cc-h" placeholder="00" /></label>
        <label>ك <input type="text" maxlength="2" class="debit-cc-k" placeholder="00" /></label>
        <label>ب <input type="text" maxlength="2" class="debit-cc-b" placeholder="00" /></label>
        <label>أ <input type="text" maxlength="2" class="debit-cc-o" placeholder="00" /></label>
      </div>
    </label>

    <label>الحساب الدائن
      <select class="credit-account">
        <option value="">-- اختر --</option>
      </select>
      <div class="cost-center-input-group">
        <label>ح <input type="text" maxlength="2" class="credit-cc-h" placeholder="00" /></label>
        <label>ك <input type="text" maxlength="2" class="credit-cc-k" placeholder="00" /></label>
        <label>ب <input type="text" maxlength="2" class="credit-cc-b" placeholder="00" /></label>
        <label>أ <input type="text" maxlength="2" class="credit-cc-o" placeholder="00" /></label>
      </div>
    </label>

    <label>المبلغ
      <input type="number" step="0.01" class="amount" />
    </label>

    <label>البيان
      <input type="text" class="description" placeholder="بيان العملية" />
    </label>
  `;

  row.querySelector(".remove-transaction").onclick = () => row.remove();

  container.appendChild(row);
  updateAccountOptionsForEntries();
}

function updateAccountOptionsForEntries() {
  const allDebit  = document.querySelectorAll(".debit-account");
  const allCredit = document.querySelectorAll(".credit-account");

  const opts = accounts
    .map(a => `<option value="${a.code}">${a.name} (${a.code})</option>`)
    .join("");

  allDebit.forEach(sel => {
    const current = sel.value;
    sel.innerHTML = `<option value="">-- اختر --</option>${opts}`;
    if (current) sel.value = current;
  });

  allCredit.forEach(sel => {
    const current = sel.value;
    sel.innerHTML = `<option value="">-- اختر --</option>${opts}`;
    if (current) sel.value = current;
  });
}

function renderEntries() {
  const tbody = document.querySelector("#tbl-entries tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  entries.forEach((entry, eIdx) => {
    entry.transactions.forEach((tr, tIdx) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${entry.entry_date}</td>
        <td>${tr.debit_account}</td>
        <td>${tr.debit_cc}</td>
        <td>${tr.credit_account}</td>
        <td>${tr.credit_cc}</td>
        <td>${tr.amount.toFixed(2)}</td>
        <td>${tr.description}</td>
        <td>${entry.entry_code}</td>
        <td>
          <button type="button" class="small-btn" onclick="deleteEntry(${eIdx},${tIdx})">حذف</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    const gap = document.createElement("tr");
    gap.innerHTML = `<td colspan="9" style="border:none;height:10px;"></td>`;
    tbody.appendChild(gap);
  });
}

function deleteEntry(eIdx, tIdx) {
  if (!confirm("هل تريد حذف هذه العملية؟")) return;

  entries[eIdx].transactions.splice(tIdx, 1);
  if (entries[eIdx].transactions.length === 0) {
    entries.splice(eIdx, 1);
  }
  saveEntries();
  renderEntries();
}

// ================== دفتر الأستاذ ==================

function initLedgerPage() {
  const tbl = document.getElementById("tbl-ledger");
  if (!tbl) return;
  renderLedger();
}

function renderLedger() {
  const tbody = document.querySelector("#tbl-ledger tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  accounts.forEach(acc => {
    let debit  = 0;
    let credit = 0;

    entries.forEach(entry => {
      (entry.transactions || []).forEach(tr => {
        if (tr.debit_account  === acc.code)  debit  += tr.amount;
        if (tr.credit_account === acc.code) credit += tr.amount;
      });
    });

    const openingSigned = acc.balance_type === "دائن"
      ? -acc.opening_balance
      :  acc.opening_balance;

    const finalBalance = openingSigned + debit - credit;

    const tr = document.createElement("tr");
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

// ================== ميزان المراجعة ==================

function initTrialBalancePage() {
  const tbl = document.getElementById("tbl-trial");
  if (!tbl) return;
  renderTrialBalance();
}

function renderTrialBalance() {
  const tbody = document.querySelector("#tbl-trial tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  accounts.forEach(acc => {
    let debit  = 0;
    let credit = 0;

    entries.forEach(entry => {
      (entry.transactions || []).forEach(tr => {
        if (tr.debit_account  === acc.code)  debit  += tr.amount;
        if (tr.credit_account === acc.code) credit += tr.amount;
      });
    });

    // رصيد أول المدة كموجب/سالب حسب النوع
    let openingSigned = acc.opening_balance;
    if (acc.balance_type === "دائن") {
      openingSigned = -openingSigned;
    }

    const opening_d = openingSigned > 0 ? openingSigned : 0;
    const opening_c = openingSigned < 0 ? Math.abs(openingSigned) : 0;

    const total_d = opening_d + debit;
    const total_c = opening_c + credit;

    const final  = openingSigned + debit - credit;
    const final_d = final > 0 ? final : 0;
    const final_c = final < 0 ? Math.abs(final) : 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${acc.name}</td>
      <td>${opening_d.toFixed(2)}</td>
      <td>${opening_c.toFixed(2)}</td>
      <td>${debit.toFixed(2)}</td>
      <td>${credit.toFixed(2)}</td>
      <td>${total_d.toFixed(2)}</td>
      <td>${total_c.toFixed(2)}</td>
      <td>${final_d.toFixed(2)}</td>
      <td>${final_c.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ================== قائمة المركز المالي ==================

function initFinancialPositionPage() {
  const btn   = document.getElementById("generate-financial");
  const from  = document.getElementById("from-year");
  const to    = document.getElementById("to-year");
  const tbody = document.querySelector("#tbl-financial tbody");
  if (!btn || !from || !to || !tbody) return;

  btn.onclick = () => {
    const fromYear = from.value || "";
    const toYear   = to.value   || "";
    renderFinancialPosition(fromYear, toYear);
  };
}

function renderFinancialPosition(fromYear, toYear) {
  const tbody = document.querySelector("#tbl-financial tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  // category للحسابات (تضبطها انت في الداتا):
  // 'non_current_asset', 'current_asset', 'non_current_liability',
  // 'current_liability', 'equity'

  let totalNonCurrentAssets = 0;
  let totalCurrentAssets    = 0;
  let totalNonCurrentLiabEq = 0;
  let totalCurrentLiab      = 0;

  function finalBalanceFor(acc) {
    let debit  = 0;
    let credit = 0;
    entries.forEach(entry => {
      (entry.transactions || []).forEach(tr => {
        if (tr.debit_account  === acc.code)  debit  += tr.amount;
        if (tr.credit_account === acc.code) credit += tr.amount;
      });
    });

    let openingSigned = acc.opening_balance;
    if (acc.balance_type === "دائن") openingSigned = -openingSigned;

    return openingSigned + debit - credit;
  }

  function addRow(label, note, fromY, toY, amount, isTotal=false) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${label}</td>
      <td>${note || ""}</td>
      <td>${fromY || ""}</td>
      <td>${toY || ""}</td>
      <td style="text-align:center;">${amount != null ? amount.toFixed(2) : ""}</td>
    `;
    if (isTotal) tr.style.fontWeight = "700";
    tbody.appendChild(tr);
  }

  // الأصول طويلة الأجل
  accounts.filter(a => a.category === "non_current_asset").forEach(acc => {
    const bal = finalBalanceFor(acc);
    totalNonCurrentAssets += bal;
    addRow(acc.name, acc.note || "", fromYear, toYear, bal);
  });
  addRow("مجموع الأصول طويلة الأجل", "", "", "", totalNonCurrentAssets, true);
  addRow("","", "", "", null);

  // الأصول المتداولة
  accounts.filter(a => a.category === "current_asset").forEach(acc => {
    const bal = finalBalanceFor(acc);
    totalCurrentAssets += bal;
    addRow(acc.name, acc.note || "", fromYear, toYear, bal);
  });
  addRow("مجموع الأصول المتداولة", "", "", "", totalCurrentAssets, true);

  const totalAssets = totalNonCurrentAssets + totalCurrentAssets;
  addRow("إجمالي الأصول", "", "", "", totalAssets, true);
  addRow("","", "", "", null);

  // الخصوم طويلة الأجل + حقوق الملكية
  accounts.filter(a =>
    a.category === "non_current_liability" ||
    a.category === "equity"
  ).forEach(acc => {
    const bal = finalBalanceFor(acc);
    totalNonCurrentLiabEq += bal;
    addRow(acc.name, acc.note || "", fromYear, toYear, bal);
  });
  addRow("مجموع الخصوم طويلة الأجل وحقوق الملكية", "", "", "", totalNonCurrentLiabEq, true);
  addRow("","", "", "", null);

  // الالتزامات قصيرة الأجل
  accounts.filter(a => a.category === "current_liability").forEach(acc => {
    const bal = finalBalanceFor(acc);
    totalCurrentLiab += bal;
    addRow(acc.name, acc.note || "", fromYear, toYear, bal);
  });
  addRow("مجموع الالتزامات قصيرة الأجل", "", "", "", totalCurrentLiab, true);

  const totalLiab = totalNonCurrentLiabEq + totalCurrentLiab;
  addRow("إجمالي الخصوم والالتزامات", "", "", "", totalLiab, true);
  addRow("","", "", "", null);

  const diff = totalAssets - totalLiab;
  addRow("الفرق بين إجمالي الأصول وإجمالي الخصوم والالتزامات", "", "", "", diff, true);
}

// ================== تهيئة الصفحات ==================

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("form-account"))       initAccountsPage();
  if (document.getElementById("form-entry"))         initEntriesPage();
  if (document.getElementById("tbl-ledger"))         initLedgerPage();
  if (document.getElementById("tbl-trial"))          initTrialBalancePage();
  if (document.getElementById("generate-financial")) initFinancialPositionPage();
});
