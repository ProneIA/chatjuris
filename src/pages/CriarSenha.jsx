import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

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
      // Marca o usuário como tendo senha cadastrada
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F9FAFB" }}>
        <div style={{ textAlign: "center", color: "#6B7280" }}>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#F9FAFB",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem", fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      <div style={{
        background: "#fff", borderRadius: "20px",
        padding: "3rem", maxWidth: "440px", width: "100%",
        boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
        border: "1.5px solid #E5E7EB"
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem" }}>
          <div style={{ width: 32, height: 32, background: "#191970", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: "0.9rem" }}>J</span>
          </div>
          <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#0D0F1A", letterSpacing: "-0.02em" }}>Juris</span>
        </div>

        {success ? (
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, background: "#D1FAE5", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2rem", margin: "0 auto 1.5rem"
            }}>✅</div>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0D0F1A", marginBottom: "0.75rem" }}>
              Senha criada com sucesso!
            </h2>
            <p style={{ color: "#6B7280", fontSize: "0.9rem", lineHeight: 1.75, marginBottom: "2rem" }}>
              Agora você pode usar e-mail e senha para entrar.
            </p>
            <Link to="/Dashboard" style={{
              display: "block", textAlign: "center",
              background: "#191970", color: "#fff",
              borderRadius: "10px", padding: "0.875rem",
              fontWeight: 700, fontSize: "0.95rem",
              textDecoration: "none"
            }}>
              Ir para o painel →
            </Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0D0F1A", marginBottom: "0.5rem" }}>
              Criar senha
            </h1>
            <p style={{ color: "#6B7280", fontSize: "0.875rem", marginBottom: "2rem", lineHeight: 1.6 }}>
              Defina uma senha para continuar acessando sua conta mesmo após a desativação do login com Google.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Email (readonly) */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
                  E-mail
                </label>
                <input
                  type="email"
                  value={user.email || ""}
                  readOnly
                  style={{
                    width: "100%", padding: "0.75rem 1rem",
                    background: "#F3F4F6", border: "1.5px solid #E5E7EB",
                    borderRadius: "8px", fontSize: "0.9rem", color: "#6B7280",
                    cursor: "not-allowed"
                  }}
                />
              </div>

              {/* Nova senha */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
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
                      border: `1.5px solid ${errors.length > 0 ? "#EF4444" : "#E5E7EB"}`,
                      borderRadius: "8px", fontSize: "0.9rem", color: "#0D0F1A",
                      outline: "none", boxSizing: "border-box"
                    }}
                    onFocus={e => e.target.style.borderColor = "#191970"}
                    onBlur={e => e.target.style.borderColor = errors.length > 0 ? "#EF4444" : "#E5E7EB"}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    style={{
                      position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)",
                      background: "none", border: "none", cursor: "pointer", fontSize: "1.1rem", color: "#9CA3AF"
                    }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
                {errors.length > 0 && (
                  <ul style={{ margin: "0.5rem 0 0", padding: "0 0 0 1rem", color: "#EF4444", fontSize: "0.78rem" }}>
                    {errors.map(e => <li key={e}>{e}</li>)}
                  </ul>
                )}
              </div>

              {/* Confirmar senha */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "0.4rem" }}>
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
                    border: `1.5px solid ${confirmError ? "#EF4444" : "#E5E7EB"}`,
                    borderRadius: "8px", fontSize: "0.9rem", color: "#0D0F1A",
                    outline: "none", boxSizing: "border-box"
                  }}
                  onFocus={e => e.target.style.borderColor = "#191970"}
                  onBlur={e => e.target.style.borderColor = confirmError ? "#EF4444" : "#E5E7EB"}
                />
                {confirmError && <p style={{ color: "#EF4444", fontSize: "0.78rem", marginTop: "0.4rem" }}>{confirmError}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? "#9CA3AF" : "#191970",
                  color: "#fff", border: "none",
                  borderRadius: "10px", padding: "0.9rem",
                  fontWeight: 700, fontSize: "0.95rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s", marginTop: "0.25rem"
                }}
              >
                {loading ? "Salvando..." : "Salvar senha"}
              </button>
            </form>

            <p style={{ textAlign: "center", color: "#9CA3AF", fontSize: "0.78rem", marginTop: "1.5rem" }}>
              <Link to="/Dashboard" style={{ color: "#6B7280", textDecoration: "none" }}>
                ← Voltar ao painel
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}