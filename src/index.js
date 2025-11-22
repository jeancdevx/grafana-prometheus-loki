const http = require("http");
const client = require("prom-client");
const pino = require("pino");

const logger = pino({
  level: "info",
  timestamp: pino.stdTimeFunctions.isoTime,
});

const hostname = "0.0.0.0";
const port = 3000;

const register = new client.Registry();
client.collectDefaultMetrics({ register });

const counter = new client.Counter({
  name: "http_requests_total",
  help: "Número total de peticiones recibidas",
});
register.registerMetric(counter);

logger.info({ hostname, port }, "Iniciando servidor HTTP");

const server = http.createServer(async (req, res) => {
  const requestStart = Date.now();

  if (req.url === "/metrics") {
    res.setHeader("Content-Type", register.contentType);
    res.end(await register.metrics());
    logger.info(
      { method: req.method, url: req.url, duration: Date.now() - requestStart },
      "Métricas servidas"
    );
    return;
  }

  counter.inc();

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  const response = "Hello World from Node.js!\n";
  res.end(response);

  logger.info(
    {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: Date.now() - requestStart,
    },
    "Request procesada"
  );
});

server.listen(port, hostname, () => {
  logger.info({ hostname, port }, "Servidor corriendo exitosamente");
});
