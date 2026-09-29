import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { roleFromSession } from "@/lib/auth";
import { getStore } from "@/lib/store";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const token = (await cookies()).get("catalogue_session")?.value;
  const role = roleFromSession(token);
  if (!role) redirect("/admin/login");
  const enquiries = getStore().enquiries;

  return (
    <>
      <header className="site-header">
        <Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">S</span><span>surpluss</span></Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}><span className="header-link">{role}</span><LogoutButton /></div>
      </header>
      <main className="admin-shell">
        <div className="admin-heading"><div><span className="eyebrow">Sales workspace</span><h1>Buyer enquiries</h1><p>New requests from published catalogues.</p></div><div className="inbox-count"><strong>{enquiries.length}</strong> total leads</div></div>
        {enquiries.length === 0 ? <div className="table-wrap empty-state">No enquiries yet.</div> : (
          <div className="table-wrap"><table className="leads-table"><thead><tr><th>Reference</th><th>Buyer</th><th>Products</th><th>Received</th></tr></thead>
            <tbody>{enquiries.map((enquiry) => (
              <tr key={enquiry.id}>
                <td>{enquiry.reference}</td>
                <td>{enquiry.name}<br /><span className="product-meta">{enquiry.email} · {enquiry.phone}</span></td>
                <td><div className="lead-items">{enquiry.items.map((item) => <span className="lead-item" key={item.productId}>{item.productName} · {item.quantity} × ₹{item.priceSnapshot.toLocaleString("en-IN")}</span>)}</div></td>
                <td>{new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(enquiry.createdAt))}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </main>
    </>
  );
}