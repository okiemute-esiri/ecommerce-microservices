import express from "express";

const app = express();
app.use(express.json());

const stock = new Map<string, number>([
  ["SKU-100", 12],
  ["SKU-200", 7]
]);

app.get("/health", (_req, res) => res.json({ service: "inventory", status: "ok" }));
app.get("/inventory/:sku", (req, res) => {
  const quantity = stock.get(req.params.sku);
  if (quantity === undefined) return res.status(404).json({ error: { code: "SKU_NOT_FOUND" } });
  return res.json({ data: { sku: req.params.sku, quantity } });
});

app.post("/inventory/:sku/adjust", (req, res) => {
  const delta = Number(req.body?.delta);
  if (!Number.isInteger(delta)) return res.status(400).json({ error: { code: "INVALID_DELTA" } });

  const current = stock.get(req.params.sku) ?? 0;
  const next = current + delta;
  if (next < 0) return res.status(409).json({ error: { code: "INSUFFICIENT_STOCK" } });

  stock.set(req.params.sku, next);
  return res.json({ data: { sku: req.params.sku, quantity: next } });
});

const port = Number(process.env.PORT ?? 3002);
app.listen(port, () => console.log(`inventory service listening on ${port}`));
