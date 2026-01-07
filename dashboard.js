import express from 'express';
const app = express();

app.get('/', (req, res) => {
  res.send(`
    <h1>Vanguard Dashboard</h1>
    <p>Bot Aktif ✅</p>
    <p>Ticket / Anti-Nuke / Müzik / Otorol</p>
  `);
});

app.listen(3000, () => {
  console.log('🌐 Dashboard: http://localhost:3000');
});
