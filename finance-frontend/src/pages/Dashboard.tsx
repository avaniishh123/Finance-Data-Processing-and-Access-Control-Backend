import { useEffect, useState } from 'react';
import { api } from '../api';

interface Summary { total_income: number; total_expenses: number; net_balance: number; }
interface CategoryRow { category: string; type: string; total: number; count: number; }
interface RecentRow { id: number; amount: number; type: string; category: string; date: string; created_by: string; }

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getSummary(), api.getByCategory(), api.getRecent()])
      .then(([s, c, r]) => { setSummary(s); setCategories(c); setRecent(r); })
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div style={styles.error}>{error}</div>;
  if (!summary) return <div style={styles.loading}>Loading...</div>;

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Dashboard</h2>

      {/* Summary cards */}
      <div style={styles.cards}>
        <div style={{ ...styles.card, borderTop: '4px solid #16a34a' }}>
          <div style={styles.cardLabel}>Total Income</div>
          <div style={{ ...styles.cardValue, color: '#16a34a' }}>{fmt(summary.total_income)}</div>
        </div>
        <div style={{ ...styles.card, borderTop: '4px solid #dc2626' }}>
          <div style={styles.cardLabel}>Total Expenses</div>
          <div style={{ ...styles.cardValue, color: '#dc2626' }}>{fmt(summary.total_expenses)}</div>
        </div>
        <div style={{ ...styles.card, borderTop: `4px solid ${summary.net_balance >= 0 ? '#4f46e5' : '#f59e0b'}` }}>
          <div style={styles.cardLabel}>Net Balance</div>
          <div style={{ ...styles.cardValue, color: summary.net_balance >= 0 ? '#4f46e5' : '#f59e0b' }}>{fmt(summary.net_balance)}</div>
        </div>
      </div>

      <div style={styles.row}>
        {/* By category */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>By Category</h3>
          {categories.length === 0 ? <p style={styles.empty}>No data yet.</p> : (
            <table style={styles.table}>
              <thead><tr>{['Category', 'Type', 'Total', 'Count'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr></thead>
              <tbody>
                {categories.map((c, i) => (
                  <tr key={i} style={i % 2 === 0 ? styles.rowEven : {}}>
                    <td style={styles.td}>{c.category}</td>
                    <td style={styles.td}><span style={{ ...styles.typeBadge, background: c.type === 'income' ? '#dcfce7' : '#fee2e2', color: c.type === 'income' ? '#16a34a' : '#dc2626' }}>{c.type}</span></td>
                    <td style={styles.td}>{fmt(c.total)}</td>
                    <td style={styles.td}>{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent activity */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Recent Activity</h3>
          {recent.length === 0 ? <p style={styles.empty}>No records yet.</p> : (
            <div style={styles.recentList}>
              {recent.map(r => (
                <div key={r.id} style={styles.recentItem}>
                  <div>
                    <div style={styles.recentCat}>{r.category}</div>
                    <div style={styles.recentMeta}>{r.date} · {r.created_by}</div>
                  </div>
                  <div style={{ color: r.type === 'income' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                    {r.type === 'income' ? '+' : '-'}{fmt(r.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { padding: '24px', maxWidth: 1100, margin: '0 auto' },
  heading: { fontSize: 22, fontWeight: 700, marginBottom: 20 },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 },
  card: { background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' },
  cardLabel: { fontSize: 13, color: '#666', marginBottom: 6 },
  cardValue: { fontSize: 26, fontWeight: 700 },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  section: { background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' },
  sectionTitle: { fontSize: 15, fontWeight: 700, marginBottom: 14, marginTop: 0 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #f0f0f0', color: '#555', fontWeight: 600 },
  td: { padding: '8px 10px', borderBottom: '1px solid #f5f5f5' },
  rowEven: { background: '#fafafa' },
  typeBadge: { padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 },
  recentList: { display: 'flex', flexDirection: 'column', gap: 10 },
  recentItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#fafafa', borderRadius: 8 },
  recentCat: { fontWeight: 600, fontSize: 14 },
  recentMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  error: { padding: 20, color: '#dc2626' },
  loading: { padding: 20, color: '#888' },
  empty: { color: '#aaa', fontSize: 13 },
};
