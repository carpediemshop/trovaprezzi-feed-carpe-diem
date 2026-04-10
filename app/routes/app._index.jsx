import { useLoaderData } from "react-router";

const FORCED_SHOP_DOMAIN = "e9d9c4-38.myshopify.com";

export async function loader() {
  return {
    shop: FORCED_SHOP_DOMAIN,
  };
}

export default function AppIndex() {
  const { shop } = useLoaderData();

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const feedUrl = `${baseUrl}/feed/trovaprezzi`;

  async function copyFeedUrl() {
    try {
      await navigator.clipboard.writeText(feedUrl);
      alert("URL feed copiato.");
    } catch {
      alert("Non sono riuscito a copiare l'URL del feed.");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.hero}>
          <div style={styles.heroBadge}>Carpe Diem Shop</div>
          <h1 style={styles.title}>Trovaprezzi Feed</h1>
          <p style={styles.subtitle}>
            Pannello di controllo del feed XML pubblico collegato allo store reale.
          </p>
        </div>

        <div style={styles.grid}>
          <div style={styles.card}>
            <div style={styles.cardLabel}>Shop collegato</div>
            <div style={styles.cardValue}>{shop}</div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>URL feed XML</div>
            <input type="text" value={feedUrl} readOnly style={styles.input} />

            <div style={styles.actions}>
              <button type="button" onClick={copyFeedUrl} style={styles.primaryButton}>
                Copia URL
              </button>

              <a
                href={feedUrl}
                target="_blank"
                rel="noreferrer"
                style={styles.secondaryButton}
              >
                Apri feed XML
              </a>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.cardLabel}>Stato feed</div>
            <div style={styles.statusBadge}>ATTIVO</div>
            <p style={styles.text}>
              Il feed pubblico è pronto per il controllo finale e per il deploy definitivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg, #0f172a 0%, #111827 35%, #172033 100%)",
    padding: "40px 20px",
    boxSizing: "border-box",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  wrapper: {
    maxWidth: "980px",
    margin: "0 auto",
  },
  hero: {
    marginBottom: "24px",
  },
  heroBadge: {
    display: "inline-block",
    padding: "7px 12px",
    borderRadius: "999px",
    background: "rgba(34,197,94,0.16)",
    color: "#86efac",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    marginBottom: "14px",
  },
  title: {
    margin: 0,
    fontSize: "34px",
    lineHeight: 1.1,
    fontWeight: 800,
    color: "#f8fafc",
  },
  subtitle: {
    marginTop: "10px",
    marginBottom: 0,
    color: "#94a3b8",
    fontSize: "15px",
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gap: "18px",
  },
  card: {
    background: "rgba(15,23,42,0.78)",
    border: "1px solid rgba(148,163,184,0.18)",
    borderRadius: "18px",
    padding: "22px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
    backdropFilter: "blur(6px)",
  },
  cardLabel: {
    color: "#94a3b8",
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "12px",
  },
  cardValue: {
    color: "#f8fafc",
    fontSize: "18px",
    fontWeight: 700,
    wordBreak: "break-word",
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid rgba(148,163,184,0.22)",
    background: "#0b1220",
    color: "#e5e7eb",
    fontSize: "14px",
    marginBottom: "14px",
    outline: "none",
  },
  actions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  primaryButton: {
    border: "none",
    borderRadius: "12px",
    padding: "12px 16px",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#052e16",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
  },
  secondaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "12px",
    padding: "12px 16px",
    background: "#1e293b",
    border: "1px solid rgba(148,163,184,0.22)",
    color: "#f8fafc",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: 700,
  },
  statusBadge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(34,197,94,0.18)",
    color: "#86efac",
    fontSize: "13px",
    fontWeight: 800,
    marginBottom: "12px",
  },
  text: {
    margin: 0,
    color: "#cbd5e1",
    fontSize: "14px",
    lineHeight: 1.6,
  },
};