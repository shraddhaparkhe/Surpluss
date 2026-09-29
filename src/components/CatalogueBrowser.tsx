"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import type { Catalogue, Product } from "@/lib/catalogue";

interface CatalogueResponse {
  catalogue: Catalogue;
  products: Product[];
}

export default function CatalogueBrowser({ slug }: { slug: string }) {
  const [data, setData] = useState<CatalogueResponse | null>(null);
  const [loadError, setLoadError] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [contact, setContact] = useState({ name: "", email: "", phone: "" });
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/catalogues/${encodeURIComponent(slug)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error("This catalogue is unavailable.");
        return (await response.json()) as CatalogueResponse;
      })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Unable to load catalogue.");
      });
    return () => { active = false; };
  }, [slug]);

  function addProduct(product: Product) {
    setQuantities((current) => ({ ...current, [product.id]: current[product.id] ?? product.moq }));
    setNotice(null);
  }

  function updateQuantity(product: Product, rawValue: string) {
    const value = Number(rawValue);
    setQuantities((current) => ({ ...current, [product.id]: value }));
  }

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!data) return;
    setSubmitting(true);
    setNotice(null);
    const response = await fetch("/api/enquiries", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        slug,
        ...contact,
        items: Object.entries(quantities).map(([productId, quantity]) => ({ productId, quantity })),
      }),
    });
    const result = (await response.json()) as { reference?: string; errors?: string[] };
    setSubmitting(false);
    if (!response.ok) {
      setNotice({ text: result.errors?.join(". ") ?? "Enquiry could not be submitted.", error: true });
      return;
    }
    setNotice({ text: `Enquiry submitted. Reference ${result.reference}.`, error: false });
    setQuantities({});
    setContact({ name: "", email: "", phone: "" });
  }

  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Surpluss home"><span className="brand-mark" aria-hidden="true">S</span><span>surpluss</span></Link>
        <Link className="header-link" href="/admin/login">Trade portal</Link>
      </header>
      <main className="page-shell">
        {loadError ? <p className="notice error" role="alert">{loadError}</p> : !data ? <p className="loading" role="status">Loading catalogue…</p> : (
          <>
            <section className="catalogue-head">
              <span className="eyebrow">Available inventory</span>
              <h1>{data.catalogue.title}</h1>
              <p>Trade pricing on verified surplus stock. Submit an enquiry for the quantities you need.</p>
            </section>
            <div className="catalogue-grid">
              <section aria-labelledby="products-heading">
                <div className="section-label"><h2 id="products-heading">Products</h2><span>{data.products.length} items</span></div>
                <div className="product-list">
                  {data.products.map((product) => {
                    const selected = product.id in quantities;
                    const discount = Math.round(((product.mrp - product.offerPrice) / product.mrp) * 100);
                    return (
                      <article className="product-row" key={product.id}>
                        <div>
                          <div className="product-meta">{product.brand} · {product.category} · {product.sku}</div>
                          <h3>{product.name}</h3>
                          <div className="price-line"><span className="price">₹{product.offerPrice.toLocaleString("en-IN")}</span><span className="mrp">₹{product.mrp.toLocaleString("en-IN")}</span><span className="discount">{discount}% below MRP</span></div>
                          <div className="stock-line">MOQ {product.moq} · {product.availableQty} available</div>
                        </div>
                        <button className={selected ? "secondary-button" : "primary-button"} type="button" onClick={() => addProduct(product)}>{selected ? "Added" : "Add to enquiry"}</button>
                      </article>
                    );
                  })}
                </div>
              </section>
              <aside className="enquiry-panel" aria-labelledby="enquiry-heading">
                <h2 id="enquiry-heading">Your enquiry</h2>
                <p className="panel-subtitle">Prices are confirmed by the sales team.</p>
                {Object.keys(quantities).length === 0 ? <p className="cart-empty">No products selected yet.</p> : (
                  <div aria-label="Selected products">
                    {Object.entries(quantities).map(([productId, quantity]) => {
                      const product = data.products.find((candidate) => candidate.id === productId);
                      if (!product) return null;
                      return <div className="cart-item" key={productId}><div><strong>{product.name}</strong><small>MOQ {product.moq}</small></div><input className="quantity-input" aria-label={`Quantity for ${product.name}`} type="number" min={product.moq} max={product.availableQty} step="1" value={quantity} onChange={(event) => updateQuantity(product, event.target.value)} /></div>;
                    })}
                  </div>
                )}
                <form onSubmit={submitEnquiry}>
                  <div className="field"><label htmlFor="buyer-name">Your name</label><input id="buyer-name" autoComplete="name" required value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} /></div>
                  <div className="field"><label htmlFor="buyer-email">Work email</label><input id="buyer-email" type="email" autoComplete="email" required value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} /></div>
                  <div className="field"><label htmlFor="buyer-phone">Phone</label><input id="buyer-phone" type="tel" autoComplete="tel" required value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} /></div>
                  <button className="primary-button submit-button" disabled={submitting || !Object.keys(quantities).length} type="submit">{submitting ? "Submitting…" : "Submit enquiry"}</button>
                </form>
                {notice && <p className={`notice${notice.error ? " error" : ""}`} role={notice.error ? "alert" : "status"}>{notice.text}</p>}
              </aside>
            </div>
          </>
        )}
      </main>
    </>
  );
}