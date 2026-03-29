import { useState, useMemo } from "react";

// ─── Utilities ────────────────────────────────────────────────────────────────
const fmt = (n) => new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 }).format(Number(n) || 0);
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

// ─── Constants ────────────────────────────────────────────────────────────────
const LEDGERS = [
  { id: "biz",      label: "商務中心",   icon: "🏢", color: "#2563eb" },
  { id: "salon",    label: "拾形造型",   icon: "✂️", color: "#8b5cf6" },
  { id: "personal", label: "個人收支",   icon: "👤", color: "#0891b2" },
  { id: "dbw",      label: "雙白商號",   icon: "🐾", color: "#f97316" },
];

const BIZ_PLANS   = ["虛擬辦公室", "電話秘書", "實體辦公室", "共用工作區", "登記址服務"];
const BIZ_CONTRACT_STATUS = {
  active:     { label: "合約中",   color: "#10b981" },
  expiring:   { label: "即將到期", color: "#f59e0b" },
  expired:    { label: "已到期",   color: "#ef4444" },
  terminated: { label: "已終止",   color: "#94a3b8" },
};
const BIZ_CHARGE_CATS = ["月租費", "會議室費用", "代收郵件費", "秘書服務費", "電話轉接費", "行政費用", "其他費用"];

const INCOME_CATS = {
  salon:    ["剪髮收入", "染燙收入", "護髮收入", "造型收入", "產品銷售", "其他收入"],
  personal: ["薪資收入", "兼職收入", "投資收益", "租金收入", "利息收入", "其他收入"],
  dbw:      ["寵物販售", "汽車出售", "其他收入"],
};
const EXPENSE_CATS = {
  salon:    ["材料費", "租金費用", "員工薪資", "水電費", "設備費", "行銷費用", "其他支出"],
  personal: ["餐飲費", "交通費", "娛樂費", "醫療費", "保險費", "日用品", "其他支出"],
  dbw:      ["寵物食品", "寵物醫療", "寵物美容", "寵物用品", "加油費", "汽車保險", "汽車維修保養", "停車費", "過路費", "汽車稅費", "其他支出"],
};

const AR_STATUS = {
  pending: { label: "未收款",   color: "#f59e0b" },
  partial: { label: "部分收款", color: "#3b82f6" },
  paid:    { label: "已結清",   color: "#10b981" },
  overdue: { label: "逾期未收", color: "#ef4444" },
};
const AP_STATUS = {
  pending: { label: "未付款",   color: "#f59e0b" },
  partial: { label: "部分付款", color: "#3b82f6" },
  paid:    { label: "已結清",   color: "#10b981" },
  overdue: { label: "逾期未付", color: "#ef4444" },
};

// ─── Seed Data ────────────────────────────────────────────────────────────────
const INIT = {
  // Business Center
  bizCompanies: [
    { id: "c1", name: "旭昇國際有限公司",    taxId: "12345678", contact: "王大明", phone: "0912-345-678", email: "wang@xusheng.com",  plan: "虛擬辦公室", contractStart: "2024-01-01", contractEnd: "2025-12-31", status: "active",   note: "長期客戶" },
    { id: "c2", name: "綠野科技股份有限公司",  taxId: "87654321", contact: "林小芬", phone: "0923-456-789", email: "lin@greentech.com", plan: "實體辦公室", contractStart: "2024-06-01", contractEnd: "2025-05-31", status: "expiring", note: "即將續約" },
    { id: "c3", name: "峰頂顧問事業",          taxId: "11223344", contact: "陳峰",   phone: "0934-567-890", email: "chen@summit.com",   plan: "電話秘書",   contractStart: "2023-03-01", contractEnd: "2024-02-28", status: "expired",  note: "" },
  ],
  bizCharges: [
    { id: "ch1", companyId: "c1", date: "2025-03-01", category: "月租費",     description: "3月虛擬辦公室月租", amount: 3500, note: "" },
    { id: "ch2", companyId: "c1", date: "2025-03-10", category: "會議室費用", description: "3/8 會議室2小時",   amount: 1200, note: "" },
    { id: "ch3", companyId: "c2", date: "2025-03-01", category: "月租費",     description: "3月實體辦公室月租", amount: 18000, note: "" },
    { id: "ch4", companyId: "c3", date: "2025-02-01", category: "月租費",     description: "2月電話秘書月租",   amount: 2000, note: "" },
  ],
  bizAR: [
    { id: "ar1", companyId: "c1", date: "2025-03-01", dueDate: "2025-03-15", description: "3月帳單", amount: 4700,  paid: 4700, status: "paid",    note: "" },
    { id: "ar2", companyId: "c2", date: "2025-03-01", dueDate: "2025-03-31", description: "3月帳單", amount: 18000, paid: 0,    status: "pending", note: "" },
    { id: "ar3", companyId: "c3", date: "2025-02-01", dueDate: "2025-02-28", description: "2月帳單", amount: 2000,  paid: 0,    status: "overdue", note: "催款未回" },
  ],
  bizNotes: [
    { id: "n1", companyId: "c1", date: "2025-03-20", content: "王大明來電詢問會議室預約事宜，已說明流程", author: "前台" },
    { id: "n2", companyId: "c2", date: "2025-03-18", content: "林小芬確認將續約，請備妥新合約", author: "業務" },
  ],

  // Salon
  salonIncome: [
    { id: "si1", date: "2025-03-05", category: "剪髮收入", description: "3月第1週剪髮",   amount: 12000, note: "" },
    { id: "si2", date: "2025-03-12", category: "染燙收入", description: "染燙服務",        amount: 18500, note: "" },
    { id: "si3", date: "2025-03-20", category: "護髮收入", description: "護髮護理服務",    amount: 6000,  note: "" },
  ],
  salonExpense: [
    { id: "se1", date: "2025-03-01", category: "租金費用", description: "3月店面租金",     amount: 25000, note: "" },
    { id: "se2", date: "2025-03-05", category: "材料費",   description: "染劑護髮材料採購", amount: 8500,  note: "" },
    { id: "se3", date: "2025-03-05", category: "員工薪資", description: "3月員工薪資",     amount: 30000, note: "" },
  ],
  salonAR: [
    { id: "sar1", date: "2025-03-10", dueDate: "2025-03-31", counterparty: "企業客戶 A",   description: "月度造型方案",  amount: 15000, paid: 0,     status: "pending", note: "" },
  ],
  salonAP: [
    { id: "sap1", date: "2025-03-05", dueDate: "2025-03-25", counterparty: "美材批發商",   description: "3月材料貨款",   amount: 8500,  paid: 8500,  status: "paid",    note: "" },
    { id: "sap2", date: "2025-03-10", dueDate: "2025-04-10", counterparty: "設備租賃公司", description: "洗髮椅租賃費",  amount: 3000,  paid: 0,     status: "pending", note: "" },
  ],

  // 雙白商號
  dbwIncome:  [],
  dbwExpense: [
    { id: "dwe1", date: "2025-03-05", category: "寵物食品",   description: "狗糧貓糧採購",   amount: 2800, note: "" },
    { id: "dwe2", date: "2025-03-10", category: "汽車保險",   description: "車險年繳",       amount: 12000, note: "" },
    { id: "dwe3", date: "2025-03-18", category: "加油費",     description: "3月加油費",      amount: 3500, note: "" },
    { id: "dwe4", date: "2025-03-20", category: "寵物醫療",   description: "年度健康檢查",   amount: 4500, note: "" },
  ],
  dbwAR: [],
  dbwAP: [
    { id: "dwap1", date: "2025-03-10", dueDate: "2025-04-10", counterparty: "汽車保險公司", description: "車險第二期", amount: 12000, paid: 0, status: "pending", note: "" },
  ],
  personalIncome: [
    { id: "pi1", date: "2025-03-05", category: "薪資收入", description: "3月薪資",   amount: 45000, note: "" },
    { id: "pi2", date: "2025-03-15", category: "兼職收入", description: "顧問諮詢",  amount: 8000,  note: "" },
  ],
  personalExpense: [
    { id: "pe1", date: "2025-03-03", category: "餐飲費",   description: "日常飲食",   amount: 4500,  note: "" },
    { id: "pe2", date: "2025-03-10", category: "交通費",   description: "油費停車費", amount: 2000,  note: "" },
    { id: "pe3", date: "2025-03-15", category: "保險費",   description: "汽車保險",   amount: 5000,  note: "" },
  ],
  personalAR: [],
  personalAP: [
    { id: "pap1", date: "2025-03-01", dueDate: "2025-03-31", counterparty: "房東", description: "3月房租", amount: 15000, paid: 0, status: "pending", note: "" },
  ],
};

