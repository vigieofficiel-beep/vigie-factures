import { useState, useEffect } from 'react';
import { supabasePro } from '../lib/supabasePro';
import { jsPDF } from 'jspdf';
import {
  Plus, Trash2, Edit2, CheckCircle, AlertTriangle, Download,
  Users, FileText, TrendingUp, RefreshCw, FileDown, Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ExportButton from '../components/ExportButton';

const ACCENT = '#5BA3C7';
const formatEuro = (n) => n == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const daysUntil = (dateStr) => { if (!dateStr) return null; return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24)); };

const STATUTS = [
  { id: 'brouillon',  label: 'Brouillon',  color: '#9AA0AE', bg: '#F0F2F5' },
  { id: 'envoye',     label: 'Envoyé',      color: '#5BA3C7', bg: 'rgba(91,163,199,0.1)' },
  { id: 'signe',      label: 'Signé',       color: '#5BC78A', bg: 'rgba(91,199,138,0.1)' },
  { id: 'encaisse',   label: 'Encaissé',    color: '#A85BC7', bg: 'rgba(168,91,199,0.1)' },
  { id: 'en_retard',  label: 'En retard',   color: '#C75B4E', bg: 'rgba(199,91,78,0.1)' },
  { id: 'annule',     label: 'Annulé',      color: '#D0D4DC', bg: '#F8F9FB' },
];

