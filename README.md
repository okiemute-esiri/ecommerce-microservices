# E-Commerce Microservices Platform

A backend-focused software engineering project demonstrating how an e-commerce domain can be decomposed into independently deployable services with explicit ownership boundaries, asynchronous integration and operational isolation.

> **Current status:** Foundational implementation. The repository includes runnable catalogue, inventory and order services plus an API gateway, Docker Compose orchestration and CI. Event streaming, persistent databases and production deployment are documented as the next milestones.

## Architecture

```text
Client
  |
  v
API Gateway :8080
  |
  +----------------+----------------+----------------+
  |                |                |
  v                v                v
Catalogue       Inventory         Orders
:3001           :3002             :3003
  |                |                |
  +----------------+----------------+
                   |
             Domain Events
             (planned broker)
```

## Service Boundaries

| Service | Responsibility |
| --- | --- |
| API Gateway | External routing and service aggregation |
| Catalogue | Product metadata, names, descriptions and prices |
| Inventory | Stock levels and stock adjustments |
| Orders | Order creation and order state |

The design deliberately keeps catalogue data separate from stock state and transactional order state. That prevents a single shared persistence model from becoming the coupling mechanism between services.

## Technology Stack

- Node.js 22
- TypeScript
- Express
- Native `fetch` for service-to-service calls
- Vitest
- Docker / Docker Compose
- GitHub Actions

## Repository Structure

```text
.
├── services/
│   ├── gateway/
│   │   └── src/index.ts
│   ├── catalogue/
│   │   └── src/index.ts
│   ├── inventory/
│   │   └── src/index.ts
│   └── orders/
│       └── src/index.ts
├── tests/
│   └── architecture.test.ts
├── .github/workflows/ci.yml
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

## Implemented Endpoints

### Gateway

```text
GET /health
GET /api/products
GET /api/products/:id
GET /api/inventory/:sku
GET /api/orders
POST /api/orders
```

### Catalogue Service

```text
GET /health
GET /products
GET /products/:id
```

### Inventory Service

```text
GET /health
GET /inventory/:sku
POST /inventory/:sku/adjust
```

### Order Service

```text
GET /health
GET /orders
POST /orders
GET /orders/:id
```

## Local Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

Run individual services:

```bash
npm run dev:catalogue
npm run dev:inventory
npm run dev:orders
npm run dev:gateway
```

Or run the complete platform:

```bash
docker compose up --build
```

The gateway is exposed at `http://localhost:8080`.

## Engineering Decisions

### Independent domain ownership

Each service owns its business state. No service reaches directly into another service's internal data structures.

### Gateway at the edge

Clients interact through one external entry point while backend services remain independently addressable inside the container network.

### Health endpoints

Every process exposes `/health`, enabling container orchestration and future Kubernetes readiness/liveness integration.

### Failure boundaries

The gateway converts upstream failures into controlled `502` responses instead of leaking raw network exceptions.

## Testing

The current test suite validates service-boundary configuration and shared architectural assumptions. Planned additions include:

- unit tests per domain service;
- API integration tests;
- order/inventory workflow tests;
- contract tests between gateway and services;
- failure-injection tests.

## CI/CD

GitHub Actions performs:

```text
Checkout
  -> Node Setup
  -> npm install
  -> TypeScript check
  -> Tests
  -> Build
```

## Production Roadmap

- [x] Establish microservice boundaries.
- [x] Implement catalogue service.
- [x] Implement inventory service.
- [x] Implement order service.
- [x] Implement API gateway.
- [x] Add Docker Compose orchestration.
- [x] Add CI pipeline.
- [ ] Add PostgreSQL per transactional service.
- [ ] Add Redis where caching is justified.
- [ ] Add Kafka or RabbitMQ domain events.
- [ ] Implement transactional outbox for reliable events.
- [ ] Add OpenTelemetry traces and Prometheus metrics.
- [ ] Add Kubernetes manifests and Helm chart.
- [ ] Add contract and integration tests.
- [ ] Add centralized structured logging.

## What This Demonstrates

This project focuses on backend and distributed-systems engineering: service decomposition, API boundaries, independent deployability, synchronous service communication, container orchestration, operational health checks, CI and an incremental path toward event-driven production architecture.
