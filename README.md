# Laboratorio de Monitoreo y Observabilidad

## Descripción del Proyecto

Este proyecto implementa una stack completa de monitoreo y observabilidad utilizando tecnologías de código abierto. El sistema integra la recolección de métricas y logs de una aplicación Node.js, proporcionando visibilidad completa del estado y comportamiento de la aplicación en tiempo real.

### Componentes Principales

- **Prometheus**: Sistema de monitoreo y alerta que recolecta métricas de tiempo real de la aplicación.
- **Loki**: Sistema de agregación de logs diseñado para trabajar eficientemente con grandes volúmenes de datos.
- **Promtail**: Agente que recolecta logs de contenedores Docker y los envía a Loki.
- **Grafana**: Plataforma de visualización que permite crear dashboards interactivos combinando métricas y logs.
- **Aplicación Node.js**: Servidor HTTP de ejemplo que expone métricas y genera logs estructurados en formato JSON.

### Arquitectura del Sistema

```
┌─────────────────┐
│   Aplicación    │
│    Node.js      │──► Expone métricas (/metrics)
│                 │──► Genera logs JSON (stdout)
└─────────────────┘
        │
        ├──► Logs ────────► ┌──────────────┐
        │                   │   Promtail   │──► Recolecta y envía
        │                   └──────────────┘
        │                           │
        │                           ▼
        │                   ┌──────────────┐
        │                   │     Loki     │──► Almacena logs
        │                   └──────────────┘
        │                           │
        └──► Métricas ────► ┌──────────────┐
                            │  Prometheus  │──► Almacena métricas
                            └──────────────┘
                                    │
                            ┌───────┴───────┐
                            │    Grafana    │──► Visualiza datos
                            └───────────────┘
```

## Requisitos Previos

- Docker (versión 20.10 o superior)
- Docker Compose (versión 2.0 o superior)
- Git
- Mínimo 2GB de RAM disponible
- Puertos disponibles: 3000, 3001, 3100, 9090

## Instalación y Configuración

### 1. Clonar el Repositorio

```bash
git clone https://github.com/jeancdevx/grafana-prometheus-loki.git
cd grafana-prometheus-loki
```

### 2. Estructura del Proyecto

```
.
├── docker-compose.yaml          # Orquestación de servicios
├── grafana/
│   └── provisioning/
│       ├── datasources/
│       │   ├── grafana.yml      # Datasource Prometheus
│       │   └── loki.yml         # Datasource Loki
│       └── dashboards/
│           ├── dashboards.yml   # Configuración de dashboards
│           └── app-monitoring.json  # Dashboard principal
├── loki/
│   └── loki-config.yml          # Configuración de Loki
├── promtail/
│   └── promtail-config.yml      # Configuración de Promtail
├── prometheus/
│   └── prometheus.yml           # Configuración de Prometheus
└── src/
    ├── Dockerfile               # Imagen de la aplicación
    ├── index.js                 # Código de la aplicación
    └── package.json             # Dependencias Node.js
```

### 3. Iniciar los Servicios

```bash
docker-compose up -d
```

Este comando iniciará todos los servicios en segundo plano:
- Prometheus (puerto 9090)
- Loki (puerto 3100)
- Promtail (sin puerto expuesto)
- Grafana (puerto 3001)
- Aplicación Node.js (puerto 3000)

### 4. Verificar el Estado de los Contenedores

```bash
docker-compose ps
```

Todos los contenedores deben mostrar estado "Up".

## Acceso a los Servicios

### URLs de Acceso

- **Aplicación Node.js**: http://localhost:3000
- **Métricas de la aplicación**: http://localhost:3000/metrics
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3001
- **API de Loki**: http://localhost:3100

### Credenciales de Grafana

- **Usuario**: root
- **Contraseña**: root

## Configuración Detallada

### Prometheus

Configurado para scrapear métricas de la aplicación cada 5 segundos:

```yaml
scrape_configs:
  - job_name: "node_app"
    metrics_path: /metrics
    static_configs:
      - targets: ["app:3000"]
```

**Métricas disponibles:**
- `http_requests_total`: Contador total de peticiones HTTP
- `process_cpu_seconds_total`: Uso de CPU del proceso
- `process_resident_memory_bytes`: Memoria utilizada
- `nodejs_eventloop_lag_*`: Latencia del event loop
- Métricas por defecto de Node.js

### Loki

Configurado en modo single-binary con almacenamiento en filesystem:

**Características:**
- Puerto HTTP: 3100
- Puerto gRPC: 9096
- Schema v13 con TSDB
- Almacenamiento local en `/loki/chunks`
- Retención de 168 horas (7 días)
- Caché embebida de 100MB

### Promtail

Agente que recolecta logs de contenedores Docker mediante Docker Service Discovery:

**Configuración:**
- Descubrimiento automático de contenedores Docker
- Labels automáticos: container, service, stream
- Pipeline de procesamiento JSON
- Envío a Loki cada batch de logs

### Aplicación Node.js

Servidor HTTP con las siguientes características:

**Endpoints:**
- `/`: Responde "Hello World from Node.js!"
- `/metrics`: Expone métricas en formato Prometheus

**Logging:**
- Librería: Pino (logs estructurados en JSON)
- Nivel: info
- Formato: JSON con timestamp ISO 8601
- Información registrada: método HTTP, URL, código de estado, duración de request

