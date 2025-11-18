/* admin-modules.js
Common JS utilities for the accounting modules.
Provides a lightweight mock API layer (in-memory) and helper functions
so pages can call the same endpoints via `apiFetch`.
If a real backend exists, apiFetch will try the real endpoint first.
*/

const mockData = {
  users: [
    {id:1,name:'أحمد علي',email:'ahmed@hnu.edu',role:'مشرف أعلى',created_at:'2023-01-10',status:'active'},
    {id:2,name:'سارة محمد',email:'sara@hnu.edu',role:'مشرف',created_at:'2024-02-12',status:'active'},
    {id:3,name:'محمود خالد',email:'mahmoud@hnu.edu',role:'محاسب',created_at:'2024-05-03',status:'inactive'}
  ],
  financialYear: {year:'2024/2025',start:'2024-09-01',end:'2025-08-31',status:'open'},
  journal: [
    {id:101,date:'2025-01-05',desc:'إيرادات مبكرة',debit:0,credit:1200},
    {id:102,date:'2025-02-10',desc:'مصروفات الصيانة',debit:400,credit:0}
  ],
  faculties: [
    {id:1,name:'كلية الهندسة'},{id:2,name:'كلية العلوم'},{id:3,name:'كلية الآداب'}
  ],
  revenues:[
    {id:1,student:'محمد',faculty_id:1,amount:500,status:'paid',year:'2024/2025'}
  ],
  accounts:[
    {id:1001,code:'101',name:'الصندوق',balance:10000,type:'asset'},
    {id:2001,code:'401',name:'إيرادات الطلاب',balance:50000,type:'revenue'}
  ]
};

function safeJson(res){
  return res.json();
}

function delay(ms){return new Promise(r=>setTimeout(r,ms));}

async function apiFetch(path, options={method:'GET',body:null}){
  // Try real backend first
  try{
    const base = '';
    const url = path.startsWith('/api') ? path : path;
    // If running as file:// the fetch to /api will fail; handle gracefully
    const resp = await fetch(url, {...options, headers:{'Content-Type':'application/json'}});
    if(resp && resp.ok){
      return resp.json();
    }
  }catch(e){
    // fallback to mock
  }

  // Simple router for mock data
  await delay(250);
  if(path.startsWith('/api/users')){
    if(path === '/api/users/list' || path === '/api/users'){
      return {success:true,users: mockData.users};
    }
    if(path === '/api/users/create' && options.method==='POST'){
      const u = JSON.parse(options.body);
      u.id = mockData.users.length+1; u.created_at = new Date().toISOString().slice(0,10);
      mockData.users.push(u);
      return {success:true,user:u};
    }
    if(path === '/api/users/update' && options.method==='POST'){
      const u = JSON.parse(options.body);
      const idx = mockData.users.findIndex(x=>x.id==u.id);
      if(idx>-1){mockData.users[idx] = {...mockData.users[idx],...u};return {success:true,user:mockData.users[idx]};}
      return {success:false,error:'not found'};
    }
    if(path === '/api/users/delete' && options.method==='POST'){
      const {id} = JSON.parse(options.body);
      const idx = mockData.users.findIndex(x=>x.id==id);
      if(idx>-1){
        const u=mockData.users[idx];
        if(u.role==='Super Admin') return {success:false,error:'Cannot delete Super Admin'};
        mockData.users.splice(idx,1);
        return {success:true};
      }
      return {success:false,error:'not found'};
    }
    if(path === '/api/users/permissions' && options.method==='POST'){
      // just accept
      return {success:true};
    }
  }
  if(path.startsWith('/api/settings/financial-year')){
    if(options.method==='GET') return {success:true,year:mockData.financialYear};
    if(options.method==='POST'){
      const p = JSON.parse(options.body);
      mockData.financialYear = {...mockData.financialYear,...p};
      return {success:true,year:mockData.financialYear};
    }
  }
  if(path.startsWith('/api/year/close') && options.method==='POST'){
    return {success:true,log:['Closed income/expense accounts.']};
  }
  if(path.startsWith('/api/year/rollover') && options.method==='POST'){
    return {success:true,log:['Created opening entries for new year.']};
  }
  if(path.startsWith('/api/reports/journal')){
    return {success:true,rows:mockData.journal};
  }
  if(path.startsWith('/api/faculties')){
    return {success:true,faculties:mockData.faculties};
  }
  if(path.startsWith('/api/revenues')){
    return {success:true,rows:mockData.revenues};
  }
  if(path.startsWith('/api/accounts')){
    return {success:true,accounts:mockData.accounts};
  }

  return {success:false,error:'unknown endpoint in mock'};
}

function showMessage(msg, type='info'){
  alert(msg);
}

// Export to window
window.AdminAPI = {apiFetch, mockData, showMessage};
