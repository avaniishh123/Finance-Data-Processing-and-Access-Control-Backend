import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

interface FinancialRecord { id: number; amount: number; type: string; category: string; date: string; notes: string; created_by_name: string; }

const EMPTY_FORM = { amount: '', type: 'income', category: '', date: '', notes: '' };

export default function Records() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isAnalyst = user?.role === 'analyst';
  const isViewer = user?.role === 'viewer';

  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20 });
  const [filters, setFilters] = useState({ type: '', category: '', date_from: '', date_to: '' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function load(page = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filters.type) params.set('type', filters.type);
      if (filters.category) params.set('category', filters.category);
      if (filters.date_from) params.set('date_from', filters.date_from);
      if (filters.date_to) params.set('date_to', filters.date_to);
      const data = await api.getRecords('?' + params.toString());
      setRecords(data.data);
      setPagination(data.pagination);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editId) {
        await api.updateRecord(editId, form);
      } else {
        await api.createRecord(form);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      setEditId(null);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this record?')) return;
    try {
      await api.deleteRecord(id);
      load(pagination.page);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    }
  }

  function openEdit(r: FinancialRecord) {
    setForm({ amount: String(r.amount), type: r.type, category: r.category, date: r.date, notes: r.notes || '' });
    setEditId(r.id);
    setShowForm(true);
  }

  const fmt = (n: number) => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.heading}>Financial Records</h2>
        {isAdmin && (
          <button style={styles.btnPrimary} onClick={() => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); }}>
            + New Record
          </button>
        )}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Role access banner for non-admins */}
      {isViewer && (
        <div style={styles.roleBanner}>
          🔒 Viewer access — read only. You can view and filter records but cannot create, edit, or delete.
        </div>
      )}
      {isAnalyst && (
        <div style={{ ...styles.roleBanner, background: '#e0f2fe', color: '#0369a1', borderColor: '#7dd3fc' }}>
          📊 Analyst access — read only. You can view records and dashboard insights but cannot modify data.
        </div>
      )}

      {/* Filters */}
      <div style={styles.filters}>
        <select style={styles.select} value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <input style={styles.input} placeholder="Category..." value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} />
        <input style={styles.input} type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
        <input style={styles.input} type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
        <button style={styles.btnSecondary} onClick={() => load(1)}>Filter</button>
        <button style={styles.btnGhost} onClick={() => { setFilters({ type: '', category: '', date_from: '', date_to: '' }); setTimeout(() => load(1), 0); }}>Clear</button>
      </div>

      {/* Modal form */}
      {showForm && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ marginTop: 0 }}>{editId ? 'Edit Record' : 'New Record'}</h3>
            <form onSubmit={handleSubmit}>
              <label style={styles.label}>Amount</label>
              <input style={styles.modalInput} type="number" step="0.01" min="0.01" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              <label style={styles.label}>Type</label>
              <select style={styles.modalInput} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <label style={styles.label}>Category</label>
              <input style={styles.modalInput} required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              <label style={styles.label}>Date</label>
              <input style={styles.modalInput} type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              <label style={styles.label}>Notes</label>
              <textarea style={{ ...styles.modalInput, height: 70, resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button style={styles.btnPrimary} type="submit">Save</button>
                <button style={styles.btnGhost} type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? <div style={styles.loading}>Loading...</div> : (
        <>
          <table style={styles.table}>
            <thead>
              <tr>{['Date', 'Category', 'Type', 'Amount', 'Notes', 'Created By', ...(isAdmin ? ['Actions'] : [])].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: '#aaa' }}>No records found.</td></tr>
              ) : records.map((r, i) => (
                <tr key={r.id} style={i % 2 === 0 ? styles.rowEven : {}}>
                  <td style={styles.td}>{r.date}</td>
                  <td style={styles.td}>{r.category}</td>
                  <td style={styles.td}><span style={{ ...styles.badge, background: r.type === 'income' ? '#dcfce7' : '#fee2e2', color: r.type === 'income' ? '#16a34a' : '#dc2626' }}>{r.type}</span></td>
                  <td style={{ ...styles.td, fontWeight: 600, color: r.type === 'income' ? '#16a34a' : '#dc2626' }}>{fmt(r.amount)}</td>
                  <td style={{ ...styles.td, color: '#888', fontSize: 12 }}>{r.notes || '—'}</td>
                  <td style={styles.td}>{r.created_by_name}</td>
                  {isAdmin && (
                    <td style={styles.td}>
                      <button style={styles.editBtn} onClick={() => openEdit(r)}>Edit</button>
                      <button style={styles.deleteBtn} onClick={() => handleDelete(r.id)}>Delete</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {/* Pagination */}
          <div style={styles.pagination}>
            <span style={{ fontSize: 13, color: '#666' }}>{pagination.total} records</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {Array.from({ length: Math.ceil(pagination.total / pagination.limit) }, (_, i) => i + 1).map(p => (
                <button key={p} style={{ ...styles.pageBtn, ...(p === pagination.page ? styles.pageBtnActive : {}) }} onClick={() => load(p)}>{p}</button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: 24, maxWidth: 1100, margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heading: { fontSize: 22, fontWeight: 700, margin: 0 },
  filters: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  select: { padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13 },
  input: { padding: '8px 10px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13 },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', fontSize: 13 },
  th: { textAlign: 'left', padding: '10px 14px', background: '#f8f8f8', borderBottom: '2px solid #eee', fontWeight: 600, color: '#555' },
  td: { padding: '10px 14px', borderBottom: '1px solid #f5f5f5' },
  rowEven: { background: '#fafafa' },
  badge: { padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 },
  editBtn: { marginRight: 6, padding: '4px 10px', background: '#e0e7ff', color: '#4f46e5', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  deleteBtn: { padding: '4px 10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 },
  btnPrimary: { padding: '9px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  btnSecondary: { padding: '8px 14px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  btnGhost: { padding: '8px 14px', background: '#f3f4f6', color: '#333', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { background: '#fff', borderRadius: 12, padding: 28, width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#444' },
  modalInput: { width: '100%', padding: '9px 11px', border: '1px solid #ddd', borderRadius: 8, fontSize: 13, marginBottom: 12, boxSizing: 'border-box' },
  pagination: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 },
  pageBtn: { padding: '5px 10px', border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: 'pointer', fontSize: 13 },
  pageBtnActive: { background: '#4f46e5', color: '#fff', borderColor: '#4f46e5' },
  error: { background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 },
  roleBanner: { padding: '10px 14px', background: '#fef9c3', color: '#854d0e', border: '1px solid #fde047', borderRadius: 8, marginBottom: 14, fontSize: 13 },
  loading: { padding: 20, color: '#888' },
};
