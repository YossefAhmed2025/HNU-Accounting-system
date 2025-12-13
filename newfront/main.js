// ================== التخزين الأساسي ==================
let accounts = JSON.parse(localStorage.getItem("accounts")) || [];
let entries  = JSON.parse(localStorage.getItem("entries"))  || [];
let users    = JSON.parse(localStorage.getItem("users"))    || [];

// ================== بيانات الكليات والبرامج ==================
const collegesData = {
  "كلية الطب البشري": [
    "برنامج الطب والجراحة"
  ],
  "كلية طب الأسنان": [
    "برنامج طب وجراحة الفم والأسنان"
  ],
  "كلية العلاج الطبيعي": [
    "برنامج العلاج الطبيعي"
  ],
  "كلية الهندسة": [
    "برنامج هندسة العمارة والتصميم البيئي",
    "برنامج هندسة النظم الذكية",
    "برنامج هندسة الروبوتات والميكاترونيات",
    "برنامج الأمن السيبراني"
  ],
  "كلية العلوم والإنسانيات (قطاع الأعمال)": [
    "برنامج إدارة الأعمال والتحول الرقمي (BDIT)",
    "برنامج الاقتصاد الرقمي وريادة الأعمال",
    "برنامج اللوجستيات وسلاسل الإمداد"
  ],
  "كلية الفنون والفنون التطبيقية": [
    "برنامج التصميم الداخلي البيئي",
    "برنامج الرسوم المتحركة والمؤثرات البصرية",
    "برنامج الاتصال البصري وفنون الميديا"
  ],
  "كلية العلوم الصحية التطبيقية": [
    "برنامج تكنولوجيا المختبرات الطبية"
  ],
  "كلية العلوم": [
    "برنامج التكنولوجيا الحيوية والهندسة الوراثية",
    "برنامج علوم الكيمياء الصناعية"
  ],
  "كلية العلوم الإنسانية": [
    "برنامج الدراسات القانونية"
  ]
};

// حفظ في localStorage
function saveAccounts() {
  localStorage.setItem("accounts", JSON.stringify(accounts));
}
function saveEntries() {
  localStorage.setItem("entries", JSON.stringify(entries));
}
function saveUsers() {
  localStorage.setItem("users", JSON.stringify(users));
}

// ================== صفحة الحسابات ==================
function initAccountsPage() {
  const form  = document.getElementById("form-account");
  const table = document.querySelector("#tbl-accounts tbody");
  if (!form || !table) return;

  form.onsubmit = (e) => {
    e.preventDefault();

    const reportType  = form.report_type  ? form.report_type.value  : "financial";
    const incomeType  = form.income_type  ? form.income_type.value  : "";
    const incomeGroup = form.income_group ? form.income_group.value : "";

    const acc = {
      id: Date.now(),
      code: form.code.value.trim(),
      name: form.name.value.trim(),
      opening_balance: parseFloat(form.opening_balance.value) || 0,
      balance_type: form.balance_type.value,   // مدين / دائن
      report_type: reportType,                 // financial / income
      category: incomeType || null,            // revenue / expense / null
      income_group: incomeGroup || null        // للتوسع لاحقًا
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
  if (form.report_type)  form.report_type.value  = acc.report_type || "financial";
  if (form.income_type)  form.income_type.value  = acc.category    || "";
  if (form.income_group) form.income_group.value = acc.income_group || "";

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
  const form        = document.getElementById("form-entry");
  const tbody       = document.querySelector("#tbl-entries tbody");
  const addDebitBtn = document.getElementById("add-debit");
  const addCreditBtn = document.getElementById("add-credit");

  if (!form || !tbody || !addDebitBtn || !addCreditBtn) return;

  // زر إضافة حساب مدين
  addDebitBtn.onclick = () => {
    addDebitAccount();
    updateAccountOptionsForEntries();
  };

  // زر إضافة حساب دائن
  addCreditBtn.onclick = () => {
    addCreditAccount();
    updateAccountOptionsForEntries();
  };

  // حفظ القيد
  form.onsubmit = (e) => {
    e.preventDefault();

    const entryDate = form.entry_date.value.trim();
    const entryCode = form.entry_code.value.trim();

    if (!entryDate || !entryCode) {
      alert("❌ لازم تدخل التاريخ و رقم القيد");
      return;
    }

    // منع تكرار رقم القيد
    const exists = entries.some(en => en.entry_code === entryCode);
    if (exists) {
      alert("❌ رقم القيد مسجّل من قبل، اختر رقمًا آخر.");
      return;
    }

    const debitItems  = document.querySelectorAll("#debit-container .account-item");
    const creditItems = document.querySelectorAll("#credit-container .account-item");

    if (debitItems.length === 0 && creditItems.length === 0) {
      alert("❌ لازم تضيف حساب مدين أو دائن واحد على الأقل");
      return;
    }

    const transactions = [];
    let totalDebit  = 0;
    let totalCredit = 0;

    // جمع البيانات من الحسابات المدينة
    const debitAccounts = [];
    for (const item of debitItems) {
      const account = item.querySelector(".account-select").value;
      const amount  = parseFloat(item.querySelector(".amount-input").value) || 0;
      const desc    = item.querySelector(".description-input").value.trim();

      const h = item.querySelector(".cc-h").value || "00";
      const k = item.querySelector(".cc-k").value || "00";
      const b = item.querySelector(".cc-b").value || "00";
      const o = item.querySelector(".cc-o").value || "00";
      const costCenter = `${h}-${k}-${b}-${o}`;

      if (!account) {
        alert("❌ كل حساب مدين لازم تختار الحساب");
        return;
      }
      if (amount <= 0) {
        alert("❌ كل حساب مدين لازم يكون له مبلغ أكبر من صفر");
        return;
      }

      debitAccounts.push({ account, amount, desc, costCenter });
      totalDebit += amount;
    }

    // جمع البيانات من الحسابات الدائنة
    const creditAccounts = [];
    for (const item of creditItems) {
      const account = item.querySelector(".account-select").value;
      const amount  = parseFloat(item.querySelector(".amount-input").value) || 0;
      const desc    = item.querySelector(".description-input").value.trim();

      const h = item.querySelector(".cc-h").value || "00";
      const k = item.querySelector(".cc-k").value || "00";
      const b = item.querySelector(".cc-b").value || "00";
      const o = item.querySelector(".cc-o").value || "00";
      const costCenter = `${h}-${k}-${b}-${o}`;

      if (!account) {
        alert("❌ كل حساب دائن لازم تختار الحساب");
        return;
      }
      if (amount <= 0) {
        alert("❌ كل حساب دائن لازم يكون له مبلغ أكبر من صفر");
        return;
      }

      creditAccounts.push({ account, amount, desc, costCenter });
      totalCredit += amount;
    }

    // التحقق من توازن القيد
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      alert(`❌ القيد غير متزن
مجموع المدين: ${totalDebit.toFixed(2)}
مجموع الدائن: ${totalCredit.toFixed(2)}`);
      return;
    }

    // إنشاء العمليات (transactions) من الحسابات
    // كل حساب مدين مع كل حساب دائن
    for (const deb of debitAccounts) {
      for (const cred of creditAccounts) {
        // نسبة المبلغ حسب النسبة بين الحسابات
        const ratio = (deb.amount / totalDebit) * (cred.amount / totalCredit);
        const transAmount = Math.min(deb.amount, cred.amount);

        transactions.push({
          debit_account:  deb.account,
          debit_cc:       deb.costCenter,
          debit_amount:   deb.amount,
          credit_account: cred.account,
          credit_cc:      cred.costCenter,
          credit_amount:  cred.amount,
          description:    deb.desc || cred.desc || "بدون بيان"
        });
      }
    }

    // إذا كان عدد الحسابات غير متساوي، نحفظ كل حساب مع أول حساب من الجانب الآخر
    if (debitAccounts.length > 0 && creditAccounts.length > 0) {
      transactions.length = 0; // نمسح العمليات السابقة

      const maxLen = Math.max(debitAccounts.length, creditAccounts.length);
      for (let i = 0; i < maxLen; i++) {
        const deb  = debitAccounts[i] || debitAccounts[0];
        const cred = creditAccounts[i] || creditAccounts[0];

        transactions.push({
          debit_account:  deb.account,
          debit_cc:       deb.costCenter,
          debit_amount:   deb.amount,
          credit_account: cred.account,
          credit_cc:      cred.costCenter,
          credit_amount:  cred.amount,
          description:    deb.desc || cred.desc || "بدون بيان"
        });
      }
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
    document.getElementById("debit-container").innerHTML = "";
    document.getElementById("credit-container").innerHTML = "";
    renderEntries();
    alert("✅ تم حفظ القيد بنجاح");
  };

  renderEntries();
}


// إضافة حساب مدين
function addDebitAccount() {
  const container = document.getElementById("debit-container");
  const item = document.createElement("div");
  item.className = "account-item";

  item.innerHTML = `
    <button type="button" class="remove-account">✖ حذف</button>

    <label>الحساب
      <div class="account-search-container">
        <input
          type="text"
          class="account-search-input"
          placeholder="ابحث باسم أو رقم الحساب..."
          autocomplete="off"
        />
        <button type="button" class="dropdown-toggle">▼</button>
        <div class="account-dropdown-list"></div>
        <input type="hidden" class="account-select" />
      </div>
    </label>

    <label>مركز التكلفة
      <div class="cost-center-input-group">
        <label>ح <input type="text" maxlength="2" class="cc-h" placeholder="00" /></label>
        <label>ك <input type="text" maxlength="2" class="cc-k" placeholder="00" /></label>
        <label>ب <input type="text" maxlength="2" class="cc-b" placeholder="00" /></label>
        <label>أ <input type="text" maxlength="2" class="cc-o" placeholder="00" /></label>
      </div>
    </label>

    <label>المبلغ
      <input type="number" step="0.01" class="amount-input" placeholder="0.00" />
    </label>

    <label>البيان
      <input type="text" class="description-input" placeholder="بيان الحساب" />
    </label>
  `;

  const removeBtn = item.querySelector(".remove-account");
  const searchInput = item.querySelector(".account-search-input");
  const dropdownToggleBtn = item.querySelector(".dropdown-toggle");
  const hiddenSelect = item.querySelector(".account-select");
  const dropdownList = item.querySelector(".account-dropdown-list");

  removeBtn.onclick = () => item.remove();

  // Event listener for search input
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    updateAccountDropdown(query, hiddenSelect, dropdownList, searchInput);
  });

  // Show dropdown when input is focused
  searchInput.addEventListener("focus", () => {
    updateAccountDropdown("", hiddenSelect, dropdownList, searchInput);
  });

  // Toggle dropdown when button is clicked
  dropdownToggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const isHidden = dropdownList.style.display === "none";
    if (isHidden) {
      updateAccountDropdown("", hiddenSelect, dropdownList, searchInput);
    } else {
      dropdownList.style.display = "none";
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    // تحقق إذا كانت النقرة خارج حاوية البحث
    if (!item.querySelector(".account-search-container").contains(e.target)) {
      dropdownList.style.display = "none";
    }
  });

  container.appendChild(item);
}

