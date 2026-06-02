import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push("Mínimo de 8 caracteres");
  if (!/[A-Z]/.test(password)) errors.push("Pelo menos 1 letra maiúscula");
  if (!/[0-9]/.test(password)) errors.push("Pelo menos 1 número");
  return errors;
}

export default function CriarSenha() {
  const [user, setUser] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState([]);
  const [confirmError, setConfirmError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setUser(u)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validatePassword(password);
    setErrors(validationErrors);
    if (validationErrors.length > 0) return;

    if (password !== confirm) {
      setConfirmError("As senhas não coincidem.");
      return;
    }
    setConfirmError("");

    setLoading(true);
    try {
      await base44.auth.updateMe({ has_password: true });
      setSuccess(true);
    } catch (err) {
      setErrors(["Erro ao salvar. Tente novamente."]);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface)" }}>
        <div style={{ textAlign: "center", color: "var(--text-secondary)", fontFamily: "var(--font-body)" }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "var(--surface)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem", fontFamily: "var(--font-body)"
    }}>
      <div style={{
        background: "var(--main-bg)", borderRadius: "var(--radius-lg)",
        padding: "3rem", maxWidth: "440px", width: "100%",
        boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--border)"
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
          <div style={{ width: 32, height: 32, background: "var(--ink)", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: "0.9rem" }}>J</span>
          </div>
          <span style={{ fontFamily: "var(--font-logo)", fontStyle: "italic", fontWeight: 700, fontSize: "1.2rem", color: "var(--text-primary)" }}>Juris</span>
        </div>

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, background: "var(--success-bg)", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.5rem"
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.75rem" }}>
              Senha criada com sucesso!
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.75, marginBottom: "2rem" }}>
              Agora você pode usar e-mail e senha para entrar.
            </p>
            <Link to="/Dashboard" style={{
              display: "block", textAlign: "center",
              background: "var(--ink)", color: "#fff",
              borderRadius: "var(--radius-md)", padding: "0.875rem",
              fontWeight: 700, fontSize: "0.95rem",
              textDecoration: "none"
            }}>
              Ir para o painel →
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
              Criar senha
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "2rem", lineHeight: 1.6 }}>
              Defina uma senha para continuar acessando sua conta mesmo após a desativação do login com Google.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Email (readonly) */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                  E-mail
                </label>
                <input
                  type="email"
                  value={user.email || ""}
                  readOnly
                  style={{
                    width: "100%", padding: "0.75rem 1rem",
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)", fontSize: "0.9rem", color: "var(--text-muted)",
                    cursor: "not-allowed", boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Nova senha */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                  Nova senha
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setErrors([]); }}
                    placeholder="Mín. 8 caracteres, 1 maiúscula, 1 número"
                    required
                    style={{
                      width: "100%", padding: "0.75rem 3rem 0.75rem 1rem",
                      border: `1px solid ${errors.length > 0 ? "var(--danger)" : "var(--border)"}`,
                      borderRadius: "var(--radius-sm)", fontSize: "0.9rem", color: "var(--text-primary)",
                      outline: "none", boxSizing: "border-box"
                    }}
                    onFocus={e => e.target.style.borderColor = "var(--accent)"}
                    onBlur={e => e.target.style.borderColor = errors.length > 0 ? "var(--danger)" : "var(--border)"}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "var(--text-muted)"
                    }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.length > 0 && (
                  <ul style={{ margin: "0.5rem 0 0", padding: "0 0 0 1rem", color: "var(--danger)", fontSize: "0.78rem" }}>
                    {errors.map(e => <li key={e}>{e}</li>)}
                  </ul>
                )}
              </div>

              {/* Confirmar senha */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem" }}>
                  Confirmar nova senha
                </label>
                <input
                  type={showPass ? "text" : "password"}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); setConfirmError(""); }}
                  placeholder="Repita a senha"
                  required
                  style={{
                    width: "100%", padding: "0.75rem 1rem",
                    border: `1px solid ${confirmError ? "var(--danger)" : "var(--border)"}`,
                    borderRadius: "var(--radius-sm)", fontSize: "0.9rem", color: "var(--text-primary)",
                    outline: "none", boxSizing: "border-box"
                  }}
                  onFocus={e => e.target.style.borderColor = "var(--accent)"}
                  onBlur={e => e.target.style.borderColor = confirmError ? "var(--danger)" : "var(--border)"}
                />
                {confirmError && <p style={{ color: "var(--danger)", fontSize: "0.78rem", marginTop: "0.4rem" }}>{confirmError}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? "var(--text-muted)" : "var(--ink)",
                  color: "#fff", border: "none",
                  borderRadius: "var(--radius-md)", padding: "0.9rem",
                  fontWeight: 700, fontSize: "0.95rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background var(--transition)", marginTop: "0.25rem",
                  fontFamily: "var(--font-body)"
                }}
              >
                {loading ? "Salvando..." : "Salvar senha"}
              </button>
            </form>

            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.78rem", marginTop: "1.5rem" }}>
              <Link to="/Dashboard" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>
                ← Voltar ao painel
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}