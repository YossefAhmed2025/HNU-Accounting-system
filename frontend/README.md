HNU Accounting - Frontend Modules

أين تضع الملفات:
- ضع كل الملفات المنشأة داخل المجلد `frontend/` بجانب `index.html`, `styles.css`, `main.js`.

الملفات التي أُنشئت/المعدّلة:
- أنشأت: `users-list.html`, `add-user.html`, `edit-user.html`, `permissions.html`, `delete-user.html` (modal fragment), `financial-year.html`, `year-close.html`, `journal.html`, `expenses-by-faculty.html`, `student-revenue.html`, `account-report.html`, `account-movements.html`, `search.html`.
- ملفات دعم: `admin-modules.js`, `modules.css`.
- تم تعديل: `index.html`, `styles.css` (أضيفت العلامة المائية والشعار) — احتفظ بنسخة احتياطية من النسخة الحالية إذا رغبت.

التكامل مع الـ Backend:
- كل صفحة تتصل بنقاط النهاية (endpoints) التالية عبر AJAX/fetch:
  - Users: `/api/users/list`, `/api/users/create`, `/api/users/update`, `/api/users/delete`, `/api/users/permissions`
  - Financial year: `/api/settings/financial-year` (GET/POST)
  - Year actions: `/api/year/close`, `/api/year/rollover`
  - Reports: `/api/reports/journal`, `/api/reports/...`
  - Faculties: `/api/faculties`, Revenues: `/api/revenues`, Accounts: `/api/accounts`

- إذا لم يوجد Backend متاح عند التجربة محلياً، يستخدم `admin-modules.js` بيانات تجريبية (mock) ويستجيب بنفس شكل JSON المتوقع.

صلاحيات وأمان:
- الواجهات تُخفي أو تمنع العمليات بناءً على نتيجة التحقق من الصلاحيات (يجب أن تضيف فحصًا حقيقيًا من الـ backend في كل طلب CRUD).
- Super Admin محمي في mock: لا يُسمح بحذفه من قبل أي مستخدم داخلية.

كيفية التجربة محلياً:
1. ضع `logo.png` في نفس المجلد `frontend`.
2. افتح أي صفحة HTML في المتصفح مباشرة (أو شغّل خادم محلي كما في README سابق).
3. الصفحات تستخدم mock data إن لم يتوفر backend.

اقتراح بنية قاعدة بيانات (مبسطة):
- users(id, name, email, password_hash, role, status, created_at)
- permissions(id, user_id/null, role/null, perm_key, allowed)
- financial_year(id, name, start_date, end_date, status)
- accounts(id, code, name, type, balance)
- journal_entries(id, date, description, created_by)
- journal_lines(id, entry_id, account_id, debit, credit)
- faculties(id, name)
- revenues(id, student_name, faculty_id, amount, status, year)

نهاية السطر المطلوب:
ابدأ الآن وولِّد الشيفرات الجاهزة للنسخ واللصق: users-list.html, add-user.html, edit-user.html, permissions.html, delete-user.html (modal), financial-year.html, year-close.html, journal.html, expenses-by-faculty.html, student-revenue.html, account-report.html, account-movements.html, search.html, plus any CSS/JS files you added or modified, and README.
