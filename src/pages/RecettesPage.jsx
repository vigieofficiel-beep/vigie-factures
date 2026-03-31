import { useState, useEffect } from 'react';
import { supabasePro } from '../lib/supabasePro';
import { jsPDF } from 'jspdf';
import {
  Plus, Trash2, Edit2, CheckCircle, AlertTriangle, Download,
  Users, FileText, TrendingUp, RefreshCw, FileDown, Settings, ExternalLink
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ExportButton from '../components/ExportButton';
import DateFilter from '../components/DateFilter';
import Tooltip from '../components/Tooltip';
import { TIPS } from '../utils/tooltips';
import { useWorkspace } from '../hooks/useWorkspace.jsx';

const ACCENT = '#5BA3C7';
const formatEuro = (n) => n == null ? '—' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const daysUntil = (dateStr) => { if (!dateStr) return null; return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24)); };

function parseOCRDate(str) {
  if (!str) return new Date().toISOString().split('T')[0];
  const p = str.split('/');
  if (p.length === 3) return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
  return new Date().toISOString().split('T')[0];
}

const STATUTS = [
  { id: 'brouillon',  label: 'Brouillon',  color: 'rgba(237,232,219,0.4)', bg: '#F0F2F5' },
  { id: 'envoye',     label: 'Envoyé',      color: '#5BA3C7', bg: 'rgba(91,163,199,0.1)' },
  { id: 'signe',      label: 'Signé',       color: '#5BC78A', bg: 'rgba(91,199,138,0.1)' },
  { id: 'encaisse',   label: 'Encaissé',    color: '#A85BC7', bg: 'rgba(168,91,199,0.1)' },
  { id: 'en_retard',  label: 'En retard',   color: '#C75B4E', bg: 'rgba(199,91,78,0.1)' },
  { id: 'annule',     label: 'Annulé',      color: 'rgba(237,232,219,0.2)', bg: 'rgba(255,255,255,0.04)' },
];

const STATUT_TIPS = {
  brouillon: TIPS.statut_brouillon,
  envoye:    TIPS.statut_envoye,
  signe:     TIPS.statut_signe,
  encaisse:  TIPS.statut_encaisse,
  en_retard: TIPS.statut_en_retard,
  annule:    TIPS.statut_annule,
};

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
  doc.text("En cas d'acceptation, retourner ce document signé avec la mention \"Bon pour accord\".", M, y); y+=4;
  if (profil.siret) doc.text(`${profil.company_name||''} — SIRET ${profil.siret}`, M, y);
  doc.save(`devis-${devis.numero}.pdf`);
}

