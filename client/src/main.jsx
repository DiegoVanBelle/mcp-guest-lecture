import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = 'http://localhost:4000';

function App() {
  const [studentId] = useState('12345');
  const [student, setStudent] = useState(null);
  const [devices, setDevices] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [view, setView] = useState('new');
  const [deviceId, setDeviceId] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadPortal() {
    setLoading(true);
    setError('');
    try {
      const [studentRes, devicesRes, ticketsRes] = await Promise.all([
        fetch(`${API}/students/${studentId}`),
        fetch(`${API}/devices/${studentId}`),
        fetch(`${API}/tickets?studentId=${studentId}`)
      ]);
      if (!studentRes.ok || !devicesRes.ok || !ticketsRes.ok) throw new Error('Could not load your IT support portal.');
      const [studentData, devicesData, ticketData] = await Promise.all([
        studentRes.json(), devicesRes.json(), ticketsRes.json()
      ]);
      setStudent(studentData);
      setDevices(devicesData);
      setDeviceId(devicesData[0]?.id || '');
      setTickets(ticketData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPortal(); }, []);

  async function submitTicket(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, device_id: deviceId, category, issue, priority })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create your ticket.');
      setTickets(current => [data, ...current]);
      setIssue('');
      setPriority('Medium');
      setCategory('Hardware');
      setMessage(`Ticket #${data.id} has been created successfully.`);
      setView('tickets');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const openTickets = useMemo(() => tickets.filter(t => t.status !== 'Resolved').length, [tickets]);

  if (loading) return <div className="loading">Loading University IT Support…</div>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brandmark">U</div><div><strong>University</strong><span>IT Support</span></div></div>
      <nav>
        <button className={view === 'new' ? 'active' : ''} onClick={() => { setView('new'); setMessage(''); }}><Icon name="plus"/>New support request</button>
        <button className={view === 'tickets' ? 'active' : ''} onClick={() => setView('tickets')}><Icon name="ticket"/>My tickets <em>{tickets.length}</em></button>
      </nav>
      <div className="help"><strong>Need urgent help?</strong><p>For account lockouts or security incidents, contact the IT Service Desk.</p><span>Mon–Fri · 08:00–18:00</span></div>
      <div className="profile"><div className="avatar">{initials(student?.name)}</div><div><strong>{student?.name}</strong><span>Student · {student?.id}</span></div></div>
    </aside>

    <div className="page">
      <header className="topbar"><div><span>IT Service Portal</span></div><div className="top-actions"><button className="icon-btn">?</button><div className="avatar small">{initials(student?.name)}</div></div></header>

      <main className="content">
        {error && <div className="alert error">{error}</div>}
        {view === 'new' ? <NewTicket student={student} devices={devices} deviceId={deviceId} setDeviceId={setDeviceId} category={category} setCategory={setCategory} issue={issue} setIssue={setIssue} priority={priority} setPriority={setPriority} busy={busy} submitTicket={submitTicket} /> : <TicketOverview tickets={tickets} devices={devices} openTickets={openTickets} message={message} onNew={() => { setView('new'); setMessage(''); }} />}
      </main>
    </div>
  </div>
}

