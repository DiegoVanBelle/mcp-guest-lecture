import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const students = {
  '12345': { id: '12345', name: 'Alex Johnson', email: 'alex.johnson@university.edu', programme: 'Computer Science', status: 'Active' },
  '67890': { id: '67890', name: 'Samira Patel', email: 'samira.patel@university.edu', programme: 'Business Analytics', status: 'Active' }
};

const devices = {
  '12345': [
    { id: 'DEV-2048', type: 'Laptop', manufacturer: 'Dell', model: 'Latitude 5440', assetTag: 'UNI-LT-8841', status: 'Assigned' },
    { id: 'DEV-2190', type: 'Phone', manufacturer: 'Apple', model: 'iPhone 15', assetTag: 'UNI-PH-1220', status: 'Assigned' }
  ],
  '67890': [{ id: 'DEV-3011', type: 'Laptop', manufacturer: 'Lenovo', model: 'ThinkPad T14', assetTag: 'UNI-LT-9921', status: 'Assigned' }]
};

const tickets = [
  { id: 4809, student_id: '12345', device_id: 'DEV-2048', category: 'Network & Wi-Fi', issue: 'Wi-Fi disconnects regularly in the library', priority: 'Low', status: 'Resolved', created_at: '2026-09-18T09:24:00.000Z' },
  { id: 4810, student_id: '12345', device_id: 'DEV-2190', category: 'Software', issue: 'University authenticator app will not open', priority: 'Medium', status: 'Resolved', created_at: '2026-09-21T13:05:00.000Z' }
];
const wait = (ms = 250) => new Promise(resolve => setTimeout(resolve, ms));

app.get('/students/:id', async (req, res) => {
  await wait();
  const student = students[req.params.id];
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

app.get('/devices/:studentId', async (req, res) => {
  await wait();
  res.json(devices[req.params.studentId] ?? []);
});

app.post('/tickets', async (req, res) => {
  await wait(450);
  const { student_id, device_id, category, issue, priority } = req.body;
  if (!student_id || !device_id || !issue || !priority) return res.status(400).json({ error: 'Student, device, issue and priority are required.' });
  if (!students[student_id]) return res.status(404).json({ error: 'Student not found.' });
  if (!(devices[student_id] ?? []).some(device => device.id === device_id)) return res.status(400).json({ error: 'That device is not assigned to this student.' });
  const nextId = Math.max(4811, ...tickets.map(t => t.id)) + 1;
  const ticket = { id: nextId, student_id, device_id, category: category || 'Other', issue: issue.trim(), priority, status: 'Open', created_at: new Date().toISOString() };
  tickets.unshift(ticket);
  res.status(201).json(ticket);
});

app.get('/tickets', async (req, res) => {
  await wait();
  const result = req.query.studentId ? tickets.filter(ticket => ticket.student_id === req.query.studentId) : tickets;
  res.json(result);
});

app.get('/tickets/:id', async (req, res) => {
  await wait();
  const ticket = tickets.find(t => String(t.id) === req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  res.json(ticket);
});

app.patch('/tickets/:id', async (req, res) => {
  await wait(350);

  const ticket = tickets.find(t => String(t.id) === req.params.id);

  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  const { issue, priority, category, status } = req.body;

  const allowedPriorities = ['Low', 'Medium', 'High'];
  const allowedStatuses = ['Open', 'In Progress', 'Resolved'];

  if (priority && !allowedPriorities.includes(priority)) {
    return res.status(400).json({
      error: 'Priority must be Low, Medium or High.'
    });
  }

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({
      error: 'Status must be Open, In Progress or Resolved.'
    });
  }

  if (issue !== undefined) {
    ticket.issue = issue.trim();
  }

  if (priority !== undefined) {
    ticket.priority = priority;
  }

  if (category !== undefined) {
    ticket.category = category;
  }

  if (status !== undefined) {
    ticket.status = status;
  }

  ticket.updated_at = new Date().toISOString();

  res.json(ticket);
});

app.get('/health', (_req, res) => res.json({ ok: true }));
app.listen(4000, () => console.log('University APIs running at http://localhost:4000'));