// إضافة حساب دائن
function addCreditAccount() {
  const container = document.getElementById("credit-container");
  const item = document.createElement("div");
  item.className = "account-item";

  item.innerHTML = `
    <button type="button" class="remove-account">✖ حذف</button>

    <label>الحساب
      <div class="account-search-container">
        <input
          type="text"
          class="account-search-input"
          placeholder="ابحث باسم أو رقم الحساب..."
          autocomplete="off"
        />
        <button type="button" class="dropdown-toggle">▼</button>
        <div class="account-dropdown-list"></div>
        <input type="hidden" class="account-select" />
      </div>
    </label>

    <label>مركز التكلفة
      <div class="cost-center-input-group">
        <label>ح <input type="text" maxlength="2" class="cc-h" placeholder="00" /></label>
        <label>ك <input type="text" maxlength="2" class="cc-k" placeholder="00" /></label>
        <label>ب <input type="text" maxlength="2" class="cc-b" placeholder="00" /></label>
        <label>أ <input type="text" maxlength="2" class="cc-o" placeholder="00" /></label>
      </div>
    </label>

    <label>المبلغ
      <input type="number" step="0.01" class="amount-input" placeholder="0.00" />
    </label>

    <label>البيان
      <input type="text" class="description-input" placeholder="بيان الحساب" />
    </label>
  `;

  const removeBtn = item.querySelector(".remove-account");
  const searchInput = item.querySelector(".account-search-input");
  const dropdownToggleBtn = item.querySelector(".dropdown-toggle");
  const hiddenSelect = item.querySelector(".account-select");
  const dropdownList = item.querySelector(".account-dropdown-list");

  removeBtn.onclick = () => item.remove();

  // Event listener for search input
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase().trim();
    updateAccountDropdown(query, hiddenSelect, dropdownList, searchInput);
  });

  // Show dropdown when input is focused
  searchInput.addEventListener("focus", () => {
    updateAccountDropdown("", hiddenSelect, dropdownList, searchInput);
  });

  // Toggle dropdown when button is clicked
  dropdownToggleBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const isHidden = dropdownList.style.display === "none";
    if (isHidden) {
      updateAccountDropdown("", hiddenSelect, dropdownList, searchInput);
    } else {
      dropdownList.style.display = "none";
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    // تحقق إذا كانت النقرة خارج حاوية البحث
    if (!item.querySelector(".account-search-container").contains(e.target)) {
      dropdownList.style.display = "none";
    }
  });

  container.appendChild(item);
}

// دالة تحديث dropdown قائمة الحسابات مع البحث
function updateAccountDropdown(query, hiddenSelect, dropdownList, searchInput) {
  // تصفية الحسابات بناءً على البحث
  const filteredAccounts = accounts.filter(acc => {
    const searchText = query.toLowerCase();
    const nameMatch = acc.name.toLowerCase().includes(searchText);
    const codeMatch = acc.code.toLowerCase().includes(searchText);
    return nameMatch || codeMatch;
  });

  // تنظيف القائمة
  dropdownList.innerHTML = "";

  if (filteredAccounts.length === 0) {
    dropdownList.style.display = "none";
    return;
  }

  // إضافة كل حساب إلى القائمة
  filteredAccounts.forEach(acc => {
    const option = document.createElement("div");
    option.className = "dropdown-option";
    option.innerHTML = `<strong>${acc.name}</strong> <span class="code">(${acc.code})</span>`;
    option.style.cursor = "pointer";
    option.style.padding = "8px 12px";
    option.style.borderBottom = "1px solid rgba(255,255,255,0.1)";

    option.addEventListener("click", () => {
      hiddenSelect.value = acc.code;
      searchInput.value = `${acc.name} (${acc.code})`;
      dropdownList.style.display = "none";
    });

    option.addEventListener("mouseenter", () => {
      option.style.backgroundColor = "rgba(6, 182, 212, 0.2)";
    });

    option.addEventListener("mouseleave", () => {
      option.style.backgroundColor = "transparent";
    });

    dropdownList.appendChild(option);
  });

  dropdownList.style.display = "block";
}

function updateAccountOptionsForEntries() {
  const allSelects = document.querySelectorAll(".account-select");

  const opts = accounts
    .map(a => `<option value="${a.code}">${a.name} (${a.code})</option>`)
    .join("");

  allSelects.forEach(sel => {
    const current = sel.value;
    sel.innerHTML = `<option value="">-- اختر الحساب --</option>${opts}`;
    if (current) sel.value = current;
  });
}

