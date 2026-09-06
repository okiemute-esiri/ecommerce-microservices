import express from "express";

const app = express();
app.use(express.json());

const products = [
  { id: "p-100", sku: "SKU-100", name: "Studio Headphones", price: 149.99 },
  { id: "p-200", sku: "SKU-200", name: "Mechanical Keyboard", price: 99.5 }
];

app.get("/health", (_req, res) => res.json({ service: "catalogue", status: "ok" }));
app.get("/products", (_req, res) => res.json({ data: products }));
app.get("/products/:id", (req, res) => {
  const product = products.find((item) => item.id === req.params.id);
  if (!product) return res.status(404).json({ error: { code: "PRODUCT_NOT_FOUND" } });
  return res.json({ data: product });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`catalogue service listening on ${port}`));
