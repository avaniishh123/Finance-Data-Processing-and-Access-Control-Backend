import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(email, password);
      login(data.token, data.user);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h2 style={styles.title}>Finance Manager</h2>
        <p style={styles.sub}>Sign in to your account</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email</label>
          <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label style={styles.label}>Password</label>
          <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={styles.hint}>
          <strong>Demo accounts</strong><br />
          admin@example.com → <code>Admin@123</code><br />
          analyst@example.com → <code>Analyst@123</code><br />
          viewer@example.com → <code>Viewer@123</code>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' },
  card: { background: '#fff', padding: '2rem', borderRadius: 12, width: 360, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
  title: { margin: '0 0 4px', fontSize: 22, fontWeight: 700 },
  sub: { margin: '0 0 1.5rem', color: '#666', fontSize: 14 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#333' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, fontSize: 14, marginBottom: 14, boxSizing: 'border-box' },
  btn: { width: '100%', padding: '11px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  error: { background: '#fee2e2', color: '#b91c1c', padding: '10px 12px', borderRadius: 8, marginBottom: 14, fontSize: 13 },
  hint: { marginTop: 16, fontSize: 12, color: '#888', lineHeight: 1.6, background: '#f9f9f9', padding: '10px 12px', borderRadius: 8 },
};
