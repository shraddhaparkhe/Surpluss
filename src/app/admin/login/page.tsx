"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
    setPending(false);
    if (!response.ok) { setError("Email or password was not recognised."); return; }
    router.push("/admin/leads");
  }

  return (
    <>
      <header className="site-header"><Link className="brand" href="/"><span className="brand-mark" aria-hidden="true">S</span><span>surpluss</span></Link><Link className="header-link" href="/catalogue/premium-corporate-essentials">Buyer catalogue</Link></header>
      <main className="login-page">
        <section className="login-panel">
          <span className="eyebrow">Sales workspace</span><h1>Sign in</h1><p>Access the catalogue workspace and buyer enquiries.</p>
          <form onSubmit={signIn}>
            <div className="field"><label htmlFor="login-email">Email</label><input id="login-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
            <div className="field"><label htmlFor="login-password">Password</label><input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
            {error && <p className="error-text" role="alert">{error}</p>}
            <button className="primary-button" disabled={pending} type="submit">{pending ? "Signing in…" : "Sign in"}</button>
          </form>
        </section>
      </main>
    </>
  );
}