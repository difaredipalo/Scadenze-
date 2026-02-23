
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppData, EntityType, Cantiere, Personale, Mezzo, Documento, CantiereStato, MezzoStato, AppSettings } from './types';
import { Icons, COLORS } from './constants';
import StatCard from './components/StatCard';
import AddModal from './components/AddModal';
import EditCantiereModal from './components/EditCantiereModal';
import EditPersonaleModal from './components/EditPersonaleModal';
import EditMezzoModal from './components/EditMezzoModal';
import EditDocumentoModal from './components/EditDocumentoModal';
import { getInsights } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const INITIAL_DATA: AppData = {
  cantieri: [
    { 
      id: '1', nome: 'Residenze Parco', cliente: 'EdilPark SRL', scadenza: '2024-12-15', stato: 'aperto', progresso: 65, importoTotale: 150000, indirizzo: 'Via Parco 12, Milano', direttoreLavori: 'Arch. Bianchi',
      tecnici: [{ nome: 'Ing. Rossi', ruolo: 'Sicurezza', contatto: '333 1234567' }],
      checklistDocumenti: [{ id: '1', titolo: 'DURC', completato: true }, { id: '2', titolo: 'POS', completato: false }],
      salList: [{ id: '1', titolo: 'Finiture Esterne', data: '2024-09-10', importo: 97500 }],
      subappalti: [{ id: '1', azienda: 'PosaInfissi SRL', lavoro: 'Serramenti', prezzoOriginale: 12000, maggiorazione: 10 }]
    },
    { id: '2', nome: 'Riqualificazione Centro', cliente: 'Comune Milano', scadenza: '2025-03-20', stato: 'in apertura', progresso: 10, importoTotale: 500000, indirizzo: 'Piazza Duomo, Milano', tecnici: [], checklistDocumenti: [], salList: [], subappalti: [] },
  ],
  personale: [
    { id: 'p1', nome: 'Mario', cognome: 'Rossi', ruolo: 'Capocantiere', scadenzaContratto: '2025-06-30', scadenzaVisitaMedica: '2024-11-15', corsiFormazione: [] },
    { id: 'p2', nome: 'Luigi', cognome: 'Verdi', ruolo: 'Operaio Specializzato', scadenzaContratto: '2024-12-31', scadenzaVisitaMedica: '2024-09-20', corsiFormazione: [] },
  ],
  mezzi: [
    { id: 'm1', modello: 'Iveco Eurocargo', targa: 'EF123GH', scadenzaAssicurazione: '2024-12-01', prossimaRevisione: '2025-02-15', stato: 'in_uso', storicoManutenzioni: [] },
    { id: 'm2', modello: 'Caterpillar 320', targa: 'ESC-001', scadenzaAssicurazione: '2024-10-15', prossimaRevisione: '2024-11-10', stato: 'disponibile', storicoManutenzioni: [] },
  ],
  documenti: [
    { id: 'd1', titolo: 'DURC Regolare', categoria: 'Aziendale', scadenza: '2024-10-30', ente: 'INPS', priorita: 'alta' },
    { id: 'd2', titolo: 'POS Cantiere A', categoria: 'Sicurezza', scadenza: '2024-12-15', ente: 'ASL', priorita: 'media' },
  ],
  settings: {
    nomeAzienda: 'Edilizia Generale SRL'
  }
};

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('scadenze_plus_data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | EntityType | 'impostazioni'>('dashboard');
  const [aiInsight, setAiInsight] = useState<string>('Analisi in corso...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCantiere, setSelectedCantiere] = useState<Cantiere | null>(null);
  const [selectedPersonale, setSelectedPersonale] = useState<Personale | null>(null);
  const [selectedMezzo, setSelectedMezzo] = useState<Mezzo | null>(null);
  const [selectedDocumento, setSelectedDocumento] = useState<Documento | null>(null);

  useEffect(() => {
    localStorage.setItem('scadenze_plus_data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const insight = await getInsights(data);
        setAiInsight(insight);
      } catch (e) { setAiInsight("Suggerimenti non disponibili."); }
    };
    if (activeTab === 'dashboard') loadInsights();
  }, [data, activeTab]);

  const getPluralKey = (type: EntityType): keyof Omit<AppData, 'settings'> => {
    switch (type) {
      case 'cantiere': return 'cantieri';
      case 'personale': return 'personale';
      case 'mezzo': return 'mezzi';
      case 'documento': return 'documenti';
    }
  };

  const filteredData = useMemo(() => {
    const s = search.toLowerCase();
    return {
      cantieri: data.cantieri.filter(c => c.nome.toLowerCase().includes(s) || c.cliente.toLowerCase().includes(s)),
      personale: data.personale.filter(p => p.nome.toLowerCase().includes(s) || p.cognome.toLowerCase().includes(s)),
      mezzi: data.mezzi.filter(m => m.modello.toLowerCase().includes(s) || m.targa.toLowerCase().includes(s)),
      documenti: data.documenti.filter(d => d.titolo.toLowerCase().includes(s)),
    };
  }, [data, search]);

  const alerts = useMemo(() => {
    const today = new Date();
    const list: { type: string; title: string; date: string; status: 'critical' | 'warning' }[] = [];
    const check = (dateStr: string, label: string, itemTitle: string) => {
      if (!dateStr) return;
      const d = new Date(dateStr);
      const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 0) list.push({ type: label, title: itemTitle, date: dateStr, status: 'critical' });
      else if (diff <= 30) list.push({ type: label, title: itemTitle, date: dateStr, status: 'warning' });
    };
    data.cantieri.forEach(c => check(c.scadenza, 'Cantiere', c.nome));
    data.personale.forEach(p => { check(p.scadenzaContratto, 'Contratto', `${p.nome} ${p.cognome}`); check(p.scadenzaVisitaMedica, 'Visita', `${p.nome} ${p.cognome}`); });
    data.mezzi.forEach(m => { check(m.scadenzaAssicurazione, 'Ass.', m.modello); check(m.prossimaRevisione, 'Rev.', m.modello); });
    data.documenti.forEach(d => check(d.scadenza, 'Doc.', d.titolo));
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  const exportToPdf = (type: EntityType | 'dashboard') => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`REPORT ${type.toUpperCase()} - ${data.settings.nomeAzienda}`, 14, 20);
    let head = [], body = [];
    if (type === 'dashboard') {
      head = [['Tipo', 'Oggetto', 'Scadenza', 'Urgenza']];
      body = alerts.map(a => [a.type, a.title, a.date, a.status]);
    } else if (type === 'cantiere') {
      head = [['Nome', 'Cliente', 'Scadenza', 'Stato']];
      body = filteredData.cantieri.map(c => [c.nome, c.cliente, c.scadenza, c.stato]);
    } else if (type === 'personale') {
      head = [['Nome', 'Ruolo', 'Contratto', 'Visita']];
      body = filteredData.personale.map(p => [`${p.nome} ${p.cognome}`, p.ruolo, p.scadenzaContratto, p.scadenzaVisitaMedica]);
    } else if (type === 'mezzo') {
      head = [['Modello', 'Targa', 'Ass.', 'Rev.']];
      body = filteredData.mezzi.map(m => [m.modello, m.targa, m.scadenzaAssicurazione, m.prossimaRevisione]);
    } else if (type === 'documento') {
      head = [['Titolo', 'Ente', 'Scadenza', 'Priorità']];
      body = filteredData.documenti.map(d => [d.titolo, d.ente, d.scadenza, d.priorita]);
    }
    (doc as any).autoTable({ startY: 30, head, body, theme: 'grid', headStyles: { fillColor: [15, 23, 42] } });
    doc.save(`Export_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = (type: EntityType) => {
    const ws = XLSX.utils.json_to_sheet(filteredData[getPluralKey(type)]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, type.toUpperCase());
    XLSX.writeFile(wb, `Export_${type}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleFullExcelExport = () => {
    const wb = XLSX.utils.book_new();
    
    // Foglio Cantieri
    const wsCantieri = XLSX.utils.json_to_sheet(data.cantieri.map(c => ({
      Nome: c.nome, Cliente: c.cliente, Scadenza: c.scadenza, Stato: c.stato, Progresso: c.progresso + '%'
    })));
    XLSX.utils.book_append_sheet(wb, wsCantieri, "CANTIERI");

    // Foglio Personale
    const wsPersonale = XLSX.utils.json_to_sheet(data.personale.map(p => ({
      Nome: p.nome, Cognome: p.cognome, Ruolo: p.ruolo, Scadenza_Contratto: p.scadenzaContratto, Scadenza_Visita: p.scadenzaVisitaMedica
    })));
    XLSX.utils.book_append_sheet(wb, wsPersonale, "PERSONALE");

    // Foglio Mezzi
    const wsMezzi = XLSX.utils.json_to_sheet(data.mezzi.map(m => ({
      Modello: m.modello, Targa: m.targa, Assicurazione: m.scadenzaAssicurazione, Revisione: m.prossimaRevisione, Stato: m.stato
    })));
    XLSX.utils.book_append_sheet(wb, wsMezzi, "MEZZI");

    // Foglio Documenti
    const wsDoc = XLSX.utils.json_to_sheet(data.documenti.map(d => ({
      Titolo: d.titolo, Categoria: d.categoria, Scadenza: d.scadenza, Ente: d.ente, Priorita: d.priorita
    })));
    XLSX.utils.book_append_sheet(wb, wsDoc, "ARCHIVIO");

    XLSX.writeFile(wb, `Database_Completo_${data.settings.nomeAzienda.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleJsonExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_scadenze_plus_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const imported = JSON.parse(evt.target?.result as string);
        if (imported.cantieri && imported.personale) {
          setData(imported);
          alert("Backup ripristinato con successo!");
        }
      } catch (err) { alert("Errore: file non valido."); }
    };
    reader.readAsText(file);
  };

  const deleteEntity = (type: EntityType, id: string) => {
    if (!window.confirm("Eliminare definitivamente?")) return;
    const key = getPluralKey(type);
    setData(prev => ({ ...prev, [key]: (prev[key] as any[]).filter(i => i.id !== id) }));
  };

  const updateEntity = (type: EntityType, updated: any) => {
    const key = getPluralKey(type);
    setData(prev => ({ ...prev, [key]: (prev[key] as any[]).map(i => i.id === updated.id ? updated : i) }));
  };

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard label="Cantieri" value={data.cantieri.length} icon={<Icons.Cantiere />} color={COLORS.secondary} />
        <StatCard label="Personale" value={data.personale.length} icon={<Icons.Personale />} color={COLORS.success} />
        <StatCard label="Mezzi" value={data.mezzi.length} icon={<Icons.Mezzi />} color={COLORS.accent} />
        <StatCard label="Scadenze" value={alerts.length} icon={<Icons.Documenti />} color={COLORS.danger} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Analisi Flussi</h3>
            <button onClick={() => exportToPdf('dashboard')} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
              <Icons.Pdf /> REPORT PDF
            </button>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{n:'Cantieri',v:data.cantieri.length}, {n:'Personale',v:data.personale.length}, {n:'Mezzi',v:data.mezzi.length}, {n:'Doc',v:data.documenti.length}]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="v" radius={[10, 10, 0, 0]} barSize={50}>
                  {[COLORS.secondary, COLORS.success, COLORS.accent, COLORS.danger].map((c, i) => <Cell key={i} fill={c} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex flex-col shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-6">Gemini AI Assistant</h3>
            <p className="text-lg font-medium italic text-slate-200 leading-relaxed mb-8">"{aiInsight}"</p>
            <div className="pt-6 border-t border-slate-800 space-y-4">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Focus Urgenti</p>
               <div className="space-y-3 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                 {alerts.slice(0, 5).map((a, i) => (
                   <div key={i} className="flex items-center justify-between text-xs">
                     <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${a.status==='critical'?'bg-red-500':'bg-amber-500'}`} />
                        <span className="font-bold text-slate-300 truncate max-w-[120px]">{a.title}</span>
                     </div>
                     <span className="text-[10px] text-slate-500 font-black">{new Date(a.date).toLocaleDateString()}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full -mr-32 -mt-32"></div>
        </div>
      </div>
    </div>
  );

  const renderList = (type: EntityType) => {
    const items = filteredData[getPluralKey(type)];
    return (
      <div className="animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white px-8 py-4 rounded-[2rem] border border-slate-100 mb-6 flex items-center justify-between">
           <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{type}</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase">Database records filtrati</p>
           </div>
           <div className="flex gap-2">
              <button onClick={() => exportToPdf(type)} title="PDF" className="p-2.5 bg-slate-50 text-slate-400 hover:text-red-500 rounded-xl transition-all"><Icons.Pdf /></button>
              <button onClick={() => exportToExcel(type)} title="Excel" className="p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-all"><Icons.Excel /></button>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {items.map((item: any) => (
            <div key={item.id} onClick={() => {
              if (type==='cantiere') setSelectedCantiere(item);
              if (type==='personale') setSelectedPersonale(item);
              if (type==='mezzo') setSelectedMezzo(item);
              if (type==='documento') setSelectedDocumento(item);
            }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-50 transition-colors">
                  {type === 'cantiere' && <Icons.Cantiere />}
                  {type === 'personale' && <Icons.Personale />}
                  {type === 'mezzo' && <Icons.Mezzi />}
                  {type === 'documento' && <Icons.Documenti />}
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteEntity(type, item.id); }} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Icons.Trash />
                </button>
              </div>
              <h4 className="text-lg font-black text-slate-900 truncate">{item.nome || item.modello || item.titolo} {item.cognome || ''}</h4>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1">{item.cliente || item.ruolo || item.targa || item.ente}</p>
              <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-300 uppercase">Scadenza</span>
                  <span className="text-xs font-bold text-slate-600">{item.scadenza || item.scadenzaContratto || item.scadenzaAssicurazione}</span>
                </div>
                <div className="px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-black text-slate-500 uppercase">{item.stato || item.priorita || 'Attivo'}</div>
              </div>
            </div>
          ))}
          <button onClick={() => setIsModalOpen(true)} className="border-4 border-dashed border-slate-100 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 text-slate-300 hover:text-blue-500 hover:bg-blue-50/30 transition-all">
            <Icons.Plus />
            <span className="text-[10px] font-black uppercase tracking-widest">Aggiungi {type}</span>
          </button>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-2xl font-black text-slate-900 uppercase mb-8">Configurazione Sistema</h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Impresa</label>
            <input type="text" value={data.settings.nomeAzienda} onChange={(e)=>setData({...data, settings: {...data.settings, nomeAzienda: e.target.value}})} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 focus:border-blue-500 outline-none transition-all" />
          </div>
          
          <div className="pt-8 border-t border-slate-50">
             <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Backup & Esportazione Dati</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={handleJsonExport} className="flex items-center justify-center gap-2 p-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">
                   <Icons.Export /> Backup JSON (Totale)
                </button>
                <button onClick={handleFullExcelExport} className="flex items-center justify-center gap-2 p-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all">
                   <Icons.Excel /> Export Excel (Totale)
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 p-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all md:col-span-2">
                   <Icons.Import /> Ripristina Database da JSON
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleJsonImport} />
             </div>
             <p className="mt-6 text-[10px] text-slate-400 italic text-center font-medium">L'export Excel genererà un file con 4 fogli separati per ogni categoria.</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-[#f8fafc] overflow-hidden">
      {/* Sidebar ERP */}
      <aside className="w-24 md:w-72 bg-white border-r border-slate-100 flex flex-col shrink-0 z-30 transition-all duration-500">
        <div className="p-8 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/30 shrink-0"><Icons.Cantiere /></div>
          <div className="hidden md:flex flex-col">
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none text-slate-900">SCADENZE +</h1>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5">GESTIONALE AZIENDE</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-6">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <Icons.Dashboard /> },
            { id: 'cantiere', label: 'Cantieri', icon: <Icons.Cantiere /> },
            { id: 'personale', label: 'Personale', icon: <Icons.Personale /> },
            { id: 'mezzo', label: 'Mezzi', icon: <Icons.Mezzi /> },
            { id: 'documento', label: 'Archivio', icon: <Icons.Documenti /> },
            { id: 'impostazioni', label: 'Setup', icon: <Icons.Settings /> },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
              {item.icon}
              <span className="hidden md:block font-black text-[10px] uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Firma Azienda in Sidebar */}
        <div className="p-8 border-t border-slate-50">
           <div className="hidden md:block bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Impresa attiva</p>
              <p className="text-xs font-black text-slate-900 truncate">{data.settings.nomeAzienda}</p>
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 shrink-0">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-4 flex items-center text-slate-300"><Icons.Search /></span>
            <input type="text" placeholder="Ricerca rapida database..." className="w-full pl-12 pr-6 py-3 bg-slate-50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/10 outline-none transition-all" value={search} onChange={(e)=>setSearch(e.target.value)} />
          </div>
          <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg hover:scale-105 active:scale-95">
            + NUOVO RECORD
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          {activeTab === 'dashboard' ? renderDashboard() : 
           activeTab === 'impostazioni' ? renderSettings() : renderList(activeTab)}
        </div>
      </main>

      {/* MODALI */}
      <AddModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)} onAdd={(t,d)=>setData({...data, [getPluralKey(t)]: [...(data[getPluralKey(t)] as any[]), d]})} defaultType={activeTab!=='dashboard'&&activeTab!=='impostazioni'?activeTab as EntityType:'cantiere'} />
      <EditCantiereModal isOpen={!!selectedCantiere} cantiere={selectedCantiere} onClose={()=>setSelectedCantiere(null)} onSave={(u)=>updateEntity('cantiere', u)} />
      <EditPersonaleModal isOpen={!!selectedPersonale} personale={selectedPersonale} onClose={()=>setSelectedPersonale(null)} onSave={(u)=>updateEntity('personale', u)} />
      <EditMezzoModal isOpen={!!selectedMezzo} mezzo={selectedMezzo} onClose={()=>setSelectedMezzo(null)} onSave={(u)=>updateEntity('mezzo', u)} />
      <EditDocumentoModal isOpen={!!selectedDocumento} documento={selectedDocumento} onClose={()=>setSelectedDocumento(null)} onSave={(u)=>updateEntity('documento', u)} />
    </div>
  );
};

export default App;