function LignesPrestation({ lignes, setLignes }) {
  const addLigne = () => setLignes(l => [...l, { description:'', quantite:1, prix_unitaire:'', tva_taux:20 }]);
  const removeLigne = (i) => setLignes(l => l.filter((_,idx) => idx!==i));
  const updateLigne = (i,k,v) => setLignes(l => l.map((item,idx) => idx===i ? {...item,[k]:v} : item));
  const inputS = { padding:'8px 10px', borderRadius:7, border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', fontSize:12, outline:'none', width:'100%', boxSizing:'border-box' };
  const totalHT  = lignes.reduce((s,l) => s+(Number(l.quantite)||0)*(Number(l.prix_unitaire)||0), 0);
  const totalTVA = lignes.reduce((s,l) => s+(Number(l.quantite)||0)*(Number(l.prix_unitaire)||0)*(Number(l.tva_taux)||20)/100, 0);
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <label style={{fontSize:11,fontWeight:600,color:'rgba(237,232,219,0.4)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Lignes de prestation *</label>
        <button type="button" onClick={addLigne} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,color:ACCENT,background:`${ACCENT}12`,border:`1px solid ${ACCENT}30`,borderRadius:7,padding:'4px 10px',cursor:'pointer'}}>
          <Plus size={11}/> Ajouter une ligne
        </button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'3fr 0.6fr 1fr 0.8fr 1fr 28px',gap:6,marginBottom:6,padding:'0 4px'}}>
        {['Description','Qté',
          <span key="ht" style={{display:'flex',alignItems:'center',gap:3}}>P.U. HT <Tooltip text={TIPS.ht} size={11}/></span>,
          <span key="tva" style={{display:'flex',alignItems:'center',gap:3}}>TVA % <Tooltip text={TIPS.taux_tva} size={11}/></span>,
          <span key="ttc" style={{display:'flex',alignItems:'center',gap:3}}>Total TTC <Tooltip text={TIPS.ttc} size={11}/></span>,
          '',
        ].map((h,i) => <span key={i} style={{fontSize:10,fontWeight:700,color:'rgba(237,232,219,0.4)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</span>)}
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
            <button type="button" onClick={()=>removeLigne(i)} disabled={lignes.length===1} style={{background:'none',border:'none',cursor:lignes.length===1?'not-allowed':'pointer',color:'rgba(237,232,219,0.2)',padding:0,display:'flex'}} onMouseEnter={e=>{if(lignes.length>1)e.currentTarget.style.color='#C75B4E'}} onMouseLeave={e=>e.currentTarget.style.color='#D0D4DC'}><Trash2 size={13}/></button>
          </div>
        );
      })}
      <div style={{marginTop:10,padding:'10px 14px',background:'rgba(255,255,255,0.04)',borderRadius:9,border:'1px solid rgba(255,255,255,0.08)',display:'flex',justifyContent:'flex-end',gap:24}}>
        <span style={{fontSize:12,color:'rgba(237,232,219,0.4)',display:'flex',alignItems:'center',gap:4}}>HT <Tooltip text={TIPS.ht} size={11}/> : <strong style={{color:'#EDE8DB'}}>{totalHT.toFixed(2)} €</strong></span>
        <span style={{fontSize:12,color:'rgba(237,232,219,0.4)',display:'flex',alignItems:'center',gap:4}}>TVA <Tooltip text={TIPS.tva} size={11}/> : <strong style={{color:'#EDE8DB'}}>{totalTVA.toFixed(2)} €</strong></span>
        <span style={{fontSize:13,color:ACCENT,fontWeight:800,display:'flex',alignItems:'center',gap:4}}>TTC <Tooltip text={TIPS.ttc} size={11}/> : {(totalHT+totalTVA).toFixed(2)} €</span>
      </div>
    </div>
  );
}

