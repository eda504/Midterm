const rows = document.getElementById('rows');
const data = JSON.parse(localStorage.getItem('leaderboard') || '[]');

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