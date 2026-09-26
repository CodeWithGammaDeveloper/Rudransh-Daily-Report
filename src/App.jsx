import { useMemo, useState } from 'react'
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  Clock3,
  Eye,
  EyeOff,
  FileSpreadsheet,
  IndianRupee,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { deleteReportsFromGoogleSheets, fetchReportsFromGoogleSheets, syncReportToGoogleSheets, updateReportInGoogleSheets } from './services/reportSync'
import logoSrc from '../logo.png'

const initialReports = [
  { id: 1, executive: 'Aarav Mehta', customer: 'Neha Sharma', location: 'Gurugram', loanAmount: 1850000, bank: 'HDFC Bank', loginDate: '24 Sep 2026', status: 'Approved', remark: 'Documents verified and sent for final approval.', time: '09:42 AM' },
  { id: 2, executive: 'Riya Kapoor', customer: 'Vikram Singh', location: 'Noida', loanAmount: 920000, bank: 'Axis Bank', loginDate: '24 Sep 2026', status: 'Login', remark: 'Income documents under review.', time: '09:18 AM' },
  { id: 3, executive: 'Kabir Jain', customer: 'Pooja Nair', location: 'Delhi', loanAmount: 2600000, bank: 'ICICI Bank', loginDate: '23 Sep 2026', status: 'Approved', remark: 'Customer confirmation received.', time: '04:36 PM' },
  { id: 4, executive: 'Meera Shah', customer: 'Arjun Rao', location: 'Faridabad', loanAmount: 710000, bank: 'SBI', loginDate: '23 Sep 2026', status: 'Reject', remark: 'Credit policy mismatch.', time: '02:10 PM' },
]

const emptyReport = { executive: '', date: '2026-09-24', customer: '', companyName: '', netSalary: '', location: '', obligation: '', btFresh: '', loanAmount: '', bank: '', loginDate: '2026-09-24', loginStatus: '', remark: '', disbursementAmount: '', cashBankDeviation: '' }
const EMPLOYEE_EMAIL = 'sales@rudranshcapital.com'
const EMPLOYEE_PASSWORD = '@rudransh26(?)'
const ADMIN_EMAIL = 'narsu.pawar@rudranshcapital.com'
const ADMIN_PASSWORD = '@admin_2026#'
const ADMIN_FORM_SCHEMAS = {
  'Leads Form': [
    { key: 'executive', label: 'Executive Name' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'customer', label: 'Customer Name' },
    { key: 'companyName', label: 'Company Name' },
    { key: 'netSalary', label: 'Net Salary', type: 'number' },
    { key: 'location', label: 'Location' },
    { key: 'obligation', label: 'Obligation', options: ['PL/BL', 'HL', 'CC', 'APP LOAN', 'AUTO LOAN', 'OTHERS'] },
    { key: 'btFresh', label: 'BT/FRESH', options: ['BT', 'FRESH'] },
    { key: 'loanAmount', label: 'Loan Amount', type: 'number' },
    { key: 'bank', label: 'Login Bank' },
    { key: 'remark', label: 'Remark', type: 'textarea' },
  ],
  'Login Form': [
    { key: 'executive', label: 'Executive Name' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'customer', label: 'Customer Name' },
    { key: 'loanAmount', label: 'Loan Amount', type: 'number' },
    { key: 'bank', label: 'Bank' },
    { key: 'loginDate', label: 'Login Date', type: 'date' },
    { key: 'loginStatus', label: 'Login Status', options: ['Yes', 'No'] },
    { key: 'remark', label: 'Remark', type: 'textarea' },
  ],
  'Disbursement Form': [
    { key: 'executive', label: 'Executive Name' },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'customer', label: 'Customer Name' },
    { key: 'disbursementAmount', label: 'Disbursement Amount', type: 'number' },
    { key: 'bank', label: 'Bank' },
    { key: 'cashBankDeviation', label: 'Cash/Bank Deviation', options: ['Cash', 'Bank Deviation'] },
  ],
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

