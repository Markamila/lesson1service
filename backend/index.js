const express = require('express');
const cors = require('cors');
const client = require('prom-client');
require('dotenv').config();

const authRoutes = require('./routes/auth');

const app = express();

// ───────── МЕТРИКИ PROMETHEUS ─────────
const register = new client.Registry();
client.collectDefaultMetrics({ register }); // CPU, память, и т.д. — стандартные метрики Node.js

// Кастомная метрика: счётчик запросов по маршрутам
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Общее количество HTTP-запросов',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

// Кастомная метрика: время ответа
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Длительность обработки запроса в секундах',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    httpRequestCounter.inc({ method: req.method, route, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, route, status: res.statusCode }, duration);
  });
  next();
});

app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Backend работает 🚀' });
});

// Эндпоинт, который будет читать Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});