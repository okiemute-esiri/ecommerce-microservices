import { randomUUID } from "node:crypto";

export type OrderStatus = "created" | "cancelled";

export type Order = {
  id: string;
  sku: string;
  quantity: number;
  status: OrderStatus;
};

export interface InventoryClient {
  adjust(sku: string, delta: number): Promise<void>;
}

export class InventoryReservationError extends Error {
  constructor(
    message: string,
    public readonly code: "INSUFFICIENT_STOCK" | "INVENTORY_UNAVAILABLE",
  ) {
    super(message);
  }
}

export class OrderService {
  private readonly orders: Order[] = [];

  constructor(private readonly inventory: InventoryClient) {}

  list(): Order[] {
    return this.orders.map((order) => ({ ...order }));
  }

  get(orderId: string): Order | null {
    const order = this.orders.find((item) => item.id === orderId);
    return order ? { ...order } : null;
  }

  async create(sku: string, quantity: number): Promise<Order> {
    await this.inventory.adjust(sku, -quantity);

    const order: Order = {
      id: randomUUID(),
      sku,
      quantity,
      status: "created",
    };

    this.orders.push(order);
    return { ...order };
  }

  async cancel(orderId: string): Promise<Order | null> {
    const order = this.orders.find((item) => item.id === orderId);
    if (!order) return null;
    if (order.status === "cancelled") return { ...order };

    await this.inventory.adjust(order.sku, order.quantity);
    order.status = "cancelled";
    return { ...order };
  }
}
