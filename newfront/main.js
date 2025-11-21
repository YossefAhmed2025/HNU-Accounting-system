/* Merged admin-modules.js (mock API + helpers) */
/* admin mock data and apiFetch - merged into main.js to have single JS file */
const mockData = {
  users: [
    {
      id: 1,
      name: "أحمد علي",
      email: "ahmed@hnu.edu",
      role: "مشرف أعلى",
      created_at: "2023-01-10",
      status: "active",
    },
    {
      id: 2,
      name: "سارة محمد",
      email: "sara@hnu.edu",
      role: "مشرف",
      created_at: "2024-02-12",
      status: "active",
    },
    {
      id: 3,
      name: "محمود خالد",
      email: "mahmoud@hnu.edu",
      role: "محاسب",
      created_at: "2024-05-03",
      status: "inactive",
    },
  ],
  financialYear: {
    year: "2024/2025",
    start: "2024-09-01",
    end: "2025-08-31",
    status: "open",
  },
  journal: [
    {
      id: 101,
      date: "2025-01-05",
      desc: "إيرادات مبكرة",
      debit: 0,
      credit: 1200,
    },
    {
      id: 102,
      date: "2025-02-10",
      desc: "مصروفات الصيانة",
      debit: 400,
      credit: 0,
    },
  ],
  faculties: [
    { id: 1, name: "كلية الهندسة" },
    { id: 2, name: "كلية العلوم" },
    { id: 3, name: "كلية الآداب" },
  ],
  revenues: [
    {
      id: 1,
      student: "محمد",
      faculty_id: 1,
      amount: 500,
      status: "paid",
      year: "2024/2025",
    },
  ],
  accounts: [
    { id: 1001, code: "101", name: "الصندوق", balance: 10000, type: "asset" },
    {
      id: 2001,
      code: "401",
      name: "إيرادات الطلاب",
      balance: 50000,
      type: "revenue",
    },
  ],
};

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function apiFetch(path, options = { method: "GET", body: null }) {
  try {
    const url = path.startsWith("/api") ? path : path;
    const resp = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json" },
    });
    if (resp && resp.ok) {
      return resp.json();
    }
  } catch (e) {
    // fallback to mock below
  }
  await delay(150);
  if (path.startsWith("/api/users")) {
    if (path === "/api/users/list" || path === "/api/users") {
      return { success: true, users: mockData.users };
    }
    if (path === "/api/users/create" && options.method === "POST") {
      const u = JSON.parse(options.body);
      u.id = mockData.users.length + 1;
      u.created_at = new Date().toISOString().slice(0, 10);
      mockData.users.push(u);
      return { success: true, user: u };
    }
    if (path === "/api/users/update" && options.method === "POST") {
      const u = JSON.parse(options.body);
      const idx = mockData.users.findIndex((x) => x.id == u.id);
      if (idx > -1) {
        mockData.users[idx] = { ...mockData.users[idx], ...u };
        return { success: true, user: mockData.users[idx] };
      }
      return { success: false, error: "not found" };
    }
    if (path === "/api/users/delete" && options.method === "POST") {
      const { id } = JSON.parse(options.body);
      const idx = mockData.users.findIndex((x) => x.id == id);
      if (idx > -1) {
        const u = mockData.users[idx];
        if (u.role === "مشرف أعلى")
          return { success: false, error: "لا يمكن حذف المشرف الأعلى" };
        mockData.users.splice(idx, 1);
        return { success: true };
      }
      return { success: false, error: "not found" };
    }
    if (path === "/api/users/permissions" && options.method === "POST") {
      return { success: true };
    }
  }
  if (path.startsWith("/api/settings/financial-year")) {
    if (options.method === "GET")
      return { success: true, year: mockData.financialYear };
    if (options.method === "POST") {
      const p = JSON.parse(options.body);
      mockData.financialYear = { ...mockData.financialYear, ...p };
      return { success: true, year: mockData.financialYear };
    }
  }
  if (path.startsWith("/api/year/close") && options.method === "POST") {
    return { success: true, log: ["Closed income/expense accounts."] };
  }
  if (path.startsWith("/api/year/rollover") && options.method === "POST") {
    return { success: true, log: ["Created opening entries for new year."] };
  }
  if (path.startsWith("/api/reports/journal")) {
    return { success: true, rows: mockData.journal };
  }
  if (path.startsWith("/api/faculties")) {
    return { success: true, faculties: mockData.faculties };
  }
  if (path.startsWith("/api/revenues")) {
    return { success: true, rows: mockData.revenues };
  }
  if (path.startsWith("/api/accounts")) {
    return { success: true, accounts: mockData.accounts };
  }
  return { success: false, error: "unknown endpoint in mock" };
}

