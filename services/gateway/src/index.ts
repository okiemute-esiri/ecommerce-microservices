import express from "express";

const app = express();
app.use(express.json());

const catalogueUrl = process.env.CATALOGUE_URL ?? "http://localhost:3001";
const inventoryUrl = process.env.INVENTORY_URL ?? "http://localhost:3002";
const ordersUrl = process.env.ORDERS_URL ?? "http://localhost:3003";

async function proxyJson(res: express.Response, url: string, init?: RequestInit) {
  try {
    const upstream = await fetch(url, init);
    const body = await upstream.json();
    return res.status(upstream.status).json(body);
  } catch {
    return res.status(502).json({ error: { code: "UPSTREAM_UNAVAILABLE" } });
  }
}

app.get("/health", (_req, res) => res.json({ service: "gateway", status: "ok" }));
app.get("/api/products", (_req, res) => proxyJson(res, `${catalogueUrl}/products`));
app.get("/api/products/:id", (req, res) => proxyJson(res, `${catalogueUrl}/products/${req.params.id}`));
app.get("/api/inventory/:sku", (req, res) => proxyJson(res, `${inventoryUrl}/inventory/${req.params.sku}`));
app.get("/api/orders", (_req, res) => proxyJson(res, `${ordersUrl}/orders`));
app.post("/api/orders", (req, res) => proxyJson(res, `${ordersUrl}/orders`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(req.body)
}));

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => console.log(`gateway listening on ${port}`));