function formatReportDate(value) {
  if (!value) return ''
  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return String(value)
  return parsedDate.toLocaleDateString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short', year: 'numeric' })
}

function reportDateInput(value) {
  if (!value) return ''
  const parsedDate = new Date(value)
  return Number.isNaN(parsedDate.getTime()) ? String(value).slice(0, 10) : parsedDate.toISOString().slice(0, 10)
}

function matchesDateFilter(value, filterValue) {
  if (!value || !filterValue) return false
  const rawValue = String(value).trim()
  const selectedDate = String(filterValue).slice(0, 10)
  const dates = new Set()

  const leadingDate = rawValue.match(/^(\d{4}-\d{2}-\d{2})/)
  if (leadingDate) dates.add(leadingDate[1])

  const parsedDate = new Date(rawValue)
  if (!Number.isNaN(parsedDate.getTime())) {
    dates.add(parsedDate.toISOString().slice(0, 10))
    dates.add(new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(parsedDate))
  }

  return dates.has(selectedDate)
}

function App() {
  const [username, setUsername] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [portal, setPortal] = useState('employee')
  const [activePage, setActivePage] = useState('Overview')
  const [reports, setReports] = useState(() => {
    const savedReports = localStorage.getItem('rudransh-reports')
    return savedReports ? JSON.parse(savedReports) : initialReports
  })
  const [form, setForm] = useState(emptyReport)
  const [formType, setFormType] = useState('Leads Form')
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const filteredReports = useMemo(() => reports.filter((report) => {
    const needle = query.toLowerCase()
    return [report.customer, report.location, report.bank, report.executive, report.status].some((value) => value.toLowerCase().includes(needle))
  }), [reports, query])

  const metrics = useMemo(() => ({
    total: reports.length,
    approved: reports.filter((report) => report.status === 'Approved').length,
    pending: reports.filter((report) => report.status === 'Login').length,
    volume: reports.reduce((sum, report) => sum + Number(report.loanAmount), 0),
  }), [reports])

  function handleLogin(enteredUsername) {
    setIsLoggedIn(true)
    setUsername(enteredUsername)
    setForm((current) => ({ ...current, executive: enteredUsername }))
  }

  async function handleAdminLogin(enteredUsername) {
    setUsername(enteredUsername)
    setPortal('admin')
    setIsLoggedIn(true)
    const spreadsheetReports = await fetchReportsFromGoogleSheets()
    if (spreadsheetReports.length > 0) setReports(spreadsheetReports.map(normalizeSheetReport))
  }

  function handleLogout() {
    setIsLoggedIn(false)
    setPortal('employee')
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function submitReport(event) {
    event.preventDefault()
    const newReport = {
      id: Date.now(),
      formType,
      executive: form.executive,
      date: form.date,
      customer: form.customer,
      location: form.location,
      companyName: form.companyName,
      netSalary: form.netSalary ? Number(form.netSalary) : '',
      obligation: form.obligation,
      btFresh: form.btFresh,
      loanAmount: form.loanAmount ? Number(form.loanAmount) : '',
      bank: form.bank,
      loginDate: form.loginDate,
      loginStatus: form.loginStatus,
      disbursementAmount: form.disbursementAmount ? Number(form.disbursementAmount) : '',
      cashBankDeviation: form.cashBankDeviation,
      remark: form.remark,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }
    setReports((current) => {
      const nextReports = [newReport, ...current]
      localStorage.setItem('rudransh-reports', JSON.stringify(nextReports))
      return nextReports
    })
    void syncReportToGoogleSheets(newReport)
    setForm({ ...emptyReport, executive: username })
    setNotice(`${formType} submitted successfully`)
    window.setTimeout(() => setNotice(''), 3500)
  }

  if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} onAdminLogin={handleAdminLogin} />
  if (portal === 'admin') return <AdminPortal username={username} reports={reports} setReports={setReports} onLogout={handleLogout} />

  return <div className="report-workspace">
    <header className="report-header">
      <img className="company-logo" src={logoSrc} alt="Rudransh Capital Advisory Services" />
      <div className="report-header-actions">
        <span className="logged-in-user"><span className="mini-avatar">{getInitials(username)}</span>{username}</span>
        <button className="logout-button" onClick={handleLogout}><LogOut size={15} /> Logout</button>
      </div>
    </header>
    {notice && <div className="toast"><span className="toast-check"><Check size={15} /></span>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}
    <main className="report-main"><ReportForm form={form} formType={formType} setFormType={setFormType} username={username} onChange={handleChange} onSubmit={submitReport} /></main>
  </div>
}

