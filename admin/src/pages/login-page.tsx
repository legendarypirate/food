import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Phone } from 'lucide-react';
import { DEMO_LOGIN, isAuthenticated, saveAuth } from '@/lib/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo =
    (location.state as { from?: string } | null)?.from?.startsWith('/admin')
      ? (location.state as { from: string }).from
      : '/admin';

  const [phone, setPhone] = useState(DEMO_LOGIN.phone);
  const [password, setPassword] = useState(DEMO_LOGIN.password);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated()) {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Нэвтрэхэд алдаа гарлаа');
      }
      const data = await res.json();
      saveAuth({ token: data.token, user: data.user });
      navigate(redirectTo, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Нэвтрэхэд алдаа гарлаа');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-root">
      {/* background blobs */}
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />

      <div className="login-card">
        {/* logo */}
        <div className="login-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src="/logoo.jpeg" alt="foody" className="login-logo-img" />
          <span className="login-logo-text">foody</span>
        </div>

        <p className="login-admin-tag">Админ хэсэг</p>
        <h1 className="login-title">Системд нэвтрэх</h1>
        <p className="login-sub">Зөвхөн эрх бүхий ажилтнуудад зориулсан</p>

        <div className="login-demo-box">
          <p className="login-demo-title">Demo нэвтрэх</p>
          <p>
            Утас: <strong>{DEMO_LOGIN.phone}</strong>
          </p>
          <p>
            Нууц үг: <strong>{DEMO_LOGIN.password}</strong>
          </p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="phone">Утасны дугаар</label>
            <div className="login-input-wrap">
              <Phone size={16} className="login-input-icon" />
              <input
                id="phone"
                type="tel"
                placeholder="99001122"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="password">Нууц үг</label>
            <div className="login-input-wrap">
              <Lock size={16} className="login-input-icon" />
              <input
                id="password"
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-pw-toggle"
                onClick={() => setShowPw((v) => !v)}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="login-submit"
            disabled={loading}
          >
            {loading ? (
              <span className="login-spinner" />
            ) : (
              'Нэвтрэх'
            )}
          </button>
        </form>

        <p className="login-back">
          <button onClick={() => navigate('/')}>← Нүүр хуудас руу буцах</button>
        </p>
      </div>
    </div>
  );
}
