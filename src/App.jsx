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
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'
import { syncReportToGoogleSheets } from './services/reportSync'

const initialReports = [
  { id: 1, executive: 'Aarav Mehta', customer: 'Neha Sharma', location: 'Gurugram', loanAmount: 1850000, bank: 'HDFC Bank', loginDate: '24 Sep 2026', status: 'Approved', remark: 'Documents verified and sent for final approval.', time: '09:42 AM' },
  { id: 2, executive: 'Riya Kapoor', customer: 'Vikram Singh', location: 'Noida', loanAmount: 920000, bank: 'Axis Bank', loginDate: '24 Sep 2026', status: 'Login', remark: 'Income documents under review.', time: '09:18 AM' },
  { id: 3, executive: 'Kabir Jain', customer: 'Pooja Nair', location: 'Delhi', loanAmount: 2600000, bank: 'ICICI Bank', loginDate: '23 Sep 2026', status: 'Approved', remark: 'Customer confirmation received.', time: '04:36 PM' },
  { id: 4, executive: 'Meera Shah', customer: 'Arjun Rao', location: 'Faridabad', loanAmount: 710000, bank: 'SBI', loginDate: '23 Sep 2026', status: 'Reject', remark: 'Credit policy mismatch.', time: '02:10 PM' },
]

const emptyReport = { executive: 'Aarav Mehta', date: '2026-09-24', customer: '', location: '', loanAmount: '', bank: '', loginDate: '2026-09-24', status: 'Login', remark: '' }
const EMPLOYEE_EMAIL = 'rudranshcapital@gmail.com'
const EMPLOYEE_PASSWORD = '@rudransh26(?)'

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
}