function ClientForm({ onSave, onCancel }) {
  const [form, setForm] = useState({nom:'',email:'',telephone:'',adresse:'',siret:''});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set=(k)=>(e)=>setForm(f=>({...f,[k]:e.target.value}));
  const iS={width:'100%',padding:'9px 12px',borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#EDE8DB',fontSize:13,outline:'none',boxSizing:'border-box'};
  const lS={fontSize:11,fontWeight:600,color:'rgba(237,232,219,0.5)',marginBottom:5,display:'flex',alignItems:'center',gap:4};
  const handleSubmit=async(e)=>{
    e.preventDefault();setLoading(true);
    try {
      const{data:{session}}=await supabasePro.auth.getSession();
      const user=session?.user;
      if(!user)throw new Error('Session expirée');
      const clientPayload = {
        nom: form.nom,
        courriel: form.email,
        'téléphone': form.telephone,
        adresse: form.adresse,
        siret: form.siret,
        user_id: user.id,
      };
      const{error:err}=await supabasePro.from('clients').insert(clientPayload);
      if(err)throw err;
      onSave();
    }catch(err){setError(err.message);}
    setLoading(false);
  };
  return (
    <form onSubmit={handleSubmit} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:24,marginBottom:24,boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
      <h3 style={{fontSize:15,fontWeight:700,color:'#EDE8DB',marginBottom:20}}>Nouveau client</h3>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <div><label style={lS}>Nom / Raison sociale *</label><input value={form.nom} onChange={set('nom')} required style={iS} placeholder="Ex: SARL Dupont"/></div>
        <div><label style={lS}>Email *</label><input type="email" value={form.email} onChange={set('email')} required style={iS} placeholder="contact@client.fr"/></div>
        <div><label style={lS}>Téléphone</label><input value={form.telephone} onChange={set('telephone')} style={iS} placeholder="06 00 00 00 00"/></div>
        <div><label style={lS}>SIRET <Tooltip text={TIPS.siret} /></label><input value={form.siret} onChange={set('siret')} style={iS} placeholder="000 000 000 00000"/></div>
      </div>
      <div style={{marginBottom:16}}><label style={lS}>Adresse</label><input value={form.adresse} onChange={set('adresse')} style={iS} placeholder="1 rue de la Paix, 75001 Paris"/></div>
      {error&&<div style={{color:'#C75B4E',fontSize:12,marginBottom:12}}>{error}</div>}
      <div style={{display:'flex',gap:10}}>
        <button type="submit" disabled={loading} style={{flex:1,padding:'10px',borderRadius:9,border:'none',background:ACCENT,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>{loading?'Enregistrement...':'✓ Enregistrer le client'}</button>
        <button type="button" onClick={onCancel} style={{padding:'10px 18px',borderRadius:9,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'rgba(237,232,219,0.5)',fontSize:13,cursor:'pointer'}}>Annuler</button>
      </div>
    </form>
  );
}

function DevisForm({ clients, onSave, onCancel, editData=null, prefill=null, workspaceId=null }) {
  const today=new Date().toISOString().split('T')[0];
  const in30=new Date(Date.now()+30*86400000).toISOString().split('T')[0];
  const [form,setForm]=useState(editData||{
    client_id:'',
    numero:`DEV-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}-001`,
    date_emission: prefill?.date ? parseOCRDate(prefill.date) : today,
    date_validite:in30,
    date_echeance:in30,
    statut:'brouillon',
    notes: prefill?.description ?? '',
  });
  const [lignes,setLignes]=useState(()=>{
    if (prefill?.montant_ttc) {
      return [{ description: prefill.description || '', quantite:1, prix_unitaire: prefill.montant_ht || prefill.montant_ttc || '', tva_taux: prefill.tva ? Math.round((prefill.tva / (prefill.montant_ht || 1)) * 100) : 20 }];
    }
    if(editData?.description){try{return JSON.parse(editData.description);}catch{}}
    return[{description:'',quantite:1,prix_unitaire:'',tva_taux:20}];
  });
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState('');
  const set=(k)=>(e)=>setForm(f=>({...f,[k]:e.target.value}));
  const totalHT=lignes.reduce((s,l)=>s+(Number(l.quantite)||0)*(Number(l.prix_unitaire)||0),0);
  const totalTVA=lignes.reduce((s,l)=>s+(Number(l.quantite)||0)*(Number(l.prix_unitaire)||0)*(Number(l.tva_taux)||20)/100,0);
  const handleSubmit=async(e)=>{
    e.preventDefault();setLoading(true);
    try {
      const{data:{session}}=await supabasePro.auth.getSession();
      const user=session?.user;
      if(!user)throw new Error('Session expirée');
      const payload={
        ...form,
        user_id:user.id,
        workspace_id: workspaceId || null,
        montant_ht:totalHT,
        tva_taux:lignes[0]?.tva_taux||20,
        montant_ttc:totalHT+totalTVA,
        description:JSON.stringify(lignes)
      };
      if(editData?.id){
        const{error:err}=await supabasePro.from('devis').update(payload).eq('id',editData.id);
        if(err)throw err;
      }else{
        const{error:err}=await supabasePro.from('devis').insert(payload);
        if(err)throw err;
      }
      onSave();
    }catch(err){setError(err.message);}
    setLoading(false);
  };
  const iS={width:'100%',padding:'9px 12px',borderRadius:8,background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'#EDE8DB',fontSize:13,outline:'none',boxSizing:'border-box'};
  const lS={fontSize:11,fontWeight:600,color:'rgba(237,232,219,0.5)',marginBottom:5,display:'flex',alignItems:'center',gap:4};
  return (
    <form onSubmit={handleSubmit} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${prefill?`${ACCENT}40`:'rgba(255,255,255,0.08)'}`,borderRadius:14,padding:24,marginBottom:24,boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
      {prefill && (
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:9,background:`${ACCENT}10`,border:`1px solid ${ACCENT}30`,marginBottom:18}}>
          <CheckCircle size={14} color={ACCENT}/>
          <span style={{fontSize:13,fontWeight:600,color:ACCENT}}>Formulaire pré-rempli depuis l'analyse du document</span>
        </div>
      )}
      <h3 style={{fontSize:15,fontWeight:700,color:'#EDE8DB',marginBottom:20,display:'flex',alignItems:'center',gap:8}}>
        {editData?'Modifier le document':'Nouveau document commercial'} <Tooltip text={TIPS.devis} size={14}/>
      </h3>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <div><label style={lS}>Client *</label><select value={form.client_id} onChange={set('client_id')} required style={{...iS,cursor:'pointer'}}><option value="">Sélectionner un client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.nom}</option>)}</select></div>
        <div><label style={lS}>Numéro de document *</label><input value={form.numero} onChange={set('numero')} required style={iS}/></div>
        <div><label style={lS}>Date d'émission *</label><input type="date" value={form.date_emission} onChange={set('date_emission')} required style={{...iS,colorScheme:'light'}}/></div>
        <div><label style={lS}>Date de validité <Tooltip text={TIPS.date_validite}/></label><input type="date" value={form.date_validite} onChange={set('date_validite')} style={{...iS,colorScheme:'light'}}/></div>
        <div><label style={lS}>Échéance paiement <Tooltip text={TIPS.date_echeance}/></label><input type="date" value={form.date_echeance} onChange={set('date_echeance')} style={{...iS,colorScheme:'light'}}/></div>
        <div><label style={lS}>Statut</label><select value={form.statut} onChange={set('statut')} style={{...iS,cursor:'pointer'}}>{STATUTS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
      </div>
      <LignesPrestation lignes={lignes} setLignes={setLignes}/>
      <div style={{marginBottom:14}}><label style={lS}>Notes internes</label><input value={form.notes} onChange={set('notes')} style={iS} placeholder="Commentaires internes (non visibles sur le document)"/></div>
      <div style={{background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:8,padding:'8px 12px',marginBottom:16,fontSize:11,color:'#92400E'}}>⚠️ Les montants sont indicatifs. Validez avec votre expert-comptable avant envoi.</div>
      {error&&<div style={{color:'#C75B4E',fontSize:12,marginBottom:12}}>{error}</div>}
      <div style={{display:'flex',gap:10}}>
        <button type="submit" disabled={loading} style={{flex:1,padding:'11px',borderRadius:9,border:'none',background:loading?`${ACCENT}50`:ACCENT,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>{loading?'Enregistrement...':'✓ Enregistrer le document'}</button>
        <button type="button" onClick={onCancel} style={{padding:'11px 18px',borderRadius:9,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'rgba(237,232,219,0.5)',fontSize:13,cursor:'pointer'}}>Annuler</button>
      </div>
    </form>
  );
}

export default function RecettesPage() {
  const { activeWorkspace } = useWorkspace();
  const [tab,setTab]=useState('devis');
  const [devis,setDevis]=useState([]);
  const [clients,setClients]=useState([]);
  const [profil,setProfil]=useState({});
  const [loading,setLoading]=useState(true);
  const [showDevisForm,setShowDevisForm]=useState(false);
  const [showClientForm,setShowClientForm]=useState(false);
  const [editDevis,setEditDevis]=useState(null);
  const [filterStatut,setFilterStatut]=useState('tous');
  const [dateRange, setDateRange] = useState({ debut:'', fin:'' });
  const [ocrPrefill, setOcrPrefill] = useState(null);
  const navigate=useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(()=>{
    const statutURL = searchParams.get('statut');
    if (statutURL) setFilterStatut(statutURL);
  }, []);

  useEffect(()=>{
    fetchAll();
    try {
      const raw = sessionStorage.getItem('ocr_prefill');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.source === 'prohome_ocr' && data.type_document === 'recette') {
          setOcrPrefill(data);
          setShowDevisForm(true);
          sessionStorage.removeItem('ocr_prefill');
        }
      }
    } catch {}
  },[activeWorkspace]);

  const fetchAll=async()=>{
    setLoading(true);
    const{data:{session}}=await supabasePro.auth.getSession();
    const user=session?.user;
    if(!user)return;

    let qDevis = supabasePro.from('devis').select('*, clients!left(nom,courriel,téléphone,adresse,siret)').eq('user_id',user.id).order('date_emission',{ascending:false});
    if(activeWorkspace?.id) qDevis = qDevis.eq('workspace_id', activeWorkspace.id);

    let qClients = supabasePro.from('clients').select('*').eq('user_id',user.id).order('nom');

    const[{data:d},{data:c},{data:p}]=await Promise.all([
      qDevis, qClients,
      supabasePro.from('user_profiles').select('*').eq('id',user.id).single(),
    ]);
    setDevis(d||[]);setClients(c||[]);setProfil(p||{});setLoading(false);
  };

  const deleteDevis=async(id)=>{if(!confirm('Supprimer ce document ?'))return;await supabasePro.from('devis').delete().eq('id',id);fetchAll();};
  const deleteClient=async(id)=>{if(!confirm('Supprimer ce client ?'))return;await supabasePro.from('clients').delete().eq('id',id);fetchAll();};
  const changerStatut=async(id,statut)=>{await supabasePro.from('devis').update({statut}).eq('id',id);fetchAll();};
  const envoyerRelance=async(d)=>{const count=(d.relance_count||0)+1;await supabasePro.from('devis').update({relance_count:count,derniere_relance:new Date().toISOString().split('T')[0]}).eq('id',d.id);await supabasePro.from('reminders').insert({user_id:d.user_id,context:'pro',type:'relance',message:`Relance ${count} — ${d.clients?.nom} — document ${d.numero} (${formatEuro(d.montant_ttc)})`,sent_at:new Date().toISOString()});alert(`Relance ${count} enregistrée pour ${d.clients?.nom}`);fetchAll();};
  const telechargerPDF=(d)=>{if(!profil.company_name&&!profil.first_name){alert('Renseignez votre profil pro avant de générer un document');return;}let lignes=[{description:d.description||'',quantite:1,prix_unitaire:d.montant_ht||0,tva_taux:d.tva_taux||20}];try{lignes=JSON.parse(d.description);}catch{}genererPDF(d,d.clients||{},profil,lignes);};

  let filtered = filterStatut==='tous' ? devis : devis.filter(d => d.statut===filterStatut);
  if (dateRange.debut) filtered = filtered.filter(d => d.date_emission >= dateRange.debut);
  if (dateRange.fin)   filtered = filtered.filter(d => d.date_emission <= dateRange.fin);
  const totalSigne=devis.filter(d=>d.statut==='signe').reduce((s,d)=>s+(d.montant_ttc||0),0);
  const totalEncaisse=devis.filter(d=>d.statut==='encaisse').reduce((s,d)=>s+(d.montant_ttc||0),0);
  const enRetard=devis.filter(d=>(d.statut==='signe'||d.statut==='envoye')&&daysUntil(d.date_echeance)!==null&&daysUntil(d.date_echeance)<0);
  const profilIncomplet=!profil.company_name&&!profil.first_name;

  const devisExport = filtered.map(d => ({
    numero: d.numero, client: d.clients?.nom || '', date_emission: d.date_emission,
    date_echeance: d.date_echeance, montant_ht: d.montant_ht, tva_taux: d.tva_taux,
    montant_ttc: d.montant_ttc, statut: d.statut, relances: d.relance_count || 0,
  }));

  return (
    <div style={{fontFamily:"'Nunito Sans', sans-serif",padding:'32px 28px',maxWidth:1000,margin:'0 auto'}}>
      {profilIncomplet&&(<div onClick={()=>navigate('/pro/profil')} style={{display:'flex',alignItems:'center',gap:10,background:'#FFF7ED',border:'1px solid #FED7AA',borderRadius:10,padding:'10px 16px',marginBottom:20,cursor:'pointer'}}><AlertTriangle size={14} color="#F59E0B"/><span style={{fontSize:12,color:'#92400E',fontWeight:600}}>Profil pro incomplet — vos PDF ne seront pas correctement remplis.</span><span style={{fontSize:12,color:'#F59E0B',fontWeight:700,marginLeft:'auto'}}>Compléter →</span></div>)}

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,flexWrap:'wrap',gap:12}}>
        <div>
          <h1 style={{fontFamily:"'Cormorant Garamond', serif",fontSize:26,fontWeight:600,color:'#EDE8DB',margin:0,display:'flex',alignItems:'center',gap:8}}>
            Recettes <Tooltip text={TIPS.recettes} size={16}/>
          </h1>
          <p style={{fontSize:13,color:'rgba(237,232,219,0.4)',marginTop:4}}>Documents commerciaux, clients et suivi des encaissements</p>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button onClick={()=>navigate('/pro/profil')} style={{display:'flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:9,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.04)',color:'rgba(237,232,219,0.5)',fontSize:12,fontWeight:600,cursor:'pointer'}}><Settings size={13}/> Mon profil</button>
          <DateFilter onChange={setDateRange} color={ACCENT}/>
          <ExportButton data={devisExport} filename={`recettes-${new Date().getFullYear()}`} color={ACCENT}
            columns={[
              { key:'numero', label:'N° Document' }, { key:'client', label:'Client' },
              { key:'date_emission', label:'Date émission' }, { key:'date_echeance', label:'Échéance' },
              { key:'montant_ht', label:'HT (€)' }, { key:'tva_taux', label:'TVA %' },
              { key:'montant_ttc', label:'TTC (€)' }, { key:'statut', label:'Statut' }, { key:'relances', label:'Nb relances' },
            ]}/>
          <button onClick={()=>{setShowClientForm(true);setShowDevisForm(false);}} style={{display:'flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:9,border:`1px solid ${ACCENT}`,background:'rgba(255,255,255,0.04)',color:ACCENT,fontSize:12,fontWeight:700,cursor:'pointer'}}><Users size={13}/> Nouveau client</button>
          <button onClick={()=>{setShowDevisForm(true);setShowClientForm(false);setEditDevis(null);setOcrPrefill(null);}} style={{display:'flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:9,border:'none',background:ACCENT,color:'#fff',fontSize:12,fontWeight:700,cursor:'pointer'}}><Plus size={13}/> Nouveau document</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',gap:14,marginBottom:24}}>
        {[
          {label:'Documents signés',  value:formatEuro(totalSigne),   color:'#5BC78A', icon:CheckCircle, tip:TIPS.statut_signe},
          {label:'Encaissé',          value:formatEuro(totalEncaisse), color:'#A85BC7', icon:TrendingUp,  tip:TIPS.statut_encaisse},
          {label:'En retard',         value:enRetard.length,           color:'#C75B4E', icon:AlertTriangle, alert:enRetard.length>0, tip:TIPS.statut_en_retard},
          {label:'Clients',           value:clients.length,            color:ACCENT,    icon:Users},
        ].map(s=>{const Icon=s.icon;return(
          <div key={s.label} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${s.alert?'rgba(199,91,78,0.3)':'rgba(255,255,255,0.08)'}`,borderRadius:12,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <p style={{fontSize:11,color:'rgba(237,232,219,0.4)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',margin:0}}>{s.label}</p>
                {s.tip && <Tooltip text={s.tip} size={11}/>}
              </div>
              <Icon size={14} color={s.color}/>
            </div>
            <p style={{fontSize:22,fontWeight:700,color:s.alert?'#C75B4E':s.color,margin:0}}>{s.value}</p>
          </div>
        );})}
      </div>

      {showClientForm&&<ClientForm onSave={()=>{setShowClientForm(false);fetchAll();}} onCancel={()=>setShowClientForm(false)}/>}
      {(showDevisForm||editDevis)&&(
        <DevisForm
          clients={clients}
          editData={editDevis}
          prefill={ocrPrefill}
          workspaceId={activeWorkspace?.id}
          onSave={()=>{setShowDevisForm(false);setEditDevis(null);setOcrPrefill(null);fetchAll();}}
          onCancel={()=>{setShowDevisForm(false);setEditDevis(null);setOcrPrefill(null);}}
        />
      )}

      <div style={{display:'flex',gap:4,marginBottom:18,background:'rgba(255,255,255,0.06)',borderRadius:10,padding:4,width:'fit-content'}}>
        {[{id:'devis',label:'Documents',icon:FileText},{id:'clients',label:'Clients',icon:Users}].map(t=>{const Icon=t.icon;return(<button key={t.id} onClick={()=>setTab(t.id)} style={{display:'flex',alignItems:'center',gap:6,padding:'7px 16px',borderRadius:8,border:'none',background:tab===t.id?'rgba(91,163,199,0.15)':'transparent',color:tab===t.id?'#5BA3C7':'rgba(237,232,219,0.4)',fontSize:13,fontWeight:tab===t.id?700:500,cursor:'pointer',boxShadow:tab===t.id?'0 1px 3px rgba(0,0,0,0.08)':'none',transition:'all 150ms ease'}}><Icon size={13}/> {t.label}</button>);})}
      </div>

      {tab==='devis'&&(<>
        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
          {[{id:'tous',label:'Tous',color:'rgba(237,232,219,0.4)'},...STATUTS].map(s=>(
            <div key={s.id} style={{display:'flex',alignItems:'center',gap:4}}>
              <button onClick={()=>setFilterStatut(s.id)} style={{padding:'5px 14px',borderRadius:20,border:`1px solid ${filterStatut===s.id?s.color:'rgba(255,255,255,0.1)'}`,background:filterStatut===s.id?`${s.color}15`:'transparent',color:filterStatut===s.id?s.color:'rgba(237,232,219,0.5)',fontSize:12,fontWeight:filterStatut===s.id?700:500,cursor:'pointer'}}>{s.label}</button>
              {STATUT_TIPS[s.id] && <Tooltip text={STATUT_TIPS[s.id]} size={11}/>}
            </div>
          ))}
        </div>
        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          {loading?<div style={{padding:40,textAlign:'center',color:'rgba(237,232,219,0.4)',fontSize:13}}>Chargement...</div>
          :filtered.length===0?<div style={{padding:48,textAlign:'center'}}><FileText size={32} color="#E8EAF0" style={{marginBottom:12}}/><p style={{color:'rgba(237,232,219,0.4)',fontSize:13,margin:0}}>{devis.length===0?'Aucun document — cliquez sur "Nouveau document"':'Aucun document pour ce filtre'}</p></div>
          :<table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                {['N° Document','Client','Émission',
                  <span key="ech" style={{display:'flex',alignItems:'center',gap:4}}>Échéance <Tooltip text={TIPS.date_echeance} size={11}/></span>,
                  <span key="ttc" style={{display:'flex',alignItems:'center',gap:4}}>Montant TTC <Tooltip text={TIPS.ttc} size={11}/></span>,
                  'Statut','Relances','',
                ].map((h,i)=>(<th key={i} style={{padding:'11px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:'rgba(237,232,219,0.4)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</th>))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d,i)=>{
                const days=daysUntil(d.date_echeance);const isLate=(d.statut==='signe'||d.statut==='envoye')&&days!==null&&days<0;
                return(<tr key={d.id||i} style={{borderBottom:'1px solid rgba(255,255,255,0.04)',background:isLate?'rgba(199,91,78,0.02)':'transparent'}} onMouseEnter={ev=>ev.currentTarget.style.background=isLate?'rgba(199,91,78,0.04)':'rgba(255,255,255,0.04)'} onMouseLeave={ev=>ev.currentTarget.style.background=isLate?'rgba(199,91,78,0.02)':'transparent'}>
                  <td style={{padding:'11px 14px',fontSize:12,fontWeight:700,color:'#EDE8DB'}}>{d.numero}</td>
                  <td style={{padding:'11px 14px',fontSize:13,color:'#EDE8DB'}}>{d.clients?.nom||'—'}</td>
                  <td style={{padding:'11px 14px',fontSize:12,color:'rgba(237,232,219,0.5)'}}>{formatDate(d.date_emission)}</td>
                  <td style={{padding:'11px 14px',fontSize:12,color:isLate?'#C75B4E':'rgba(237,232,219,0.4)',fontWeight:isLate?700:400}}>{formatDate(d.date_echeance)}{isLate&&<span style={{fontSize:10,marginLeft:4}}>({Math.abs(days)}j)</span>}</td>
                  <td style={{padding:'11px 14px',fontSize:13,fontWeight:700,color:ACCENT}}>{formatEuro(d.montant_ttc)}</td>
                  <td style={{padding:'11px 14px'}}><select value={d.statut} onChange={e=>changerStatut(d.id,e.target.value)} style={{background:'transparent',border:'none',cursor:'pointer',fontSize:12,fontWeight:600,outline:'none',color:STATUTS.find(s=>s.id===d.statut)?.color||'rgba(237,232,219,0.4)'}}>{STATUTS.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></td>
                  <td style={{padding:'11px 14px',fontSize:12,color:'rgba(237,232,219,0.4)'}}>{d.relance_count||0} relance{(d.relance_count||0)>1?'s':''}</td>
                  <td style={{padding:'11px 14px'}}>
                    <div style={{display:'flex',gap:4}}>
                      <button onClick={()=>telechargerPDF(d)} title="Générer PDF" style={{background:'transparent',border:'none',cursor:'pointer',padding:4,color:'rgba(237,232,219,0.4)'}} onMouseEnter={ev=>ev.currentTarget.style.color=ACCENT} onMouseLeave={ev=>ev.currentTarget.style.color='rgba(237,232,219,0.4)'}><FileDown size={13}/></button>
                      {(d.statut==='signe'||d.statut==='envoye')&&<button onClick={()=>envoyerRelance(d)} title="Relance" style={{background:'transparent',border:'none',cursor:'pointer',padding:4,color:'#5BC78A'}}><RefreshCw size={13}/></button>}
                      <button onClick={()=>{setEditDevis(d);setShowDevisForm(false);}} title="Modifier" style={{background:'transparent',border:'none',cursor:'pointer',padding:4,color:'rgba(237,232,219,0.4)'}} onMouseEnter={ev=>ev.currentTarget.style.color=ACCENT} onMouseLeave={ev=>ev.currentTarget.style.color='rgba(237,232,219,0.4)'}><Edit2 size={13}/></button>
                      <button onClick={()=>deleteDevis(d.id)} title="Supprimer" style={{background:'transparent',border:'none',cursor:'pointer',padding:4,color:'rgba(237,232,219,0.2)'}} onMouseEnter={ev=>ev.currentTarget.style.color='#C75B4E'} onMouseLeave={ev=>ev.currentTarget.style.color='#D0D4DC'}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>);
              })}
            </tbody>
          </table>}
        </div>
      </>)}

      {tab==='clients'&&(
        <div style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          {clients.length===0?<div style={{padding:48,textAlign:'center'}}><Users size={32} color="#E8EAF0" style={{marginBottom:12}}/><p style={{color:'rgba(237,232,219,0.4)',fontSize:13,margin:0}}>Aucun client — cliquez sur "Nouveau client"</p></div>
          :<table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                {['Nom','Email','Téléphone',
                  <span key="siret" style={{display:'flex',alignItems:'center',gap:4}}>SIRET <Tooltip text={TIPS.siret} size={11}/></span>,
                  '',
                ].map((h,i)=>(<th key={i} style={{padding:'11px 14px',textAlign:'left',fontSize:10,fontWeight:700,color:'rgba(237,232,219,0.4)',textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</th>))}
              </tr>
            </thead>
            <tbody>{clients.map((c,i)=>(<tr key={c.id||i} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}} onMouseEnter={ev=>ev.currentTarget.style.background='rgba(255,255,255,0.03)'} onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}><td style={{padding:'11px 14px',fontSize:13,fontWeight:600,color:'#EDE8DB'}}>{c.nom}</td><td style={{padding:'11px 14px',fontSize:12,color:'rgba(237,232,219,0.5)'}}>{c.email}</td><td style={{padding:'11px 14px',fontSize:12,color:'rgba(237,232,219,0.5)'}}>{c.telephone||'—'}</td><td style={{padding:'11px 14px',fontSize:12,color:'rgba(237,232,219,0.5)'}}>{c.siret||'—'}</td><td style={{padding:'11px 14px'}}><button onClick={()=>deleteClient(c.id)} style={{background:'transparent',border:'none',cursor:'pointer',padding:4,color:'rgba(237,232,219,0.2)'}} onMouseEnter={ev=>ev.currentTarget.style.color='#C75B4E'} onMouseLeave={ev=>ev.currentTarget.style.color='#D0D4DC'}><Trash2 size={13}/></button></td></tr>))}</tbody>
          </table>}
        </div>
      )}
    </div>
  );
}