function normalizeSheetReport(report) {
  const reportType = report.formType || report.sourceTab || report['Form Type'] || ''
  const dateRaw = report.Date || ''
  const loginDateRaw = report['Login Date'] || ''
  return {
    id: report.id || report['S.No.'] || report['Serial Number'] || Date.now(),
    reportType,
    executive: report['Executive Name'] || report['Executive'] || '',
    date: formatReportDate(dateRaw),
    dateValue: reportDateInput(dateRaw),
    customer: report['Customer Name'] || report.Customer || '',
    location: report.Location || '',
    companyName: report['Company Name'] || '',
    netSalary: Number(report['Net Salary'] || 0),
    obligation: report.Obligation || '',
    btFresh: report['BT/FRESH'] || '',
    loanAmount: Number(report['Loan Amount'] || 0),
    bank: report['Login Bank'] || report.Bank || '',
    loginDate: formatReportDate(loginDateRaw),
    loginDateValue: reportDateInput(loginDateRaw),
    loginStatus: report['Login Status'] || '',
    disbursementAmount: Number(report['Disbursement Amount'] || 0),
    cashBankDeviation: report['Cash/Bank Deviation'] || '',
    status: report['Login Status'] || report.Disbursement || report['Disbursement Status'] || '',
    remark: report.Remark || '',
  }
}

function LoginScreen({ onLogin, onAdminLogin }) {
  const [credentials, setCredentials] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [mode, setMode] = useState('employee')

  function updateCredentials(event) {
    const { name, value } = event.target
    setCredentials((current) => ({ ...current, [name]: value }))
    setError('')
  }

  function submit(event) {
    event.preventDefault()
    const expectedEmail = mode === 'admin' ? ADMIN_EMAIL : EMPLOYEE_EMAIL
    const expectedPassword = mode === 'admin' ? ADMIN_PASSWORD : EMPLOYEE_PASSWORD
    const emailMatches = credentials.email.trim().toLowerCase() === expectedEmail.toLowerCase()
    const passwordMatches = credentials.password === expectedPassword
    if (!credentials.username.trim() || !emailMatches || !passwordMatches) {
      setError('Access denied. Email and password must match your assigned credentials.')
      return
    }
    if (mode === 'admin') onAdminLogin(credentials.username.trim())
    else onLogin(credentials.username.trim())
  }

  return <div className="login-page"><div className="login-visual"><div className="visual-brand"><img className="company-logo" src={logoSrc} alt="Rudransh Capital Advisory Services" /></div><div className="visual-copy"><p className="eyebrow">{mode === 'admin' ? 'ADMIN PORTAL' : 'EMPLOYEE ACCESS ONLY'}</p><h1>Every visit.<br /><em>One clear report.</em></h1><p>{mode === 'admin' ? 'Review employee activity and keep every case moving.' : 'Sign in to capture, track, and move every customer case forward.'}</p></div><div className="visual-footer"><span>Secure workspace</span><span>•</span><span>Pune, IN</span></div></div><div className="login-panel"><div className="login-form-wrap"><div className="mobile-brand"><img className="company-logo" src={logoSrc} alt="Rudransh Capital Advisory Services" /></div><p className="eyebrow">{mode === 'admin' ? 'ADMIN LOGIN' : 'EMPLOYEE LOGIN'}</p><h2>{mode === 'admin' ? 'Login to admin portal' : 'Login to your workspace'}</h2><p className="form-intro">Use your assigned {mode} credentials to continue.</p><form onSubmit={submit}><Field label="Username" name="username" value={credentials.username} onChange={updateCredentials} placeholder="Enter your name" required /><Field label="Work email" name="email" type="email" value={credentials.email} onChange={updateCredentials} placeholder={mode === 'admin' ? 'Narsu.pawar@rudranshcapital.com' : 'Sales@rudranshcapital.com'} required /><label className="field"><span>Password<b>*</b></span><span className="password-input"><input name="password" type={showPassword ? 'text' : 'password'} value={credentials.password} onChange={updateCredentials} placeholder="Enter your password" required /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>{error && <p className="auth-error">Access denied. Check your credentials.</p>}<button className="primary-button full-button" type="submit">{mode === 'admin' ? 'Enter admin portal' : 'Login'} <ArrowUpRight size={17} /></button></form><div className="login-help">{mode === 'admin' ? 'Employee access?' : 'Administrator access?'} <button type="button" className="text-button" onClick={() => { setMode(mode === 'admin' ? 'employee' : 'admin'); setError(''); setCredentials({ username: '', email: '', password: '' }) }}>{mode === 'admin' ? 'Login as employee' : 'Open admin portal'}</button></div></div><span className="login-copyright">© 2026 Rudransh Capital Advisory Services</span></div></div>
}