function showMessage(msg, type = "info") {
  alert(msg);
}

window.AdminAPI = { apiFetch, mockData, showMessage };

let accounts = JSON.parse(localStorage.getItem("accounts")) || [];
let entries = JSON.parse(localStorage.getItem("entries")) || [];

const pages = document.querySelectorAll(".page");
document.querySelector("#nav-accounts").onclick = () =>
  showPage("section-accounts");
document.querySelector("#nav-entry").onclick = () => showPage("section-entry");
document.querySelector("#nav-ledger").onclick = () =>
  showPage("section-ledger");
document.querySelector("#nav-trial").onclick = () => showPage("section-trial");
document.querySelector("#nav-financial").onclick = () =>
  showPage("section-financial");

// New module buttons: load external HTML modules into a dynamic container
const dynamicContainer = document.createElement("div");
dynamicContainer.id = "dynamic-module";
dynamicContainer.className = "page";
dynamicContainer.style.display = "none";
document.querySelector("main.container").appendChild(dynamicContainer);

document.querySelector("#nav-users").onclick = () =>
  showPage("section-users-list");
document.querySelector("#nav-finyear").onclick = () =>
  showPage("section-financial-year");
document.querySelector("#nav-yearclose").onclick = () =>
  showPage("section-year-close");
document.querySelector("#nav-journal").onclick = () =>
  showPage("section-journal");
document.querySelector("#nav-reports").onclick = () =>
  showPage("section-expenses-faculty");
document.querySelector("#nav-search").onclick = () =>
  showPage("section-search");

async function loadModule(url) {
  // hide existing pages
  pages.forEach((p) => (p.style.display = "none"));
  dynamicContainer.style.display = "block";
  // Use an iframe to reliably load full page (works with file:// and http://)
  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.style.width = "100%";
  iframe.style.height = "78vh";
  iframe.style.border = "none";
  iframe.onload = function () {
    // remove previous content
  };
  dynamicContainer.innerHTML = "";
  dynamicContainer.appendChild(iframe);
}

function showPage(id) {
  pages.forEach((p) => (p.style.display = "none"));
  document.getElementById(id).style.display = "block";
  if (id === "section-ledger") renderLedger();
  if (id === "section-entry") updateAccountOptions();
  if (id === "section-trial") renderTrialBalance();
}