function genererPDF(devis, client, profil, lignes) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210; const M = 20;
  const bleu = [91, 163, 199]; const dark = [15, 23, 42]; const gray = [100, 116, 139]; const light = [226, 232, 240];
  doc.setFillColor(...bleu); doc.rect(0, 0, W, 38, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(255,255,255);
  doc.text('DEVIS', M, 18);
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(`N° ${devis.numero}`, M, 26); doc.text(`Émis le ${formatDate(devis.date_emission)}`, M, 32);
  doc.setFont('helvetica', 'bold'); doc.text(`Valable jusqu'au`, W - M - 55, 26);
  doc.setFont('helvetica', 'normal'); doc.text(formatDate(devis.date_validite), W - M - 55, 32);
  let y = 50;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...bleu);
  doc.text('ÉMETTEUR', M, y); y += 5;
  doc.setTextColor(...dark); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text(profil.company_name || `${profil.first_name||''} ${profil.last_name||''}`.trim() || 'Non renseigné', M, y); y += 5;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
  if (profil.forme_juridique) { doc.text(profil.forme_juridique, M, y); y += 4; }
  if (profil.adresse) { doc.text(profil.adresse, M, y); y += 4; }
  if (profil.code_postal || profil.ville) { doc.text(`${profil.code_postal||''} ${profil.ville||''}`.trim(), M, y); y += 4; }
  if (profil.siret) { doc.text(`SIRET : ${profil.siret}`, M, y); y += 4; }
  if (profil.tva_intracommunautaire) { doc.text(`TVA : ${profil.tva_intracommunautaire}`, M, y); y += 4; }
  if (profil.phone) { doc.text(`Tél : ${profil.phone}`, M, y); y += 4; }
  let yc = 50; const xc = W / 2 + 5;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...bleu);
  doc.text('CLIENT', xc, yc); yc += 5;
  doc.setTextColor(...dark); doc.setFontSize(11); doc.setFont('helvetica', 'bold');
  doc.text(client.nom || 'Client', xc, yc); yc += 5;
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
  if (client.email) { doc.text(client.email, xc, yc); yc += 4; }
  if (client.telephone) { doc.text(client.telephone, xc, yc); yc += 4; }
  if (client.adresse) { doc.text(client.adresse, xc, yc); yc += 4; }
  if (client.siret) { doc.text(`SIRET : ${client.siret}`, xc, yc); yc += 4; }
  y = Math.max(y, yc) + 8;
  doc.setDrawColor(...light); doc.setLineWidth(0.3); doc.line(M, y, W-M, y); y += 8;
  doc.setFillColor(...bleu); doc.rect(M, y, W-M*2, 8, 'F');
  doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(8);
  const cols = { desc: M+2, qty: 120, pu: 142, tva: 162, ttc: 182 };
  doc.text('Description', cols.desc, y+5.5); doc.text('Qté', cols.qty, y+5.5);
  doc.text('P.U. HT', cols.pu, y+5.5); doc.text('TVA', cols.tva, y+5.5); doc.text('Total TTC', cols.ttc, y+5.5); y += 8;
  let totalHT = 0; let totalTVA = 0;
  lignes.forEach((l, i) => {
    const ht = (l.quantite||0)*(l.prix_unitaire||0); const tva = ht*(l.tva_taux||20)/100; const ttc = ht+tva;
    totalHT += ht; totalTVA += tva;
    doc.setFillColor(i%2===0?248:255, i%2===0?250:255, i%2===0?252:255);
    doc.rect(M, y, W-M*2, 7, 'F');
    doc.setTextColor(...dark); doc.setFont('helvetica','normal'); doc.setFontSize(8.5);
    doc.text((l.description||'').substring(0,55), cols.desc, y+4.5);
    doc.text(String(l.quantite||1), cols.qty, y+4.5);
    doc.text(`${Number(l.prix_unitaire||0).toFixed(2)} €`, cols.pu, y+4.5);
    doc.text(`${l.tva_taux||20}%`, cols.tva, y+4.5);
    doc.text(`${ttc.toFixed(2)} €`, cols.ttc, y+4.5); y += 7;
  });
  y += 4; doc.setDrawColor(...light); doc.line(M, y, W-M, y); y += 6;
  const xTot = W-M-60;
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(...gray);
  doc.text('Total HT :', xTot, y); doc.setTextColor(...dark); doc.text(`${totalHT.toFixed(2)} €`, W-M-2, y, {align:'right'}); y+=6;
  doc.setTextColor(...gray); doc.text('TVA :', xTot, y); doc.setTextColor(...dark); doc.text(`${totalTVA.toFixed(2)} €`, W-M-2, y, {align:'right'}); y+=2;
  doc.setFillColor(...bleu); doc.rect(xTot-4, y, W-M-xTot+6, 9, 'F');
  doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(10);
  doc.text('TOTAL TTC :', xTot, y+6); doc.text(`${(totalHT+totalTVA).toFixed(2)} €`, W-M-2, y+6, {align:'right'}); y+=16;
  doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...gray);
  if (devis.date_echeance) { doc.text(`Conditions de paiement : échéance au ${formatDate(devis.date_echeance)}`, M, y); y+=5; }
  if (profil.iban) { doc.text(`IBAN : ${profil.iban}`, M, y); y+=5; }
  if (devis.notes) { y+=3; doc.setFontSize(8); doc.text(`Notes : ${devis.notes}`, M, y); y+=5; }
  y+=8; doc.setDrawColor(...light); doc.line(M, y, W-M, y); y+=5;
  doc.setFontSize(7.5); doc.setTextColor(...gray);
  doc.text("Devis sans engagement — valable jusqu'à la date de validité indiquée.", M, y); y+=4;
  doc.text('En cas d\'acceptation, retourner ce document signé avec la mention "Bon pour accord".', M, y); y+=4;
  if (profil.siret) doc.text(`${profil.company_name||''} — SIRET ${profil.siret}`, M, y);
  doc.save(`devis-${devis.numero}.pdf`);
}

