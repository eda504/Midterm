const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let leaderboard = [];

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/game.html');
});

// ── Full CRUD for leaderboard ────────────────────────────────────────────────

app.get('/api/leaderboard', (req, res) => {
  res.status(200).json(leaderboard);
});

app.get('/api/leaderboard/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 0 || id >= leaderboard.length) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  res.status(200).json(leaderboard[id]);
});

app.post('/api/leaderboard', (req, res) => {
  const { name, time, score, date } = req.body;

  if (!name || typeof time !== 'string' || typeof score !== 'number' || !date) {
    return res.status(400).json({ error: 'Missing or invalid fields: name (string), time (string), score (number), date (string) required' });
  }

  const newEntry = { name, time, score, date };
  leaderboard.push(newEntry);
  res.status(201).json({ success: true, entry: newEntry });
});

app.put('/api/leaderboard/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 0 || id >= leaderboard.length) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  const { name, time, score, date } = req.body;
  if (!name && time === undefined && score === undefined && !date) {
    return res.status(400).json({ error: 'At least one field to update required' });
  }

  if (name)  leaderboard[id].name  = name;
  if (time)  leaderboard[id].time  = time;
  if (score !== undefined) leaderboard[id].score = score;
  if (date)  leaderboard[id].date  = date;

  res.status(200).json({ success: true, entry: leaderboard[id] });
});

app.delete('/api/leaderboard/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id < 0 || id >= leaderboard.length) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  leaderboard.splice(id, 1);
  res.status(200).json({ success: true, message: 'Entry deleted' });
});

// Optional: keep old endpoint as alias if you already call it somewhere
app.post('/api/death', (req, res) => {
  // Forward to the proper endpoint
  res.redirect(307, '/api/leaderboard');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});