// --------- الحسابات ----------
document.getElementById("form-account").onsubmit = (e) => {
  e.preventDefault();
  const form = e.target;
  const acc = {
    code: form.code.value.trim(),
    name: form.name.value.trim(),
    opening_balance: parseFloat(form.opening_balance.value),
    balance_type: form.balance_type.value,
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
  accounts.forEach((acc) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${acc.code}</td>
      <td>${acc.name}</td>
      <td>${acc.opening_balance.toFixed(2)}</td>
      <td>${acc.balance_type === "debit" ? "مدين" : "دائن"}</td>
    `;
    tbody.appendChild(tr);
  });
}
renderAccounts();

// --------- القيود ----------
function updateAccountOptions() {
  const selects = document.querySelectorAll(".transaction .account");
  selects.forEach((sel) => {
    sel.innerHTML = accounts
      .map((acc) => `<option value="${acc.code}">${acc.name}</option>`)
      .join("");
  });
}

document.getElementById("add-transaction").onclick = () => {
  const container = document.getElementById("transactions-container");
  const div = document.createElement("div");
  div.className = "transaction row";
  div.innerHTML = `
    <label>نوع العملية<br>
      <select class="type">
        <option value="debit">مدين</option>
        <option value="credit">دائن</option>
      </select>
    </label>
    <label>الحساب<br>
      <select class="account" required></select>
    </label>
    <label>المبلغ<br>
      <input class="amount" type="number" step="0.01" required />
    </label>
    <button type="button" class="remove-transaction btn muted">✖</button>
  `;
  container.appendChild(div);
  updateAccountOptions();
};

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-transaction")) {
    e.target.parentElement.remove();
  }
});

document.getElementById("form-entry").onsubmit = (e) => {
  e.preventDefault();
  const form = e.target;
  const entryDate = form.entry_date.value;
  const description = form.description.value;
  const transactions = [];

  document
    .querySelectorAll("#transactions-container .transaction")
    .forEach((tr) => {
      const type = tr.querySelector(".type").value;
      const account = tr.querySelector(".account").value;
      const amount = parseFloat(tr.querySelector(".amount").value);
      if (amount > 0) {
        transactions.push({ type, account, amount });
      }
    });

  entries.push({ entryDate, description, transactions });
  localStorage.setItem("entries", JSON.stringify(entries));
  form.reset();
  document.getElementById("transactions-container").innerHTML = "";
  document.getElementById("add-transaction").click();
  renderEntries();
  alert("✅ تم حفظ القيد بنجاح");
};

function renderEntries() {
  const tbody = document.querySelector("#tbl-entries tbody");
  tbody.innerHTML = "";
  entries.forEach((en) => {
    en.transactions.forEach((trx) => {
      const acc =
        accounts.find((a) => a.code === trx.account)?.name || trx.account;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${en.entryDate}</td>
        <td>${trx.type === "debit" ? "مدين" : "دائن"}</td>
        <td>${acc}</td>
        <td>${trx.amount.toFixed(2)}</td>
        <td>${en.description}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}
renderEntries();

// --------- دفتر الأستاذ ----------
function renderLedger() {
  const tbody = document.querySelector("#tbl-ledger tbody");
  tbody.innerHTML = "";

  accounts.forEach((acc) => {
    let debitTotal = 0,
      creditTotal = 0;
    entries.forEach((en) => {
      en.transactions.forEach((trx) => {
        if (trx.account === acc.code) {
          if (trx.type === "debit") debitTotal += trx.amount;
          else creditTotal += trx.amount;
        }
      });
    });

    let finalBalance;
    if (acc.balance_type === "debit") {
      finalBalance = acc.opening_balance + debitTotal - creditTotal;
    } else {
      finalBalance = acc.opening_balance - debitTotal + creditTotal;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${acc.code}</td>
      <td>${acc.name}</td>
      <td>${acc.opening_balance.toFixed(2)}</td>
      <td>${debitTotal.toFixed(2)}</td>
      <td>${creditTotal.toFixed(2)}</td>
      <td>${finalBalance.toFixed(2)}</td>
      <td>${acc.balance_type === "debit" ? "مدين" : "دائن"}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --------- ميزان المراجعة ----------
function renderTrialBalance() {
  const tbody = document.querySelector("#tbl-trial tbody");
  tbody.innerHTML = "";

  accounts.forEach((acc) => {
    let debitMovement = 0,
      creditMovement = 0;
    entries.forEach((en) => {
      en.transactions.forEach((trx) => {
        if (trx.account === acc.code) {
          if (trx.type === "debit") debitMovement += trx.amount;
          else creditMovement += trx.amount;
        }
      });
    });

    const openingDebit = acc.balance_type === "debit" ? acc.opening_balance : 0;
    const openingCredit =
      acc.balance_type === "credit" ? acc.opening_balance : 0;

    const totalDebit = openingDebit + debitMovement;
    const totalCredit = openingCredit + creditMovement;

    const finalDebit =
      totalDebit - totalCredit > 0 ? totalDebit - totalCredit : 0;
    const finalCredit =
      totalCredit - totalDebit > 0 ? totalCredit - totalDebit : 0;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${acc.name}</td>
      <td>${openingDebit.toFixed(2)}</td>
      <td>${openingCredit.toFixed(2)}</td>
      <td>${debitMovement.toFixed(2)}</td>
      <td>${creditMovement.toFixed(2)}</td>
      <td>${totalDebit.toFixed(2)}</td>
      <td>${totalCredit.toFixed(2)}</td>
      <td>${finalDebit.toFixed(2)}</td>
      <td>${finalCredit.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --------- قائمة المركز المالي ----------
document.getElementById("generate-financial").onclick = () => {
  const fromYear = document.getElementById("from-year").value;
  const toYear = document.getElementById("to-year").value;
  const tbody = document.querySelector("#tbl-financial tbody");
  tbody.innerHTML = "";

  accounts.forEach((acc) => {
    if (acc.balance_type === "debit") {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${acc.name}</td>
        <td>${acc.code}</td>
        <td>${fromYear}</td>
        <td>${toYear}</td>
      `;
      tbody.appendChild(tr);
    }
  });
};

