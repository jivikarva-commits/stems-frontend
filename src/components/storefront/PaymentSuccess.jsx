import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, LockKeyhole, Download } from "lucide-react";
import { API } from "../../config/env";
import { product } from "../../config/product";
import { StoreShell, StoreSEO } from "./Storefront";
import { api, purchaseHeaders } from "./Checkout";
export function DownloadCard({ access }) {
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  async function download(kind) {
    setBusy(kind);
    setError("");
    try {
      const response = await fetch(`${API}/download?kind=${kind}`, {
        headers: purchaseHeaders(),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Download unavailable.");
      }
      if (response.headers.get("Content-Type")?.includes("application/json")) {
        const data = await response.json();
        const destination = new URL(data.url);
        if (
          destination.protocol !== "https:" ||
          destination.hostname !== "drive.google.com"
        )
          throw new Error("Invalid product destination.");
        window.location.assign(destination.href);
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download =
        response.headers
          .get("Content-Disposition")
          ?.match(/filename="([^"]+)"/)?.[1] ||
        (kind === "guide" ? "stems-guide.pdf" : "stems-database.zip");
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="download-card">
      <h2>{product.name}</h2>
      <p>
        {access.delivery_mode === "drive_folder"
          ? "Your purchase includes access to the supplied Google Drive collection. Open a category, then download the CSV files you need."
          : "Your files are ready to download."}
      </p>
      <p>Payment reference: {access.payment_id}</p>
      <p>
        Save your files and payment ID. This browser’s access expires{" "}
        {new Date(access.expires_at * 1000).toLocaleDateString()}.
      </p>
      <button
        className="st-button"
        disabled={Boolean(busy) || !access.database_ready}
        onClick={() => download("database")}
      >
        <Download size={17} />
        {busy === "database"
          ? "Downloading…"
          : access.delivery_mode === "drive_folder"
            ? "Open USA data folder"
            : "Download database"}
      </button>
      <button
        className="st-button secondary"
        disabled={Boolean(busy) || !access.guide_ready}
        onClick={() => download("guide")}
      >
        {busy === "guide" ? "Downloading…" : "Download product guide / PDF"}
      </button>
      {!access.guide_ready && (
        <p className="section-note">The product guide is not available yet.</p>
      )}
      {error && (
        <p role="alert" className="st-error">
          {error}
        </p>
      )}
    </div>
  );
}
export default function PaymentSuccess() {
  const [access, setAccess] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api("/product/access")
      .then((data) => {
        if (active) setAccess(data);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <StoreShell>
      <StoreSEO title="Your download | Stems" path="/download" noIndex />
      <main id="main" className="download-page st-wrap">
        {access ? (
          <>
            <CheckCircle2 className="success-icon" />
            <h1>Payment successful.</h1>
            <p>Your USA Client Data is ready.</p>
            <DownloadCard access={access} />
          </>
        ) : error ? (
          <>
            <LockKeyhole className="success-icon" />
            <h1>Purchase access required.</h1>
            <p>{error}</p>
            <p className="section-note">
              Already paid? Return to the browser you purchased in, or contact
              support with your payment ID. Do not pay again.
            </p>
            <Link className="st-button" to="/contact">
              Get help
            </Link>
          </>
        ) : (
          <p role="status">Checking your purchase securely…</p>
        )}
      </main>
    </StoreShell>
  );
}
