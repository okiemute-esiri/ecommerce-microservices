import express from "express";
import { randomUUID } from "node:crypto";

const app = express();
app.use(express.json());

type Order = {
  id: string;
  sku: string;
  quantity: number;
  status: "created" | "cancelled";
};

const orders: Order[] = [];

app.get("/health", (_req, res) => res.json({ service: "orders", status: "ok" }));
app.get("/orders", (_req, res) => res.json({ data: orders }));
app.get("/orders/:id", (req, res) => {
  const order = orders.find((item) => item.id === req.params.id);
  if (!order) return res.status(404).json({ error: { code: "ORDER_NOT_FOUND" } });
  return res.json({ data: order });
});

app.post("/orders", (req, res) => {
  const sku = String(req.body?.sku ?? "").trim();
  const quantity = Number(req.body?.quantity);

  if (!sku || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: { code: "INVALID_ORDER" } });
  }

  const order: Order = { id: randomUUID(), sku, quantity, status: "created" };
  orders.push(order);
  return res.status(201).json({ data: order });
});

const port = Number(process.env.PORT ?? 3003);
app.listen(port, () => console.log(`orders service listening on ${port}`));