function NewTicket({ student, devices, deviceId, setDeviceId, category, setCategory, issue, setIssue, priority, setPriority, busy, submitTicket }) {
  return <>
    <div className="page-title"><span className="kicker">SUPPORT</span><h1>How can we help?</h1><p>Tell us what’s going wrong and the IT Service Desk will take it from here.</p></div>
    <div className="form-layout">
      <form className="card ticket-form" onSubmit={submitTicket}>
        <div className="card-heading"><div className="step-number">1</div><div><h2>Create a support request</h2><p>Fields marked with * are required.</p></div></div>
        <div className="form-grid">
          <label className="full">What do you need help with? *<select value={category} onChange={e => setCategory(e.target.value)}><option>Hardware</option><option>Software</option><option>Network & Wi-Fi</option><option>Account & Access</option><option>Other</option></select></label>
          <label className="full">Which device is affected? *<select value={deviceId} onChange={e => setDeviceId(e.target.value)}>{devices.map(d => <option key={d.id} value={d.id}>{d.manufacturer} {d.model} · {d.assetTag}</option>)}</select><small>These are the university devices assigned to you.</small></label>
          <label className="full">Describe the problem *<textarea required minLength="10" value={issue} onChange={e => setIssue(e.target.value)} placeholder="For example: My laptop has crashed three times today. It freezes, shows a blue screen and restarts…"/><small>Please include what happened and anything you already tried.</small></label>
          <fieldset className="full"><legend>How urgent is this? *</legend><div className="priority-options">{['Low','Medium','High'].map(p => <label key={p} className={priority === p ? 'selected' : ''}><input type="radio" name="priority" value={p} checked={priority === p} onChange={() => setPriority(p)}/><span><strong>{p}</strong><small>{p === 'Low' ? 'I can continue working' : p === 'Medium' ? 'My work is disrupted' : 'I cannot work or study'}</small></span></label>)}</div></fieldset>
        </div>
        <div className="form-footer"><span>Requests are normally reviewed during Service Desk hours.</span><button className="primary" disabled={busy || !issue.trim() || !deviceId}>{busy ? 'Submitting…' : 'Submit support request'} <b>→</b></button></div>
      </form>
      <aside className="side-info"><div className="card student-card"><span className="mini-label">SIGNED IN AS</span><div className="student-line"><div className="avatar">{initials(student?.name)}</div><div><strong>{student?.name}</strong><span>{student?.email}</span></div></div><dl><div><dt>Student ID</dt><dd>{student?.id}</dd></div><div><dt>Programme</dt><dd>{student?.programme}</dd></div></dl></div><div className="tip"><b>i</b><div><strong>Before you submit</strong><p>Save your work and restart the affected device if it is safe to do so. This resolves many common issues.</p></div></div></aside>
    </div>
  </>
}

function TicketOverview({ tickets, devices, openTickets, message, onNew }) {
  return <>
    <div className="overview-head"><div className="page-title compact"><span className="kicker">SUPPORT</span><h1>My tickets</h1><p>Track your IT support requests and their current status.</p></div><button className="primary" onClick={onNew}>+ New support request</button></div>
    {message && <div className="alert success"><b>✓</b><div><strong>Request submitted</strong><span>{message} The IT Service Desk will review it shortly.</span></div></div>}
    <div className="stats"><Stat value={tickets.length} label="Total requests"/><Stat value={openTickets} label="Open requests"/><Stat value={tickets.filter(t => t.status === 'Resolved').length} label="Resolved"/></div>
    <section className="card tickets-card"><div className="tickets-heading"><div><h2>Your support requests</h2><p>Most recent requests appear first.</p></div><span>{tickets.length} ticket{tickets.length === 1 ? '' : 's'}</span></div>
      {tickets.length === 0 ? <div className="empty-state"><div>✓</div><h3>No support requests yet</h3><p>When you submit a request, you’ll be able to track it here.</p><button className="secondary" onClick={onNew}>Create your first request</button></div> : <div className="ticket-list">{tickets.map(ticket => <TicketRow key={ticket.id} ticket={ticket} device={devices.find(d => d.id === ticket.device_id)}/>)}</div>}
    </section>
  </>
}

function TicketRow({ ticket, device }) {
  return <article className="ticket-row"><div className="ticket-icon"><Icon name="ticket"/></div><div className="ticket-main"><div className="ticket-meta"><strong>#{ticket.id}</strong><span>{formatDate(ticket.created_at)}</span></div><h3>{ticket.issue}</h3><p>{device ? `${device.manufacturer} ${device.model} · ${device.assetTag}` : ticket.device_id}</p><div className="badges"><span className={`status ${ticket.status.toLowerCase()}`}>{ticket.status}</span><span className={`priority ${ticket.priority.toLowerCase()}`}>{ticket.priority} priority</span>{ticket.category && <span>{ticket.category}</span>}</div></div><button className="chevron">›</button></article>
}

function Stat({ value, label }) { return <div className="card stat"><strong>{value}</strong><span>{label}</span></div> }
function initials(name='') { return name.split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase() }
function formatDate(value) { return new Intl.DateTimeFormat('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }).format(new Date(value)) }
function Icon({ name }) { return name === 'plus' ? <span className="nav-icon">＋</span> : <span className="nav-icon">▱</span> }

createRoot(document.getElementById('root')).render(<App/>);
