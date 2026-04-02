import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

interface User { id: number; name: string; email: string; role: string; is_active: boolean; created_at: string; }
const EMPTY = { name: '', email: '', password: '', role: 'viewer' };

export default function Users() {
  const { user: me } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { if (me?.role !== 'admin') navigate('/'); }, [me]);

  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');

  async function load() {
    try { setUsers(await api.getUsers()); } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api.createUser(form);
      setShowForm(false);
      setForm(EMPTY);
      load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); }
  }

  async function toggleActive(u: User) {
    try { await api.updateUser(u.id, { is_active: !u.is_active }); load(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); }
  }

  async function changeRole(u: User, role: string) {
    try { await api.updateUser(u.id, { role }); load(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this user?')) return;
    try { await api.deleteUser(id); load(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed'); }
  }

  const roleColor: Record<string, string> = { admin: '#4f46e5', analyst: '#0891b2', viewer: '#16a34a' };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.heading}>User Management</h2>
        <button style={styles.btnPrimary} onClick={() => setShowForm(true)}>+ New User</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ marginTop: 0 }}>Create User</h3>
            <form onSubmit={handleCreate}>
              {(['name', 'email', 'password'] as const).map(f => (
                <div key={f}>
                  <label style={styles.label}>{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                  <input style={styles.input} type={f === 'password' ? 'password' : 'text'} required value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
                </div>
              ))}
              <label style={styles.label}>Role</label>
              <select style={styles.input} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                <option value="viewer">Viewer</option>
                <option value="analyst">Analyst</option>
                <option value="admin">Admin</option>
              </select>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button style={styles.btnPrimary} type="submit">Create</button>
                <button style={styles.btnGhost} type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table style={styles.table}>
        <thead><tr>{['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u.id} style={i % 2 === 0 ? styles.rowEven : {}}>
              <td style={styles.td}>{u.name}</td>
              <td style={styles.td}>{u.email}</td>
              <td style={styles.td}>
                <select style={{ ...styles.roleSelect, color: roleColor[u.role] }} value={u.role} onChange={e => changeRole(u, e.target.value)} disabled={u.id === me?.id}>
                  <option value="viewer">Viewer</option>
                  <option value="analyst">Analyst</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
              <td style={styles.td}>
                <span style={{ ...styles.statusBadge, background: u.is_active ? '#dcfce7' : '#f3f4f6', color: u.is_active ? '#16a34a' : '#888' }}>
                  {u.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td style={styles.td}>
                <button style={styles.actionBtn} onClick={() => toggleActive(u)} disabled={u.id === me?.id}>
                  {u.is_active ? 'Deactivate' : 'Activate'}
                </button>
                {u.id !== me?.id && (
                  <button style={{ ...styles.actionBtn, background: '#fee2e2', color: '#dc2626' }} onClick={() => handleDelete(u.id)}>Delete</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24, maxWidth: 1000, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heading: { fontSize: 22, fontWeight: 700, margin: 0 },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 14px', background: '#f8f8f8', borderBottom: '2px solid #eee', fontWeight: 600, color: '#555' },
  td: { padding: '10px 14px', borderBottom: '1px solid #f5f5f5' },
  rowEven: { background: '#fafafa' },
  roleSelect: { border: 'none', background: 'transparent', fontWeight: 600, fontSize: 13, cursor: 'pointer' },
  statusBadge: { padding: '2px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600 },
  actionBtn: { marginRight: 6, padding: '4px 10px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  btnPrimary: { padding: '9px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  btnGhost: { padding: '8px 14px', background: '#f3f4f6', color: '#333', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: 12, padding: 28, width: 380, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#444' },
  input: { width: '100%', padding: '9px 11px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, marginBottom: 12, boxSizing: 'border-box' },
  error: { background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 },
};