function LignesPrestation({ lignes, setLignes }) {
  const addLigne = () => setLignes(l => [...l, { description:'', quantite:1, prix_unitaire:'', tva_taux:20 }]);
  const removeLigne = (i) => setLignes(l => l.filter((_,idx) => idx!==i));
  const updateLigne = (i,k,v) => setLignes(l => l.map((item,idx) => idx===i ? {...item,[k]:v} : item));
  const inputS = { padding:'8px 10px', borderRadius:7, border:'1px solid #E2E8F0', background:'#F8FAFC', fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' };
  const totalHT  = lignes.reduce((s,l) => s+(Number(l.quantite)||0)*(Number(l.prix_unitaire)||0), 0);
  const totalTVA = lignes.reduce((s,l) => s+(Number(l.quantite)||0)*(Number(l.prix_unitaire)||0)*(Number(l.tva_taux)||20)/100, 0);
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <label style={{fontSize:11,fontWeight:600,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.05em'}}>Lignes de prestation *</label>
        <button type="button" onClick={addLigne} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,color:ACCENT,background:`${ACCENT}12`,border:`1px solid ${ACCENT}30`,borderRadius:7,padding:'4px 10px',cursor:'pointer'}}>
          <Plus size={11}/> Ajouter une ligne
        </button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'3fr 0.6fr 1fr 0.8fr 1fr 28px',gap:6,marginBottom:6,padding:'0 4px'}}>
        {['Description','Qté','P.U. HT (€)','TVA (%)','Total TTC',''].map(h => <span key={h} style={{fontSize:10,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</span>)}
      </div>
      {lignes.map((l,i) => {
        const ht=(Number(l.quantite)||0)*(Number(l.prix_unitaire)||0); const ttc=ht*(1+(Number(l.tva_taux)||20)/100);
        return (
          <div key={i} style={{display:'grid',gridTemplateColumns:'3fr 0.6fr 1fr 0.8fr 1fr 28px',gap:6,marginBottom:6,alignItems:'center'}}>
            <input value={l.description} onChange={e=>updateLigne(i,'description',e.target.value)} style={inputS} placeholder="Description de la prestation"/>
            <input type="number" min="1" value={l.quantite} onChange={e=>updateLigne(i,'quantite',e.target.value)} style={inputS}/>
            <input type="number" step="0.01" min="0" value={l.prix_unitaire} onChange={e=>updateLigne(i,'prix_unitaire',e.target.value)} style={inputS} placeholder="0.00"/>
            <select value={l.tva_taux} onChange={e=>updateLigne(i,'tva_taux',e.target.value)} style={{...inputS,cursor:'pointer'}}>
              <option value="0">0%</option><option value="5.5">5,5%</option><option value="10">10%</option><option value="20">20%</option>
            </select>
            <span style={{fontSize:12,fontWeight:700,color:ACCENT,textAlign:'right'}}>{ttc.toFixed(2)} €</span>
            <button type="button" onClick={()=>removeLigne(i)} disabled={lignes.length===1} style={{background:'none',border:'none',cursor:lignes.length===1?'not-allowed':'pointer',color:'#D0D4DC',padding:0,display:'flex'}} onMouseEnter={e=>{if(lignes.length>1)e.currentTarget.style.color='#C75B4E'}} onMouseLeave={e=>e.currentTarget.style.color='#D0D4DC'}><Trash2 size={13}/></button>
          </div>
        );
      })}
      <div style={{marginTop:10,padding:'10px 14px',background:'#F8FAFC',borderRadius:9,border:'1px solid #E2E8F0',display:'flex',justifyContent:'flex-end',gap:24}}>
        <span style={{fontSize:12,color:'#94A3B8'}}>HT : <strong style={{color:'#0F172A'}}>{totalHT.toFixed(2)} €</strong></span>
        <span style={{fontSize:12,color:'#94A3B8'}}>TVA : <strong style={{color:'#0F172A'}}>{totalTVA.toFixed(2)} €</strong></span>
        <span style={{fontSize:13,color:ACCENT,fontWeight:800}}>TTC : {(totalHT+totalTVA).toFixed(2)} €</span>
      </div>
    </div>
  );
}

