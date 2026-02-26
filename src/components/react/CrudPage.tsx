import { useState, useEffect, useCallback } from 'react';
import type { EntityConfig } from '../../lib/entity-config';
import { apiList, buildLookup } from '../../lib/api-client';
import CrudTable from './CrudTable';
import CrudForm from './CrudForm';
import DeleteConfirm from './DeleteConfirm';

interface Props {
  config: EntityConfig;
}

export default function CrudPage({ config }: Props) {
  const [records, setRecords] = useState<any[]>([]);
  const [lookups, setLookups] = useState<Record<string, Record<string, any>>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editRecord, setEditRecord] = useState<any>(null);
  const [deleteRecord, setDeleteRecord] = useState<any>(null);

  const relatedEntities = config.fields
    .filter(f => f.type === 'relationship' && f.relation)
    .map(f => f.relation!.entity);
  const uniqueRelated = [...new Set(relatedEntities)];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [mainResult, ...relResults] = await Promise.all([
        apiList(config.name),
        ...uniqueRelated.map(e => apiList(e)),
      ]);

      setRecords(mainResult.data);

      const newLookups: Record<string, Record<string, any>> = {};
      uniqueRelated.forEach((entity, i) => {
        newLookups[entity] = buildLookup(relResults[i].data);
      });
      setLookups(newLookups);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [config.name]);

  useEffect(() => { loadData(); }, [loadData]);

  const filtered = search
    ? records.filter(r => {
        const q = search.toLowerCase();
        return Object.values(r.data || {}).some(v =>
          v != null && String(v).toLowerCase().includes(q)
        );
      })
    : records;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <CrudTable
        config={config}
        records={filtered}
        lookups={lookups}
        search={search}
        onSearch={setSearch}
        onNew={() => { setEditRecord(null); setMode('create'); }}
        onEdit={(rec) => { setEditRecord(rec); setMode('edit'); }}
        onDelete={(rec) => setDeleteRecord(rec)}
      />

      {(mode === 'create' || mode === 'edit') && (
        <CrudForm
          config={config}
          record={mode === 'edit' ? editRecord : null}
          lookups={lookups}
          onClose={() => setMode('list')}
          onSaved={() => { setMode('list'); loadData(); }}
        />
      )}

      {deleteRecord && (
        <DeleteConfirm
          entityName={config.name}
          record={deleteRecord}
          onClose={() => setDeleteRecord(null)}
          onDeleted={() => { setDeleteRecord(null); loadData(); }}
        />
      )}
    </div>
  );
}