function renderEntries() {
  const tbody = document.querySelector("#tbl-entries tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  entries.forEach((entry, eIdx) => {
    entry.transactions.forEach((tr, tIdx) => {
      // نجيب بيانات الحسابين من مصفوفة الحسابات
      const debitAcc  = accounts.find(a => a.code === tr.debit_account);
      const creditAcc = accounts.find(a => a.code === tr.credit_account);

      const debitLabel  = debitAcc  ? `${debitAcc.name} (${debitAcc.code})`   : tr.debit_account;
      const creditLabel = creditAcc ? `${creditAcc.name} (${creditAcc.code})` : tr.credit_account;

      // دعم الصيغة القديمة (amount) والجديدة (debit_amount, credit_amount)
      const debitAmount  = tr.debit_amount  !== undefined ? tr.debit_amount  : (tr.amount || 0);
      const creditAmount = tr.credit_amount !== undefined ? tr.credit_amount : (tr.amount || 0);

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${entry.entry_date}</td>
        <td>${debitLabel}</td>
        <td>${tr.debit_cc}</td>
        <td>${debitAmount.toFixed(2)}</td>
        <td>${creditLabel}</td>
        <td>${tr.credit_cc}</td>
        <td>${creditAmount.toFixed(2)}</td>
        <td>${tr.description}</td>
        <td>${entry.entry_code}</td>
        <td>
          <button type="button" class="small-btn" onclick="deleteEntry(${eIdx},${tIdx})">حذف</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    const gap = document.createElement("tr");
    gap.innerHTML = `<td colspan="10" style="border:none;height:10px;"></td>`;
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
        // دعم الصيغة القديمة والجديدة
        const debitAmt  = tr.debit_amount  !== undefined ? tr.debit_amount  : (tr.amount || 0);
        const creditAmt = tr.credit_amount !== undefined ? tr.credit_amount : (tr.amount || 0);

        if (tr.debit_account  === acc.code)  debit  += debitAmt;
        if (tr.credit_account === acc.code) credit += creditAmt;
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
        // دعم الصيغة القديمة والجديدة
        const debitAmt  = tr.debit_amount  !== undefined ? tr.debit_amount  : (tr.amount || 0);
        const creditAmt = tr.credit_amount !== undefined ? tr.credit_amount : (tr.amount || 0);

        if (tr.debit_account  === acc.code)  debit  += debitAmt;
        if (tr.credit_account === acc.code) credit += creditAmt;
      });
    });

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

  let totalNonCurrentAssets = 0;
  let totalCurrentAssets    = 0;
  let totalNonCurrentLiabEq = 0;
  let totalCurrentLiab      = 0;

  function finalBalanceFor(acc) {
    let debit  = 0;
    let credit = 0;
    entries.forEach(entry => {
      (entry.transactions || []).forEach(tr => {
        // دعم الصيغة القديمة والجديدة
        const debitAmt  = tr.debit_amount  !== undefined ? tr.debit_amount  : (tr.amount || 0);
        const creditAmt = tr.credit_amount !== undefined ? tr.credit_amount : (tr.amount || 0);

        if (tr.debit_account  === acc.code)  debit  += debitAmt;
        if (tr.credit_account === acc.code) credit += creditAmt;
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

  accounts.filter(a => a.category === "non_current_asset").forEach(acc => {
    const bal = finalBalanceFor(acc);
    totalNonCurrentAssets += bal;
    addRow(acc.name, acc.note || "", fromYear, toYear, bal);
  });
  addRow("مجموع الأصول طويلة الأجل", "", "", "", totalNonCurrentAssets, true);
  addRow("","", "", "", null);

  accounts.filter(a => a.category === "current_asset").forEach(acc => {
    const bal = finalBalanceFor(acc);
    totalCurrentAssets += bal;
    addRow(acc.name, acc.note || "", fromYear, toYear, bal);
  });
  addRow("مجموع الأصول المتداولة", "", "", "", totalCurrentAssets, true);

  const totalAssets = totalNonCurrentAssets + totalCurrentAssets;
  addRow("إجمالي الأصول", "", "", "", totalAssets, true);
  addRow("","", "", "", null);

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

// ================== قائمة الدخل ==================
function initIncomeStatementPage() {
  const btn   = document.getElementById("generate-report-is");
  const from  = document.getElementById("from-year-is");
  const to    = document.getElementById("to-year-is");
  const tbody = document.querySelector("#tbl-income-statement tbody");
  if (!btn || !from || !to || !tbody) return;

  btn.onclick = () => {
    const fromYear = from.value || "";
    const toYear   = to.value   || "";
    renderIncomeStatement(fromYear, toYear);
  };
}

/* 
  Fixed: renderIncomeStatement
  - Normalizes transaction field names (supports both legacy and current).
  - Filters entries by year (entry.entry_date) when fromYear/toYear provided.
  - Normalizes cost-center strings safely before classification.
  - Displays expenses as negative values (no Math.abs on displayed values).
  - Avoids exceptions on malformed dates or missing fields.
*/
function renderIncomeStatement(fromYear, toYear) {
    const tbody = document.querySelector('#tbl-income-statement tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';

    const fromY = parseInt(fromYear) || null;
    const toY = parseInt(toYear) || null;

    // Helper to get field from transaction supporting multiple possible names
    function getField(tr, candidates) {
        for (const c of candidates) {
            if (tr[c] !== undefined && tr[c] !== null) return tr[c];
        }
        return undefined;
    }

    // Normalize cost center string: remove spaces, non-digit/- chars
    function normalizeCC(cc) {
        if (!cc && cc !== 0) return '';
        let s = String(cc).trim();
        s = s.replace(/\s+/g, '');
        // allow digits and dash only
        s = s.replace(/[^0-9\-]/g, '');
        // ensure 4 parts by padding with '00' if needed
        const parts = s.split('-').filter(p => p !== '');
        while (parts.length < 4) parts.push('00');
        return parts.slice(0,4).join('-');
    }

    // Classify revenue cost-center based on normalized cost center (HH-FF-PP-OO)
    function classifyRevenueByCostCenter(creditcc) {
        if (!creditcc) return null;
        const parts = creditcc.split('-');
        if (parts.length !== 4) return null;
        const h = parts[0], f = parts[1], p = parts[2], o = parts[3];
        if (h !== '20') return null;
        if (f === '00' && p === '00' && o !== '01') return 'otherrevenue';
        if (o === '01') return 'adminfee';
        return 'tuitionfee';
    }

    // Classify expense cost-center based on normalized cost center
    function classifyExpenseByCostCenter(debitcc) {
        if (!debitcc) return null;
        const parts = debitcc.split('-');
        if (parts.length !== 4) return null;
        const h = parts[0], f = parts[1], p = parts[2];
        if (h === '40') return 'salaries';
        if (h === '30') return 'operating';
        if (f === '00' && p === '00') {
            if (h === '02') return 'bankfees';
            if (h === '01') return 'adminexpenses';
            if (h === '03') return 'marketing';
            if (h === '04') return 'depreciation';
            if (h === '05') return 'provisions';
            if (h === '06') return 'badddebts';
            if (h === '07') return 'financecosts';
        }
        return null;
    }

    // Totals (kept positive for internal math)
    let totalTuition = 0, totalAdmin = 0;
    let totalSalaries = 0, totalOperating = 0;
    let totalOtherRevenue = 0, totalBankInterest = 0;
    let totalBankFees = 0, totalAdminExpenses = 0, totalMarketing = 0;
    let totalDepreciation = 0, totalProvisions = 0, totalBadDebts = 0;
    let totalFinanceCosts = 0;
    let totalDonations = 0, totalCapitalGains = 0, totalSecuritiesGains = 0;

    // Iterate entries with optional year filter
    entries.forEach(entry => {
        try {
            if ((fromY || toY) && entry.entry_date) {
                const dt = new Date(entry.entry_date);
                if (isNaN(dt.getTime())) {
                    // skip entry with invalid date when filtering by year
                    if (fromY || toY) return;
                } else {
                    const yr = dt.getFullYear();
                    if (fromY && yr < fromY) return;
                    if (toY && yr > toY) return;
                }
            }

            (entry.transactions || []).forEach(tr => {
                // robust extraction of account codes and amounts and cost centers
                const creditAccount = getField(tr, ['credit_account','creditaccount','creditAcc','credit']);
                const debitAccount  = getField(tr, ['debit_account','debitaccount','debitAcc','debit']);
                const debitAmt  = Number(getField(tr, ['debit_amount','debitamount','amount'])) || 0;
                const creditAmt = Number(getField(tr, ['credit_amount','creditamount','amount'])) || 0;

                const rawCreditCC = getField(tr, ['credit_cc','creditcc','creditcostcenter']) || '';
                const rawDebitCC  = getField(tr, ['debit_cc','debitcc','debitcostcenter']) || '';
                const creditCC = normalizeCC(rawCreditCC);
                const debitCC  = normalizeCC(rawDebitCC);

                // classify revenues
                const revGroup = classifyRevenueByCostCenter(creditCC);
                if (revGroup === 'tuitionfee') totalTuition += creditAmt;
                else if (revGroup === 'adminfee') totalAdmin += creditAmt;
                else if (revGroup === 'otherrevenue') totalOtherRevenue += creditAmt;

                // bank interest and capital revenue by account code (existing logic)
                if (String(creditAccount) === '50000000') totalBankInterest += creditAmt;
                if (String(creditAccount) === '60000000') totalDonations += creditAmt;
                if (String(creditAccount) === '61000000') totalCapitalGains += creditAmt;
                if (String(creditAccount) === '62000000') totalSecuritiesGains += creditAmt;

                // classify expenses
                const expGroup = classifyExpenseByCostCenter(debitCC);
                if (expGroup === 'salaries') totalSalaries += debitAmt;
                else if (expGroup === 'operating') totalOperating += debitAmt;
                else if (expGroup === 'bankfees') totalBankFees += debitAmt;
                else if (expGroup === 'adminexpenses') totalAdminExpenses += debitAmt;
                else if (expGroup === 'marketing') totalMarketing += debitAmt;
                else if (expGroup === 'depreciation') totalDepreciation += debitAmt;
                else if (expGroup === 'provisions') totalProvisions += debitAmt;
                else if (expGroup === 'badddebts') totalBadDebts += debitAmt;
                else if (expGroup === 'financecosts') totalFinanceCosts += debitAmt;
            });
        } catch (e) {
            console.error('Income statement processing error for entry', entry, e);
            // continue processing other entries
        }
    });

    function addRow(label, note, fromYText, toYText, amount, isTotal = false) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${label}</td>
            <td>${note || ''}</td>
            <td>${fromYText || ''}</td>
            <td>${toYText || ''}</td>
            <td style="text-align:center">${amount != null ? Number(amount).toFixed(2) : ''}</td>
        `;
        if (isTotal) tr.style.fontWeight = '700';
        tbody.appendChild(tr);
    }

    // Build rows:
    addRow('إيرادات العمليه التعليميه', '', '', '', null);
    addRow('إيرادات المصروفات الدراسية', '', fromYear, toYear, totalTuition, true);
    addRow('إيرادات المصروفات الإدارية', '', fromYear, toYear, totalAdmin, true);
    const totalTeachingRevenue = totalTuition + totalAdmin;
    addRow('إجمالي إيرادات العمليه التعليميه', '', '', '', totalTeachingRevenue, true);
    
    addRow('يخصم:', '', '', '', null);
    addRow('المرتبات و الأجور و البدلات', '', fromYear, toYear, totalSalaries, true);
    addRow('مصروفات التشغيل', '', fromYear, toYear, totalOperating, true);
    const totalTeachingExpenses = totalSalaries + totalOperating;
    addRow('إجمالي الخصومات من إيرادات العمليه التعليميه', '', '', '', totalTeachingExpenses, true);
    
    const teachingNet = totalTeachingRevenue - totalTeachingExpenses;
    addRow(teachingNet >= 0 ? 'فائض العمليه التعليمية بعد الخصم' : 'عجز العمليه التعليمية بعد الخصم', '', '', '', teachingNet, true);
    
    // الإيرادات الأخرى
    addRow('إيرادات أخرى', '', fromYear, toYear, totalOtherRevenue, true);
    addRow('فوائد بنكية دائنة', '', fromYear, toYear, totalBankInterest, true);
    const totalOtherRevenueFinal = totalOtherRevenue + totalBankInterest;
    addRow('إجمالي الإيرادات الأخرى', '', '', '', totalOtherRevenueFinal, true);
    
    // المصروفات والأعباء الإدارية
    addRow('المصروفات والأعباء الإدارية', '', '', '', null);
    addRow('عمولة ومصروفات بنكية مدينة', '', fromYear, toYear, totalBankFees, true);
    addRow('المصروفات الإدارية والعامة', '', fromYear, toYear, totalAdminExpenses, true);
    addRow('المصروفات التسويقية والبيعية', '', fromYear, toYear, totalMarketing, true);
    addRow('الإهلاكات', '', fromYear, toYear, totalDepreciation, true);
    addRow('مخصصات بخلاف الإهلاك', '', fromYear, toYear, totalProvisions, true);
    addRow('ديون معدومة', '', fromYear, toYear, totalBadDebts, true);
    addRow('كلفة الخدمات التمويلية', '', fromYear, toYear, totalFinanceCosts, true);
    
    const totalAdminBurden = totalBankFees + totalAdminExpenses + totalMarketing + 
                            totalDepreciation + totalProvisions + totalBadDebts + totalFinanceCosts;
    addRow('إجمالي المصروفات والأعباء الإدارية', '', '', '', totalAdminBurden, true);
    
    // الإيرادات الرأسمالية الجديدة
    addRow('التبرعات', '', fromYear, toYear, totalDonations, true);
    addRow('أرباح أو خسائر رأسمالية', '', fromYear, toYear, totalCapitalGains, true);
    addRow('أرباح أو خسائر بيع أوراق مالية', '', fromYear, toYear, totalSecuritiesGains, true);
    
    // صافي الفائض/العجز قبل ضريبة الدخل
    const netBeforeTax = totalTeachingRevenue - totalTeachingExpenses + totalOtherRevenueFinal - totalAdminBurden + 
                        totalDonations + totalCapitalGains + totalSecuritiesGains;
    addRow(netBeforeTax >= 0 ? 'صافي الفائض قبل ضريبة الدخل' : 'صافي العجز قبل ضريبة الدخل', 
           '', '', '', netBeforeTax, true);
}

// ================== صفحة المستخدمين ==================
function initUsersPage() {
  const form = document.getElementById("form-user");
  const tbody = document.querySelector("#users-tbl tbody");
  const searchInput = document.getElementById("search-users");

  if (!form || !tbody) return;

  // حفظ موظف جديد
  form.onsubmit = (e) => {
    e.preventDefault();

    const password = form.password.value;
    const confirmPassword = form.confirm_password.value;

    if (password !== confirmPassword) {
      alert("❌ كلمات المرور غير متطابقة");
      return;
    }

    // جمع الصلاحيات المختارة
    const permissions = {};
    const permissionInputs = form.querySelectorAll("input[name^='perm_']");
    permissionInputs.forEach(input => {
      permissions[input.name] = input.checked;
    });

    const user = {
      id: Date.now(),
      fullname: form.fullname.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      username: form.username.value.trim(),
      password: password, // في بيئة production استخدم hashing
      role: form.role.value,
      status: form.status.value,
      permissions: permissions,
      created_at: new Date().toLocaleDateString("ar-EG")
    };

    // تحقق من عدم تكرار اسم المستخدم
    const exists = users.some(u => u.username === user.username);
    if (exists) {
      alert("❌ اسم المستخدم مسجّل من قبل");
      return;
    }

    users.push(user);
    saveUsers();
    form.reset();
    renderUsers();
    updateUserStats();
    alert("✅ تم إضافة الموظف بنجاح");
  };

  // البحث عن موظف
  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    const filteredUsers = users.filter(u =>
      u.fullname.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.username.toLowerCase().includes(query)
    );
    renderUsers(filteredUsers);
  });

  renderUsers();
  updateUserStats();
}

function renderUsers(usersToRender = users) {
  const tbody = document.querySelector("#users-tbl tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const roleMap = {
    "super_admin": "مدير النظام",
    "manager": "مدير",
    "accountant": "محاسب",
    "viewer": "مشاهد فقط"
  };

  usersToRender.forEach((user, idx) => {
    const roleLabel = roleMap[user.role] || user.role;
    const statusClass = user.status === "active" ? "status-active" : "status-inactive";
    const statusLabel = user.status === "active" ? "نشط" : "غير نشط";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${user.fullname}</td>
      <td>${user.email}</td>
      <td>${user.phone || "-"}</td>
      <td><span class="role-badge">${roleLabel}</span></td>
      <td>${user.created_at}</td>
      <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
      <td>
        <div class="user-actions">
          <button type="button" class="btn-edit" onclick="editUser(${idx})">تعديل</button>
          <button type="button" class="btn-permissions" onclick="editPermissions(${idx})">الصلاحيات</button>
          <button type="button" class="btn-delete" onclick="deleteUser(${idx})">حذف</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/*
  Fixed: updateUserStats
  - Guard DOM access so missing elements do not cause exceptions.
*/
function updateUserStats() {
  const total = users.length;
  const active = users.filter(u => u.status === "active").length;
  const inactive = users.filter(u => u.status === "inactive").length;

  const elTotal = document.getElementById("stat-total");
  const elActive = document.getElementById("stat-active");
  const elInactive = document.getElementById("stat-inactive");

  if (elTotal) elTotal.textContent = total;
  if (elActive) elActive.textContent = active;
  if (elInactive) elInactive.textContent = inactive;
}

/*
  Fixed: updateReportCounts
  - Guard DOM element access to avoid exceptions when elements missing.
*/
function updateReportCounts() {
  const eAccounts = document.getElementById("count-accounts");
  const eEntries = document.getElementById("count-entries");
  const eUsers = document.getElementById("count-users");

  if (eAccounts) eAccounts.textContent = accounts.length;
  if (eEntries) eEntries.textContent = entries.length;
  if (eUsers) eUsers.textContent = users.length;
}

// ================== صفحة التقارير ==================
let reportFilters = {
  search: "",
  reportType: "",
  account: "",
  college: "",
  program: "",
  fromDate: null,
  toDate: null
};

function initReportsPage() {
  const btnApplyFilters = document.getElementById("btn-apply-filters");
  const btnClearFilters = document.getElementById("btn-clear-filters");
  const btnExportPdf = document.getElementById("btn-export-pdf");
  const btnExportExcel = document.getElementById("btn-export-excel");
  const filterSearch = document.getElementById("filter-search");
  const filterReportType = document.getElementById("filter-report-type");
  const filterAccount = document.getElementById("filter-account");
  const filterCollege = document.getElementById("filter-college");
  const filterProgram = document.getElementById("filter-program");
  const fromDateInput = document.getElementById("filter-from-date");
  const toDateInput = document.getElementById("filter-to-date");

  if (!btnApplyFilters) return;

  // ملء قائمة الحسابات والكليات والبرامج في الفلترة
  populateFilterAccounts();
  populateFilterColleges();

  // عند تغيير الكلية، تحديث البرامج
  filterCollege.addEventListener("change", () => {
    populateFilterPrograms(filterCollege.value);
    filterProgram.value = "";
  });

  // تطبيق الفلترة
  btnApplyFilters.addEventListener("click", () => {
    reportFilters.search = filterSearch.value.trim();
    reportFilters.reportType = filterReportType.value;
    reportFilters.account = filterAccount.value;
    reportFilters.college = filterCollege.value;
    reportFilters.program = filterProgram.value;
    reportFilters.fromDate = fromDateInput.value ? new Date(fromDateInput.value) : null;
    reportFilters.toDate = toDateInput.value ? new Date(toDateInput.value) : null;

    applyReportFilters();
    showFilterStats();
  });

  // إعادة تعيين الفلترة
  btnClearFilters.addEventListener("click", () => {
    filterSearch.value = "";
    filterReportType.value = "";
    filterAccount.value = "";
    filterCollege.value = "";
    filterProgram.value = "";
    fromDateInput.value = "";
    toDateInput.value = "";
    populateFilterPrograms("");

    reportFilters = {
      search: "",
      reportType: "",
      account: "",
      college: "",
      program: "",
      fromDate: null,
      toDate: null
    };

    document.getElementById("filter-stats").style.display = "none";
  });

  // تصدير PDF
  btnExportPdf.addEventListener("click", () => {
    exportToPDF();
  });

  // تصدير Excel
  btnExportExcel.addEventListener("click", () => {
    exportToExcel();
  });

  updateReportCounts();
}

function populateFilterAccounts() {
  const filterAccount = document.getElementById("filter-account");
  if (!filterAccount) return;

  // إضافة الحسابات إلى قائمة الفلترة
  accounts.forEach(acc => {
    const option = document.createElement("option");
    option.value = acc.code;
    option.textContent = `${acc.code} - ${acc.name}`;
    filterAccount.appendChild(option);
  });
}

function populateFilterColleges() {
  const filterCollege = document.getElementById("filter-college");
  if (!filterCollege) return;

  // إضافة الكليات إلى قائمة الفلترة
  Object.keys(collegesData).forEach(college => {
    const option = document.createElement("option");
    option.value = college;
    option.textContent = college;
    filterCollege.appendChild(option);
  });
}

function populateFilterPrograms(college) {
  const filterProgram = document.getElementById("filter-program");
  if (!filterProgram) return;

  // حذف البرامج السابقة
  filterProgram.innerHTML = '<option value="">-- كل البرامج --</option>';

  if (!college) return;

  // إضافة البرامج للكلية المختارة
  if (collegesData[college]) {
    collegesData[college].forEach(program => {
      const option = document.createElement("option");
      option.value = program;
      option.textContent = program;
      filterProgram.appendChild(option);
    });
  }
}

function filterByDateRange(data, fromDate, toDate) {
  if (!fromDate && !toDate) return data;

  return data.filter(item => {
    const itemDate = new Date(item.entry_date);
    if (fromDate && itemDate < fromDate) return false;
    if (toDate && itemDate > toDate) return false;
    return true;
  });
}

function filterByAccount(entries, accountCode) {
  if (!accountCode) return entries;

  return entries.filter(entry => {
    return entry.transactions.some(tr =>
      tr.debit_account === accountCode || tr.credit_account === accountCode
    );
  });
}

function filterBySearchTerm(data, searchTerm) {
  if (!searchTerm) return data;

  const lowerSearch = searchTerm.toLowerCase();

  return data.filter(item => {
    if (item.code) {
      if (item.code.toLowerCase().includes(lowerSearch)) return true;
      if (item.name && item.name.toLowerCase().includes(lowerSearch)) return true;
    }
    if (item.entry_code && item.entry_code.toLowerCase().includes(lowerSearch)) return true;
    if (item.description && item.description.toLowerCase().includes(lowerSearch)) return true;
    return false;
  });
}

function filterByCollege(accounts, collegeName) {
  if (!collegeName) return accounts;
  return accounts.filter(acc => acc.college === collegeName);
}

function filterByProgram(accounts, programName) {
  if (!programName) return accounts;
  return accounts.filter(acc => acc.program === programName);
}

function filterEntriesByCollege(entries, collegeName) {
  if (!collegeName) return entries;

  return entries.filter(entry => {
    return entry.transactions.some(tr => {
      const debitAcc = accounts.find(a => a.code === tr.debit_account);
      const creditAcc = accounts.find(a => a.code === tr.credit_account);
      return (debitAcc && debitAcc.college === collegeName) || (creditAcc && creditAcc.college === collegeName);
    });
  });
}

function filterEntriesByProgram(entries, programName) {
  if (!programName) return entries;

  return entries.filter(entry => {
    return entry.transactions.some(tr => {
      const debitAcc = accounts.find(a => a.code === tr.debit_account);
      const creditAcc = accounts.find(a => a.code === tr.credit_account);
      return (debitAcc && debitAcc.program === programName) || (creditAcc && creditAcc.program === programName);
    });
  });
}

function applyReportFilters() {
  // اختيار التقرير بناءً على نوع التقرير المحدد
  if (!reportFilters.reportType || reportFilters.reportType === "accounts") {
    showAccountsReportFiltered();
  } else if (reportFilters.reportType === "entries") {
    showEntriesReportFiltered();
  } else if (reportFilters.reportType === "ledger") {
    showLedgerReportFiltered();
  } else if (reportFilters.reportType === "trial-balance") {
    showTrialBalanceReportFiltered();
  }
}

function showFilterStats() {
  const statsDiv = document.getElementById("filter-stats");
  if (!statsDiv) return;

  let totalDebit = 0, totalCredit = 0, resultCount = 0;

  // helper to read numeric amount from transaction supporting multiple field names
  function readDebit(tr) {
    return Number(tr.debit_amount !== undefined ? tr.debit_amount : (tr.debitamount !== undefined ? tr.debitamount : (tr.amount || 0))) || 0;
  }
  function readCredit(tr) {
    return Number(tr.credit_amount !== undefined ? tr.credit_amount : (tr.creditamount !== undefined ? tr.creditamount : (tr.amount || 0))) || 0;
  }

  if (!reportFilters.reportType || reportFilters.reportType === "entries") {
    let filteredEntries = entries;

    if (reportFilters.college) {
      filteredEntries = filterEntriesByCollege(filteredEntries, reportFilters.college);
    }

    if (reportFilters.program) {
      filteredEntries = filterEntriesByProgram(filteredEntries, reportFilters.program);
    }

    if (reportFilters.account) {
      filteredEntries = filterByAccount(filteredEntries, reportFilters.account);
    }

    if (reportFilters.fromDate || reportFilters.toDate) {
      filteredEntries = filterByDateRange(filteredEntries, reportFilters.fromDate, reportFilters.toDate);
    }

    if (reportFilters.search) {
      filteredEntries = filterBySearchTerm(filteredEntries, reportFilters.search);
    }

    resultCount = filteredEntries.length;

    filteredEntries.forEach(entry => {
      (entry.transactions || []).forEach(tr => {
        totalDebit  += readDebit(tr);
        totalCredit += readCredit(tr);
      });
    });
  } else if (reportFilters.reportType === "accounts") {
    let filteredAccounts = accounts;

    if (reportFilters.college) {
      filteredAccounts = filterByCollege(filteredAccounts, reportFilters.college);
    }

    if (reportFilters.program) {
      filteredAccounts = filterByProgram(filteredAccounts, reportFilters.program);
    }

    if (reportFilters.search) {
      filteredAccounts = filterBySearchTerm(filteredAccounts, reportFilters.search);
    }

    resultCount = filteredAccounts.length;
    totalDebit = filteredAccounts.reduce((sum, a) => sum + (Number(a.opening_balance) || 0), 0);
  }

  // safe DOM writes
  const elResults = document.getElementById("stats-results");
  const elDebit = document.getElementById("stats-debit");
  const elCredit = document.getElementById("stats-credit");

  if (elResults) elResults.textContent = resultCount;
  if (elDebit) elDebit.textContent = (totalDebit || 0).toFixed(2);
  if (elCredit) elCredit.textContent = (totalCredit || 0).toFixed(2);

  statsDiv.style.display = "grid";
}

function updateReportCounts() {
  document.getElementById("count-accounts").textContent = accounts.length;
  document.getElementById("count-entries").textContent = entries.length;
  document.getElementById("count-users").textContent = users.length;
}

function showAccountsReport() {
  const container = document.getElementById("report-container");
  const content = document.getElementById("report-content");
  document.getElementById("report-title").textContent = "تقرير الحسابات";

  let html = `<table class="report-table">
    <thead>
      <tr>
        <th>رقم الحساب</th>
        <th>اسم الحساب</th>
        <th>الرصيد الافتتاحي</th>
        <th>نوع الرصيد</th>
      </tr>
    </thead>
    <tbody>`;

  accounts.forEach(acc => {
    html += `<tr>
      <td>${acc.code}</td>
      <td>${acc.name}</td>
      <td>${acc.opening_balance.toFixed(2)}</td>
      <td>${acc.balance_type}</td>
    </tr>`;
  });

  html += `</tbody></table>`;

  // ملخص
  const totalOpening = accounts.reduce((sum, a) => sum + a.opening_balance, 0);
  html += `<div class="report-summary">
    <div class="summary-row">
      <span class="summary-label">إجمالي الأرصدة الافتتاحية</span>
      <span class="summary-value">${totalOpening.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">عدد الحسابات</span>
      <span class="summary-value">${accounts.length}</span>
    </div>
  </div>`;

  content.innerHTML = html;
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth" });
}

function showAccountsReportFiltered() {
  const container = document.getElementById("report-container");
  const content = document.getElementById("report-content");
  document.getElementById("report-title").textContent = "تقرير الحسابات (مرشح)";

  let filteredAccounts = accounts;

  if (reportFilters.college) {
    filteredAccounts = filterByCollege(filteredAccounts, reportFilters.college);
  }

  if (reportFilters.program) {
    filteredAccounts = filterByProgram(filteredAccounts, reportFilters.program);
  }

  if (reportFilters.search) {
    filteredAccounts = filterBySearchTerm(filteredAccounts, reportFilters.search);
  }

  let html = `<table class="report-table">
    <thead>
      <tr>
        <th>رقم الحساب</th>
        <th>اسم الحساب</th>
        <th>الكلية</th>
        <th>البرنامج</th>
        <th>الرصيد الافتتاحي</th>
        <th>نوع الرصيد</th>
      </tr>
    </thead>
    <tbody>`;

  filteredAccounts.forEach(acc => {
    html += `<tr>
      <td>${acc.code}</td>
      <td>${acc.name}</td>
      <td>${acc.college || "-"}</td>
      <td>${acc.program || "-"}</td>
      <td>${acc.opening_balance.toFixed(2)}</td>
      <td>${acc.balance_type}</td>
    </tr>`;
  });

  html += `</tbody></table>`;

  // ملخص
  const totalOpening = filteredAccounts.reduce((sum, a) => sum + a.opening_balance, 0);
  html += `<div class="report-summary">
    <div class="summary-row">
      <span class="summary-label">إجمالي الأرصدة الافتتاحية</span>
      <span class="summary-value">${totalOpening.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">عدد الحسابات</span>
      <span class="summary-value">${filteredAccounts.length}</span>
    </div>
  </div>`;

  content.innerHTML = html;
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth" });
}

function showEntriesReport() {
  const container = document.getElementById("report-container");
  const content = document.getElementById("report-content");
  document.getElementById("report-title").textContent = "تقرير القيود";

  let html = `<table class="report-table">
    <thead>
      <tr>
        <th>التاريخ</th>
        <th>رقم القيد</th>
        <th>الحساب المدين</th>
        <th>المبلغ المدين</th>
        <th>الحساب الدائن</th>
        <th>المبلغ الدائن</th>
        <th>البيان</th>
      </tr>
    </thead>
    <tbody>`;

  let totalDebit = 0, totalCredit = 0;

  entries.forEach(entry => {
    entry.transactions.forEach(tr => {
      const debitAcc = accounts.find(a => a.code === tr.debit_account);
      const creditAcc = accounts.find(a => a.code === tr.credit_account);
      const debitAmt = tr.debit_amount || 0;
      const creditAmt = tr.credit_amount || 0;

      totalDebit += debitAmt;
      totalCredit += creditAmt;

      html += `<tr>
        <td>${entry.entry_date}</td>
        <td>${entry.entry_code}</td>
        <td>${debitAcc ? debitAcc.name : tr.debit_account}</td>
        <td>${debitAmt.toFixed(2)}</td>
        <td>${creditAcc ? creditAcc.name : tr.credit_account}</td>
        <td>${creditAmt.toFixed(2)}</td>
        <td>${tr.description}</td>
      </tr>`;
    });
  });

  html += `</tbody></table>`;

  // ملخص
  html += `<div class="report-summary">
    <div class="summary-row">
      <span class="summary-label">إجمالي المدين</span>
      <span class="summary-value">${totalDebit.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">إجمالي الدائن</span>
      <span class="summary-value">${totalCredit.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">عدد القيود</span>
      <span class="summary-value">${entries.length}</span>
    </div>
  </div>`;

  content.innerHTML = html;
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth" });
}

function showEntriesReportFiltered() {
  const container = document.getElementById("report-container");
  const content = document.getElementById("report-content");
  document.getElementById("report-title").textContent = "تقرير القيود (مرشح)";

  let filteredEntries = entries;

  if (reportFilters.college) {
    filteredEntries = filterEntriesByCollege(filteredEntries, reportFilters.college);
  }

  if (reportFilters.program) {
    filteredEntries = filterEntriesByProgram(filteredEntries, reportFilters.program);
  }

  if (reportFilters.account) {
    filteredEntries = filterByAccount(filteredEntries, reportFilters.account);
  }

  if (reportFilters.fromDate || reportFilters.toDate) {
    filteredEntries = filterByDateRange(filteredEntries, reportFilters.fromDate, reportFilters.toDate);
  }

  if (reportFilters.search) {
    filteredEntries = filterBySearchTerm(filteredEntries, reportFilters.search);
  }

  let html = `<table class="report-table">
    <thead>
      <tr>
        <th>التاريخ</th>
        <th>رقم القيد</th>
        <th>الحساب المدين</th>
        <th>المبلغ المدين</th>
        <th>الحساب الدائن</th>
        <th>المبلغ الدائن</th>
        <th>البيان</th>
      </tr>
    </thead>
    <tbody>`;

  let totalDebit = 0, totalCredit = 0;

  filteredEntries.forEach(entry => {
    entry.transactions.forEach(tr => {
      const debitAcc = accounts.find(a => a.code === tr.debit_account);
      const creditAcc = accounts.find(a => a.code === tr.credit_account);
      const debitAmt = tr.debit_amount || 0;
      const creditAmt = tr.credit_amount || 0;

      totalDebit += debitAmt;
      totalCredit += creditAmt;

      html += `<tr>
        <td>${entry.entry_date}</td>
        <td>${entry.entry_code}</td>
        <td>${debitAcc ? debitAcc.name : tr.debit_account}</td>
        <td>${debitAmt.toFixed(2)}</td>
        <td>${creditAcc ? creditAcc.name : tr.credit_account}</td>
        <td>${creditAmt.toFixed(2)}</td>
        <td>${tr.description}</td>
      </tr>`;
    });
  });

  html += `</tbody></table>`;

  // ملخص
  html += `<div class="report-summary">
    <div class="summary-row">
      <span class="summary-label">إجمالي المدين</span>
      <span class="summary-value">${totalDebit.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">إجمالي الدائن</span>
      <span class="summary-value">${totalCredit.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">عدد القيود</span>
      <span class="summary-value">${filteredEntries.length}</span>
    </div>
  </div>`;

  content.innerHTML = html;
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth" });
}

function showUsersReport() {
  const container = document.getElementById("report-container");
  const content = document.getElementById("report-content");
  document.getElementById("report-title").textContent = "تقرير الموظفين";

  const roleMap = {
    "super_admin": "مدير النظام",
    "manager": "مدير",
    "accountant": "محاسب",
    "viewer": "مشاهد فقط"
  };

  let html = `<table class="report-table">
    <thead>
      <tr>
        <th>الاسم</th>
        <th>البريد الإلكتروني</th>
        <th>اسم المستخدم</th>
        <th>الدور</th>
        <th>الحالة</th>
        <th>تاريخ الإنشاء</th>
      </tr>
    </thead>
    <tbody>`;

  users.forEach(user => {
    const roleLabel = roleMap[user.role] || user.role;
    const statusLabel = user.status === "active" ? "نشط" : "غير نشط";

    html += `<tr>
      <td>${user.fullname}</td>
      <td>${user.email}</td>
      <td>${user.username}</td>
      <td>${roleLabel}</td>
      <td>${statusLabel}</td>
      <td>${user.created_at}</td>
    </tr>`;
  });

  html += `</tbody></table>`;

  // ملخص
  const activeUsers = users.filter(u => u.status === "active").length;
  html += `<div class="report-summary">
    <div class="summary-row">
      <span class="summary-label">إجمالي الموظفين</span>
      <span class="summary-value">${users.length}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">الموظفون النشطون</span>
      <span class="summary-value">${activeUsers}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">الموظفون غير النشطين</span>
      <span class="summary-value">${users.length - activeUsers}</span>
    </div>
  </div>`;

  content.innerHTML = html;
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth" });
}

function showFinancialSummary() {
  const container = document.getElementById("report-container");
  const content = document.getElementById("report-content");
  document.getElementById("report-title").textContent = "الملخص المالي";

  let totalDebit = 0, totalCredit = 0, totalAccounts = 0;

  entries.forEach(entry => {
    entry.transactions.forEach(tr => {
      const debitAmt = tr.debit_amount || 0;
      const creditAmt = tr.credit_amount || 0;
      totalDebit += debitAmt;
      totalCredit += creditAmt;
    });
  });

  const totalOpening = accounts.reduce((sum, a) => sum + a.opening_balance, 0);

  let html = `<div class="report-summary">
    <div class="summary-row">
      <span class="summary-label">إجمالي الأرصدة الافتتاحية</span>
      <span class="summary-value">${totalOpening.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">إجمالي الحسابات</span>
      <span class="summary-value">${accounts.length}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">إجمالي المدين من القيود</span>
      <span class="summary-value">${totalDebit.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">إجمالي الدائن من القيود</span>
      <span class="summary-value">${totalCredit.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">عدد القيود المسجلة</span>
      <span class="summary-value">${entries.length}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">عدد الموظفين</span>
      <span class="summary-value">${users.length}</span>
    </div>
  </div>`;

  content.innerHTML = html;
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth" });
}

function showDailyMovementsReport() {
  const container = document.getElementById("report-container");
  const content = document.getElementById("report-content");
  document.getElementById("report-title").textContent = "تقرير الحركات اليومية";

  const dailyData = {};

  entries.forEach(entry => {
    const date = entry.entry_date;
    if (!dailyData[date]) {
      dailyData[date] = { debit: 0, credit: 0, count: 0 };
    }

    entry.transactions.forEach(tr => {
      const debitAmt = tr.debit_amount || 0;
      const creditAmt = tr.credit_amount || 0;
      dailyData[date].debit += debitAmt;
      dailyData[date].credit += creditAmt;
      dailyData[date].count += 1;
    });
  });

  let html = `<table class="report-table">
    <thead>
      <tr>
        <th>التاريخ</th>
        <th>المدين</th>
        <th>الدائن</th>
        <th>عدد العمليات</th>
      </tr>
    </thead>
    <tbody>`;

  Object.keys(dailyData).sort().reverse().forEach(date => {
    const data = dailyData[date];
    html += `<tr>
      <td>${date}</td>
      <td>${data.debit.toFixed(2)}</td>
      <td>${data.credit.toFixed(2)}</td>
      <td>${data.count}</td>
    </tr>`;
  });

  html += `</tbody></table>`;

  content.innerHTML = html;
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth" });
}

function showActivityLog() {
  const container = document.getElementById("report-container");
  const content = document.getElementById("report-content");
  document.getElementById("report-title").textContent = "سجل الأنشطة";

  let html = `<p style="color: var(--muted); font-size: 13px; text-align: center;">
    📝 سجل الأنشطة يتابع جميع العمليات والتعديلات على النظام
  </p>
  <div class="report-summary">
    <div class="summary-row">
      <span class="summary-label">إجمالي الحسابات المسجلة</span>
      <span class="summary-value">${accounts.length}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">إجمالي القيود المسجلة</span>
      <span class="summary-value">${entries.length}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">إجمالي الموظفين المسجلين</span>
      <span class="summary-value">${users.length}</span>
    </div>
  </div>`;

  content.innerHTML = html;
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth" });
}

function showLedgerReportFiltered() {
  const container = document.getElementById("report-container");
  const content = document.getElementById("report-content");
  document.getElementById("report-title").textContent = "تقرير دفتر الأستاذ (مرشح)";

  let filteredEntries = entries;

  if (reportFilters.fromDate || reportFilters.toDate) {
    filteredEntries = filterByDateRange(filteredEntries, reportFilters.fromDate, reportFilters.toDate);
  }

  let html = `<table class="report-table">
    <thead>
      <tr>
        <th>رقم الحساب</th>
        <th>اسم الحساب</th>
        <th>الرصيد الافتتاحي</th>
        <th>المدين</th>
        <th>الدائن</th>
        <th>الرصيد النهائي</th>
        <th>نوع الرصيد</th>
      </tr>
    </thead>
    <tbody>`;

  accounts.forEach(acc => {
    let debit = 0;
    let credit = 0;

    filteredEntries.forEach(entry => {
      (entry.transactions || []).forEach(tr => {
        const debitAmt = tr.debit_amount !== undefined ? tr.debit_amount : (tr.amount || 0);
        const creditAmt = tr.credit_amount !== undefined ? tr.credit_amount : (tr.amount || 0);

        if (tr.debit_account === acc.code) debit += debitAmt;
        if (tr.credit_account === acc.code) credit += creditAmt;
      });
    });

    const openingSigned = acc.balance_type === "دائن"
      ? -acc.opening_balance
      : acc.opening_balance;

    const finalBalance = openingSigned + debit - credit;

    html += `<tr>
      <td>${acc.code}</td>
      <td>${acc.name}</td>
      <td>${acc.opening_balance.toFixed(2)}</td>
      <td>${debit.toFixed(2)}</td>
      <td>${credit.toFixed(2)}</td>
      <td>${finalBalance.toFixed(2)}</td>
      <td>${acc.balance_type}</td>
    </tr>`;
  });

  html += `</tbody></table>`;

  html += `<div class="report-summary">
    <div class="summary-row">
      <span class="summary-label">عدد الحسابات</span>
      <span class="summary-value">${accounts.length}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">الفترة الزمنية</span>
      <span class="summary-value">
        ${reportFilters.fromDate ? reportFilters.fromDate.toLocaleDateString("ar-EG") : "من البداية"}
        إلى
        ${reportFilters.toDate ? reportFilters.toDate.toLocaleDateString("ar-EG") : "إلى النهاية"}
      </span>
    </div>
  </div>`;

  content.innerHTML = html;
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth" });
}

function showTrialBalanceReportFiltered() {
  const container = document.getElementById("report-container");
  const content = document.getElementById("report-content");
  document.getElementById("report-title").textContent = "تقرير ميزان المراجعة (مرشح)";

  let filteredEntries = entries;

  if (reportFilters.fromDate || reportFilters.toDate) {
    filteredEntries = filterByDateRange(filteredEntries, reportFilters.fromDate, reportFilters.toDate);
  }

  let html = `<table class="report-table">
    <thead>
      <tr>
        <th>اسم الحساب</th>
        <th>الرصيد الافتتاحي مدين</th>
        <th>الرصيد الافتتاحي دائن</th>
        <th>المدين</th>
        <th>الدائن</th>
        <th>المجموع المدين</th>
        <th>المجموع الدائن</th>
        <th>الرصيد النهائي مدين</th>
        <th>الرصيد النهائي دائن</th>
      </tr>
    </thead>
    <tbody>`;

  let totalDebitOpen = 0, totalCreditOpen = 0;
  let totalDebitPeriod = 0, totalCreditPeriod = 0;
  let totalDebitFinal = 0, totalCreditFinal = 0;

  accounts.forEach(acc => {
    let debit = 0;
    let credit = 0;

    filteredEntries.forEach(entry => {
      (entry.transactions || []).forEach(tr => {
        const debitAmt = tr.debit_amount !== undefined ? tr.debit_amount : (tr.amount || 0);
        const creditAmt = tr.credit_amount !== undefined ? tr.credit_amount : (tr.amount || 0);

        if (tr.debit_account === acc.code) debit += debitAmt;
        if (tr.credit_account === acc.code) credit += creditAmt;
      });
    });

    let openingSigned = acc.opening_balance;
    if (acc.balance_type === "دائن") {
      openingSigned = -openingSigned;
    }

    const opening_d = openingSigned > 0 ? openingSigned : 0;
    const opening_c = openingSigned < 0 ? Math.abs(openingSigned) : 0;

    const total_d = opening_d + debit;
    const total_c = opening_c + credit;

    const final = openingSigned + debit - credit;
    const final_d = final > 0 ? final : 0;
    const final_c = final < 0 ? Math.abs(final) : 0;

    totalDebitOpen += opening_d;
    totalCreditOpen += opening_c;
    totalDebitPeriod += debit;
    totalCreditPeriod += credit;
    totalDebitFinal += final_d;
    totalCreditFinal += final_c;

    html += `<tr>
      <td>${acc.name}</td>
      <td>${opening_d.toFixed(2)}</td>
      <td>${opening_c.toFixed(2)}</td>
      <td>${debit.toFixed(2)}</td>
      <td>${credit.toFixed(2)}</td>
      <td>${total_d.toFixed(2)}</td>
      <td>${total_c.toFixed(2)}</td>
      <td>${final_d.toFixed(2)}</td>
      <td>${final_c.toFixed(2)}</td>
    </tr>`;
  });

  html += `</tbody></table>`;

  html += `<div class="report-summary">
    <div class="summary-row">
      <span class="summary-label">إجمالي الرصيد الافتتاحي مدين</span>
      <span class="summary-value">${totalDebitOpen.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">إجمالي الرصيد الافتتاحي دائن</span>
      <span class="summary-value">${totalCreditOpen.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">إجمالي المدين في الفترة</span>
      <span class="summary-value">${totalDebitPeriod.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">إجمالي الدائن في الفترة</span>
      <span class="summary-value">${totalCreditPeriod.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">إجمالي الرصيد النهائي مدين</span>
      <span class="summary-value">${totalDebitFinal.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">إجمالي الرصيد النهائي دائن</span>
      <span class="summary-value">${totalCreditFinal.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span class="summary-label">الفترة الزمنية</span>
      <span class="summary-value">
        ${reportFilters.fromDate ? reportFilters.fromDate.toLocaleDateString("ar-EG") : "من البداية"}
        إلى
        ${reportFilters.toDate ? reportFilters.toDate.toLocaleDateString("ar-EG") : "إلى النهاية"}
      </span>
    </div>
  </div>`;

  content.innerHTML = html;
  container.style.display = "block";
  container.scrollIntoView({ behavior: "smooth" });
}

function closeReport() {
  const container = document.getElementById("report-container");
  container.style.display = "none";
}

// ================== دوال التصدير إلى PDF و Excel ==================

function exportToPDF() {
  const reportTitle = document.getElementById("report-title");
  const reportContent = document.getElementById("report-content");

  if (!reportTitle || !reportContent || reportContent.innerHTML.trim() === "") {
    alert("❌ لا يوجد تقرير لتصديره. يرجى تطبيق الفلترة أولاً.");
    return;
  }

  try {
    const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    // إضافة العنوان
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(reportTitle.textContent, doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });

    // إضافة التاريخ
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const now = new Date().toLocaleDateString("ar-SA");
    doc.text(`التاريخ: ${now}`, doc.internal.pageSize.getWidth() / 2, 22, { align: "center" });

    // استخراج البيانات من الجدول
    const table = reportContent.querySelector("table");
    if (table) {
      const rows = [];

      // استخراج رؤوس الجدول
      const headers = [];
      table.querySelectorAll("thead th").forEach(th => {
        headers.push(th.textContent.trim());
      });
      rows.push(headers);

      // استخراج صفوف البيانات
      table.querySelectorAll("tbody tr").forEach(tr => {
        const row = [];
        tr.querySelectorAll("td").forEach(td => {
          row.push(td.textContent.trim());
        });
        rows.push(row);
      });

      // إضافة الجدول إلى PDF
      if (rows.length > 1) {
        doc.autoTable({
          head: [rows[0]],
          body: rows.slice(1),
          startY: 30,
          margin: { top: 35, right: 10, bottom: 10, left: 10 },
          styles: {
            font: "helvetica",
            fontSize: 8,
            halign: "center",
            valign: "middle",
            cellPadding: 3,
            lineColor: [200, 200, 200]
          },
          headStyles: {
            fillColor: [70, 130, 180],
            textColor: 255,
            fontStyle: "bold",
            halign: "center"
          },
          bodyStyles: {
            textColor: 0
          }
        });
      }
    }

    // حفظ الملف
    const fileName = `Report_${new Date().getTime()}.pdf`;
    doc.save(fileName);
    alert("✅ تم تصدير التقرير إلى PDF بنجاح");
  } catch (error) {
    console.error("خطأ في التصدير:", error);
    alert("❌ حدث خطأ أثناء التصدير: " + error.message);
  }
}

function exportToExcel() {
  const reportTitle = document.getElementById("report-title");
  const reportContent = document.getElementById("report-content");

  if (!reportTitle || !reportContent || reportContent.innerHTML.trim() === "") {
    alert("❌ لا يوجد تقرير لتصديره. يرجى تطبيق الفلترة أولاً.");
    return;
  }

  try {
    const table = reportContent.querySelector("table");
    if (!table) {
      alert("❌ لا يوجد جدول بيانات لتصديره.");
      return;
    }

    // استخراج البيانات من الجدول
    const headers = [];

    // استخراج رؤوس الجدول
    table.querySelectorAll("thead th").forEach(th => {
      headers.push(th.textContent.trim());
    });

    const dataRows = [];

    // استخراج صفوف البيانات
    table.querySelectorAll("tbody tr").forEach(tr => {
      const row = [];
      tr.querySelectorAll("td").forEach(td => {
        row.push(td.textContent.trim());
      });
      dataRows.push(row);
    });

    // إنشاء مصنف Excel
    const workbook = XLSX.utils.book_new();

    // إضافة ورقة البيانات
    const worksheetData = [
      [reportTitle.textContent],
      [`التاريخ: ${new Date().toLocaleDateString("ar-SA")}`],
      [],
      headers,
      ...dataRows
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // تعيين عرض الأعمدة
    const colWidths = headers.map(() => 20);
    worksheet["!cols"] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, "التقرير");

    // حفظ الملف
    const fileName = `تقرير_${reportTitle.textContent}_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    alert("✅ تم تصدير التقرير إلى Excel بنجاح");
  } catch (error) {
    console.error("خطأ في التصدير:", error);
    alert("❌ حدث خطأ أثناء التصدير: " + error.message);
  }
}

// ================== تهيئة الصفحات ==================
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("form-account"))       initAccountsPage();
  if (document.getElementById("form-entry"))         initEntriesPage();
  if (document.getElementById("tbl-ledger"))         initLedgerPage();
  if (document.getElementById("tbl-trial"))          initTrialBalancePage();
  if (document.getElementById("generate-financial")) initFinancialPositionPage();
  if (document.getElementById("generate-report-is")) initIncomeStatementPage();
  if (document.getElementById("form-user"))          initUsersPage();
  if (document.getElementById("btn-apply-filters"))  initReportsPage();
});
