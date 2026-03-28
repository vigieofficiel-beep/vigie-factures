import { useState, useEffect } from "react";
import { supabasePro } from '../lib/supabasePro';
import Tooltip from '../components/Tooltip';
import { TIPS } from '../utils/tooltips';

const Icon = {
  Download: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3" strokeLinecap="round"/></svg>,
  FileText: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  Info: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  Alert: () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
};

const COMPTES = {
  recette:            { num: "706000", lib: "Prestations de services" },
  recette_produit:    { num: "707000", lib: "Ventes de marchandises" },
  depense_transport:  { num: "624100", lib: "Transport sur achats" },
  depense_repas:      { num: "625700", lib: "Repas d'affaires" },
  depense_materiel:   { num: "606300", lib: "Fournitures d'entretien" },
  depense_logiciel:   { num: "605100", lib: "Logiciels et licences" },
  depense_default:    { num: "606800", lib: "Autres fournitures" },
  tva_collectee:      { num: "445710", lib: "TVA collectée" },
  tva_deductible:     { num: "445660", lib: "TVA déductible" },
  client:             { num: "411000", lib: "Clients" },
  fournisseur:        { num: "401000", lib: "Fournisseurs" },
  banque:             { num: "512000", lib: "Banque" },
  caisse:             { num: "530000", lib: "Caisse" },
};

const ANNEES = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
const MOIS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