function ClientForm({ onSave, onCancel }) {
  const [form, setForm] = useState({nom:'',email:'',telephone:'',adresse:'',siret:''});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set=(k)=>(e)=>setForm(f=>({...f,[k]:e.target.value}));
  const iS={width:'100%',padding:'9px 12px',borderRadius:8,background:'#F8F9FB',border:'1px solid #E8EAF0',color:'#1A1C20',fontSize:13,outline:'none',boxSizing:'border-box'};
  const lS={fontSize:11,fontWeight:600,color:'#5A6070',marginBottom:5,display:'block'};
  const handleSubmit=async(e)=>{e.preventDefault();setLoading(true);try{const{data:{user}}=await supabasePro.auth.getUser();const{error:err}=await supabasePro.from('clients').insert({...form,user_id:user.id});if(err)throw err;onSave();}catch(err){setError(err.message);}setLoading(false);};
  return (
    <form onSubmit={handleSubmit} style={{background:'#fff',border:'1px solid #E8EAF0',borderRadius:14,padding:24,marginBottom:24,boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
      <h3 style={{fontSize:15,fontWeight:700,color:'#1A1C20',marginBottom:20}}>Nouveau client</h3>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <div><label style={lS}>Nom / Raison sociale *</label><input value={form.nom} onChange={set('nom')} required style={iS} placeholder="Ex: SARL Dupont"/></div>
        <div><label style={lS}>Email *</label><input type="email" value={form.email} onChange={set('email')} required style={iS} placeholder="contact@client.fr"/></div>
        <div><label style={lS}>Téléphone</label><input value={form.telephone} onChange={set('telephone')} style={iS} placeholder="06 00 00 00 00"/></div>
        <div><label style={lS}>SIRET</label><input value={form.siret} onChange={set('siret')} style={iS} placeholder="000 000 000 00000"/></div>
      </div>
      <div style={{marginBottom:16}}><label style={lS}>Adresse</label><input value={form.adresse} onChange={set('adresse')} style={iS} placeholder="1 rue de la Paix, 75001 Paris"/></div>
      {error&&<div style={{color:'#C75B4E',fontSize:12,marginBottom:12}}>{error}</div>}
      <div style={{display:'flex',gap:10}}>
        <button type="submit" disabled={loading} style={{flex:1,padding:'10px',borderRadius:9,border:'none',background:ACCENT,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>{loading?'Enregistrement...':'✓ Enregistrer le client'}</button>
        <button type="button" onClick={onCancel} style={{padding:'10px 18px',borderRadius:9,border:'1px solid #E8EAF0',background:'#fff',color:'#5A6070',fontSize:13,cursor:'pointer'}}>Annuler</button>
      </div>
    </form>
  );
}

function DevisForm({ clients, onSave, onCancel, editData=null }) {
  const today=new Date().toISOString().split('T')[0];
  const in30=new Date(Date.now()+30*86400000).toISOString().split('T')[0];
  const [form,setForm]=useState(editData||{client_id:'',numero:`DEV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-001`,date_emission:today,date_validite:in30,date_echeance:in30,statut:'brouillon',notes:''});
  const [lignes,setLignes]=useState(()=>{if(editData?.description){try{return JSON.parse(editData.description);}catch{}}return[{description:'',quantite:1,prix_unitaire:'',tva_taux:20}];});
  const [loading,setLoading]=useState(false);const[error,setError]=useState('');
  const set=(k)=>(e)=>setForm(f=>({...f,[k]:e.target.value}));
  const totalHT=lignes.reduce((s,l)=>s+(Number(l.quantite)||0)*(Number(l.prix_unitaire)||0),0);
  const totalTVA=lignes.reduce((s,l)=>s+(Number(l.quantite)||0)*(Number(l.prix_unitaire)||0)*(Number(l.tva_taux)||20)/100,0);
  const handleSubmit=async(e)=>{e.preventDefault();setLoading(true);try{const{data:{user}}=await supabasePro.auth.getUser();const payload={...form,user_id:user.id,montant_ht:totalHT,tva_taux:lignes[0]?.tva_taux||20,montant_ttc:totalHT+totalTVA,description:JSON.stringify(lignes)};if(editData?.id){const{error:err}=await supabasePro.from('devis').update(payload).eq('id',editData.id);if(err)throw err;}else{const{error:err}=await supabasePro.from('devis').insert(payload);if(err)throw err;}onSave();}catch(err){setError(err.message);}setLoading(false);};
  const iS={width:'100%',padding:'9px 12px',borderRadius:8,background:'#F8F9FB',border:'1px solid #E8EAF0',color:'#1A1C20',fontSize:13,outline:'none',boxSizing:'border-box'};
  const lS={fontSize:11,fontWeight:600,color:'#5A6070',marginBottom:5,display:'block'};
  return (
    <form onSubmit={handleSubmit} style={{background:'#fff',border:'1px solid #E8EAF0',borderRadius:14,padding:24,marginBottom:24,boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
      <h3 style={{fontSize:15,fontWeight:700,color:'#1A1C20',marginBottom:20}}>{editData?'Modifier le devis':'Nouveau devis'}</h3>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <div><label style={lS}>Client *</label><select value={form.client_id} onChange={set('client_id')} required style={{...iS,cursor:'pointer'}}><option value="">Sélectionner un client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
        <div><label style={lS}>Numéro de devis *</label><input value={form.numero} onChange={set('numero')} required style={iS}/></div>
        <div><label style={lS}>Date d'émission *</label><input type="date" value={form.date_emission} onChange={set('date_emission')} required style={{...iS,colorScheme:'light'}}/></div>
        <div><label style={lS}>Date de validité</label><input type="date" value={form.date_validite} onChange={set('date_validite')} style={{...iS,colorScheme:'light'}}/></div>
        <div><label style={lS}>Échéance paiement</label><input type="date" value={form.date_echeance} onChange={set('date_echeance')} style={{...iS,colorScheme:'light'}}/></div>
        <div><label style={lS}>Statut</label><select value={form.statut} onChange={set('statut')} style={{...iS,cursor:'pointer'}}>{STATUTS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
      </div>
      <LignesPrestation lignes={lignes} setLignes={setLignes}/>
      <div style={{marginBottom:14}}><label style={lS}>Notes internes</label><input value={form.notes} onChange={set('notes')} style={iS} placeholder="Commentaires internes (non visibles sur le devis)"/></div>
      <div style={{background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:8,padding:'8px 12px',marginBottom:16,fontSize:11,color:'#92400E'}}>⚠️ Les montants sont indicatifs. Validez avec votre expert-comptable avant envoi.</div>
      {error&&<div style={{color:'#C75B4E',fontSize:12,marginBottom:12}}>{error}</div>}
      <div style={{display:'flex',gap:10}}>
        <button type="submit" disabled={loading} style={{flex:1,padding:'11px',borderRadius:9,border:'none',background:loading?`${ACCENT}50`:ACCENT,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>{loading?'Enregistrement...':'✓ Enregistrer le devis'}</button>
        <button type="button" onClick={onCancel} style={{padding:'11px 18px',borderRadius:9,border:'1px solid #E8EAF0',background:'#fff',color:'#5A6070',fontSize:13,cursor:'pointer'}}>Annuler</button>
      </div>
    </form>
  );
}

export default function RecettesPage() {
  const [tab,setTab]=useState('devis');
  const [devis,setDevis]=useState([]);
  const [clients,setClients]=useState([]);
  const [profil,setProfil]=useState({});
  const [loading,setLoading]=useState(true);
  const [showDevisForm,setShowDevisForm]=useState(false);
  const [showClientForm,setShowClientForm]=useState(false);
  const [editDevis,setEditDevis]=useState(null);
  const [filterStatut,setFilterStatut]=useState('tous');
  const navigate=useNavigate();

  useEffect(()=>{fetchAll();},[]);

  const fetchAll=async()=>{
    setLoading(true);
    const{data:{user}}=await supabasePro.auth.getUser();
    if(!user)return;
    const[{data:d},{data:c},{data:p}]=await Promise.all([
      supabasePro.from('devis').select('*, clients(nom,email,telephone,adresse,siret)').eq('user_id',user.id).order('date_emission',{ascending:false}),
      supabasePro.from('clients').select('*').eq('user_id',user.id).order('nom'),
      supabasePro.from('user_profiles').select('*').eq('id',user.id).single(),
    ]);
    setDevis(d||[]);setClients(c||[]);setProfil(p||{});setLoading(false);
  };

  const deleteDevis=async(id)=>{if(!confirm('Supprimer ce devis ?'))return;await supabasePro.from('devis').delete().eq('id',id);fetchAll();};
  const deleteClient=async(id)=>{if(!confirm('Supprimer ce client ?'))return;await supabasePro.from('clients').delete().eq('id',id);fetchAll();};
  const changerStatut=async(id,statut)=>{await supabasePro.from('devis').update({statut}).eq('id',id);fetchAll();};
  const envoyerRelance=async(d)=>{const count=(d.relance_count||0)+1;await supabasePro.from('devis').update({relance_count:count,derniere_relance:new Date().toISOString().split('T')[0]}).eq('id',d.id);await supabasePro.from('reminders').insert({user_id:d.user_id,context:'pro',type:'relance',message:`Relance ${count} — ${d.clients?.nom} — devis ${d.numero} (${formatEuro(d.montant_ttc)})`,sent_at:new Date().toISOString()});alert(`Relance ${count} enregistrée pour ${d.clients?.nom}`);fetchAll();};
  const telechargerPDF=(d)=>{if(!profil.company_name&&!profil.first_name){alert('Renseignez votre profil pro avant de générer un devis');return;}let lignes=[{description:d.description||'',quantite:1,prix_unitaire:d.montant_ht||0,tva_taux:d.tva_taux||20}];try{lignes=JSON.parse(d.description);}catch{}genererPDF(d,d.clients||{},profil,lignes);};

  const filtered=filterStatut==='tous'?devis:devis.filter(d=>d.statut===filterStatut);
  const totalSigne=devis.filter(d=>d.statut==='signe').reduce((s,d)=>s+(d.montant_ttc||0),0);
  const totalEncaisse=devis.filter(d=>d.statut==='encaisse').reduce((s,d)=>s+(d.montant_ttc||0),0);
  const enRetard=devis.filter(d=>(d.statut==='signe'||d.statut==='envoye')&&daysUntil(d.date_echeance)!==null&&daysUntil(d.date_echeance)<0);
  const profilIncomplet=!profil.company_name&&!profil.first_name;

  // Données aplaties pour export
  const devisExport = filtered.map(d => ({
    numero: d.numero,
    client: d.clients?.nom || '',
    date_emission: d.date_emission,
    date_echeance: d.date_echeance,
    montant_ht: d.montant_ht,
    tva_taux: d.tva_taux,
    montant_ttc: d.montant_ttc,
    statut: d.statut,
    relances: d.relance_count || 0,
  }));

  return (
    <div style={{fontFamily:"'Nunito Sans', sans-serif",padding:'32px 28px',maxWidth:1000,margin:'0 auto'}}>
      {profilIncomplet&&(<div onClick={()=>navigate('/pro/profil')} style={{display:'flex',alignItems:'center',gap:10,background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:10,padding:'10px 16px',marginBottom:20,cursor:'pointer'}}><AlertTriangle size={14} color="#F59E0B"/><span style={{fontSize:12,color:'#92400E',fontWeight:600}}>Profil pro incomplet — vos PDF ne seront pas correctement remplis.</span><span style={{fontSize:12,color:'#F59E0B',fontWeight:700,marginLeft:'auto'}}>Compléter →</span></div>)}

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:26,fontWeight:600,color:'#1A1C20',margin:0}}>Recettes</h1>
          <p style={{fontSize:13,color:'#9AA0AE',marginTop:4}}>Devis, clients et suivi des encaissements</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={()=>navigate('/pro/profil')} style={{display:'flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:9,border:'1px solid #E8EAF0',background:'#fff',color:'#5A6070',fontSize:12,fontWeight:600,cursor:'pointer'}}><Settings size={13}/> Mon profil</button>
          <ExportButton
            data={devisExport}
            filename={`recettes-${new Date().getFullYear()}`}
            color={ACCENT}
            columns={[
              { key:'numero',      label:'N° Devis' },
              { key:'client',      label:'Client' },
              { key:'date_emission',label:'Date émission' },
              { key:'date_echeance',label:'Échéance' },
              { key:'montant_ht',  label:'HT (€)' },
              { key:'tva_taux',    label:'TVA %' },
              { key:'montant_ttc', label:'TTC (€)' },
              { key:'statut',      label:'Statut' },
              { key:'relances',    label:'Nb relances' },
            ]}
          />
          <button onClick={()=>{setShowClientForm(true);setShowDevisForm(false);}} style={{display:'flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:9,border:`1px solid ${ACCENT}`,background:'#fff',color:ACCENT,fontSize:12,fontWeight:700,cursor:'pointer'}}><Users size={13}/> Nouveau client</button>
          <button onClick={()=>{setShowDevisForm(true);setShowClientForm(false);setEditDevis(null);}} style={{display:'flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:9,border:'none',background:ACCENT,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}><Plus size={13}/> Nouveau devis</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',gap:14,marginBottom:24}}>
        {[{label:'Devis signés',value:formatEuro(totalSigne),color:'#5BC78A',icon:CheckCircle},{label:'Encaissé',value:formatEuro(totalEncaisse),color:'#A85BC7',icon:TrendingUp},{label:'En retard',value:enRetard.length,color:'#C75B4E',icon:AlertTriangle,alert:enRetard.length>0},{label:'Clients',value:clients.length,color:ACCENT,icon:Users}].map(s=>{const Icon=s.icon;return(<div key={s.label} style={{background:'#fff',border:`1px solid ${s.alert?'rgba(199,91,78,0.3)':'#E8EAF0'}`,borderRadius:12,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}><p style={{fontSize:11,color:'#9AA0AE',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',margin:0}}>{s.label}</p><Icon size={14} color={s.color}/></div><p style={{fontSize:22,fontWeight:700,color:s.alert?'#C75B4E':s.color,margin:0}}>{s.value}</p></div>);})}
      </div>

      {showClientForm&&<ClientForm onSave={()=>{setShowClientForm(false);fetchAll();}} onCancel={()=>setShowClientForm(false)}/>}
      {(showDevisForm||editDevis)&&<DevisForm clients={clients} editData={editDevis} onSave={()=>{setShowDevisForm(false);setEditDevis(null);fetchAll();}} onCancel={()=>{setShowDevisForm(false);setEditDevis(null);}}/>}

      <div style={{display:'flex',gap:4,marginBottom:18,background:'#F0F2F5',borderRadius:10,padding:4,width:'fit-content'}}>
        {[{id:'devis',label:'Devis',icon:FileText},{id:'clients',label:'Clients',icon:Users}].map(t=>{const Icon=t.icon;return(<button key={t.id} onClick={()=>setTab(t.id)} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 16px',borderRadius:8,border:'none',background:tab===t.id?'#fff':'transparent',color:tab===t.id?'#1A1C20':'#9AA0AE',fontSize:13,fontWeight:tab===t.id?700:500,cursor:'pointer',boxShadow:tab===t.id?'0 1px 3px rgba(0,0,0,0.08)':'none',transition:'all 150ms ease'}}><Icon size={13}/> {t.label}</button>);})}
      </div>

      {tab==='devis'&&(<>
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {[{id:'tous',label:'Tous',color:'#9AA0AE'},...STATUTS].map(s=>(<button key={s.id} onClick={()=>setFilterStatut(s.id)} style={{padding:'5px 14px',borderRadius:20,border:`1px solid ${filterStatut===s.id?s.color:'#E8EAF0'}`,background:filterStatut===s.id?`${s.color}15`:'#fff',color:filterStatut===s.id?s.color:'#5A6070',fontSize:12,fontWeight:filterStatut===s.id?700:500,cursor:'pointer'}}>{s.label}</button>))}
        </div>
        <div style={{background:'#fff',border:'1px solid #E8EAF0',borderRadius:14,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          {loading?<div style={{padding:40,textAlign:'center',color:'#9AA0AE',fontSize:13}}>Chargement...</div>
          :filtered.length===0?<div style={{padding:48,textAlign:'center'}}><FileText size={32} color="#E8EAF0" style={{marginBottom:12}}/><p style={{color:'#9AA0AE',fontSize:13,margin:0}}>{devis.length===0?'Aucun devis — cliquez sur "Nouveau devis"':'Aucun devis pour ce filtre'}</p></div>
          :<table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:'1px solid #F0F2F5'}}>{['N° Devis','Client','Émission','Échéance','Montant TTC','Statut','Relances',''].map(h=>(<th key={h} style={{padding:'11px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:'#9AA0AE',textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</th>))}</tr></thead>
            <tbody>
              {filtered.map((d,i)=>{
                const days=daysUntil(d.date_echeance);const isLate=(d.statut==='signe'||d.statut==='envoye')&&days!==null&&days<0;
                return(<tr key={d.id||i} style={{borderBottom:'1px solid #F8F9FB',background:isLate?'rgba(199,91,78,0.02)':'transparent'}} onMouseEnter={ev=>ev.currentTarget.style.background=isLate?'rgba(199,91,78,0.04)':'#FAFBFC'} onMouseLeave={ev=>ev.currentTarget.style.background=isLate?'rgba(199,91,78,0.02)':'transparent'}>
                  <td style={{padding:'11px 14px',fontSize:12,fontWeight:700,color:'#1A1C20'}}>{d.numero}</td>
                  <td style={{padding:'11px 14px',fontSize:13,color:'#1A1C20'}}>{d.clients?.nom||'—'}</td>
                  <td style={{padding:'11px 14px',fontSize:12,color:'#5A6070'}}>{formatDate(d.date_emission)}</td>
                  <td style={{padding:'11px 14px',fontSize:12,color:isLate?'#C75B4E':'#5A6070',fontWeight:isLate?700:400}}>{formatDate(d.date_echeance)}{isLate&&<span style={{fontSize:10,marginLeft:4}}>({Math.abs(days)}j)</span>}</td>
                  <td style={{padding:'11px 14px',fontSize:13,fontWeight:700,color:ACCENT}}>{formatEuro(d.montant_ttc)}</td>
                  <td style={{padding:'11px 14px'}}><select value={d.statut} onChange={e=>changerStatut(d.id,e.target.value)} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:12,fontWeight:600,outline:'none',color:STATUTS.find(s=>s.id===d.statut)?.color||'#9AA0AE'}}>{STATUTS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></td>
                  <td style={{padding:'11px 14px',fontSize:12,color:'#9AA0AE'}}>{d.relance_count||0} relance{(d.relance_count||0)>1?'s':''}</td>
                  <td style={{padding:'11px 14px'}}>
                    <div style={{display:'flex',gap:4}}>
                      <button onClick={()=>telechargerPDF(d)} title="PDF" style={{background:'transparent',border:'none',cursor:'pointer',padding:4,color:'#9AA0AE'}} onMouseEnter={ev=>ev.currentTarget.style.color=ACCENT} onMouseLeave={ev=>ev.currentTarget.style.color='#9AA0AE'}><FileDown size={13}/></button>
                      {(d.statut==='signe'||d.statut==='envoye')&&<button onClick={()=>envoyerRelance(d)} title="Relance" style={{background:'transparent',border:'none',cursor:'pointer',padding:4,color:'#5BC78A'}}><RefreshCw size={13}/></button>}
                      <button onClick={()=>{setEditDevis(d);setShowDevisForm(false);}} title="Modifier" style={{background:'transparent',border:'none',cursor:'pointer',padding:4,color:'#9AA0AE'}} onMouseEnter={ev=>ev.currentTarget.style.color=ACCENT} onMouseLeave={ev=>ev.currentTarget.style.color='#9AA0AE'}><Edit2 size={13}/></button>
                      <button onClick={()=>deleteDevis(d.id)} title="Supprimer" style={{background:'transparent',border:'none',cursor:'pointer',padding:4,color:'#D0D4DC'}} onMouseEnter={ev=>ev.currentTarget.style.color='#C75B4E'} onMouseLeave={ev=>ev.currentTarget.style.color='#D0D4DC'}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>);
              })}
            </tbody>
          </table>}
        </div>
      </>)}

      {tab==='clients'&&(
        <div style={{background:'#fff',border:'1px solid #E8EAF0',borderRadius:14,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          {clients.length===0?<div style={{padding:48,textAlign:'center'}}><Users size={32} color="#E8EAF0" style={{marginBottom:12}}/><p style={{color:'#9AA0AE',fontSize:13,margin:0}}>Aucun client — cliquez sur "Nouveau client"</p></div>
          :<table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{borderBottom:'1px solid #F0F2F5'}}>{['Nom','Email','Téléphone','SIRET',''].map(h=>(<th key={h} style={{padding:'11px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:'#9AA0AE',textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</th>))}</tr></thead>
            <tbody>{clients.map((c,i)=>(<tr key={c.id||i} style={{borderBottom:'1px solid #F8F9FB'}} onMouseEnter={ev=>ev.currentTarget.style.background='#FAFBFC'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}><td style={{padding:'11px 14px',fontSize:13,fontWeight:600,color:'#1A1C20'}}>{c.nom}</td><td style={{padding:'11px 14px',fontSize:12,color:'#5A6070'}}>{c.email}</td><td style={{padding:'11px 14px',fontSize:12,color:'#5A6070'}}>{c.telephone||'—'}</td><td style={{padding:'11px 14px',fontSize:12,color:'#5A6070'}}>{c.siret||'—'}</td><td style={{padding:'11px 14px'}}><button onClick={()=>deleteClient(c.id)} style={{background:'transparent',border:'none',cursor:'pointer',padding:4,color:'#D0D4DC'}} onMouseEnter={ev=>ev.currentTarget.style.color='#C75B4E'} onMouseLeave={ev=>ev.currentTarget.style.color='#D0D4DC'}><Trash2 size={13}/></button></td></tr>))}</tbody>
          </table>}
        </div>
      )}
    </div>
  );
}
