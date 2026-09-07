import { describe, expect, it, vi } from "vitest";
import { InventoryReservationError, OrderService, type InventoryClient } from "../services/orders/src/order-service.js";

describe("order inventory consistency", () => {
  it("reserves inventory before creating an order", async () => {
    const adjust = vi.fn(async () => undefined);
    const service = new OrderService({ adjust });

    const order = await service.create("SKU-100", 2);

    expect(adjust).toHaveBeenCalledWith("SKU-100", -2);
    expect(order.status).toBe("created");
    expect(service.list()).toHaveLength(1);
  });

  it("does not create an order when inventory reservation fails", async () => {
    const inventory: InventoryClient = {
      adjust: async () => {
        throw new InventoryReservationError("rejected", "INSUFFICIENT_STOCK");
      },
    };
    const service = new OrderService(inventory);

    await expect(service.create("SKU-100", 99)).rejects.toMatchObject({ code: "INSUFFICIENT_STOCK" });
    expect(service.list()).toHaveLength(0);
  });

  it("releases reserved stock when an order is cancelled", async () => {
    const adjust = vi.fn(async () => undefined);
    const service = new OrderService({ adjust });
    const order = await service.create("SKU-200", 3);

    const cancelled = await service.cancel(order.id);

    expect(adjust).toHaveBeenNthCalledWith(1, "SKU-200", -3);
    expect(adjust).toHaveBeenNthCalledWith(2, "SKU-200", 3);
    expect(cancelled?.status).toBe("cancelled");
  });

  it("does not restock twice when cancellation is retried", async () => {
    const adjust = vi.fn(async () => undefined);
    const service = new OrderService({ adjust });
    const order = await service.create("SKU-200", 1);

    await service.cancel(order.id);
    await service.cancel(order.id);

    expect(adjust).toHaveBeenCalledTimes(2);
  });
});
