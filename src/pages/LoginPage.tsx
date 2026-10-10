// src/pages/LoginPage.tsx
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, useLocation } from "react-router-dom";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const from = (
        location.state as {
          from?: { pathname?: string; search?: string };
        } | null
      )?.from;
      navigate(
        from?.pathname?.startsWith("/") && !from.pathname.startsWith("//")
          ? `${from.pathname}${from.search ?? ""}`
          : "/reservations",
        { replace: true },
      );
    } catch (err: any) {
      setError(err.message || "ログインに失敗しました");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-workspace">
      <h2>ログイン</h2>
      <p className="patient-help">院内スタッフ用の管理画面</p>
      <form onSubmit={handleLogin}>
        <label>
          メールアドレス:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            disabled={busy}
          />
        </label>

        <label>
          パスワード:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={busy}
          />
        </label>

        {error && (
          <p className="patient-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy}>
          {busy ? "ログイン中…" : "ログイン"}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
