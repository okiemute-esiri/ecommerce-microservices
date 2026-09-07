import express from "express";
import { InventoryReservationError, OrderService, type InventoryClient } from "./order-service.js";

const app = express();
app.use(express.json());

const inventoryBaseUrl = process.env.INVENTORY_URL ?? "http://localhost:3002";

const inventoryClient: InventoryClient = {
  async adjust(sku, delta) {
    let response: Response;
    try {
      response = await fetch(`${inventoryBaseUrl}/inventory/${encodeURIComponent(sku)}/adjust`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ delta }),
      });
    } catch {
      throw new InventoryReservationError("inventory service unavailable", "INVENTORY_UNAVAILABLE");
    }

    if (response.ok) return;
    if (response.status === 409 || response.status === 404) {
      throw new InventoryReservationError("inventory reservation rejected", "INSUFFICIENT_STOCK");
    }
    throw new InventoryReservationError("inventory service unavailable", "INVENTORY_UNAVAILABLE");
  },
};

const orders = new OrderService(inventoryClient);

app.get("/health", (_req, res) => res.json({ service: "orders", status: "ok" }));
app.get("/orders", (_req, res) => res.json({ data: orders.list() }));
app.get("/orders/:id", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: { code: "ORDER_NOT_FOUND" } });
  return res.json({ data: order });
});

app.post("/orders", async (req, res) => {
  const sku = String(req.body?.sku ?? "").trim();
  const quantity = Number(req.body?.quantity);

  if (!sku || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ error: { code: "INVALID_ORDER" } });
  }

  try {
    const order = await orders.create(sku, quantity);
    return res.status(201).json({ data: order });
  } catch (error) {
    if (error instanceof InventoryReservationError) {
      const status = error.code === "INSUFFICIENT_STOCK" ? 409 : 503;
      return res.status(status).json({ error: { code: error.code } });
    }
    throw error;
  }
});

app.post("/orders/:id/cancel", async (req, res) => {
  try {
    const order = await orders.cancel(req.params.id);
    if (!order) return res.status(404).json({ error: { code: "ORDER_NOT_FOUND" } });
    return res.json({ data: order });
  } catch (error) {
    if (error instanceof InventoryReservationError) {
      return res.status(503).json({ error: { code: "INVENTORY_UNAVAILABLE" } });
    }
    throw error;
  }
});

const port = Number(process.env.PORT ?? 3003);
app.listen(port, () => console.log(`orders service listening on ${port}`));