function App() {
  const [username, setUsername] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activePage, setActivePage] = useState('Overview')
  const [reports, setReports] = useState(() => {
    const savedReports = localStorage.getItem('rudransh-reports')
    return savedReports ? JSON.parse(savedReports) : initialReports
  })
  const [form, setForm] = useState(emptyReport)
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

  function handleLogout() {
    setIsLoggedIn(false)
  }

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  function submitReport(event) {
    event.preventDefault()
    const newReport = {
      id: Date.now(),
      executive: form.executive,
      date: form.date,
      customer: form.customer,
      location: form.location,
      loanAmount: Number(form.loanAmount),
      bank: form.bank,
      loginDate: new Date(form.loginDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: form.status,
      remark: form.remark || 'No additional remarks.',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    }
    setReports((current) => {
      const nextReports = [newReport, ...current]
      localStorage.setItem('rudransh-reports', JSON.stringify(nextReports))
      return nextReports
    })
    void syncReportToGoogleSheets(newReport)
    setForm({ ...emptyReport, executive: username })
    setNotice('Report saved and queued for spreadsheet sync')
    window.setTimeout(() => setNotice(''), 3500)
  }

  if (!isLoggedIn) return <LoginScreen onLogin={handleLogin} />

  return <div className="report-workspace">
    <header className="report-header">
      <img className="company-logo" src="/logo.png" alt="Rudransh Capital Advisory Services" />
      <div className="report-header-actions">
        <span className="logged-in-user"><span className="mini-avatar">{getInitials(username)}</span>{username}</span>
        <button className="logout-button" onClick={handleLogout}><LogOut size={15} /> Logout</button>
      </div>
    </header>
    {notice && <div className="toast"><span className="toast-check"><Check size={15} /></span>{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button></div>}
    <main className="report-main"><ReportForm form={form} onChange={handleChange} onSubmit={submitReport} /></main>
  </div>
}

function LoginScreen({ onLogin }) {
  const [credentials, setCredentials] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function updateCredentials(event) {
    const { name, value } = event.target
    setCredentials((current) => ({ ...current, [name]: value }))
    setError('')
  }

  function submit(event) {
    event.preventDefault()
    const emailMatches = credentials.email.trim().toLowerCase() === EMPLOYEE_EMAIL
    const passwordMatches = credentials.password === EMPLOYEE_PASSWORD
    if (!credentials.username.trim() || !emailMatches || !passwordMatches) {
      setError('Access denied. Check your username, email, and password.')
      return
    }
    onLogin(credentials.username.trim())
  }

  return <div className="login-page"><div className="login-visual"><div className="visual-brand"><img className="company-logo" src="/logo.png" alt="Rudransh Capital Advisory Services" /></div><div className="visual-copy"><p className="eyebrow">EMPLOYEE ACCESS ONLY</p><h1>Every visit.<br /><em>One clear report.</em></h1><p>Sign in to capture, track, and move every customer case forward.</p></div><div className="visual-footer"><span>Secure employee workspace</span><span>•</span><span>New Delhi, IN</span></div></div><div className="login-panel"><div className="login-form-wrap"><div className="mobile-brand"><img className="company-logo" src="/logo.png" alt="Rudransh Capital Advisory Services" /></div><p className="eyebrow">EMPLOYEE LOGIN</p><h2>Login to your workspace</h2><p className="form-intro">Use your assigned employee credentials to continue.</p><form onSubmit={submit}><Field label="Username" name="username" value={credentials.username} onChange={updateCredentials} placeholder="Enter your name" required /><Field label="Work email" name="email" type="email" value={credentials.email} onChange={updateCredentials} placeholder="rudranshcapital@gmail.com" required /><label className="field"><span>Password<b>*</b></span><span className="password-input"><input name="password" type={showPassword ? 'text' : 'password'} value={credentials.password} onChange={updateCredentials} placeholder="Enter your password" required /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></span></label>{error && <p className="auth-error">{error}</p>}<button className="primary-button full-button" type="submit">Login <ArrowUpRight size={17} /></button></form><div className="login-help">Authorized employees only · Contact your administrator for access</div></div><span className="login-copyright">© 2026 Rudransh Capital Advisory Services</span></div></div>
}

function Field({ label, type = 'text', placeholder, required, value, onChange, name }) { return <label className="field"><span>{label}{required && <b>*</b>}</span><input name={name} type={type} placeholder={placeholder} required={required} value={value} onChange={onChange} /></label> }
function getInitials(name) { return name.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase() }
function NavItem({ icon, label, active, onClick }) { return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span>{active && <i />}</button> }

function Overview({ username, metrics, reports, onNew, onHistory }) {
  return <><section className="page-heading overview-heading"><div><p className="eyebrow">THURSDAY, 24 SEPTEMBER 2026</p><h1>Good morning, {username}</h1><p className="subheading">Here is how your team's activity is shaping up today.</p></div><button className="primary-button" onClick={onNew}><Plus size={18} /> New daily report</button></section><section className="metric-grid"><Metric icon={<ClipboardList />} label="Reports this month" value={metrics.total + 96} trend="12.8%" caption="vs. last month" tone="mint" /><Metric icon={<Check />} label="Approved cases" value={metrics.approved + 47} trend="8.4%" caption="vs. last month" tone="blue" /><Metric icon={<Clock3 />} label="Awaiting action" value={metrics.pending + 12} trend="4.2%" caption="vs. last month" tone="gold" /><Metric icon={<IndianRupee />} label="Loan volume" value={formatCurrency(metrics.volume + 12400000).replace('₹', '₹ ')} trend="16.5%" caption="vs. last month" tone="coral" /></section><section className="dashboard-grid"><div className="panel recent-panel"><div className="panel-heading"><div><p className="eyebrow">LIVE FEED</p><h2>Recent reports</h2></div><button className="link-button" onClick={onHistory}>View all <ArrowUpRight size={15} /></button></div><ReportList reports={reports.slice(0, 4)} /></div><div className="panel snapshot-panel"><div className="panel-heading"><div><p className="eyebrow">CASE SNAPSHOT</p><h2>Today's progress</h2></div><span className="date-pill"><CalendarDays size={14} /> Today</span></div><div className="progress-ring"><div><strong>{Math.round(((metrics.approved + metrics.pending) / Math.max(metrics.total, 1)) * 100)}%</strong><span>reported</span></div></div><div className="progress-legend"><div><span className="legend-dot approved" /><span>Approved</span><strong>{metrics.approved + 47}</strong></div><div><span className="legend-dot login" /><span>In review</span><strong>{metrics.pending + 12}</strong></div><div><span className="legend-dot reject" /><span>Rejected</span><strong>18</strong></div></div></div></section><section className="insight-strip"><div className="insight-icon"><BarChart3 size={21} /></div><div><strong>Your approval rate is up 8.4% this month.</strong><span>Keep the momentum going. 12 cases are ready for the next step.</span></div><button className="icon-button"><ArrowUpRight size={18} /></button></section></>
}
function Metric({ icon, label, value, trend, caption, tone }) { return <div className={`metric-card ${tone}`}><div className="metric-top"><span className="metric-icon">{icon}</span><span className="metric-trend">↑ {trend}</span></div><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong><span className="metric-caption">{caption}</span></div> }
function ReportList({ reports }) { return <div className="report-list">{reports.map((report) => <div className="report-row" key={report.id}><div className="customer-avatar">{report.customer.split(' ').map((word) => word[0]).join('')}</div><div className="report-person"><strong>{report.customer}</strong><span>{report.location} · {report.bank}</span></div><div className="report-amount">{formatCurrency(report.loanAmount)}</div><Status status={report.status} /><span className="report-time">{report.time}</span></div>)}</div> }
function Status({ status }) { return <span className={`status status-${status.toLowerCase()}`}><i />{status}</span> }

function ReportForm({ form, onChange, onSubmit }) {
  return <><section className="page-heading"><div><p className="eyebrow">DAILY ACTIVITY</p><h1>New daily report</h1><p className="subheading">Capture the details while the conversation is still fresh.</p></div><span className="secure-note"><ShieldCheck size={17} /> Saved securely</span></section><form className="report-form" onSubmit={onSubmit}><div className="form-card"><div className="form-card-heading"><div><span className="step-number">01</span><div><h2>Visit details</h2><p>Tell us who you met and where.</p></div></div><span className="required-note">* Required</span></div><div className="field-grid"><Field label="Executive name" name="executive" value={form.executive} onChange={onChange} required /><Field label="Report date" name="date" type="date" value={form.date} onChange={onChange} required /><Field label="Customer name" name="customer" value={form.customer} onChange={onChange} placeholder="Enter customer name" required /><Field label="Location" name="location" value={form.location} onChange={onChange} placeholder="City or area" required /></div></div><div className="form-card"><div className="form-card-heading"><div><span className="step-number">02</span><div><h2>Loan details</h2><p>Keep the case information up to date.</p></div></div></div><div className="field-grid"><Field label="Loan amount" name="loanAmount" type="number" value={form.loanAmount} onChange={onChange} placeholder="e.g. 1500000" required /><Field label="Bank name" name="bank" value={form.bank} onChange={onChange} placeholder="Select or type bank" required /><Field label="Login date" name="loginDate" type="date" value={form.loginDate} onChange={onChange} required /><label className="field"><span>Disbursement status<b>*</b></span><select name="status" value={form.status} onChange={onChange}><option>Login</option><option>Approved</option><option>Reject</option></select></label></div></div><div className="form-card"><div className="form-card-heading"><div><span className="step-number">03</span><div><h2>Final note</h2><p>Leave a useful handoff for your team.</p></div></div></div><label className="field"><span>Remark</span><textarea name="remark" value={form.remark} onChange={onChange} placeholder="Add context, next steps, or anything the team should know..." rows="4" /></label></div><div className="form-actions"><button type="submit" className="primary-button"><Check size={18} /> Submit report</button></div></form></>
}

function History({ reports, query, setQuery }) { return <><section className="page-heading"><div><p className="eyebrow">ALL ACTIVITY</p><h1>Report history</h1><p className="subheading">A searchable record of every customer report.</p></div><button className="secondary-button"><FileSpreadsheet size={17} /> Export sheet</button></section><div className="history-panel panel"><div className="history-toolbar"><div className="search-input"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer, location, bank..." /></div><button className="filter-button"><CalendarDays size={16} /> Date range <ChevronDown size={15} /></button><button className="filter-button">All statuses <ChevronDown size={15} /></button></div><div className="table-wrap"><table><thead><tr><th>Customer</th><th>Executive</th><th>Location</th><th>Loan amount</th><th>Bank</th><th>Login date</th><th>Status</th><th /></tr></thead><tbody>{reports.map((report) => <tr key={report.id}><td><div className="table-customer"><span className="customer-avatar">{report.customer.split(' ').map((word) => word[0]).join('')}</span><strong>{report.customer}</strong></div></td><td>{report.executive}</td><td><span className="location-cell"><MapPin size={14} /> {report.location}</span></td><td className="amount-cell">{formatCurrency(report.loanAmount)}</td><td>{report.bank}</td><td>{report.loginDate}</td><td><Status status={report.status} /></td><td><button className="icon-button"><ArrowUpRight size={16} /></button></td></tr>)}</tbody></table></div>{reports.length === 0 && <div className="empty-state">No reports match your search.</div>}<div className="table-footer">Showing <strong>{reports.length}</strong> of <strong>{reports.length}</strong> reports <span>Synced with Google Sheets · just now</span></div></div></> }

export default App
