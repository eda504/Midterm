const rows = document.getElementById('rows');
const data = JSON.parse(localStorage.getItem('leaderboard') || '[]');
const music = new Audio('music2.mp3');
music.loop = true;
music.volume = 0.4;
music.play();

// Sort by longest time surviving
data.sort((a, b) => b.time - a.time);

data.forEach(entry => {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${entry.name}</td>
    <td>N/A (Infinite)</td>
    <td>${entry.time}s</td>
    <td>0</td>
    <td>0</td>
    <td>${entry.date}</td>
  `;
  rows.appendChild(tr);
});