function AdminPortal({ username, reports, setReports, onLogout }) {
  const [selectedForm, setSelectedForm] = useState('')
  const [filters, setFilters] = useState({})
  const [editingReport, setEditingReport] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [editMessage, setEditMessage] = useState('')
  const availableForms = Object.keys(ADMIN_FORM_SCHEMAS)
  const formSchema = selectedForm ? ADMIN_FORM_SCHEMAS[selectedForm] : []
  const filterFields = formSchema.filter((field) => field.key !== 'remark')
  const hasAppliedFilter = Object.values(filters).some((value) => String(value).trim() !== '')

  const visibleReports = reports.filter((report) => {
    if (!selectedForm || report.reportType !== selectedForm) return false
    return filterFields.every((field) => {
      const filterValue = filters[field.key] || ''
      if (!filterValue) return true
      const reportValue = field.type === 'date'
        ? report[`${field.key}Value`] || report[field.key]
        : report[field.key]
      if (field.type === 'date') return matchesDateFilter(reportValue, filterValue)
      return String(reportValue ?? '').toLowerCase().includes(filterValue.toLowerCase())
    })
  })

  function selectForm(formName) {
    setSelectedForm(formName)
    setFilters({})
    setEditingReport(null)
    setEditMessage('')
  }

  function updateFilter(event) {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
  }

  async function deleteFilteredReports() {
    if (visibleReports.length === 0) return
    const confirmed = window.confirm(`Permanently delete ${visibleReports.length} ${selectedForm} row${visibleReports.length === 1 ? '' : 's'} from the spreadsheet? This cannot be undone.`)
    if (!confirmed) return

    const serialNumbers = visibleReports.map((report) => report.id)
    const result = await deleteReportsFromGoogleSheets(serialNumbers)
    if (!result.deleted) return

    const deletedIds = new Set(serialNumbers.map(String))
    const remaining = reports.filter((report) => !deletedIds.has(String(report.id)))
    setReports(remaining)
    localStorage.setItem('rudransh-reports', JSON.stringify(remaining))
  }

  function beginEdit(report) {
    const values = {}
    formSchema.forEach((field) => {
      values[field.key] = field.type === 'date'
        ? report[`${field.key}Value`] || reportDateInput(report[field.key])
        : report[field.key] ?? ''
    })
    setEditingReport(report)
    setEditValues(values)
    setEditMessage('')
  }

  async function saveEdit(event) {
    event.preventDefault()
    setSavingEdit(true)
    setEditMessage('')
    const result = await updateReportInGoogleSheets({
      id: editingReport.id,
      sourceTab: selectedForm,
      values: editValues,
    })
    setSavingEdit(false)

    if (!result.updated) {
      setEditMessage('Could not submit the spreadsheet update. Please try again.')
      return
    }

    const normalizedEditValues = { ...editValues }
    formSchema.filter((field) => field.type === 'date').forEach((field) => {
      normalizedEditValues[`${field.key}Value`] = editValues[field.key]
      normalizedEditValues[field.key] = formatReportDate(editValues[field.key])
    })
    const updatedReports = reports.map((report) => report.id === editingReport.id
      ? { ...report, ...normalizedEditValues }
      : report)
    setReports(updatedReports)
    localStorage.setItem('rudransh-reports', JSON.stringify(updatedReports))
    setEditingReport(null)
  }

  return <div className="admin-workspace">
    <header className="report-header"><img className="company-logo" src={logoSrc} alt="Rudransh Capital Advisory Services" /><div className="report-header-actions"><span className="logged-in-user"><span className="mini-avatar">{getInitials(username)}</span>{username} · Admin</span><button className="logout-button" onClick={onLogout}><LogOut size={15} /> Logout</button></div></header>
    <main className="admin-main">
      <section className="admin-heading"><div><p className="eyebrow">ADMIN PORTAL</p><h1>Employee daily reports</h1><p className="subheading">Select a form to review and update its spreadsheet records.</p></div>{selectedForm && <span className="admin-count">{visibleReports.length} reports</span>}</section>
      <div className="admin-form-tabs" role="tablist" aria-label="Report type">
        {availableForms.map((formName) => <button type="button" role="tab" aria-selected={selectedForm === formName} className={selectedForm === formName ? 'admin-form-tab active' : 'admin-form-tab'} key={formName} onClick={() => selectForm(formName)}>{formName}</button>)}
      </div>
      {selectedForm ? <>
        <section className="admin-filters">
          <div className="admin-filter-heading"><div><h2>Filter {selectedForm}</h2><p>Filter by any column except serial number and remark. Combine filters as needed.</p></div><button className="clear-filters" onClick={() => setFilters({})}>Clear filters</button></div>
          <div className="admin-filter-grid">{filterFields.map((field) => <AdminSchemaField key={field.key} field={field} value={filters[field.key] || ''} onChange={updateFilter} filterMode />)}</div>
        </section>
        {hasAppliedFilter ? <section className="admin-table-card">
          <div className="admin-table-toolbar"><span>{visibleReports.length} matching {selectedForm.toLowerCase()} entr{visibleReports.length === 1 ? 'y' : 'ies'}</span>{visibleReports.length > 0 && <button className="delete-filtered-button" onClick={deleteFilteredReports}><Trash2 size={15} /> Delete filtered data</button>}</div>
          <div className="admin-table-wrap"><table><thead><tr><th>S.No.</th>{formSchema.map((field) => <th key={field.key}>{field.label}</th>)}<th>Actions</th></tr></thead><tbody>{visibleReports.map((report) => <tr key={report.id}><td>{String(report.id).split(':').pop()}</td>{formSchema.map((field) => <td key={field.key} className={field.key === 'remark' ? 'remark-cell' : ''}>{field.type === 'number' && report[field.key] !== '' && report[field.key] != null ? formatCurrency(report[field.key]) : field.type === 'date' ? report[field.key] || '-' : report[field.key] || '-'}</td>)}<td><button className="admin-edit-button" onClick={() => beginEdit(report)}>Edit</button></td></tr>)}</tbody></table></div>
          {visibleReports.length === 0 && <div className="empty-state">No {selectedForm.toLowerCase()} entries match the selected filters.</div>}
          <div className="admin-table-footer">Showing {visibleReports.length} of {reports.filter((report) => report.reportType === selectedForm).length} {selectedForm.toLowerCase()} entries</div>
        </section> : <div className="admin-empty-prompt"><Search size={22} /><strong>Apply a filter to view entries</strong><span>The table will appear after you filter {selectedForm.toLowerCase()} data.</span></div>}
      </> : <div className="admin-empty-prompt"><ClipboardList size={22} /><strong>Choose a report section</strong><span>Select Leads Form, Login Form, or Disbursement Form to view its entries.</span></div>}
    </main>
    {editingReport && <div className="admin-edit-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingReport(null) }}><section className="admin-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-report-title"><div className="admin-edit-heading"><div><p className="eyebrow">{selectedForm.toUpperCase()}</p><h2 id="edit-report-title">Edit report</h2></div><button className="icon-button" onClick={() => setEditingReport(null)} aria-label="Close edit form"><X size={18} /></button></div><form onSubmit={saveEdit}><div className="admin-edit-grid">{formSchema.map((field) => <AdminSchemaField key={field.key} field={field} value={editValues[field.key] ?? ''} onChange={(event) => setEditValues((current) => ({ ...current, [field.key]: event.target.value }))} />)}</div>{editMessage && <p className="auth-error">{editMessage}</p>}<div className="form-actions"><button type="button" className="secondary-button" onClick={() => setEditingReport(null)}>Cancel</button><button type="submit" className="primary-button" disabled={savingEdit}>{savingEdit ? 'Saving…' : 'Save changes'}</button></div></form></section></div>}
  </div>
}

function Field({ label, type = 'text', placeholder, required, value, onChange, name }) {
  return <label className="field"><span>{label}{required && <b>*</b>}</span><input name={name} type={type} placeholder={placeholder} required={required} value={value} onChange={onChange} /></label>
}

function AdminSchemaField({ field, value, onChange, filterMode = false }) {
  const fieldLabel = filterMode ? `Filter ${field.label}` : field.label
  const placeholder = filterMode ? `Filter by ${field.label.toLowerCase()}` : `Enter ${field.label.toLowerCase()}`
  if (field.options) return <label className="field"><span>{fieldLabel}</span><select name={field.key} value={value} onChange={onChange}><option value="">{filterMode ? 'All' : 'Select'} {field.label.toLowerCase()}</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select></label>
  if (field.type === 'textarea') return <label className="field"><span>{fieldLabel}</span><textarea name={field.key} value={value} onChange={onChange} placeholder={placeholder} rows="3" /></label>
  return <label className="field"><span>{fieldLabel}</span><input name={field.key} type={field.type || 'text'} value={value} onChange={onChange} placeholder={placeholder} /></label>
}

function getInitials(name) {
  return name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase()
}

function ReportForm({ form, formType, setFormType, username, onChange, onSubmit }) {
  const formTabs = ['Leads Form', 'Login Form', 'Disbursement Form']

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">WELCOME</p>
          <h1>Welcome, {username}</h1>
          <p className="subheading">Choose a report form and enter the customer details.</p>
        </div>
        <span className="secure-note"><ShieldCheck size={17} /> Saved securely</span>
      </section>
      <div className="report-form-tabs" role="tablist" aria-label="Report form type">
        {formTabs.map((tab) => (
          <button key={tab} type="button" role="tab" aria-selected={formType === tab} className={formType === tab ? 'report-form-tab active' : 'report-form-tab'} onClick={() => setFormType(tab)}>{tab}</button>
        ))}
      </div>
      <form className="report-form" onSubmit={onSubmit}>
        <div className="form-card">
          <div className="form-card-heading">
            <div><span className="step-number">{formTabs.indexOf(formType) + 1}</span><div><h2>{formType}</h2><p>Executive: {username}</p></div></div>
            <span className="required-note">* Required</span>
          </div>
          <div className="field-grid">
            <Field label="Date" name="date" type="date" value={form.date} onChange={onChange} required />
            <Field label="Customer name" name="customer" value={form.customer} onChange={onChange} placeholder="Enter customer name" required />

            {formType === 'Leads Form' && <>
              <Field label="Company name" name="companyName" value={form.companyName} onChange={onChange} placeholder="Enter company name" required />
              <Field label="Net salary" name="netSalary" type="number" value={form.netSalary} onChange={onChange} placeholder="Enter net salary" required />
              <Field label="Location" name="location" value={form.location} onChange={onChange} placeholder="City or area" required />
              <label className="field"><span>Obligation<b>*</b></span><select name="obligation" value={form.obligation} onChange={onChange} required><option value="">Select obligation</option><option>PL/BL</option><option>HL</option><option>CC</option><option>APP LOAN</option><option>AUTO LOAN</option><option>OTHERS</option></select></label>
              <label className="field"><span>BT/FRESH<b>*</b></span><select name="btFresh" value={form.btFresh} onChange={onChange} required><option value="">Select type</option><option>BT</option><option>FRESH</option></select></label>
              <Field label="Loan amount" name="loanAmount" type="number" value={form.loanAmount} onChange={onChange} placeholder="Enter loan amount" required />
              <Field label="Login bank" name="bank" value={form.bank} onChange={onChange} placeholder="Enter bank name" required />
            </>}

            {formType === 'Login Form' && <>
              <Field label="Loan amount" name="loanAmount" type="number" value={form.loanAmount} onChange={onChange} placeholder="Enter loan amount" required />
              <Field label="Bank" name="bank" value={form.bank} onChange={onChange} placeholder="Enter bank name" required />
              <Field label="Login date" name="loginDate" type="date" value={form.loginDate} onChange={onChange} required />
              <label className="field"><span>Login status<b>*</b></span><select name="loginStatus" value={form.loginStatus} onChange={onChange} required><option value="">Select status</option><option>Yes</option><option>No</option></select></label>
            </>}

            {formType === 'Disbursement Form' && <>
              <Field label="Disbursement amount" name="disbursementAmount" type="number" value={form.disbursementAmount} onChange={onChange} placeholder="Enter disbursement amount" required />
              <Field label="Bank" name="bank" value={form.bank} onChange={onChange} placeholder="Enter bank name" required />
              <label className="field"><span>Cash/Bank deviation<b>*</b></span><select name="cashBankDeviation" value={form.cashBankDeviation} onChange={onChange} required><option value="">Select option</option><option>Cash</option><option>Bank Deviation</option></select></label>
            </>}
          </div>
          {(formType === 'Leads Form' || formType === 'Login Form') && <label className="field report-remark-field"><span>Remark</span><textarea name="remark" value={form.remark} onChange={onChange} placeholder="Add notes" rows="3" /></label>}
        </div>
        <div className="form-actions"><button type="submit" className="primary-button"><Check size={18} /> Submit {formType}</button></div>
      </form>
    </>
  )
}

