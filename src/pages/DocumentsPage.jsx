import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, FilePlus } from 'lucide-react';
import DocumentsDevis from './DocumentsDevis';
import DocumentsFactures from './DocumentsFactures';

export default function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'factures');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'devis' || tab === 'factures') setActiveTab(tab);
  }, [searchParams]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 50%, #E2E8F0 100%)',
      fontFamily: "'Nunito Sans', sans-serif",
      padding: '32px 24px',
    }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'linear-gradient(135deg, #5BA3C7, #3D7FA3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(91,163,199,0.3)',
          }}>
            <FileText size={22} color="#fff" strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0F172A', fontFamily: "'Cormorant Garamond', serif" }}>
              Générateur de documents
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Générez vos devis et factures</p>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 4, marginBottom: 28,
        background: 'rgba(15,23,42,0.06)', borderRadius: 12, padding: 4, width: 'fit-content',
      }}>
        {[
          { id: 'factures', label: 'Factures', icon: FileText },
          { id: 'devis',    label: 'Devis',    icon: FilePlus },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => switchTab(tab.id)} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 20px', borderRadius: 9, border: 'none',
              background: isActive ? '#fff' : 'transparent',
              color: isActive ? '#5BA3C7' : '#64748B',
              fontWeight: isActive ? 700 : 500, fontSize: 13, cursor: 'pointer',
              boxShadow: isActive ? '0 2px 8px rgba(15,23,42,0.1)' : 'none',
              transition: 'all 180ms ease', fontFamily: "'Nunito Sans', sans-serif",
            }}>
              <Icon size={15} strokeWidth={2} />{tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'factures' ? <DocumentsFactures /> : <DocumentsDevis />}
    </div>
  );
}
