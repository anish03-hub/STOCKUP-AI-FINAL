import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiAward, FiShoppingCart, FiLayers } from 'react-icons/fi';
import DataTable from '../../components/common/DataTable';
import { supplierApi } from '../../services/api';
import { useCurrency } from '../../context/useCurrency';
import '../../styles/suppliers/suppliers.css';

const CATEGORY_OPTIONS = [
  'All Categories',
  'Insulin [CS]',
  'General Medicine',
  'Penicillin-class Antibacterial [EPC]',
  'Corticosteroid Hormone Receptor Agonists [MoA]',
  'Anti-Inflammatory Agents',
  'Central Nervous System Stimulant [EPC]',
  'Angiotensin 2 Receptor Antagonists [MoA]',
  'Blood Coagulation Factor [EPC]',
  'Anti-epileptic Agent [EPC]',
  'G-Protein-linked Receptor Interactions [MoA]'
];

const SupplierList = () => {
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();
  const [view, setView] = useState('all'); // 'all' | 'recommended'
  const [suppliers, setSuppliers] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all suppliers and recommendations
  const loadData = async (cat = '') => {
    setLoading(true);
    setError('');
    try {
      const [all, recs] = await Promise.all([
        supplierApi.getAll(),
        supplierApi.recommend(cat && cat !== 'All Categories' ? cat : undefined, 15).catch(() => []),
      ]);
      setSuppliers(Array.isArray(all) ? all : []);
      setRecommendations(Array.isArray(recs) ? recs : []);
    } catch (err) {
      console.error('Failed to load suppliers:', err);
      setError('Failed to connect to supplier database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedCategory);
  }, [selectedCategory]);

  const handleDelete = async (row) => {
    if (!window.confirm(`Archive supplier "${row.name}"?`)) return;
    try {
      await supplierApi.delete(row.id);
      loadData(selectedCategory);
    } catch (err) {
      alert('Failed to archive supplier: ' + (err.message || 'Unknown error'));
    }
  };

  const handleCreatePOFromSupplier = useCallback((supplier) => {
    navigate('/purchase/new', {
      state: {
        supplierId: supplier.supplierId || supplier.id,
        supplierName: supplier.name,
        unitCost: supplier.unitCost,
        leadTimeDays: supplier.avgLeadTimeDays,
      }
    });
  }, [navigate]);

  const listColumns = useMemo(() => [
    { key: 'name', title: 'Distributor / Supplier', accessor: 'name', sortable: true },
    { key: 'contactPerson', title: 'Contact Person', accessor: 'contactPerson', sortable: true },
    { key: 'city', title: 'Location', accessor: 'city', sortable: true, render: (_val, row) => `${row.city || '—'}, ${row.state || ''}` },
    { key: 'unitCost', title: 'Unit Cost', accessor: 'unitCost', sortable: true, render: (val) => val != null ? formatCurrency(val) : '—' },
    { key: 'avgLeadTimeDays', title: 'Lead Time (d)', accessor: 'avgLeadTimeDays', sortable: true, render: (val) => val != null ? `${Number(val).toFixed(1)}d` : '—' },
    { key: 'performanceScore', title: 'Performance', accessor: 'performanceScore', sortable: true, render: (val) => val != null ? `${Number(val).toFixed(0)}/100` : '—' },
    { key: 'suppliedCategories', title: 'Supplied Categories', accessor: 'suppliedCategories', render: (val) => (
      <span className="text-muted" style={{ fontSize: '12px', maxWidth: '240px', display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={val}>
        {val || 'General Pharma'}
      </span>
    )},
    { key: 'status', title: 'Status', accessor: 'status', type: 'status', sortable: true },
    { key: 'actions', title: 'Actions', type: 'actions' },
  ], [formatCurrency]);

  const recColumns = useMemo(() => [
    { key: 'rank', title: 'Rank', accessor: 'rank', sortable: true, render: (val, row) => <strong style={{ color: row.rank === 1 ? '#d97706' : '#2563eb' }}>#{val}</strong> },
    { key: 'name', title: 'Distributor', accessor: 'name', sortable: true },
    { key: 'score', title: 'AI Score', accessor: 'score', sortable: true, render: (val) => <span className="badge-score"><strong>{Number(val).toFixed(1)}</strong></span> },
    { key: 'unitCost', title: 'Unit Cost', accessor: 'unitCost', sortable: true, render: (val) => val != null ? formatCurrency(val) : '—' },
    { key: 'avgLeadTimeDays', title: 'Lead Time', accessor: 'avgLeadTimeDays', sortable: true, render: (val, row) => val != null ? `${Number(val).toFixed(1)}d (±${Number(row.leadTimeStdDevDays || 0).toFixed(1)}d)` : '—' },
    { key: 'rawPerformanceScore', title: 'Performance', accessor: 'rawPerformanceScore', sortable: true, render: (val) => val != null ? `${Number(val).toFixed(0)}/100` : '—' },
    { key: 'reason', title: 'Recommendation Rationale', accessor: 'reason', render: (val) => <span style={{ fontSize: '12px', color: '#166534', background: '#dcfce7', padding: '3px 8px', borderRadius: '4px', display: 'inline-block' }}>{val}</span> },
    { key: 'poAction', title: 'Draft Order', render: (_val, row) => (
      <button
        type="button"
        className="btn-sm btn-primary"
        style={{ padding: '6px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        onClick={() => handleCreatePOFromSupplier(row)}
      >
        <FiShoppingCart /> Order
      </button>
    )},
  ], [handleCreatePOFromSupplier, formatCurrency]);

  return (
    <div className="suppliers-page">
      <div className="suppliers-header">
        <div>
          <h1>Pharmaceutical Supplier Network</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '4px 0 0 0' }}>
            Live distributor network mapped to FDA therapeutic categories with multi-criteria AI performance scoring.
          </p>
        </div>
        <div className="suppliers-controls">
          <button
            type="button"
            className={view === 'all' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setView('all')}
          >
            All Distributors ({suppliers.length})
          </button>
          <button
            type="button"
            className={view === 'recommended' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setView('recommended')}
          >
            <FiAward /> AI Recommended
          </button>
          <Link to="/suppliers/add" className="btn-primary">
            <FiPlus /> Add Supplier
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {loading && <div className="loading-state">Loading pharmaceutical distributors…</div>}

      {!loading && view === 'all' && (
        <DataTable
          data={suppliers}
          columns={listColumns}
          title="Distributor Network"
          subtitle="Track distributor reliability, average lead times, costs, and therapeutic catalog coverage"
          searchPlaceholder="Search suppliers by name, region, or category..."
          searchable
          filters={[
            { key: 'status', label: 'Status', defaultValue: 'All', options: [{ value: 'All', label: 'All Status' }, { value: 'Active', label: 'Active' }, { value: 'Inactive', label: 'Inactive' }] },
          ]}
          pageSize={10}
          actions={[
            { label: 'View', icon: <FiEye />, onClick: (row) => (window.location.href = `/suppliers/${row.id}`) },
            { label: 'Edit', icon: <FiEdit2 />, onClick: (row) => (window.location.href = `/suppliers/${row.id}/edit`) },
            { label: 'Draft PO', icon: <FiShoppingCart />, onClick: handleCreatePOFromSupplier },
            { label: 'Archive', icon: <FiTrash2 />, onClick: handleDelete },
          ]}
          statusMap={{ active: 'success', inactive: 'warning' }}
        />
      )}

      {!loading && view === 'recommended' && (
        <div>
          <div style={{
            background: 'var(--surface)',
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '16px',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiLayers style={{ color: '#2563eb', fontSize: '18px' }} />
              <label htmlFor="cat-filter" style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-primary)' }}>
                Filter by Therapeutic Category:
              </label>
              <select
                id="cat-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--input-border)',
                  background: 'var(--input-bg)',
                  color: 'var(--text-primary)',
                  fontSize: '14px',
                  outline: 'none'
                }}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat === 'All Categories' ? '' : cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Showing {recommendations.length} ranked distributors {selectedCategory ? `for "${selectedCategory}"` : 'across all categories'}
            </div>
          </div>

          <DataTable
            data={recommendations}
            columns={recColumns}
            title="AI-Ranked Distributor Recommendations"
            subtitle="Transparent multi-criteria weighting: Unit Cost (30%), Lead Time (25%), Lead-Time Reliability (20%), Performance (25%)"
            pageSize={10}
          />
        </div>
      )}
    </div>
  );
};

export default SupplierList;
