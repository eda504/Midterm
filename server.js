const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let leaderboard = [];

app.post('/api/death', (req, res) => {
  leaderboard.push(req.body);
  res.json({ success: true });
});

app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboard);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/game.html');
});