function formatDateFEC(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
}
function formatMontantFEC(val) { return Number(val||0).toFixed(2).replace(".",","); }
function cleanStr(str) { if (!str) return ""; return str.replace(/[|;"\n\r]/g," ").trim(); }

function genererEcrituresFEC(recettes, depenses, factures_fourn, transactions, siren) {
  const ecritures = [];
  let numJournal = 1;

  const ligne = (jCode, jLib, num, date, compte, compteLib, compAux, compAuxLib, debit, credit, lib, dateV, montDev, idev) =>
    [cleanStr(jCode),cleanStr(jLib),String(num).padStart(6,"0"),formatDateFEC(date),cleanStr(compte),cleanStr(compteLib),cleanStr(compAux),cleanStr(compAuxLib),formatMontantFEC(debit),formatMontantFEC(credit),cleanStr(lib),formatDateFEC(dateV||date),montDev?formatMontantFEC(montDev):"",idev||""].join("|");

  recettes.forEach(r => {
    const ht=Number(r.montant_ht||r.montant||0), tva=ht*(Number(r.taux_tva||20)/100), ttc=ht+tva;
    const lib=`Recette - ${r.description||r.libelle||"Prestation"}`;
    ecritures.push(ligne("VE","Journal des ventes",numJournal,r.date,COMPTES.client.num,COMPTES.client.lib,"","",ttc,0,lib,r.date,"",""));
    ecritures.push(ligne("VE","Journal des ventes",numJournal,r.date,COMPTES.recette.num,COMPTES.recette.lib,"","",0,ht,lib,r.date,"",""));
    if(tva>0) ecritures.push(ligne("VE","Journal des ventes",numJournal,r.date,COMPTES.tva_collectee.num,COMPTES.tva_collectee.lib,"","",0,tva,`TVA - ${lib}`,r.date,"",""));
    numJournal++;
  });

  depenses.forEach(d => {
    const ht=Number(d.montant_ht||d.montant||0), tva=ht*(Number(d.taux_tva||20)/100), ttc=ht+tva;
    const lib=`Dépense - ${d.description||d.libelle||d.categorie||"Achat"}`;
    let cc=COMPTES.depense_default;
    const cat=(d.categorie||"").toLowerCase();
    if(cat.includes("transport")||cat.includes("kilomètre")) cc=COMPTES.depense_transport;
    else if(cat.includes("repas")||cat.includes("restaurant")) cc=COMPTES.depense_repas;
    else if(cat.includes("logiciel")||cat.includes("abonnement")||cat.includes("saas")) cc=COMPTES.depense_logiciel;
    else if(cat.includes("matériel")||cat.includes("equipement")) cc=COMPTES.depense_materiel;
    ecritures.push(ligne("AC","Journal des achats",numJournal,d.date,cc.num,cc.lib,"","",ht,0,lib,d.date,"",""));
    if(tva>0) ecritures.push(ligne("AC","Journal des achats",numJournal,d.date,COMPTES.tva_deductible.num,COMPTES.tva_deductible.lib,"","",tva,0,`TVA - ${lib}`,d.date,"",""));
    ecritures.push(ligne("AC","Journal des achats",numJournal,d.date,COMPTES.fournisseur.num,COMPTES.fournisseur.lib,"","",0,ttc,lib,d.date,"",""));
    numJournal++;
  });

  factures_fourn.forEach(f => {
    const ht=Number(f.montant_ht||0), tva=ht*(Number(f.tva||20)/100), ttc=ht+tva;
    const lib=`Facture fourn. - ${f.numero||""}`;
    ecritures.push(ligne("AC","Journal des achats",numJournal,f.date_facture,COMPTES.depense_default.num,COMPTES.depense_default.lib,"","",ht,0,lib,f.date_facture,"",""));
    if(tva>0) ecritures.push(ligne("AC","Journal des achats",numJournal,f.date_facture,COMPTES.tva_deductible.num,COMPTES.tva_deductible.lib,"","",tva,0,`TVA - ${lib}`,f.date_facture,"",""));
    ecritures.push(ligne("AC","Journal des achats",numJournal,f.date_facture,COMPTES.fournisseur.num,COMPTES.fournisseur.lib,"","",0,ttc,lib,f.date_facture,"",""));
    numJournal++;
  });

  transactions.forEach(t => {
    const montant=Math.abs(Number(t.montant||0)), lib=`${t.libelle||t.description||"Transaction"}`, isCredit=Number(t.montant)>0;
    ecritures.push(ligne("BQ","Journal de banque",numJournal,t.date,COMPTES.banque.num,COMPTES.banque.lib,"","",isCredit?montant:0,isCredit?0:montant,lib,t.date,"",""));
    ecritures.push(ligne("BQ","Journal de banque",numJournal,t.date,isCredit?COMPTES.client.num:COMPTES.fournisseur.num,isCredit?COMPTES.client.lib:COMPTES.fournisseur.lib,"","",isCredit?0:montant,isCredit?montant:0,lib,t.date,"",""));
    numJournal++;
  });

  return ecritures;
}

export default function ExportsFEC() {
  const [annee,       setAnnee]       = useState(new Date().getFullYear());
  const [periodeType, setPeriodeType] = useState("annee");
  const [moisDebut,   setMoisDebut]   = useState(0);
  const [moisFin,     setMoisFin]     = useState(11);
  const [siren,       setSiren]       = useState("");
  const [raisonSociale, setRaisonSociale] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [stats,       setStats]       = useState(null);
  const [preview,     setPreview]     = useState([]);
  const [sources,     setSources]     = useState({ recettes:true, depenses:true, factures_fournisseurs:true, transactions:true });

  const toggleSource = (k) => setSources(s => ({ ...s, [k]: !s[k] }));

  const getDateRange = () => {
    const debut = periodeType==="annee" ? `${annee}-01-01` : `${annee}-${String(moisDebut+1).padStart(2,"0")}-01`;
    const fin   = periodeType==="annee" ? `${annee}-12-31` : new Date(annee,moisFin+1,0).toISOString().split("T")[0];
    return { debut, fin };
  };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      const { debut, fin } = getDateRange();
      const [{ data:r },{ data:d },{ data:f },{ data:t }] = await Promise.all([
        sources.recettes ? supabasePro.from("invoices").select("*").eq("user_id",user.id).gte("date",debut).lte("date",fin) : {data:[]},
        sources.depenses ? supabasePro.from("expenses").select("*").eq("user_id",user.id).gte("date",debut).lte("date",fin) : {data:[]},
        sources.factures_fournisseurs ? supabasePro.from("factures_fournisseurs").select("*").eq("user_id",user.id).gte("date_facture",debut).lte("date_facture",fin) : {data:[]},
        sources.transactions ? supabasePro.from("bank_transactions").select("*").eq("user_id",user.id).gte("date",debut).lte("date",fin) : {data:[]},
      ]);
      const rec=r||[], dep=d||[], fac=f||[], tx=t||[];
      setStats({ nbRecettes:rec.length, totalRecettes:rec.reduce((s,x)=>s+Number(x.montant_ht||x.montant||0),0), nbDepenses:dep.length, totalDepenses:dep.reduce((s,x)=>s+Number(x.montant_ht||x.montant||0),0), nbFactures:fac.length, totalFactures:fac.reduce((s,x)=>s+Number(x.montant_ht||0),0), nbTransactions:tx.length, total:rec.length+dep.length+fac.length+tx.length });
      setPreview(genererEcrituresFEC(rec,dep,fac,tx,siren).slice(0,10));
    } catch(e){ console.error(e); } finally { setLoading(false); }
  };

  useEffect(()=>{ fetchStats(); },[annee,moisDebut,moisFin,periodeType,sources]);

  const exporterFEC = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabasePro.auth.getUser();
      const { debut, fin } = getDateRange();
      const [{ data:r },{ data:d },{ data:f },{ data:t }] = await Promise.all([
        sources.recettes ? supabasePro.from("invoices").select("*").eq("user_id",user.id).gte("date",debut).lte("date",fin) : {data:[]},
        sources.depenses ? supabasePro.from("expenses").select("*").eq("user_id",user.id).gte("date",debut).lte("date",fin) : {data:[]},
        sources.factures_fournisseurs ? supabasePro.from("factures_fournisseurs").select("*").eq("user_id",user.id).gte("date_facture",debut).lte("date_facture",fin) : {data:[]},
        sources.transactions ? supabasePro.from("bank_transactions").select("*").eq("user_id",user.id).gte("date",debut).lte("date",fin) : {data:[]},
      ]);
      const ecritures = genererEcrituresFEC(r||[],d||[],f||[],t||[],siren);
      const entete = "JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|Debit|Credit|EcritureLib|ValidDate|Montantdevise|Idevise";
      const blob = new Blob(["\uFEFF"+[entete,...ecritures].join("\n")], { type:"text/plain;charset=utf-8;" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = siren ? `${siren}FEC${annee}1231.txt` : `FEC_${annee}_export.txt`;
      a.click();
    } catch(e){ console.error(e); } finally { setLoading(false); }
  };

  return (
    <div style={{ padding:32, maxWidth:900, margin:"0 auto", fontFamily:"'Nunito Sans', sans-serif" }}>

      {/* En-tête */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ margin:0, fontSize:26, fontWeight:700, color:"#EDE8DB", fontFamily:"'Cormorant Garamond', serif", display:'flex', alignItems:'center', gap:10 }}>
          Exports FEC <Tooltip text={TIPS.exports_fec} size={16}/>
        </h1>
        <p style={{ margin:"4px 0 0", color:"rgba(237,232,219,0.4)", fontSize:14 }}>
          Fichier des Écritures Comptables — Format légal pour le contrôle fiscal (art. L.47 A du LPF)
        </p>
      </div>

      {/* Bandeau info */}
      <div style={{ background:"rgba(91,163,199,0.08)", border:"1px solid rgba(91,163,199,0.3)", borderRadius:12, padding:"14px 18px", marginBottom:24, display:"flex", gap:12, alignItems:"flex-start" }}>
        <span style={{ color:"#2563eb", flexShrink:0, marginTop:1 }}><Icon.Info /></span>
        <div style={{ fontSize:13, color:"#5BA3C7", lineHeight:1.6 }}>
          Le FEC est un fichier obligatoire remis à l'administration fiscale lors d'un contrôle. Il contient l'ensemble des écritures comptables de l'exercice dans un format normalisé.
          <br /><span style={{ fontWeight:700 }}>Ce fichier est à remettre à votre expert-comptable pour validation avant tout usage officiel.</span>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

        {/* Colonne gauche */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          <Section titre={<span style={{display:'flex',alignItems:'center',gap:6}}>Identité de la société <Tooltip text={TIPS.siret} size={12}/></span>}>
            <Field label={<span style={{display:'flex',alignItems:'center',gap:4}}>SIREN (9 chiffres) <Tooltip text={TIPS.siret} size={11}/></span>}>
              <input value={siren} onChange={e=>setSiren(e.target.value.replace(/\D/g,"").slice(0,9))} style={inputStyle} placeholder="123456789" maxLength={9}/>
            </Field>
            <Field label="Raison sociale">
              <input value={raisonSociale} onChange={e=>setRaisonSociale(e.target.value)} style={inputStyle} placeholder="Ma Société SAS"/>
            </Field>
          </Section>

          <Section titre="Période">
            <Field label="Exercice">
              <select value={annee} onChange={e=>setAnnee(Number(e.target.value))} style={inputStyle}>
                {ANNEES.map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Granularité">
              <div style={{ display:"flex", gap:8 }}>
                {[{id:"annee",label:"Année complète"},{id:"mois",label:"Période personnalisée"}].map(o=>(
                  <button key={o.id} onClick={()=>setPeriodeType(o.id)} style={{ flex:1, padding:"7px 10px", borderRadius:8, border:"1px solid", borderColor:periodeType===o.id?"#5BA3C7":"rgba(255,255,255,0.1)", background:periodeType===o.id?"rgba(91,163,199,0.08)":"rgba(255,255,255,0.04)", color:periodeType===o.id?"#5BA3C7":"#EDE8DB", fontWeight:periodeType===o.id?700:400, fontSize:13, cursor:"pointer", fontFamily:"inherit" }}>{o.label}</button>
                ))}
              </div>
            </Field>
            {periodeType==="mois" && (<>
              <Field label="Mois de début"><select value={moisDebut} onChange={e=>setMoisDebut(Number(e.target.value))} style={inputStyle}>{MOIS_FR.map((m,i)=><option key={i} value={i}>{m}</option>)}</select></Field>
              <Field label="Mois de fin"><select value={moisFin} onChange={e=>setMoisFin(Number(e.target.value))} style={inputStyle}>{MOIS_FR.map((m,i)=><option key={i} value={i}>{m}</option>)}</select></Field>
            </>)}
          </Section>

          <Section titre="Sources de données">
            {[
              { k:"recettes",              label:"Recettes / Factures clients",  tip:TIPS.recettes },
              { k:"depenses",              label:"Dépenses & Frais",             tip:TIPS.depenses },
              { k:"factures_fournisseurs", label:"Factures fournisseurs",        tip:null },
              { k:"transactions",          label:"Transactions bancaires",       tip:TIPS.rapprochement },
            ].map(s=>(
              <div key={s.k} onClick={()=>toggleSource(s.k)} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:8, cursor:"pointer", border:`1px solid ${sources[s.k]?"#5BA3C7":"rgba(255,255,255,0.1)"}`, background:sources[s.k]?"rgba(91,163,199,0.08)":"rgba(255,255,255,0.03)", transition:"all 150ms ease" }}>
                <div style={{ width:20, height:20, borderRadius:6, flexShrink:0, background:sources[s.k]?"#5BA3C7":"rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {sources[s.k]&&<span style={{ color:"rgba(255,255,255,0.04)", fontSize:12 }}>✓</span>}
                </div>
                <span style={{ fontSize:14, color:sources[s.k]?"#5BA3C7":"rgba(237,232,219,0.4)", fontWeight:sources[s.k]?600:400, flex:1 }}>{s.label}</span>
                {s.tip && <Tooltip text={s.tip} size={11}/>}
              </div>
            ))}
          </Section>
        </div>

        {/* Colonne droite */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>

          <Section titre={<span style={{display:'flex',alignItems:'center',gap:6}}>Récapitulatif de la période <Tooltip text={TIPS.exports_fec} size={12}/></span>}>
            {loading ? (
              <div style={{ textAlign:"center", padding:30, color:"rgba(237,232,219,0.4)" }}>Analyse en cours...</div>
            ) : stats ? (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { label:"Recettes",              nb:stats.nbRecettes,     montant:stats.totalRecettes,  color:"#5BC78A" },
                  { label:"Dépenses",              nb:stats.nbDepenses,     montant:stats.totalDepenses,  color:"#ef4444" },
                  { label:"Factures fournisseurs", nb:stats.nbFactures,     montant:stats.totalFactures,  color:"#f59e0b" },
                  { label:"Transactions bancaires",nb:stats.nbTransactions, montant:null,                  color:"#5BA3C7" },
                ].map(s=>(
                  <div key={s.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:"rgba(255,255,255,0.03)", borderRadius:8, border:"1px solid rgba(255,255,255,0.08)" }}>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:"#EDE8DB" }}>{s.label}</div>
                      <div style={{ fontSize:12, color:"rgba(237,232,219,0.4)" }}>{s.nb} entrée{s.nb!==1?"s":""}</div>
                    </div>
                    {s.montant!==null && <div style={{ fontSize:14, fontWeight:700, color:s.color }}>{s.montant.toLocaleString("fr-FR",{style:"currency",currency:"EUR"})}</div>}
                  </div>
                ))}
                <div style={{ background:"rgba(91,199,138,0.08)", border:"1px solid rgba(91,199,138,0.3)", borderRadius:8, padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:14, fontWeight:700, color:"#5BC78A" }}>Total écritures FEC</span>
                  <span style={{ fontSize:18, fontWeight:800, color:"#5BC78A" }}>{stats.total}</span>
                </div>
              </div>
            ) : <div style={{ textAlign:"center", padding:30, color:"rgba(237,232,219,0.4)" }}>Aucune donnée</div>}
          </Section>

          {preview.length>0 && (
            <Section titre="Aperçu des premières écritures">
              <div style={{ overflowX:"auto", fontSize:11, fontFamily:"monospace", background:"rgba(0,0,0,0.4)", color:"#EDE8DB", borderRadius:8, padding:12, lineHeight:1.8 }}>
                <div style={{ color:"#94a3b8", marginBottom:6, fontSize:10 }}>JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|...</div>
                {preview.map((ligne,i)=>(
                  <div key={i} style={{ borderBottom:"1px solid rgba(255,255,255,0.05)", paddingBottom:2 }}>
                    {ligne.substring(0,80)}{ligne.length>80?"...":""}
                  </div>
                ))}
              </div>
            </Section>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            <button onClick={exporterFEC} disabled={loading||!stats||stats.total===0} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:8, background:stats&&stats.total>0?"#5BA3C7":"rgba(255,255,255,0.1)", color:stats&&stats.total>0?"#fff":"rgba(237,232,219,0.4)", border:"none", padding:"14px 20px", borderRadius:10, fontWeight:700, fontSize:15, cursor:stats&&stats.total>0?"pointer":"not-allowed", fontFamily:"inherit", transition:"background 150ms ease" }}>
              <Icon.Download/>
              {loading?"Génération en cours...":`Exporter le FEC ${annee}`}
            </button>
            {siren && <div style={{ fontSize:12, color:"rgba(237,232,219,0.4)", textAlign:"center" }}>Nom du fichier : <span style={{ fontFamily:"monospace", color:"#EDE8DB" }}>{siren}FEC{annee}1231.txt</span></div>}
            <div style={{ background:"rgba(212,168,83,0.08)", border:"1px solid rgba(212,168,83,0.15)", borderRadius:10, padding:"12px 14px", display:"flex", gap:10 }}>
              <span style={{ color:"#d97706", flexShrink:0 }}><Icon.Alert/></span>
              <p style={{ margin:0, fontSize:12, color:"#D4A853", lineHeight:1.6 }}>Ce fichier est généré à titre préparatoire. Il doit être vérifié et validé par votre expert-comptable avant toute remise à l'administration fiscale.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ titre, children }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:20, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" }}>
      <h3 style={{ margin:"0 0 14px", fontSize:14, fontWeight:700, color:"#EDE8DB", textTransform:"uppercase", letterSpacing:"0.05em", display:'flex', alignItems:'center', gap:6 }}>{titre}</h3>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <label style={{ fontSize:12, fontWeight:600, color:"rgba(237,232,219,0.4)", display:'flex', alignItems:'center', gap:4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = { padding:"8px 12px", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, fontSize:14, color:"#EDE8DB", background:"#1a1d24", outline:"none", fontFamily:"inherit", width:"100%", boxSizing:"border-box" };
