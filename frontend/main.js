let accounts = JSON.parse(localStorage.getItem("accounts")) || [];
let entries = JSON.parse(localStorage.getItem("entries")) || [];

const pages = document.querySelectorAll(".page");
document.querySelector("#nav-accounts").onclick = () => showPage("section-accounts");
document.querySelector("#nav-entry").onclick = () => showPage("section-entry");
document.querySelector("#nav-ledger").onclick = () => showPage("section-ledger");
document.querySelector("#nav-trial").onclick = () => showPage("section-trial");
document.querySelector("#nav-financial").onclick = () => showPage("section-financial");

// New module buttons: load external HTML modules into a dynamic container
const dynamicContainer = document.createElement('div');
dynamicContainer.id = 'dynamic-module';
dynamicContainer.className = 'page';
dynamicContainer.style.display = 'none';
document.querySelector('main.container').appendChild(dynamicContainer);

document.querySelector('#nav-users').onclick = () => loadModule('users-list.html');
document.querySelector('#nav-finyear').onclick = () => loadModule('financial-year.html');
document.querySelector('#nav-yearclose').onclick = () => loadModule('year-close.html');
document.querySelector('#nav-journal').onclick = () => loadModule('journal.html');
document.querySelector('#nav-reports').onclick = () => loadModule('expenses-by-faculty.html');
document.querySelector('#nav-search').onclick = () => loadModule('search.html');

async function loadModule(url){
  // hide existing pages
  pages.forEach(p => p.style.display = 'none');
  dynamicContainer.style.display = 'block';
  // Use an iframe to reliably load full page (works with file:// and http://)
  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.style.width = '100%';
  iframe.style.height = '78vh';
  iframe.style.border = 'none';
  iframe.onload = function(){
    // remove previous content
  };
  dynamicContainer.innerHTML = '';
  dynamicContainer.appendChild(iframe);
}

function showPage(id) {
  pages.forEach(p => p.style.display = "none");
  document.getElementById(id).style.display = "block";
  if (id === "section-ledger") renderLedger();
  if (id === "section-entry") updateAccountOptions();
  if (id === "section-trial") renderTrialBalance();
}

// --------- الحسابات ----------
document.getElementById("form-account").onsubmit = e => {
  e.preventDefault();
  const form = e.target;
  const acc = {
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
  accounts.forEach(acc => {
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
  selects.forEach(sel => {
    sel.innerHTML = accounts.map(acc => `<option value="${acc.code}">${acc.name}</option>`).join("");
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

document.addEventListener("click", e => {
  if (e.target.classList.contains("remove-transaction")) {
    e.target.parentElement.remove();
  }
});

document.getElementById("form-entry").onsubmit = e => {
  e.preventDefault();
  const form = e.target;
  const entryDate = form.entry_date.value;
  const description = form.description.value;
  const transactions = [];

  document.querySelectorAll("#transactions-container .transaction").forEach(tr => {
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
  entries.forEach(en => {
    en.transactions.forEach(trx => {
      const acc = accounts.find(a => a.code === trx.account)?.name || trx.account;
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

  accounts.forEach(acc => {
    let debitTotal = 0, creditTotal = 0;
    entries.forEach(en => {
      en.transactions.forEach(trx => {
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

  accounts.forEach(acc => {
    let debitMovement = 0, creditMovement = 0;
    entries.forEach(en => {
      en.transactions.forEach(trx => {
        if (trx.account === acc.code) {
          if (trx.type === "debit") debitMovement += trx.amount;
          else creditMovement += trx.amount;
        }
      });
    });

    const openingDebit = acc.balance_type === "debit" ? acc.opening_balance : 0;
    const openingCredit = acc.balance_type === "credit" ? acc.opening_balance : 0;

    const totalDebit = openingDebit + debitMovement;
    const totalCredit = openingCredit + creditMovement;

    const finalDebit = totalDebit - totalCredit > 0 ? totalDebit - totalCredit : 0;
    const finalCredit = totalCredit - totalDebit > 0 ? totalCredit - totalDebit : 0;

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

  accounts.forEach(acc => {
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