// ─── UI Primitives ────────────────────────────────────────────────────────────
const Badge = ({ label, color }) => (
  <span style={{ background: color+"22", color, border:`1px solid ${color}44`, borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700, whiteSpace:"nowrap" }}>{label}</span>
);
const Card = ({ children, style }) => (
  <div style={{ background:"#fff", borderRadius:14, padding:16, boxShadow:"0 2px 8px rgba(0,0,0,0.06)", ...style }}>{children}</div>
);
const Stat = ({ label, value, color="#1e293b", sub }) => (
  <div style={{ background:"#fff", borderRadius:12, padding:"12px 14px", boxShadow:"0 2px 8px rgba(0,0,0,0.05)" }}>
    <div style={{ fontSize:10, color:"#64748b", fontWeight:700, letterSpacing:0.6, marginBottom:4 }}>{label}</div>
    <div style={{ fontSize:17, fontWeight:800, color }}>{value}</div>
    {sub && <div style={{ fontSize:10, color:"#94a3b8", marginTop:2 }}>{sub}</div>}
  </div>
);
const inputSt = { width:"100%", padding:"11px 14px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:16, background:"#f8fafc", color:"#1e293b", outline:"none", boxSizing:"border-box", fontFamily:"inherit" };
const labelSt = { fontSize:11, color:"#64748b", fontWeight:700, marginBottom:4, display:"block", letterSpacing:0.5 };
const Th = ({ children }) => <th style={{ padding:"10px 13px", textAlign:"left", fontWeight:700, color:"#475569", fontSize:12, letterSpacing:0.4, whiteSpace:"nowrap" }}>{children}</th>;
const Td = ({ children, style }) => <td style={{ padding:"10px 13px", fontSize:13, color:"#334155", ...style }}>{children}</td>;

const btnFor = (color) => ({ background:`linear-gradient(135deg,${color}cc,${color})`, color:"#fff", border:"none", borderRadius:10, padding:"10px 18px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" });
const btnSm = (bg, color) => ({ background:bg, color, border:"none", borderRadius:6, padding:"5px 12px", fontSize:12, fontWeight:600, cursor:"pointer", marginRight:4, fontFamily:"inherit" });

// ─── Row Card (mobile-friendly record row) ────────────────────────────────────
const RowCard = ({ left, right, sub, badge, onEdit, onDel, accentColor }) => (
  <div style={{ background:"#fff", borderRadius:12, padding:"12px 14px", marginBottom:8, boxShadow:"0 1px 6px rgba(0,0,0,0.05)", display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
    <div style={{ flex:1, minWidth:0 }}>
      <div style={{ fontWeight:700, fontSize:14, color:"#1e293b", marginBottom:2 }}>{left}</div>
      {sub && <div style={{ fontSize:12, color:"#94a3b8" }}>{sub}</div>}
      {badge && <div style={{ marginTop:4 }}>{badge}</div>}
    </div>
    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, marginLeft:10, flexShrink:0 }}>
      <div style={{ fontWeight:800, fontSize:15, color:accentColor||"#1e293b" }}>{right}</div>
      <div style={{ display:"flex", gap:4 }}>
        <button style={btnSm("#dbeafe","#2563eb")} onClick={onEdit}>編輯</button>
        <button style={btnSm("#fee2e2","#ef4444")} onClick={onDel}>刪除</button>
      </div>
    </div>
  </div>
);

// ─── Modal (mobile bottom sheet) ─────────────────────────────────────────────
const Modal = ({ title, accentColor, onClose, onSubmit, children }) => (
  <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.55)", zIndex:300, display:"flex", alignItems:"flex-end", justifyContent:"center" }}>
    <div style={{ background:"#fff", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:520, maxHeight:"90vh", overflow:"auto", boxShadow:"0 -8px 40px rgba(0,0,0,0.2)" }}>
      <div style={{ background:accentColor||"#1e3a5f", padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", borderRadius:"20px 20px 0 0" }}>
        <span style={{ color:"#fff", fontWeight:700, fontSize:16 }}>{title}</span>
        <button onClick={onClose} style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"#fff", fontSize:18, cursor:"pointer", lineHeight:1, borderRadius:8, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
      </div>
      <div style={{ padding:20 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>{children}</div>
        <div style={{ marginTop:16, display:"flex", gap:10 }}>
          <button onClick={onClose} style={{ flex:1, background:"#f1f5f9", color:"#475569", border:"none", borderRadius:10, padding:"13px", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>取消</button>
          <button onClick={onSubmit} style={{ flex:2, ...(btnFor(accentColor||"#2563eb")), padding:"13px", fontSize:15 }}>儲存</button>
        </div>
      </div>
    </div>
  </div>
);
const Field = ({ label, children, full }) => (
  <div style={full?{gridColumn:"1/-1"}:{}}>
    <label style={labelSt}>{label}</label>{children}
  </div>
);

// ─── Generic Income/Expense/AR/AP tabs ───────────────────────────────────────
function LedgerTabs({ lid, color, income, setIncome, expense, setExpense, ar, setAr, ap, setAp }) {
  const [tab, setTab] = useState("income");
  const [modal, setModal] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({});

  const iCats = INCOME_CATS[lid] || [];
  const eCats = EXPENSE_CATS[lid] || [];

  const totalIncome  = income.reduce((s, r) => s + r.amount, 0);
  const totalExpense = expense.reduce((s, r) => s + r.amount, 0);
  const totalAR      = ar.reduce((s, r) => s + Number(r.amount) - Number(r.paid||0), 0);
  const totalAP      = ap.reduce((s, r) => s + Number(r.amount) - Number(r.paid||0), 0);

  const openModal = (type, item=null) => {
    setModal(type); setEditItem(item);
    const base = {
      income:  { date:today(), category:iCats[0]||"", description:"", amount:"", note:"" },
      expense: { date:today(), category:eCats[0]||"", description:"", amount:"", note:"" },
      ar:      { date:today(), dueDate:"", counterparty:"", description:"", amount:"", paid:"0", status:"pending", note:"" },
      ap:      { date:today(), dueDate:"", counterparty:"", description:"", amount:"", paid:"0", status:"pending", note:"" },
    }[type];
    setForm(item ? { ...item } : { ...base });
  };
  const closeModal = () => { setModal(null); setEditItem(null); };

  const save = (type) => {
    if ((type==="income"||type==="expense") && (!form.description||!form.amount)) return;
    if ((type==="ar"||type==="ap") && !form.amount) return;
    const entry = { ...form, id: editItem?.id||uid(), amount:Number(form.amount), paid:Number(form.paid||0) };
    const updater = (arr, set) => editItem ? set(arr.map(x=>x.id===editItem.id?entry:x)) : set([...arr, entry]);
    if (type==="income")  updater(income,  setIncome);
    if (type==="expense") updater(expense, setExpense);
    if (type==="ar")      updater(ar,      setAr);
    if (type==="ap")      updater(ap,      setAp);
    closeModal();
  };
  const del = (type, id) => {
    if (type==="income")  setIncome(r=>r.filter(x=>x.id!==id));
    if (type==="expense") setExpense(r=>r.filter(x=>x.id!==id));
    if (type==="ar")      setAr(r=>r.filter(x=>x.id!==id));
    if (type==="ap")      setAp(r=>r.filter(x=>x.id!==id));
  };

  const tabs = [
    { key:"income",  label:"收入", icon:"📈" },
    { key:"expense", label:"支出", icon:"📉" },
    { key:"ar",      label:"應收", icon:"📥" },
    { key:"ap",      label:"應付", icon:"📤" },
  ];

  return (
    <div style={{ paddingBottom:20 }}>
      {/* Stats 2x2 grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
        <Stat label="收入總計" value={fmt(totalIncome)}  color="#10b981" sub={`${income.length} 筆`} />
        <Stat label="支出總計" value={fmt(totalExpense)} color="#ef4444" sub={`${expense.length} 筆`} />
        <Stat label="應收餘額" value={fmt(totalAR)}      color="#2563eb" sub={`${ar.filter(r=>r.status!=="paid").length} 筆待收`} />
        <Stat label="應付餘額" value={fmt(totalAP)}      color="#f59e0b" sub={`${ap.filter(r=>r.status!=="paid").length} 筆待付`} />
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", background:"#fff", borderRadius:12, padding:4, marginBottom:16, boxShadow:"0 1px 6px rgba(0,0,0,0.06)" }}>
        {tabs.map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            flex:1, background: tab===t.key ? color : "transparent",
            border:"none", borderRadius:9, padding:"8px 4px", cursor:"pointer", fontFamily:"inherit",
            fontWeight:700, fontSize:12, color: tab===t.key?"#fff":"#64748b",
            transition:"all 0.15s",
          }}>{t.icon}<br/>{t.label}</button>
        ))}
      </div>

      {/* ── Income ── */}
      {tab==="income" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <span style={{ fontWeight:700, color:"#1e293b", fontSize:15 }}>收入明細</span>
            <button style={btnFor(color)} onClick={()=>openModal("income")}>＋ 新增</button>
          </div>
          {[...income].reverse().map(r=>(
            <RowCard key={r.id}
              left={r.description}
              right={`+${fmt(r.amount)}`}
              sub={`${r.date} · ${r.category}`}
              accentColor="#10b981"
              onEdit={()=>openModal("income",r)}
              onDel={()=>del("income",r.id)}
            />
          ))}
          {income.length===0 && <div style={{ textAlign:"center", padding:32, color:"#94a3b8" }}>尚無收入記錄</div>}
        </div>
      )}

      {/* ── Expense ── */}
      {tab==="expense" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <span style={{ fontWeight:700, color:"#1e293b", fontSize:15 }}>支出明細</span>
            <button style={btnFor("#ef4444")} onClick={()=>openModal("expense")}>＋ 新增</button>
          </div>
          {[...expense].reverse().map(r=>(
            <RowCard key={r.id}
              left={r.description}
              right={`-${fmt(r.amount)}`}
              sub={`${r.date} · ${r.category}`}
              accentColor="#ef4444"
              onEdit={()=>openModal("expense",r)}
              onDel={()=>del("expense",r.id)}
            />
          ))}
          {expense.length===0 && <div style={{ textAlign:"center", padding:32, color:"#94a3b8" }}>尚無支出記錄</div>}
        </div>
      )}

      {/* ── AR ── */}
      {tab==="ar" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <span style={{ fontWeight:700, color:"#1e293b", fontSize:15 }}>應收帳款</span>
            <button style={btnFor(color)} onClick={()=>openModal("ar")}>＋ 新增</button>
          </div>
          {[...ar].reverse().map(r=>{
            const st=AR_STATUS[r.status]; const rem=Number(r.amount)-Number(r.paid||0);
            return (
              <RowCard key={r.id}
                left={r.counterparty||r.description||"-"}
                right={fmt(rem)}
                sub={`${r.description} · 到期 ${r.dueDate||"未設"}`}
                badge={<Badge label={st?.label} color={st?.color} />}
                accentColor={rem>0?"#ef4444":"#10b981"}
                onEdit={()=>openModal("ar",r)}
                onDel={()=>del("ar",r.id)}
              />
            );
          })}
          {ar.length===0 && <div style={{ textAlign:"center", padding:32, color:"#94a3b8" }}>尚無應收帳款</div>}
        </div>
      )}

      {/* ── AP ── */}
      {tab==="ap" && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <span style={{ fontWeight:700, color:"#1e293b", fontSize:15 }}>應付帳款</span>
            <button style={btnFor("#f59e0b")} onClick={()=>openModal("ap")}>＋ 新增</button>
          </div>
          {[...ap].reverse().map(r=>{
            const st=AP_STATUS[r.status]; const rem=Number(r.amount)-Number(r.paid||0);
            return (
              <RowCard key={r.id}
                left={r.counterparty||r.description||"-"}
                right={fmt(rem)}
                sub={`${r.description} · 到期 ${r.dueDate||"未設"}`}
                badge={<Badge label={st?.label} color={st?.color} />}
                accentColor={rem>0?"#f59e0b":"#10b981"}
                onEdit={()=>openModal("ap",r)}
                onDel={()=>del("ap",r.id)}
              />
            );
          })}
          {ap.length===0 && <div style={{ textAlign:"center", padding:32, color:"#94a3b8" }}>尚無應付帳款</div>}
        </div>
      )}

      {/* ── Modals ── */}
      {(modal==="income"||modal==="expense") && (
        <Modal title={`${editItem?"編輯":"新增"}${modal==="income"?"收入":"支出"}`} accentColor={modal==="income"?color:"#ef4444"} onClose={closeModal} onSubmit={()=>save(modal)}>
          <Field label="日期 *" full><input type="date" style={inputSt} value={form.date||today()} onChange={e=>setForm({...form,date:e.target.value})} /></Field>
          <Field label="科目" full>
            <select style={inputSt} value={form.category||""} onChange={e=>setForm({...form,category:e.target.value})}>
              {(modal==="income"?iCats:eCats).map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="說明 *" full><input style={inputSt} value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} placeholder="說明" /></Field>
          <Field label="金額 (NT$) *" full><input type="number" style={inputSt} value={form.amount||""} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0" /></Field>
          <Field label="備註" full><input style={inputSt} value={form.note||""} onChange={e=>setForm({...form,note:e.target.value})} placeholder="選填" /></Field>
        </Modal>
      )}
      {(modal==="ar"||modal==="ap") && (
        <Modal title={`${editItem?"編輯":"新增"}${modal==="ar"?"應收帳款":"應付帳款"}`} accentColor={modal==="ar"?color:"#f59e0b"} onClose={closeModal} onSubmit={()=>save(modal)}>
          <Field label="日期 *"><input type="date" style={inputSt} value={form.date||today()} onChange={e=>setForm({...form,date:e.target.value})} /></Field>
          <Field label="到期日"><input type="date" style={inputSt} value={form.dueDate||""} onChange={e=>setForm({...form,dueDate:e.target.value})} /></Field>
          <Field label={modal==="ar"?"客戶":"廠商"} full><input style={inputSt} value={form.counterparty||""} onChange={e=>setForm({...form,counterparty:e.target.value})} placeholder="對象名稱" /></Field>
          <Field label="說明" full><input style={inputSt} value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} placeholder="帳款說明" /></Field>
          <Field label="金額 (NT$) *"><input type="number" style={inputSt} value={form.amount||""} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0" /></Field>
          <Field label={modal==="ar"?"已收":"已付"}><input type="number" style={inputSt} value={form.paid||"0"} onChange={e=>setForm({...form,paid:e.target.value})} placeholder="0" /></Field>
          <Field label="狀態" full>
            <select style={inputSt} value={form.status||"pending"} onChange={e=>setForm({...form,status:e.target.value})}>
              {Object.entries(modal==="ar"?AR_STATUS:AP_STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="備註" full><input style={inputSt} value={form.note||""} onChange={e=>setForm({...form,note:e.target.value})} placeholder="選填" /></Field>
        </Modal>
      )}
    </div>
  );
}

// ─── Business Center View ─────────────────────────────────────────────────────
function BizView({ color }) {
  const [companies, setCompanies] = useState(INIT.bizCompanies);
  const [charges,   setCharges]   = useState(INIT.bizCharges);
  const [ar,        setAr]        = useState(INIT.bizAR);
  const [notes,     setNotes]     = useState(INIT.bizNotes);

  const [view, setView]         = useState("overview"); // overview | list | detail
  const [selectedCo, setSelectedCo] = useState(null);
  const [coTab, setCoTab]       = useState("charges");
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm]         = useState({});

  const coCharges  = (cid) => charges.filter(c=>c.companyId===cid);
  const coAR       = (cid) => ar.filter(r=>r.companyId===cid);
  const coNotes    = (cid) => notes.filter(n=>n.companyId===cid);
  const coBalance  = (cid) => coAR(cid).reduce((s,r)=>s+Number(r.amount)-Number(r.paid||0),0);

  const totalOutstanding = ar.reduce((s,r)=>s+Number(r.amount)-Number(r.paid||0),0);
  const overdueCount     = ar.filter(r=>r.status==="overdue").length;
  const expiringCount    = companies.filter(c=>c.status==="expiring").length;

  const openModal = (type, item=null, defaults={}) => {
    setModal(type); setEditItem(item);
    const bases = {
      company: { name:"", taxId:"", contact:"", phone:"", email:"", plan:BIZ_PLANS[0], contractStart:today(), contractEnd:"", status:"active", note:"" },
      charge:  { companyId:selectedCo?.id||"", date:today(), category:BIZ_CHARGE_CATS[0], description:"", amount:"", note:"" },
      ar:      { companyId:selectedCo?.id||"", date:today(), dueDate:"", description:"", amount:"", paid:"0", status:"pending", note:"" },
      note:    { companyId:selectedCo?.id||"", date:today(), content:"", author:"" },
    };
    setForm(item ? {...item} : {...bases[type], ...defaults});
  };
  const closeModal = () => { setModal(null); setEditItem(null); };

  const saveCompany = () => {
    if (!form.name) return;
    if (editItem) setCompanies(cs=>cs.map(c=>c.id===editItem.id?{...form,id:editItem.id}:c));
    else setCompanies(cs=>[...cs,{...form,id:uid()}]);
    closeModal();
  };
  const saveCharge = () => {
    if (!form.description||!form.amount) return;
    const entry = {...form,id:editItem?.id||uid(),amount:Number(form.amount)};
    if (editItem) setCharges(cs=>cs.map(c=>c.id===editItem.id?entry:c));
    else setCharges(cs=>[...cs,entry]);
    closeModal();
  };
  const saveAR = () => {
    if (!form.amount) return;
    const entry = {...form,id:editItem?.id||uid(),amount:Number(form.amount),paid:Number(form.paid||0)};
    if (editItem) setAr(rs=>rs.map(r=>r.id===editItem.id?entry:r));
    else setAr(rs=>[...rs,entry]);
    closeModal();
  };
  const saveNote = () => {
    if (!form.content) return;
    const entry = {...form,id:editItem?.id||uid()};
    if (editItem) setNotes(ns=>ns.map(n=>n.id===editItem.id?entry:n));
    else setNotes(ns=>[...ns,entry]);
    closeModal();
  };

  const filtered = companies.filter(c=>c.name.includes(search)||(c.taxId||"").includes(search)||(c.contact||"").includes(search));

  const navTabs = [
    { key:"overview", label:"📊 總覽" },
    { key:"list",     label:"🏢 公司列表" },
  ];

  return (
    <div>
      {/* Sub nav */}
      <div style={{ display:"flex", gap:2, borderBottom:"2px solid #e2e8f0", marginBottom:20 }}>
        {navTabs.map(t=>(
          <button key={t.key} onClick={()=>{setView(t.key);setSelectedCo(null);}} style={{
            background:"none",border:"none",padding:"9px 16px",cursor:"pointer",fontFamily:"inherit",
            fontWeight:view===t.key&&!selectedCo?700:400,fontSize:14,
            color:view===t.key&&!selectedCo?color:"#64748b",
            borderBottom:view===t.key&&!selectedCo?`2px solid ${color}`:"2px solid transparent",
            marginBottom:-2,
          }}>{t.label}</button>
        ))}
        {selectedCo && <>
          <span style={{ padding:"9px 6px", color:"#cbd5e1" }}>/</span>
          <span style={{ padding:"9px 0", fontWeight:700, fontSize:14, color:color }}>{selectedCo.name}</span>
        </>}
        <div style={{ flex:1 }} />
        <button style={{...btnFor(color), marginBottom:4, padding:"6px 16px", fontSize:13}} onClick={()=>openModal("company")}>＋ 新增公司</button>
      </div>

      {/* Overview */}
      {view==="overview" && !selectedCo && (
        <div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:13, marginBottom:22 }}>
            <Stat label="服務公司數"   value={companies.length+" 間"}  color={color} sub={`合約中 ${companies.filter(c=>c.status==="active").length} 間`} />
            <Stat label="總應收餘額"   value={fmt(totalOutstanding)}    color="#f59e0b" />
            <Stat label="逾期未收"     value={overdueCount+" 筆"}       color="#ef4444" sub={overdueCount>0?"需追款":"無逾期"} />
            <Stat label="即將到期合約" value={expiringCount+" 間"}      color="#8b5cf6" />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18 }}>
            <Card>
              <div style={{ fontWeight:700, color:"#1e293b", marginBottom:14 }}>🏢 各公司帳款狀況</div>
              {companies.map(c=>{
                const bal=coBalance(c.id); const cs=BIZ_CONTRACT_STATUS[c.status];
                return (
                  <div key={c.id} onClick={()=>{setSelectedCo(c);setView("detail");setCoTab("charges");}}
                    style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #f1f5f9",cursor:"pointer" }}>
                    <div>
                      <div style={{ fontWeight:600,fontSize:14,color:"#1e293b" }}>{c.name}</div>
                      <div style={{ fontSize:12,color:"#94a3b8" }}>{c.plan} · {c.contact}</div>
                    </div>
                    <div style={{ textAlign:"right",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
                      <span style={{ fontWeight:700,color:bal>0?"#ef4444":"#10b981",fontSize:14 }}>{bal>0?fmt(bal):"無欠款"}</span>
                      <Badge label={cs?.label} color={cs?.color} />
                    </div>
                  </div>
                );
              })}
            </Card>
            <Card>
              <div style={{ fontWeight:700,color:"#1e293b",marginBottom:14 }}>⚠️ 逾期 / 待收帳款</div>
              {ar.filter(r=>r.status==="overdue"||r.status==="pending").map(r=>{
                const co=companies.find(c=>c.id===r.companyId); const st=AR_STATUS[r.status];
                return (
                  <div key={r.id} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:"1px solid #f1f5f9" }}>
                    <div>
                      <div style={{ fontWeight:600,fontSize:14,color:"#1e293b" }}>{co?.name||"-"}</div>
                      <div style={{ fontSize:12,color:"#94a3b8" }}>{r.description} · 到期 {r.dueDate||"未設定"}</div>
                    </div>
                    <div style={{ textAlign:"right",display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4 }}>
                      <span style={{ fontWeight:700,color:st?.color,fontSize:14 }}>{fmt(Number(r.amount)-Number(r.paid||0))}</span>
                      <Badge label={st?.label} color={st?.color} />
                    </div>
                  </div>
                );
              })}
              {ar.filter(r=>r.status==="overdue"||r.status==="pending").length===0&&<div style={{ color:"#94a3b8",textAlign:"center",padding:20 }}>✅ 無待收帳款</div>}
            </Card>
          </div>
        </div>
      )}

      {/* Company List */}
      {view==="list" && !selectedCo && (
        <div>
          <input style={{...inputSt,maxWidth:340,background:"#fff",marginBottom:14}} placeholder="🔍  搜尋名稱、統編、聯絡人…" value={search} onChange={e=>setSearch(e.target.value)} />
          <Card style={{ padding:0,overflow:"hidden" }}>
            <table style={{ width:"100%",borderCollapse:"collapse" }}>
              <thead><tr style={{ background:"#f8fafc",borderBottom:"1px solid #e2e8f0" }}>
                <Th>公司名稱</Th><Th>統編</Th><Th>聯絡人</Th><Th>方案</Th><Th>合約期間</Th><Th>未收餘額</Th><Th>狀態</Th><Th>操作</Th>
              </tr></thead>
              <tbody>
                {filtered.map((c,i)=>{
                  const cs=BIZ_CONTRACT_STATUS[c.status]; const bal=coBalance(c.id);
                  return (
                    <tr key={c.id} style={{ borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa",cursor:"pointer" }}
                      onClick={()=>{setSelectedCo(c);setView("detail");setCoTab("charges");}}>
                      <Td style={{ fontWeight:700 }}>{c.name}</Td>
                      <Td style={{ color:"#64748b" }}>{c.taxId||"-"}</Td>
                      <Td>{c.contact}<br/><span style={{ fontSize:11,color:"#94a3b8" }}>{c.phone}</span></Td>
                      <Td><span style={{ background:"#dbeafe",color:"#1d4ed8",borderRadius:6,padding:"2px 9px",fontSize:12,fontWeight:600 }}>{c.plan}</span></Td>
                      <Td style={{ fontSize:12 }}>{c.contractStart} ～ {c.contractEnd||"未定"}</Td>
                      <Td style={{ fontWeight:700,color:bal>0?"#ef4444":"#10b981" }}>{bal>0?fmt(bal):"無欠款"}</Td>
                      <Td><Badge label={cs?.label} color={cs?.color} /></Td>
                      <Td onClick={e=>e.stopPropagation()}>
                        <button style={btnSm("#dbeafe","#2563eb")} onClick={()=>openModal("company",c)}>編輯</button>
                        <button style={btnSm("#fee2e2","#ef4444")} onClick={()=>setCompanies(cs=>cs.filter(x=>x.id!==c.id))}>刪除</button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length===0&&<div style={{ textAlign:"center",padding:32,color:"#94a3b8" }}>查無公司資料</div>}
          </Card>
        </div>
      )}

      {/* Company Detail */}
      {selectedCo && view==="detail" && (()=>{
        const co       = companies.find(c=>c.id===selectedCo.id)||selectedCo;
        const cs       = BIZ_CONTRACT_STATUS[co.status];
        const cCharges = coCharges(co.id);
        const cAR      = coAR(co.id);
        const cNotes   = coNotes(co.id);
        const balance  = cAR.reduce((s,r)=>s+Number(r.amount)-Number(r.paid||0),0);
        const coTabs   = [{key:"charges",label:"📋 收費明細"},{key:"ar",label:"💰 應收帳款"},{key:"notes",label:"📝 備忘紀錄"}];
        return (
          <div>
            <Card style={{ marginBottom:18 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12 }}>
                <div style={{ display:"flex",gap:14,alignItems:"center" }}>
                  <div style={{ width:50,height:50,borderRadius:13,background:`linear-gradient(135deg,${color}cc,${color})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0 }}>🏢</div>
                  <div>
                    <div style={{ fontSize:18,fontWeight:800,color:"#1e293b" }}>{co.name}</div>
                    <div style={{ fontSize:13,color:"#64748b" }}>統編：{co.taxId||"未填"} · {co.plan}</div>
                    <div style={{ fontSize:13,color:"#64748b" }}>{co.contact}　{co.phone}　{co.email}</div>
                    <div style={{ fontSize:13,color:"#64748b" }}>合約：{co.contractStart} ～ {co.contractEnd||"未設定"}</div>
                  </div>
                </div>
                <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                  <Badge label={cs?.label} color={cs?.color} />
                  <button style={btnSm("#dbeafe","#2563eb")} onClick={()=>openModal("company",co)}>編輯</button>
                </div>
              </div>
              {co.note&&<div style={{ marginTop:10,padding:"8px 12px",background:"#f8fafc",borderRadius:8,fontSize:13,color:"#475569",borderLeft:"3px solid #cbd5e1" }}>備註：{co.note}</div>}
            </Card>
            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:13,marginBottom:18 }}>
              <Stat label="累積費用" value={fmt(cCharges.reduce((s,c)=>s+c.amount,0))} color={color} sub={`${cCharges.length} 筆`} />
              <Stat label="已收款"   value={fmt(cAR.reduce((s,r)=>s+Number(r.paid||0),0))} color="#10b981" />
              <Stat label="未收餘額" value={fmt(balance)} color={balance>0?"#ef4444":"#10b981"} sub={balance>0?"需催收":"帳款清零"} />
            </div>
            <div style={{ display:"flex",gap:2,borderBottom:"2px solid #e2e8f0",marginBottom:16 }}>
              {coTabs.map(t=>(
                <button key={t.key} onClick={()=>setCoTab(t.key)} style={{
                  background:"none",border:"none",padding:"9px 16px",cursor:"pointer",fontFamily:"inherit",
                  fontWeight:coTab===t.key?700:400,fontSize:14,
                  color:coTab===t.key?color:"#64748b",
                  borderBottom:coTab===t.key?`2px solid ${color}`:"2px solid transparent",
                  marginBottom:-2,
                }}>{t.label}</button>
              ))}
            </div>

            {coTab==="charges"&&(
              <Card style={{ padding:0,overflow:"hidden" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",borderBottom:"1px solid #f1f5f9" }}>
                  <span style={{ fontWeight:700,color:"#1e293b" }}>收費明細</span>
                  <button style={btnFor(color)} onClick={()=>openModal("charge",null,{companyId:co.id})}>＋ 新增費用</button>
                </div>
                <table style={{ width:"100%",borderCollapse:"collapse" }}>
                  <thead><tr style={{ background:"#f8fafc" }}><Th>日期</Th><Th>科目</Th><Th>說明</Th><Th>金額</Th><Th>備註</Th><Th>操作</Th></tr></thead>
                  <tbody>
                    {[...cCharges].reverse().map((c,i)=>(
                      <tr key={c.id} style={{ borderTop:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa" }}>
                        <Td style={{ color:"#64748b" }}>{c.date}</Td>
                        <Td><span style={{ background:"#dbeafe",color:"#1d4ed8",borderRadius:6,padding:"2px 9px",fontSize:12,fontWeight:600 }}>{c.category}</span></Td>
                        <Td style={{ fontWeight:600 }}>{c.description}</Td>
                        <Td style={{ fontWeight:700,color:color }}>{fmt(c.amount)}</Td>
                        <Td style={{ color:"#94a3b8" }}>{c.note||"-"}</Td>
                        <Td>
                          <button style={btnSm("#dbeafe","#2563eb")} onClick={()=>openModal("charge",c)}>編輯</button>
                          <button style={btnSm("#fee2e2","#ef4444")} onClick={()=>setCharges(cs=>cs.filter(x=>x.id!==c.id))}>刪除</button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {cCharges.length===0&&<div style={{ textAlign:"center",padding:28,color:"#94a3b8" }}>尚無費用記錄</div>}
              </Card>
            )}

            {coTab==="ar"&&(
              <Card style={{ padding:0,overflow:"hidden" }}>
                <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 16px",borderBottom:"1px solid #f1f5f9" }}>
                  <span style={{ fontWeight:700,color:"#1e293b" }}>應收帳款</span>
                  <button style={btnFor(color)} onClick={()=>openModal("ar",null,{companyId:co.id})}>＋ 新增帳款</button>
                </div>
                <table style={{ width:"100%",borderCollapse:"collapse" }}>
                  <thead><tr style={{ background:"#f8fafc" }}><Th>發票日</Th><Th>到期日</Th><Th>說明</Th><Th>應收</Th><Th>已收</Th><Th>餘額</Th><Th>狀態</Th><Th>備註</Th><Th>操作</Th></tr></thead>
                  <tbody>
                    {[...cAR].reverse().map((r,i)=>{
                      const st=AR_STATUS[r.status]; const rem=Number(r.amount)-Number(r.paid||0);
                      return (
                        <tr key={r.id} style={{ borderTop:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa" }}>
                          <Td style={{ color:"#64748b" }}>{r.date}</Td>
                          <Td style={{ color:r.status==="overdue"?"#ef4444":"#64748b",fontWeight:r.status==="overdue"?700:400 }}>{r.dueDate||"-"}</Td>
                          <Td style={{ fontWeight:600 }}>{r.description}</Td>
                          <Td>{fmt(r.amount)}</Td>
                          <Td style={{ color:"#10b981",fontWeight:600 }}>{fmt(r.paid||0)}</Td>
                          <Td style={{ fontWeight:700,color:rem>0?"#ef4444":"#10b981" }}>{fmt(rem)}</Td>
                          <Td><Badge label={st?.label} color={st?.color} /></Td>
                          <Td style={{ color:"#94a3b8",fontSize:12 }}>{r.note||"-"}</Td>
                          <Td>
                            <button style={btnSm("#dbeafe","#2563eb")} onClick={()=>openModal("ar",r)}>編輯</button>
                            <button style={btnSm("#fee2e2","#ef4444")} onClick={()=>setAr(rs=>rs.filter(x=>x.id!==r.id))}>刪除</button>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {cAR.length===0&&<div style={{ textAlign:"center",padding:28,color:"#94a3b8" }}>尚無應收帳款記錄</div>}
              </Card>
            )}

            {coTab==="notes"&&(
              <div>
                <div style={{ display:"flex",justifyContent:"flex-end",marginBottom:12 }}>
                  <button style={btnFor(color)} onClick={()=>openModal("note",null,{companyId:co.id})}>＋ 新增備忘</button>
                </div>
                {[...cNotes].reverse().map(n=>(
                  <Card key={n.id} style={{ marginBottom:10 }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14,color:"#1e293b",lineHeight:1.7 }}>{n.content}</div>
                        <div style={{ fontSize:12,color:"#94a3b8",marginTop:6 }}>📅 {n.date}　✍️ {n.author||"未填"}</div>
                      </div>
                      <div style={{ display:"flex",gap:5,marginLeft:12,flexShrink:0 }}>
                        <button style={btnSm("#dbeafe","#2563eb")} onClick={()=>openModal("note",n)}>編輯</button>
                        <button style={btnSm("#fee2e2","#ef4444")} onClick={()=>setNotes(ns=>ns.filter(x=>x.id!==n.id))}>刪除</button>
                      </div>
                    </div>
                  </Card>
                ))}
                {cNotes.length===0&&<Card><div style={{ textAlign:"center",padding:22,color:"#94a3b8" }}>尚無備忘紀錄</div></Card>}
              </div>
            )}
          </div>
        );
      })()}

      {/* Modals */}
      {modal==="company"&&(
        <Modal title={editItem?"編輯公司":"新增公司"} accentColor={color} onClose={closeModal} onSubmit={saveCompany} wide>
          <Field label="公司名稱 *" full><input style={inputSt} value={form.name||""} onChange={e=>setForm({...form,name:e.target.value})} placeholder="公司全名" /></Field>
          <Field label="統一編號"><input style={inputSt} value={form.taxId||""} onChange={e=>setForm({...form,taxId:e.target.value})} placeholder="8碼統編" /></Field>
          <Field label="服務方案"><select style={inputSt} value={form.plan||BIZ_PLANS[0]} onChange={e=>setForm({...form,plan:e.target.value})}>{BIZ_PLANS.map(p=><option key={p} value={p}>{p}</option>)}</select></Field>
          <Field label="負責人 / 聯絡人"><input style={inputSt} value={form.contact||""} onChange={e=>setForm({...form,contact:e.target.value})} placeholder="姓名" /></Field>
          <Field label="聯絡電話"><input style={inputSt} value={form.phone||""} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="09xx-xxx-xxx" /></Field>
          <Field label="Email"><input style={inputSt} value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email" /></Field>
          <Field label="合約開始日"><input type="date" style={inputSt} value={form.contractStart||""} onChange={e=>setForm({...form,contractStart:e.target.value})} /></Field>
          <Field label="合約結束日"><input type="date" style={inputSt} value={form.contractEnd||""} onChange={e=>setForm({...form,contractEnd:e.target.value})} /></Field>
          <Field label="合約狀態"><select style={inputSt} value={form.status||"active"} onChange={e=>setForm({...form,status:e.target.value})}>{Object.entries(BIZ_CONTRACT_STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></Field>
          <Field label="備註" full><textarea style={{...inputSt,minHeight:65,resize:"vertical"}} value={form.note||""} onChange={e=>setForm({...form,note:e.target.value})} placeholder="備註說明" /></Field>
        </Modal>
      )}
      {modal==="charge"&&(
        <Modal title={editItem?"編輯費用":"新增費用"} accentColor={color} onClose={closeModal} onSubmit={saveCharge}>
          <Field label="日期 *"><input type="date" style={inputSt} value={form.date||today()} onChange={e=>setForm({...form,date:e.target.value})} /></Field>
          <Field label="科目"><select style={inputSt} value={form.category||BIZ_CHARGE_CATS[0]} onChange={e=>setForm({...form,category:e.target.value})}>{BIZ_CHARGE_CATS.map(c=><option key={c} value={c}>{c}</option>)}</select></Field>
          <Field label="說明 *" full><input style={inputSt} value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} placeholder="費用說明" /></Field>
          <Field label="金額 (NT$) *"><input type="number" style={inputSt} value={form.amount||""} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0" /></Field>
          <Field label="備註"><input style={inputSt} value={form.note||""} onChange={e=>setForm({...form,note:e.target.value})} placeholder="選填" /></Field>
        </Modal>
      )}
      {modal==="ar"&&(
        <Modal title={editItem?"編輯應收":"新增應收帳款"} accentColor={color} onClose={closeModal} onSubmit={saveAR}>
          <Field label="發票日 *"><input type="date" style={inputSt} value={form.date||today()} onChange={e=>setForm({...form,date:e.target.value})} /></Field>
          <Field label="到期日"><input type="date" style={inputSt} value={form.dueDate||""} onChange={e=>setForm({...form,dueDate:e.target.value})} /></Field>
          <Field label="說明" full><input style={inputSt} value={form.description||""} onChange={e=>setForm({...form,description:e.target.value})} placeholder="帳單說明" /></Field>
          <Field label="應收金額 *"><input type="number" style={inputSt} value={form.amount||""} onChange={e=>setForm({...form,amount:e.target.value})} placeholder="0" /></Field>
          <Field label="已收金額"><input type="number" style={inputSt} value={form.paid||"0"} onChange={e=>setForm({...form,paid:e.target.value})} placeholder="0" /></Field>
          <Field label="狀態"><select style={inputSt} value={form.status||"pending"} onChange={e=>setForm({...form,status:e.target.value})}>{Object.entries(AR_STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</select></Field>
          <Field label="備註" full><input style={inputSt} value={form.note||""} onChange={e=>setForm({...form,note:e.target.value})} placeholder="催款紀錄等" /></Field>
        </Modal>
      )}
      {modal==="note"&&(
        <Modal title={editItem?"編輯備忘":"新增備忘"} accentColor={color} onClose={closeModal} onSubmit={saveNote}>
          <Field label="日期 *"><input type="date" style={inputSt} value={form.date||today()} onChange={e=>setForm({...form,date:e.target.value})} /></Field>
          <Field label="記錄人"><input style={inputSt} value={form.author||""} onChange={e=>setForm({...form,author:e.target.value})} placeholder="前台 / 業務" /></Field>
          <Field label="內容 *" full><textarea style={{...inputSt,minHeight:90,resize:"vertical"}} value={form.content||""} onChange={e=>setForm({...form,content:e.target.value})} placeholder="客戶往來、合約異動、跟進事項…" /></Field>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP — Mobile First
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [activeLedger, setActiveLedger] = useState("biz");

  const [salonIncome,  setSalonIncome]  = useState(INIT.salonIncome);
  const [salonExpense, setSalonExpense] = useState(INIT.salonExpense);
  const [salonAR,      setSalonAR]      = useState(INIT.salonAR);
  const [salonAP,      setSalonAP]      = useState(INIT.salonAP);

  const [persIncome,   setPersIncome]   = useState(INIT.personalIncome);
  const [persExpense,  setPersExpense]  = useState(INIT.personalExpense);
  const [persAR,       setPersAR]       = useState(INIT.personalAR);
  const [persAP,       setPersAP]       = useState(INIT.personalAP);

  const [dbwIncome,    setDbwIncome]    = useState(INIT.dbwIncome);
  const [dbwExpense,   setDbwExpense]   = useState(INIT.dbwExpense);
  const [dbwAR,        setDbwAR]        = useState(INIT.dbwAR);
  const [dbwAP,        setDbwAP]        = useState(INIT.dbwAP);

  const activeLedgerInfo = LEDGERS.find(l => l.id === activeLedger);

  return (
    <div style={{ minHeight:"100vh", maxWidth:480, margin:"0 auto", background:"#f0f4f8", fontFamily:"'Noto Sans TC','PingFang TC',sans-serif", position:"relative" }}>

      {/* ── Top Header ── */}
      <div style={{ background:`linear-gradient(135deg,${activeLedgerInfo.color}dd,${activeLedgerInfo.color})`, padding:"16px 16px 14px", position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 12px rgba(0,0,0,0.15)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:24 }}>{activeLedgerInfo.icon}</span>
          <div>
            <div style={{ fontSize:18, color:"#fff", fontWeight:800, lineHeight:1.2 }}>{activeLedgerInfo.label}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.75)" }}>
              { activeLedger==="biz"      ? "商務中心帳務管理" :
                activeLedger==="salon"    ? "拾形造型收支帳務" :
                activeLedger==="personal" ? "個人收支帳務" :
                                            "寵物開銷 & 汽車開銷" }
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding:"16px 14px 90px" }}>
        {activeLedger==="biz" && <BizView color={activeLedgerInfo.color} />}

        {activeLedger==="salon" && (
          <LedgerTabs lid="salon" color={activeLedgerInfo.color}
            income={salonIncome}   setIncome={setSalonIncome}
            expense={salonExpense} setExpense={setSalonExpense}
            ar={salonAR}           setAr={setSalonAR}
            ap={salonAP}           setAp={setSalonAP}
          />
        )}

        {activeLedger==="personal" && (
          <LedgerTabs lid="personal" color={activeLedgerInfo.color}
            income={persIncome}   setIncome={setPersIncome}
            expense={persExpense} setExpense={setPersExpense}
            ar={persAR}           setAr={setPersAR}
            ap={persAP}           setAp={setPersAP}
          />
        )}

        {activeLedger==="dbw" && (
          <LedgerTabs lid="dbw" color={activeLedgerInfo.color}
            income={dbwIncome}   setIncome={setDbwIncome}
            expense={dbwExpense} setExpense={setDbwExpense}
            ar={dbwAR}           setAr={setDbwAR}
            ap={dbwAP}           setAp={setDbwAP}
          />
        )}
      </div>

      {/* ── Bottom Nav ── */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", borderTop:"1px solid #e2e8f0", display:"flex", zIndex:200, boxShadow:"0 -4px 20px rgba(0,0,0,0.08)" }}>
        {LEDGERS.map(l => (
          <button key={l.id} onClick={() => setActiveLedger(l.id)} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            padding:"10px 4px 12px", background:"none", border:"none", cursor:"pointer", fontFamily:"inherit",
            borderTop: activeLedger===l.id ? `3px solid ${l.color}` : "3px solid transparent",
          }}>
            <span style={{ fontSize:20, marginBottom:2 }}>{l.icon}</span>
            <span style={{ fontSize:10, fontWeight: activeLedger===l.id?700:400, color: activeLedger===l.id?l.color:"#94a3b8" }}>{l.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
