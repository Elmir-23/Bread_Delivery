import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { c } from "../styles/styles";
import { CSS } from "../styles/global";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Email və şifrə daxil edin"); return; }
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError("Email və ya şifrə yanlışdır");
      setLoading(false);
    }
  };

  return (
    <div style={{ ...c.wrap, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "1rem" }}>
      <style>{CSS}</style>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" />
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚚</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: "var(--text2)", marginBottom: 6 }}>ŞAH Market</div>
          <div style={{ fontSize: 14, color: "var(--text2)" }}>Daxil olmaq üçün məlumatlarınızı daxil edin</div>
        </div>

        <div style={c.block}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>Email</div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="email@example.com"
              style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)" }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6 }}>Şifrə</div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="••••••"
              style={{ width: "100%", padding: "10px 12px", fontSize: 14, border: "1px solid var(--border2)", borderRadius: 10, background: "var(--bg)", color: "var(--text)" }}
            />
          </div>
          {error && <div style={{ fontSize: 13, color: "#dc2626", marginBottom: 12, textAlign: "center" }}>{error}</div>}
          <button
            style={{ ...c.primaryBtn, opacity: loading ? 0.6 : 1 }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Yüklənir…" : "Daxil ol"}
          </button>
        </div>
      </div>
    </div>
  );
}