function History({ reports, query, setQuery }) { return <><section className="page-heading"><div><p className="eyebrow">ALL ACTIVITY</p><h1>Report history</h1><p className="subheading">A searchable record of every customer report.</p></div><button className="secondary-button"><FileSpreadsheet size={17} /> Export sheet</button></section><div className="history-panel panel"><div className="history-toolbar"><div className="search-input"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer, location, bank..." /></div><button className="filter-button"><CalendarDays size={16} /> Date range <ChevronDown size={15} /></button><button className="filter-button">All statuses <ChevronDown size={15} /></button></div><div className="table-wrap"><table><thead><tr><th>Customer</th><th>Executive</th><th>Location</th><th>Loan amount</th><th>Bank</th><th>Login date</th><th>Status</th><th /></tr></thead><tbody>{reports.map((report) => <tr key={report.id}><td><div className="table-customer"><span className="customer-avatar">{report.customer.split(' ').map((word) => word[0]).join('')}</span><strong>{report.customer}</strong></div></td><td>{report.executive}</td><td><span className="location-cell"><MapPin size={14} /> {report.location}</span></td><td className="amount-cell">{formatCurrency(report.loanAmount)}</td><td>{report.bank}</td><td>{report.loginDate}</td><td><Status status={report.status} /></td><td><button className="icon-button"><ArrowUpRight size={16} /></button></td></tr>)}</tbody></table></div>{reports.length === 0 && <div className="empty-state">No reports match your search.</div>}<div className="table-footer">Showing <strong>{reports.length}</strong> of <strong>{reports.length}</strong> reports <span>Synced with Google Sheets · just now</span></div></div></> }

export default App