**Ejemplo de log:**
```json
{
  "level": 30,
  "time": "2025-11-22T00:29:23.411Z",
  "pid": 18,
  "hostname": "30b1bd2b7bde",
  "method": "GET",
  "url": "/",
  "statusCode": 200,
  "duration": 2,
  "msg": "Request procesada"
}
```

## Dashboard de Grafana

El dashboard "Monitoreo de Aplicación Node.js" incluye:

### Sección de Métricas (Prometheus)

1. **Total de Requests HTTP**: Gauge mostrando el valor actual
2. **Rate de Requests**: Gráfico de línea con requests por segundo
3. **Uso de Memoria**: Visualización de memoria del proceso
4. **Uso de CPU**: Porcentaje de uso de CPU

### Sección de Logs (Loki)

5. **Logs en Tiempo Real**: Tabla con los últimos logs de la aplicación
6. **Logs por Nivel**: Distribución de logs por severity
7. **Rate de Logs**: Cantidad de logs generados por segundo

### Variables del Dashboard

- `$interval`: Intervalo de agregación (auto, 1m, 5m, 15m)
- Filtros automáticos por container y service

## Uso y Pruebas

### Generar Tráfico de Prueba

```bash
# Generar 10 requests a la aplicación
for i in {1..10}; do curl http://localhost:3000; done
```

### Consultar Métricas en Prometheus

Acceder a http://localhost:9090/graph y ejecutar queries:

```promql
# Total de requests
http_requests_total

# Rate de requests por segundo
rate(http_requests_total[5m])

# Uso de memoria
process_resident_memory_bytes / 1024 / 1024
```

### Consultar Logs en Loki

Acceder a Grafana → Explore → Seleccionar Loki como datasource:

```logql
# Todos los logs de la aplicación
{container="app"}

# Logs filtrados por método
{container="app"} | json | method="GET"

# Logs con duración mayor a 5ms
{container="app"} | json | duration > 5
```

### Verificar Targets en Prometheus

```bash
curl -s http://localhost:9090/api/v1/targets | grep -o '"health":"[^"]*"'
```

### Verificar Labels en Loki

```bash
curl -s http://localhost:3100/loki/api/v1/label/container/values
```

## Cambios e Implementaciones Realizadas

### 1. Configuración de Loki (feat: añadir servicio Loki)

- Implementación de Loki 3.0.0 para almacenamiento de logs
- Configuración de schema v13 con TSDB para mejor rendimiento
- Modo single-binary para simplicidad en desarrollo
- Volumen persistente para chunks y reglas

### 2. Integración de Promtail (feat: añadir Promtail)

- Configuración de Docker Service Discovery
- Montaje de socket Docker para acceso a logs de contenedores
- Pipeline de procesamiento para extraer campos JSON
- Labels automáticos (container, service, stream)

### 3. Datasource de Loki en Grafana (ci: añadir datasource)

- Provisioning automático mediante archivos YAML
- Configuración de conexión a Loki vía red interna Docker
- Límite de 1000 líneas por query para rendimiento

### 4. Logs Estructurados en la Aplicación (feat: implementar logs JSON)

- Migración de console.log a Pino
- Formato JSON con timestamps ISO 8601
- Metadata contextual en cada log (method, url, duration, statusCode)
- Separación de logs de métricas y requests normales

### 5. Dashboard Integrado (feat: crear dashboard de monitoreo)

- Provisioning automático del dashboard
- Combinación de métricas de Prometheus y logs de Loki
- Paneles informativos y gráficos de tendencias
- Variables para filtrado dinámico

### 6. Mejoras en el Dockerfile (feat: añadir dependencias)

- Separación de COPY para aprovechar caché de Docker
- Instalación de dependencias antes de copiar código fuente
- Reducción de tiempo de rebuild durante desarrollo

## Troubleshooting

### Los contenedores no inician

```bash
# Ver logs de un servicio específico
docker-compose logs [servicio]

# Ejemplos
docker-compose logs loki
docker-compose logs promtail
docker-compose logs app
```

### Prometheus no muestra métricas

```bash
# Verificar que la app esté exponiendo métricas
curl http://localhost:3000/metrics

# Verificar targets en Prometheus
curl http://localhost:9090/api/v1/targets
```

### Loki no muestra logs

```bash
# Verificar que Promtail esté enviando logs
docker-compose logs promtail | grep "error"

# Verificar conectividad con Loki
curl http://localhost:3100/ready

# Ver labels disponibles en Loki
curl http://localhost:3100/loki/api/v1/labels
```

### Grafana no muestra el dashboard

```bash
# Reiniciar Grafana
docker-compose restart grafana

# Verificar provisioning
docker-compose exec grafana ls -la /etc/grafana/provisioning/dashboards/
```

## Detener y Limpiar

### Detener servicios

```bash
docker-compose down
```

### Detener y eliminar volúmenes

```bash
docker-compose down -v
```

### Limpiar completamente

```bash
docker-compose down -v --remove-orphans
docker system prune -a
```

## Referencias y Documentación

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/latest/)
- [Promtail Configuration](https://grafana.com/docs/loki/latest/clients/promtail/)
- [Grafana Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- [Prom-client npm package](https://github.com/siimon/prom-client)
- [Pino Logger](https://getpino.io/)

## Licencia

ISC

## Autor

Walter Leturia