// Users management (simple client-side using mockData)
function loadUsers() {
  const tbody = document.querySelector("#users-tbl tbody");
  tbody.innerHTML = "";
  (mockData.users || []).forEach((u) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>${u.created_at}</td>
      <td>${u.status}</td>
      <td class="table-actions">
        <button class="small-btn users-edit" data-id="${u.id}">تعديل</button>
        <button class="small-btn users-delete" data-id="${u.id}">حذف</button>
        <button class="small-btn users-perm" data-id="${u.id}">صلاحيات</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById("users-btn-new").onclick = () =>
  showPage("section-add-user");

document.getElementById("form-add-user").onsubmit = (e) => {
  e.preventDefault();
  const f = e.target;
  const newUser = {
    id:
      (mockData.users.length
        ? mockData.users[mockData.users.length - 1].id
        : 0) + 1,
    name: f.name.value.trim(),
    email: f.email.value.trim(),
    role: f.role.value,
    created_at: new Date().toISOString().slice(0, 10),
    status: "active",
  };
  mockData.users.push(newUser);
  f.reset();
  loadUsers();
  showPage("section-users-list");
  alert("✅ تم إضافة المستخدم");
};

// Delegated actions for users table
document.querySelector("#users-tbl tbody").addEventListener("click", (e) => {
  const t = e.target;
  if (t.classList.contains("users-delete")) {
    const id = +t.dataset.id;
    const idx = mockData.users.findIndex((x) => x.id === id);
    if (idx > -1) {
      if (mockData.users[idx].role === "مشرف أعلى") {
        alert("لا يمكن حذف المشرف الأعلى");
        return;
      }
      mockData.users.splice(idx, 1);
      loadUsers();
    }
  }
  if (t.classList.contains("users-edit")) {
    const id = +t.dataset.id;
    const u = mockData.users.find((x) => x.id === id);
    if (u) {
      showPage("section-edit-user");
      document.getElementById("edit-uid").value = u.id;
      document.getElementById("edit-name").value = u.name;
      document.getElementById("edit-email").value = u.email;
      document.getElementById("edit-role").value = u.role;
    }
  }
  if (t.classList.contains("users-perm")) {
    const id = +t.dataset.id;
    document.getElementById("perm-uid").value = id;
    showPage("section-permissions");
  }
});

document.getElementById("form-edit-user").onsubmit = (e) => {
  e.preventDefault();
  const f = e.target;
  const id = +document.getElementById("edit-uid").value;
  const u = mockData.users.find((x) => x.id === id);
  if (u) {
    u.name = f.name.value.trim();
    u.email = f.email.value.trim();
    if (f.password.value) {
      /* password ignored in mock */
    }
    u.role = f.role.value;
    loadUsers();
    showPage("section-users-list");
    alert("✅ تم حفظ التعديلات");
  }
};

document.getElementById("form-permissions").onsubmit = (e) => {
  e.preventDefault();
  // In this mock we just acknowledge saving
  alert("✅ تم حفظ الصلاحيات");
  showPage("section-users-list");
};

// Financial year helpers
function loadFinancialYear() {
  const y = mockData.financialYear || {};
  document.getElementById("fy-year").value = y.year || "";
  document.getElementById("fy-start").value = y.start || "";
  document.getElementById("fy-end").value = y.end || "";
  document.getElementById("fy-status").innerText =
    "الحالة: " + (y.status || "غير مفعلة");
}

document.getElementById("fy-activate").onclick = (e) => {
  e.preventDefault();
  const f = document.getElementById("form-year");
  mockData.financialYear = {
    year: f.year.value.trim(),
    start: f.start.value,
    end: f.end.value,
    status: "open",
  };
  loadFinancialYear();
  alert("✅ تم تفعيل/تحديث السنة المالية");
};

document.getElementById("fy-close").onclick = async () => {
  const res = await apiFetch("/api/year/close", { method: "POST" });
  document.getElementById("yc-audit-log").innerText = (res.log || []).join(
    "\n"
  );
  alert("✅ تمت عملية إغلاق السنة (اختباري)");
};

// Year close actions
document.getElementById("yc-close-accounts").onclick = async () => {
  const res = await apiFetch("/api/year/close", { method: "POST" });
  document.getElementById("yc-audit-log").innerText = (res.log || []).join(
    "\n"
  );
};
document.getElementById("yc-rollover").onclick = async () => {
  const res = await apiFetch("/api/year/rollover", { method: "POST" });
  document.getElementById("yc-audit-log").innerText = (res.log || []).join(
    "\n"
  );
};

// Journal filter
document.getElementById("j-refresh").onclick = async () => {
  const from = document.getElementById("j-from").value;
  const to = document.getElementById("j-to").value;
  const res = await apiFetch("/api/reports/journal");
  const rows = (res.rows || mockData.journal || []).filter((r) => {
    if (from && r.date < from) return false;
    if (to && r.date > to) return false;
    return true;
  });
  const tbody = document.querySelector("#j-tbl tbody");
  tbody.innerHTML = "";
  rows.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.id || ""}</td><td>${r.date || ""}</td><td>${
      r.desc || ""
    }</td><td>${r.debit || 0}</td><td>${
      r.credit || 0
    }</td><td><button class="small-btn">عرض</button></td>`;
    tbody.appendChild(tr);
  });
};

// Faculties / expenses
function populateFaculties() {
  const sel = document.getElementById("ef-faculty");
  if (!sel) return;
  sel.innerHTML = (mockData.faculties || [])
    .map((f) => `<option value="${f.id}">${f.name}</option>`)
    .join("");
}
document.getElementById("ef-view").onclick = () => {
  const id = +document.getElementById("ef-faculty").value;
  const rows = (mockData.revenues || []).filter((r) => r.faculty_id === id);
  const sum = rows.reduce((s, x) => s + (x.amount || 0), 0);
  document.getElementById(
    "ef-summary"
  ).innerText = `مجموع الإيرادات للكلية: ${sum.toFixed(2)}`;
};

// Student revenues
document.getElementById("sr-refresh").onclick = () => {
  const results = mockData.revenues || [];
  document.getElementById("sr-results").innerText = JSON.stringify(
    results,
    null,
    2
  );
};

// Account-specific reports / movements
function populateAccountSelectors() {
  const opts = (accounts || [])
    .map((a) => `<option value="${a.code}">${a.name}</option>`)
    .join("");
  const ar = document.getElementById("ar-account");
  if (ar) ar.innerHTML = opts;
  const am = document.getElementById("am-account");
  if (am) am.innerHTML = opts;
}
document.getElementById("ar-view").onclick = () => {
  const code = document.getElementById("ar-account").value;
  const from = document.getElementById("ar-from").value;
  const to = document.getElementById("ar-to").value;
  const rows = entries.flatMap((en) =>
    en.transactions
      .filter((t) => t.account === code)
      .map((t) => ({
        date: en.entryDate,
        type: t.type,
        amount: t.amount,
        desc: en.description,
      }))
  );
  document.getElementById("ar-report").innerText = JSON.stringify(
    rows.filter(
      (r) => (from ? r.date >= from : true) && (to ? r.date <= to : true)
    ),
    null,
    2
  );
};
document.getElementById("am-view").onclick = () => {
  const code = document.getElementById("am-account").value;
  const rows = entries.filter((en) =>
    en.transactions.some((t) => t.account === code)
  );
  document.getElementById("am-movements").innerText = JSON.stringify(
    rows,
    null,
    2
  );
};

// Search
document.getElementById("s-search").onclick = () => {
  const q = (document.getElementById("s-q").value || "").toLowerCase();
  const type = document.getElementById("s-type").value;
  let out = "";
  if (!type || type === "account") {
    const found = (accounts || []).filter(
      (a) => a.code.includes(q) || a.name.toLowerCase().includes(q)
    );
    out += "Accounts:\n" + JSON.stringify(found, null, 2) + "\n";
  }
  if (!type || type === "entry") {
    const found = (entries || []).filter(
      (en) =>
        en.description.toLowerCase().includes(q) ||
        en.entryDate.includes(q) ||
        en.transactions.some((t) => t.account.includes(q))
    );
    out += "Entries:\n" + JSON.stringify(found, null, 2);
  }
  document.getElementById("s-results").innerText = out || "لا توجد نتائج";
};

// Initialize small modules
loadUsers();
loadFinancialYear();
populateFaculties();
populateAccountSelectors();

// ensure transactions row exists for entry form (first row)
if (!document.querySelector("#transactions-container .transaction")) {
  document.getElementById("add-transaction").click();
}

// End of additions

// Simple logout handler — standalone login page handles sign-in
function doLogout() {
  try {
    localStorage.removeItem("loggedIn");
    window.location.href = "login.html";
  } catch (e) {
    console.warn("Logout error", e);
  }
}

// attach logout button
try {
  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) logoutBtn.addEventListener("click", doLogout);
  // show logout button only when logged in
  if (localStorage.getItem("loggedIn")) {
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    if (logoutBtn) logoutBtn.style.display = "none";
  }
} catch (e) {
  console.warn("Logout init error", e);
}
