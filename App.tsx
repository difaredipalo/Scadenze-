
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppData, EntityType, Cantiere, Personale, Mezzo, Documento, CantiereStato, MezzoStato, AppSettings } from './types';
import { Icons, COLORS } from './constants';
import StatCard from './components/StatCard';
import AddModal from './components/AddModal';
import EditCantiereModal from './components/EditCantiereModal';
import EditPersonaleModal from './components/EditPersonaleModal';
import EditMezzoModal from './components/EditMezzoModal';
import EditDocumentoModal from './components/EditDocumentoModal';
import { BadgeGeneratorModal } from './components/BadgeGeneratorModal';
import GaraCalculator from './components/GaraCalculator';
import Login from './components/Login';
import { getInsights, getGeminiApiKey, saveGeminiApiKey, testGeminiApiKey } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  checkSupabaseConnection,
  fetchAllDataFromSupabase,
  syncAllDataToSupabase,
  getSupabaseSQLSchema,
  SupabaseConfig,
} from './services/supabaseService';

const INITIAL_DATA: AppData = {
  cantieri: [
    { 
      id: '1', nome: 'Residenze Parco', cliente: 'EdilPark SRL', scadenza: '2025-12-15', stato: 'aperto', progresso: 65, importoTotale: 150000, indirizzo: 'Via Parco 12, Milano', direttoreLavori: 'Arch. Bianchi',
      tecnici: [{ nome: 'Ing. Rossi', ruolo: 'Sicurezza', contatto: '333 1234567' }],
      checklistDocumenti: [{ id: '1', titolo: 'DURC', completato: true }, { id: '2', titolo: 'POS', completato: false }],
      salList: [{ id: '1', titolo: 'Finiture Esterne', data: '2025-09-10', importo: 97500 }],
      subappalti: [{ id: '1', azienda: 'PosaInfissi SRL', lavoro: 'Serramenti', prezzoOriginale: 12000, maggiorazione: 10 }]
    },
    { id: '2', nome: 'Riqualificazione Centro', cliente: 'Comune Milano', scadenza: '2026-03-20', stato: 'in apertura', progresso: 10, importoTotale: 500000, indirizzo: 'Piazza Duomo, Milano', tecnici: [], checklistDocumenti: [], salList: [], subappalti: [] },
  ],
  personale: [
    { id: 'p1', nome: 'Mario', cognome: 'Rossi', ruolo: 'Capocantiere', categoria: 'operaio', dataNascita: '1980-01-15', luogoNascita: 'Roma (RM)', dataAssunzione: '2023-03-01', codiceFiscale: 'RSSMRA80A01H501Z', scadenzaContratto: '2026-06-30', scadenzaVisitaMedica: '2025-11-15', inForza: true, corsiFormazione: [] },
    { id: 'p2', nome: 'Luigi', cognome: 'Verdi', ruolo: 'Operaio Specializzato', categoria: 'operaio', dataNascita: '1985-06-20', luogoNascita: 'Milano (MI)', dataAssunzione: '2024-01-15', codiceFiscale: 'VRDLGU85B12F205W', scadenzaContratto: '2025-12-31', scadenzaVisitaMedica: '2025-09-20', inForza: true, corsiFormazione: [] },
  ],
  mezzi: [
    { id: 'm1', modello: 'Iveco Eurocargo', targa: 'EF123GH', scadenzaAssicurazione: '2025-12-01', prossimaRevisione: '2026-02-15', stato: 'disponibile', storicoManutenzioni: [] },
    { id: 'm2', modello: 'Caterpillar 320', targa: 'ESC-001', scadenzaAssicurazione: '2025-10-15', prossimaRevisione: '2025-11-10', stato: 'non in uso', storicoManutenzioni: [] },
  ],
  documenti: [
    { id: 'd1', titolo: 'DURC Regolare', categoria: 'Aziendale', scadenza: '2025-10-30', ente: 'INPS', priorita: 'alta' },
    { id: 'd2', titolo: 'POS Cantiere A', categoria: 'Sicurezza', scadenza: '2025-12-15', ente: 'ASL', priorita: 'media' },
  ],
  settings: {
    nomeAzienda: 'Edilizia Generale SRL',
    theme: 'light',
    username: 'admin',
    password: 'admin'
  }
};

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('scadenze_plus_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.personale = (parsed.personale || []).map((p: any) => ({
          ...p,
          categoria: p.categoria || 'operaio',
          inForza: p.inForza !== undefined ? p.inForza : true
        }));
        parsed.mezzi = (parsed.mezzi || []).map((m: any) => ({
          ...m,
          stato: m.stato === 'in_uso' ? 'disponibile' : (m.stato || 'disponibile')
        }));
        parsed.cantieri = (parsed.cantieri || []).map((c: any) => ({
          ...c,
          extraList: c.extraList || []
        }));
        if (!parsed.settings) parsed.settings = { ...INITIAL_DATA.settings };
        if (!parsed.settings.theme) parsed.settings.theme = 'light';
        if (!parsed.settings.username) parsed.settings.username = 'admin';
        if (!parsed.settings.password) parsed.settings.password = 'admin';
        if (!parsed.cantieri) parsed.cantieri = INITIAL_DATA.cantieri;
        if (!parsed.mezzi) parsed.mezzi = INITIAL_DATA.mezzi;
        if (!parsed.documenti) parsed.documenti = INITIAL_DATA.documenti;
        return parsed;
      } catch (e) {
        return INITIAL_DATA;
      }
    }
    return INITIAL_DATA;
  });

  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem('scadenze_plus_is_logged_in');
      return savedAuth === 'true';
    } catch {
      return false;
    }
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | EntityType | 'calcolatore' | 'impostazioni'>('dashboard');
  const [showOnlyActivePersonale, setShowOnlyActivePersonale] = useState(true);
  const [hideClosedCantieri, setHideClosedCantieri] = useState(false);
  const [hideNotInUseMezzi, setHideNotInUseMezzi] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [aiInsight, setAiInsight] = useState<string>('Analisi in corso...');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedCantiere, setSelectedCantiere] = useState<Cantiere | null>(null);
  const [selectedPersonale, setSelectedPersonale] = useState<Personale | null>(null);
  const [selectedMezzo, setSelectedMezzo] = useState<Mezzo | null>(null);
  const [selectedDocumento, setSelectedDocumento] = useState<Documento | null>(null);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [badgePersonaleId, setBadgePersonaleId] = useState<string | undefined>(undefined);

  // Gemini AI State
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => getGeminiApiKey());
  const [isTestingGemini, setIsTestingGemini] = useState(false);

  const handleSaveGeminiKey = async () => {
    saveGeminiApiKey(geminiKeyInput);
    setIsTestingGemini(true);
    try {
      if (geminiKeyInput && geminiKeyInput.trim().length > 0) {
        const testRes = await testGeminiApiKey(geminiKeyInput);
        if (testRes.ok) {
          showCloudToast('success', 'Gemini AI collegato e attivo!');
        } else {
          showCloudToast('error', testRes.message);
        }
      } else {
        showCloudToast('info', 'Chiave API rimossa. L\'assistente userà l\'analisi euristica locale.');
      }
      const result = await getInsights(data);
      setAiInsight(result);
    } catch (err: any) {
      showCloudToast('error', 'Errore durante la verifica della chiave Gemini.');
    } finally {
      setIsTestingGemini(false);
    }
  };

  // Supabase Cloud State
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => getSupabaseConfig());
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    checking: boolean;
    message: string;
    latencyMs?: number;
  }>({
    connected: false,
    checking: false,
    message: 'Non verificato',
  });
  const [isSyncingToCloud, setIsSyncingToCloud] = useState(false);
  const [isPullingFromCloud, setIsPullingFromCloud] = useState(false);
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(() => localStorage.getItem('scadenze_last_cloud_sync'));
  const [cloudToast, setCloudToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const isInitialCloudLoadDone = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showCloudToast = (type: 'success' | 'error' | 'info', message: string) => {
    setCloudToast({ type, message });
    setTimeout(() => {
      setCloudToast(null);
    }, 4500);
  };

  const verifySupabaseConnection = async (customConfig?: SupabaseConfig, silent = false) => {
    if (customConfig) {
      saveSupabaseConfig(customConfig);
      setSupabaseConfig(customConfig);
    }
    setSupabaseStatus(prev => ({ ...prev, checking: true }));
    const res = await checkSupabaseConnection();
    setSupabaseStatus({
      connected: res.ok,
      checking: false,
      message: res.message,
      latencyMs: res.latencyMs,
    });
    if (!silent) {
      if (res.ok) {
        showCloudToast('success', res.message);
      } else {
        showCloudToast('error', res.message);
      }
    }
    return res.ok;
  };

  // Caricamento e sincronizzazione automatica iniziale all'avvio dell'app da Supabase
  useEffect(() => {
    const initCloudData = async () => {
      const cfg = getSupabaseConfig();
      if (!cfg.url || !cfg.anonKey) return;

      const isConnected = await verifySupabaseConnection(cfg, true);
      if (isConnected && !isInitialCloudLoadDone.current) {
        setIsPullingFromCloud(true);
        const res = await fetchAllDataFromSupabase();
        setIsPullingFromCloud(false);
        if (res.data) {
          setData(prev => ({
            ...prev,
            ...res.data,
            settings: {
              ...prev.settings,
              ...(res.data?.settings || {}),
            }
          }));
          const nowStr = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastCloudSync(nowStr);
          localStorage.setItem('scadenze_last_cloud_sync', nowStr);
          showCloudToast('info', 'Database Supabase sincronizzato in tempo reale!');
        } else {
          // Se il DB remoto è ancora vuoto, sincronizza i dati locali esistenti
          syncAllDataToSupabase(data);
        }
        isInitialCloudLoadDone.current = true;
      }
    };

    initCloudData();
  }, []);

  const handleSyncToSupabase = async () => {
    setIsSyncingToCloud(true);
    const res = await syncAllDataToSupabase(data);
    setIsSyncingToCloud(false);
    if (res.ok) {
      const nowStr = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastCloudSync(nowStr);
      localStorage.setItem('scadenze_last_cloud_sync', nowStr);
      setSupabaseStatus(prev => ({ ...prev, connected: true, message: 'Connessione attiva e sincronizzata' }));
      showCloudToast('success', 'Tutti i dati sono stati sincronizzati con successo sul database Supabase!');
    } else {
      showCloudToast('error', res.message);
    }
  };

  const handlePullFromSupabase = async () => {
    setIsPullingFromCloud(true);
    const res = await fetchAllDataFromSupabase();
    setIsPullingFromCloud(false);
    if (res.data) {
      setData(prev => ({
        ...prev,
        ...res.data,
        settings: {
          ...prev.settings,
          ...(res.data?.settings || {}),
        }
      }));
      const nowStr = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastCloudSync(nowStr);
      localStorage.setItem('scadenze_last_cloud_sync', nowStr);
      showCloudToast('success', 'Dati scaricati e ripristinati con successo dal database Supabase!');
    } else {
      showCloudToast('error', res.error || 'Nessun dato trovato da scaricare');
    }
  };

  const handleCopySupabaseSql = () => {
    const sql = getSupabaseSQLSchema();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    showCloudToast('success', 'Script SQL copiato negli appunti! Incollalo nel SQL Editor di Supabase.');
    setTimeout(() => setCopiedSql(false), 4000);
  };

  // Salvataggio automatico continuo su localStorage e AUTO-SYNC su Supabase Cloud (Debounced)
  useEffect(() => {
    localStorage.setItem('scadenze_plus_data', JSON.stringify(data));
    if (data.settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Auto-sync in background su Supabase ogni volta che i dati cambiano
    const cfg = getSupabaseConfig();
    if (cfg.url && cfg.anonKey && isInitialCloudLoadDone.current) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(async () => {
        setIsSyncingToCloud(true);
        const res = await syncAllDataToSupabase(data);
        setIsSyncingToCloud(false);
        if (res.ok) {
          const nowStr = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastCloudSync(nowStr);
          localStorage.setItem('scadenze_last_cloud_sync', nowStr);
        }
      }, 1000);
    }
  }, [data]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const insight = await getInsights(data);
        setAiInsight(insight);
      } catch (e) { 
        setAiInsight("Suggerimenti AI pronti non appena configurata l'API."); 
      }
    };
    if (activeTab === 'dashboard') loadInsights();
  }, [data, activeTab]);

  const getPluralKey = (type: EntityType): keyof Omit<AppData, 'settings'> => {
    switch (type) {
      case 'cantiere': return 'cantieri';
      case 'personale': return 'personale';
      case 'mezzo': return 'mezzi';
      case 'documento': return 'documenti';
      default: return 'cantieri';
    }
  };

  const filteredData = useMemo(() => {
    const s = (search || '').trim().toLowerCase();
    const cantieri = Array.isArray(data?.cantieri) ? data.cantieri : [];
    const personale = Array.isArray(data?.personale) ? data.personale : [];
    const mezzi = Array.isArray(data?.mezzi) ? data.mezzi : [];
    const documenti = Array.isArray(data?.documenti) ? data.documenti : [];

    return {
      cantieri: cantieri.filter(c => {
        if (!c) return false;
        const matchesSearch = !s || 
          (c.nome && String(c.nome).toLowerCase().includes(s)) || 
          (c.cliente && String(c.cliente).toLowerCase().includes(s)) ||
          (c.indirizzo && String(c.indirizzo).toLowerCase().includes(s)) ||
          (c.direttoreLavori && String(c.direttoreLavori).toLowerCase().includes(s)) ||
          (c.note && String(c.note).toLowerCase().includes(s)) ||
          (c.stato && String(c.stato).toLowerCase().includes(s)) ||
          (Array.isArray(c.extraList) && c.extraList.some(e => e && ((e.titolo && String(e.titolo).toLowerCase().includes(s)) || (e.descrizione && String(e.descrizione).toLowerCase().includes(s)))));
        const matchesStatus = hideClosedCantieri ? c.stato !== 'chiuso' : true;
        return Boolean(matchesSearch && matchesStatus);
      }),
      personale: personale.filter(p => {
        if (!p) return false;
        const fullName = `${p.nome || ''} ${p.cognome || ''}`.toLowerCase();
        const matchesSearch = !s || 
          (p.nome && String(p.nome).toLowerCase().includes(s)) || 
          (p.cognome && String(p.cognome).toLowerCase().includes(s)) ||
          fullName.includes(s) ||
          (p.ruolo && String(p.ruolo).toLowerCase().includes(s)) ||
          (p.categoria && String(p.categoria).toLowerCase().includes(s)) ||
          (p.codiceFiscale && String(p.codiceFiscale).toLowerCase().includes(s)) ||
          (p.note && String(p.note).toLowerCase().includes(s)) ||
          (Array.isArray(p.corsiFormazione) && p.corsiFormazione.some(c => c && c.corso && String(c.corso).toLowerCase().includes(s)));
        const matchesActive = showOnlyActivePersonale ? Boolean(p.inForza) : true;
        return Boolean(matchesSearch && matchesActive);
      }),
      mezzi: mezzi.filter(m => {
        if (!m) return false;
        const matchesSearch = !s || 
          (m.modello && String(m.modello).toLowerCase().includes(s)) || 
          (m.targa && String(m.targa).toLowerCase().includes(s)) ||
          (m.telaio && String(m.telaio).toLowerCase().includes(s)) ||
          (m.note && String(m.note).toLowerCase().includes(s)) ||
          (m.stato && String(m.stato).toLowerCase().includes(s));
        const matchesStatus = hideNotInUseMezzi ? (m.stato !== 'non in uso' && m.stato !== 'non_in_uso') : true;
        return Boolean(matchesSearch && matchesStatus);
      }),
      documenti: documenti.filter(d => {
        if (!d) return false;
        return !s || 
          (d.titolo && String(d.titolo).toLowerCase().includes(s)) || 
          (d.ente && String(d.ente).toLowerCase().includes(s)) ||
          (d.categoria && String(d.categoria).toLowerCase().includes(s)) ||
          (d.priorita && String(d.priorita).toLowerCase().includes(s)) ||
          (d.note && String(d.note).toLowerCase().includes(s));
      }),
    };
  }, [data, search, showOnlyActivePersonale, hideClosedCantieri, hideNotInUseMezzi]);

  const totalSearchResultsCount = useMemo(() => {
    if (!search || !search.trim()) return 0;
    return (filteredData.cantieri?.length || 0) + 
           (filteredData.personale?.length || 0) + 
           (filteredData.mezzi?.length || 0) + 
           (filteredData.documenti?.length || 0);
  }, [filteredData, search]);

  const alerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const list: { 
      type: string; 
      title: string; 
      date: string; 
      diffDays: number;
      diffText: string;
      status: 'critical' | 'warning';
    }[] = [];

    const check = (dateStr: string, label: string, itemTitle: string) => {
      if (!dateStr || typeof dateStr !== 'string') return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      d.setHours(0, 0, 0, 0);
      const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      const diffText = diff < 0 
        ? `Scaduto da ${Math.abs(diff)} ${Math.abs(diff) === 1 ? 'giorno' : 'giorni'}` 
        : diff === 0 
          ? 'Scade oggi' 
          : `Scade tra ${diff} ${diff === 1 ? 'giorno' : 'giorni'}`;

      if (diff < 0) {
        list.push({ type: label, title: itemTitle || 'Elemento', date: dateStr, diffDays: diff, diffText, status: 'critical' });
      } else if (diff <= 30) {
        list.push({ type: label, title: itemTitle || 'Elemento', date: dateStr, diffDays: diff, diffText, status: 'warning' });
      }
    };
    (data.cantieri || []).forEach(c => {
      if (!c) return;
      check(c.scadenza, 'Cantiere', c.nome);
      if (c.scadenzaDNL) check(c.scadenzaDNL, 'DNL', c.nome);
      if (c.scadenzaSuoloPubblico) check(c.scadenzaSuoloPubblico, 'Suolo Pubblico', c.nome);
    });
    (data.personale || []).forEach(p => { 
      if (p && p.inForza) {
        if (p.scadenzaContratto) check(p.scadenzaContratto, 'Contratto', `${p.nome || ''} ${p.cognome || ''}`.trim()); 
        check(p.scadenzaVisitaMedica, 'Visita', `${p.nome || ''} ${p.cognome || ''}`.trim()); 
        (p.corsiFormazione || []).forEach(f => {
          if (f && f.scadenza) check(f.scadenza, `Corso: ${f.corso || ''}`, `${p.nome || ''} ${p.cognome || ''}`.trim());
        });
      }
    });
    (data.mezzi || []).forEach(m => { 
      if (!m) return;
      check(m.scadenzaAssicurazione, 'Assicurazione', m.modello); 
      check(m.prossimaRevisione, 'Revisione', m.modello); 
      if (m.scadenzaVerificaPeriodica) check(m.scadenzaVerificaPeriodica, 'Verifica', m.modello);
    });
    (data.documenti || []).forEach(d => {
      if (!d) return;
      check(d.scadenza, 'Documento', d.titolo);
    });
    return list.sort((a, b) => (new Date(a.date).getTime() || 0) - (new Date(b.date).getTime() || 0));
  }, [data]);

  const exportToPdf = (type: EntityType | 'dashboard') => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`REPORT ${type.toUpperCase()} - ${data.settings.nomeAzienda}`, 14, 20);
    let head: string[][] = [], body: any[][] = [];
    if (type === 'dashboard') {
      head = [['Tipo', 'Oggetto', 'Data Scadenza', 'Scade tra', 'Urgenza']];
      body = alerts.map(a => {
        const d = new Date(a.date);
        const formattedDate = !isNaN(d.getTime()) ? d.toLocaleDateString('it-IT') : a.date;
        return [a.type, a.title, formattedDate, a.diffText, ''];
      });
    } else if (type === 'cantiere') {
      head = [['Nome', 'Cliente', 'Scadenza', 'Stato']];
      body = filteredData.cantieri.map(c => [c.nome, c.cliente, c.scadenza, c.stato]);
    } else if (type === 'personale') {
      head = [['Nome', 'Ruolo', 'Contratto', 'Visita']];
      body = filteredData.personale.map(p => [`${p.nome} ${p.cognome}`, p.ruolo, p.scadenzaContratto || 'Indeterminato', p.scadenzaVisitaMedica]);
    } else if (type === 'mezzo') {
      head = [['Modello', 'Targa', 'Ass.', 'Rev.', 'Verifica']];
      body = filteredData.mezzi.map(m => [m.modello, m.targa, m.scadenzaAssicurazione, m.prossimaRevisione, m.scadenzaVerificaPeriodica || '-']);
    } else if (type === 'documento') {
      head = [['Titolo', 'Ente', 'Scadenza', 'Priorità']];
      body = filteredData.documenti.map(d => [d.titolo, d.ente, d.scadenza, d.priorita]);
    }
    (doc as any).autoTable({ 
      startY: 30, 
      head, 
      body, 
      theme: 'grid', 
      headStyles: { fillColor: [15, 23, 42] },
      didParseCell: (dataCell: any) => {
        if (type === 'dashboard' && dataCell.section === 'body') {
          const alertItem = alerts[dataCell.row.index];
          if (alertItem && dataCell.column.index === 4) {
            // Colonna Urgenza: nessun testo scritto, solo colore rosso per critico e giallo per warning
            dataCell.cell.text = '';
            if (alertItem.status === 'critical') {
              dataCell.cell.styles.fillColor = [239, 68, 68]; // Rosso
            } else if (alertItem.status === 'warning') {
              dataCell.cell.styles.fillColor = [245, 158, 11]; // Giallo
            }
          }
        }
      }
    });
    doc.save(`Export_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateTemplatePdf = (templateType: string, entityData: any) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text(templateType.toUpperCase(), 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Azienda: ${data.settings.nomeAzienda}`, 20, 50);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 20, 60);
    
    doc.line(20, 65, 190, 65);
    
    let y = 80;
    if (templateType === 'Dichiarazione Cantiere') {
      doc.text(`Il sottoscritto legale rappresentante della ditta ${data.settings.nomeAzienda},`, 20, y);
      y += 10;
      doc.text(`DICHIARA`, 105, y, { align: 'center' });
      y += 10;
      doc.text(`che i lavori presso il cantiere "${entityData.nome}" sito in ${entityData.indirizzo || 'N/D'}`, 20, y);
      y += 10;
      doc.text(`per il cliente ${entityData.cliente} sono in regola con le normative vigenti.`, 20, y);
    } else {
      doc.text(`Documento generato per: ${entityData.nome || entityData.titolo}`, 20, y);
      y += 10;
      doc.text(`Tipologia: ${templateType}`, 20, y);
    }
    
    y += 40;
    doc.text("Firma", 150, y);
    doc.line(130, y + 5, 180, y + 5);
    
    doc.save(`${templateType.replace(/\s+/g, '_')}_${entityData.id}.pdf`);
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
    const wsCantieri = XLSX.utils.json_to_sheet(data.cantieri.map(c => {
      const totExtra = (c.extraList || []).reduce((s, e) => s + (Number(e.importo) || 0), 0);
      return {
        Nome: c.nome, 
        Cliente: c.cliente, 
        Indirizzo: c.indirizzo || '', 
        Direttore_Lavori: c.direttoreLavori || '', 
        Data_Inizio: c.dataInizio || '', 
        Data_Consegna: c.dataConsegna || '', 
        Scadenza: c.scadenza, 
        DNL: c.scadenzaDNL || '', 
        Suolo_Pubblico: c.scadenzaSuoloPubblico || '', 
        Stato: c.stato, 
        Progresso: c.progresso + '%', 
        Importo_Base: c.importoTotale,
        Totale_Extra: totExtra,
        Numero_Extra: (c.extraList || []).length,
        Importo_Complessivo: (c.importoTotale || 0) + totExtra
      };
    }));
    XLSX.utils.book_append_sheet(wb, wsCantieri, "CANTIERI");

    // Foglio Extra Lavori
    const allExtras: any[] = [];
    data.cantieri.forEach(c => {
      (c.extraList || []).forEach((ex, i) => {
        allExtras.push({
          Cantiere: c.nome,
          Cliente: c.cliente,
          Identificativo: ex.titolo || `Extra ${i + 1}`,
          Data: ex.data || '',
          Stato: ex.stato || 'approvato',
          Importo: ex.importo || 0,
          Descrizione: ex.descrizione || ''
        });
      });
    });
    if (allExtras.length > 0) {
      const wsExtras = XLSX.utils.json_to_sheet(allExtras);
      XLSX.utils.book_append_sheet(wb, wsExtras, "EXTRA_LAVORI");
    }

    // Foglio Personale
    const wsPersonale = XLSX.utils.json_to_sheet(data.personale.map(p => ({
      Nome: p.nome, Cognome: p.cognome, Ruolo: p.ruolo, Scadenza_Contratto: p.scadenzaContratto || 'Indeterminato', Scadenza_Visita: p.scadenzaVisitaMedica
    })));
    XLSX.utils.book_append_sheet(wb, wsPersonale, "PERSONALE");

    // Foglio Mezzi
    const wsMezzi = XLSX.utils.json_to_sheet(data.mezzi.map(m => ({
      Modello: m.modello, Targa: m.targa, Assicurazione: m.scadenzaAssicurazione, Revisione: m.prossimaRevisione, Verifica_Periodica: m.scadenzaVerificaPeriodica || '-', Stato: m.stato
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
    if (!window.confirm("Eliminare definitivamente questo elemento?")) return;
    const key = getPluralKey(type);
    setData(prev => ({ ...prev, [key]: (prev[key] as any[]).filter(i => i.id !== id) }));
  };

  const updateEntity = (type: EntityType, updated: any) => {
    const key = getPluralKey(type);
    setData(prev => ({ ...prev, [key]: (prev[key] as any[]).map(i => i.id === updated.id ? updated : i) }));
  };

  const renderDashboard = () => {
    const hasSearch = search.trim().length > 0;

    if (hasSearch) {
      return (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header Barra Ricerca Globale */}
          <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <Icons.Search />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Risultati Ricerca Globale Database
                  </h2>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                    {totalSearchResultsCount} corrispondenze trovate per <span className="text-blue-600 dark:text-blue-400">"{search}"</span>
                  </p>
                </div>
              </div>

              {/* Pills contatori per categoria */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${filteredData.cantieri.length > 0 ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  Cantieri: {filteredData.cantieri.length}
                </span>
                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${filteredData.personale.length > 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  Personale: {filteredData.personale.length}
                </span>
                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${filteredData.mezzi.length > 0 ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  Mezzi: {filteredData.mezzi.length}
                </span>
                <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${filteredData.documenti.length > 0 ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                  Documenti: {filteredData.documenti.length}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setSearch('')}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
              >
                ✕ Cancella Ricerca
              </button>
            </div>
          </div>

          {/* Nessun Risultato Trovato */}
          {totalSearchResultsCount === 0 && (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 flex items-center justify-center mx-auto text-2xl">
                <Icons.Search />
              </div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-200">Nessun elemento trovato nel database</h3>
              <p className="text-sm text-slate-400 dark:text-slate-500 max-w-md mx-auto">
                Nessun cantiere, dipendente, mezzo o documento corrisponde al termine di ricerca <strong className="text-slate-600 dark:text-slate-300">"{search}"</strong>. Prova a verificare l'ortografia o cerca per codice fiscale, targa o cliente.
              </p>
              <button
                onClick={() => setSearch('')}
                className="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
              >
                Mostra Dashboard Completa
              </button>
            </div>
          )}

          {/* Sezione Cantieri Trovati */}
          {filteredData.cantieri.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                    <Icons.Cantiere />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Cantieri ({filteredData.cantieri.length})</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Clicca su una riga per aprire e modificare il cantiere</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('cantiere')} 
                  className="text-xs font-black text-blue-600 hover:underline uppercase tracking-wider"
                >
                  Vai alla sezione →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredData.cantieri.map(c => {
                  const totExtra = (c.extraList || []).reduce((s, e) => s + (Number(e.importo) || 0), 0);
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCantiere(c)}
                      className="p-5 bg-slate-50/70 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="font-black text-slate-900 dark:text-white text-sm truncate group-hover:text-blue-600 transition-colors">
                            {c.nome}
                          </h4>
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-400 truncate mt-0.5">
                            {c.cliente} {c.indirizzo ? `• ${c.indirizzo}` : ''}
                          </p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 ${
                          c.stato === 'aperto' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                          c.stato === 'in apertura' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                          c.stato === 'in pausa' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                          'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {c.stato}
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700 flex justify-between items-center text-xs">
                        <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase">Totale:</span>
                          <span className="font-black text-slate-800 dark:text-slate-200 ml-1">
                            € {((c.importoTotale || 0) + totExtra).toLocaleString('it-IT')}
                          </span>
                          {totExtra > 0 && (
                            <span className="text-[10px] text-amber-600 font-bold ml-1">
                              (+€{totExtra.toLocaleString('it-IT')} extra)
                            </span>
                          )}
                        </div>
                        <div>
                          {renderDatePill(c.scadenza)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sezione Personale Trovato */}
          {filteredData.personale.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Icons.Personale />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Personale ({filteredData.personale.length})</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Clicca su un nominativo per aprire e modificare la scheda</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('personale')} 
                  className="text-xs font-black text-blue-600 hover:underline uppercase tracking-wider"
                >
                  Vai alla sezione →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredData.personale.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPersonale(p)}
                    className="p-5 bg-slate-50/70 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 hover:border-emerald-500 hover:bg-emerald-50/40 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 dark:text-white text-sm truncate group-hover:text-emerald-600 transition-colors">
                          {p.nome} {p.cognome}
                        </h4>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-400 truncate mt-0.5">
                          {p.ruolo} • <span className="capitalize">{p.categoria}</span>
                          {p.codiceFiscale ? ` • CF: ${p.codiceFiscale}` : ''}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 ${
                        p.inForza ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}>
                        {p.inForza ? 'In Forza' : 'Cessato'}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase">Visita Medica:</span>
                        <div className="mt-0.5">{renderDatePill(p.scadenzaVisitaMedica)}</div>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase">Contratto:</span>
                        <div className="mt-0.5">{p.scadenzaContratto ? renderDatePill(p.scadenzaContratto) : <span className="text-xs font-black text-slate-600 dark:text-slate-300">Indeterminato</span>}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sezione Mezzi Trovati */}
          {filteredData.mezzi.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                    <Icons.Mezzi />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Parco Mezzi ({filteredData.mezzi.length})</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Clicca su un mezzo per aprire e modificare i dettagli</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('mezzo')} 
                  className="text-xs font-black text-blue-600 hover:underline uppercase tracking-wider"
                >
                  Vai alla sezione →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredData.mezzi.map(m => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMezzo(m)}
                    className="p-5 bg-slate-50/70 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 hover:border-amber-500 hover:bg-amber-50/40 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 dark:text-white text-sm truncate group-hover:text-amber-600 transition-colors">
                          {m.modello}
                        </h4>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-400 truncate mt-0.5">
                          Targa: <span className="font-black text-slate-700 dark:text-slate-300 uppercase">{m.targa}</span>
                          {m.telaio ? ` • Telaio: ${m.telaio}` : ''}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 ${
                        m.stato === 'disponibile' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                        m.stato === 'manutenzione' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                        'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {m.stato}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase">Assicurazione:</span>
                        <div className="mt-0.5">{renderDatePill(m.scadenzaAssicurazione)}</div>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase">Revisione:</span>
                        <div className="mt-0.5">{renderDatePill(m.prossimaRevisione)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sezione Documenti Trovati */}
          {filteredData.documenti.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Icons.Documenti />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Archivio Documenti ({filteredData.documenti.length})</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Clicca su un documento per visualizzare e aggiornare</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('documento')} 
                  className="text-xs font-black text-blue-600 hover:underline uppercase tracking-wider"
                >
                  Vai alla sezione →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredData.documenti.map(d => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDocumento(d)}
                    className="p-5 bg-slate-50/70 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-slate-800 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className="font-black text-slate-900 dark:text-white text-sm truncate group-hover:text-indigo-600 transition-colors">
                          {d.titolo}
                        </h4>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-400 truncate mt-0.5">
                          Ente: {d.ente} • Categoria: {d.categoria}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider shrink-0 ${
                        d.priorita === 'alta' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                        d.priorita === 'media' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}>
                        {d.priorita}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase">Scadenza Documento:</span>
                        <div className="mt-0.5">{renderDatePill(d.scadenza)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Default Dashboard (Nessuna ricerca attiva)
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard label="Cantieri" value={data.cantieri.length} icon={<Icons.Cantiere />} color={COLORS.secondary} />
          <StatCard label="Personale" value={data.personale.length} icon={<Icons.Personale />} color={COLORS.success} />
          <StatCard label="Mezzi" value={data.mezzi.length} icon={<Icons.Mezzi />} color={COLORS.accent} />
          <StatCard label="Scadenze" value={alerts.length} icon={<Icons.Documenti />} color={COLORS.danger} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Analisi Flussi</h3>
              <button onClick={() => exportToPdf('dashboard')} className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-500 transition-all">
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
            <div className="relative z-10 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <Icons.AI /> Gemini AI Assistant
                  </h3>
                  <button 
                    onClick={async () => {
                      setAiInsight('Analisi in corso...');
                      const res = await getInsights(data);
                      setAiInsight(res);
                    }} 
                    title="Rianalizza con l'AI"
                    className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Icons.Sync />
                  </button>
                </div>
                <p className="text-base font-medium italic text-slate-200 leading-relaxed mb-6">"{aiInsight}"</p>
                {aiInsight.includes('Configura la tua API Key') && (
                  <button
                    onClick={() => setActiveTab('impostazioni')}
                    className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    ⚙️ Configura API Key in Impostazioni
                  </button>
                )}
              </div>
              <div className="pt-6 border-t border-slate-800 space-y-4">
                 <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Focus Urgenti</p>
                   <span className="text-[9px] font-black text-slate-400 uppercase">Scade tra</span>
                 </div>
                 <div className="space-y-3 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                   {alerts.slice(0, 5).map((a, i) => (
                     <div key={i} className="flex items-center justify-between text-xs">
                       <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status==='critical'?'bg-red-500 shadow-sm shadow-red-500/50':'bg-amber-500 shadow-sm shadow-amber-500/50'}`} />
                          <span className="font-bold text-slate-300 truncate max-w-[120px]">{a.title}</span>
                       </div>
                       <span className={`text-[10px] font-black ${a.status==='critical'?'text-red-400':'text-amber-400'}`}>
                         {a.diffText}
                       </span>
                     </div>
                   ))}
                   {alerts.length === 0 && (
                     <p className="text-xs text-slate-400 font-medium">Nessuna scadenza critica nei prossimi 30 giorni.</p>
                   )}
                 </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full -mr-32 -mt-32"></div>
          </div>
        </div>

        {/* ================= REPORT SCADENZE DASHBOARD ================= */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Report Scadenze & Monitoraggio
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  {alerts.length}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>Legenda urgenza:</span>
                <span className="inline-flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Critico / Scaduto
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="inline-flex items-center gap-1 font-bold text-slate-600 dark:text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> In Scadenza (entro 30gg)
                </span>
              </p>
            </div>
            <button 
              onClick={() => exportToPdf('dashboard')} 
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
            >
              <Icons.Pdf /> ESPORTA REPORT PDF
            </button>
          </div>

          {alerts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <p className="text-sm font-bold">Nessuna scadenza critica o imminente rilevata nei prossimi 30 giorni.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-3">Tipo</th>
                    <th className="pb-3 px-3">Oggetto / Elemento</th>
                    <th className="pb-3 px-3">Data Scadenza</th>
                    <th className="pb-3 px-3">Scade tra</th>
                    <th className="pb-3 px-3 text-center">Urgenza</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {alerts.map((a, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-slate-700 dark:text-slate-200">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-600 dark:text-slate-300">
                          {a.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-black text-slate-900 dark:text-white">
                        {a.title}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                        {new Date(a.date).toLocaleDateString('it-IT')}
                      </td>
                      <td className="py-3.5 px-3 font-bold">
                        <span className={`px-2.5 py-1 rounded-md text-[11px] font-black ${
                          a.status === 'critical'
                            ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400'
                            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                        }`}>
                          {a.diffText}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span 
                          title={a.status === 'critical' ? 'Critico' : 'Warning'}
                          className={`inline-block w-3.5 h-3.5 rounded-full ${
                            a.status === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const getDateStatus = (dateStr?: string): { status: 'expired' | 'warning' | 'ok' | 'none'; label: string; formatted: string } => {
    if (!dateStr || typeof dateStr !== 'string') return { status: 'none', label: 'Non impostata', formatted: '-' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) {
      return { status: 'none', label: 'Data non valida', formatted: String(dateStr) };
    }
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let formatted = dateStr;
    try {
      formatted = target.toLocaleDateString('it-IT');
    } catch {
      formatted = String(dateStr);
    }

    if (diffDays < 0) {
      return { status: 'expired', label: `Scaduto (${Math.abs(diffDays)}gg fa)`, formatted };
    } else if (diffDays <= 30) {
      return { status: 'warning', label: `Scade tra ${diffDays}gg`, formatted };
    } else {
      return { status: 'ok', label: `Valido (${diffDays}gg)`, formatted };
    }
  };

  const renderDatePill = (dateStr?: string, defaultLabel = '-') => {
    if (!dateStr) return <span className="text-xs text-slate-400 font-bold">{defaultLabel}</span>;
    const { status, label, formatted } = getDateStatus(dateStr);
    
    if (status === 'expired') {
      return (
        <div className="inline-flex flex-col items-start gap-0.5">
          <span className="text-xs font-black text-red-600 dark:text-red-400">{formatted}</span>
          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
            ⚠️ {label}
          </span>
        </div>
      );
    }
    if (status === 'warning') {
      return (
        <div className="inline-flex flex-col items-start gap-0.5">
          <span className="text-xs font-black text-amber-600 dark:text-amber-400">{formatted}</span>
          <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
            ⏳ {label}
          </span>
        </div>
      );
    }
    return (
      <div className="inline-flex flex-col items-start gap-0.5">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatted}</span>
        <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">{label}</span>
      </div>
    );
  };

  const renderList = (type: EntityType) => {
    const items = filteredData[getPluralKey(type)];
    
    // KPI Stats per tipo
    const cantieriStats = type === 'cantiere' ? (() => {
      const importoBase = data.cantieri.reduce((sum, c) => sum + (c.importoTotale || 0), 0);
      const importoExtra = data.cantieri.reduce((sum, c) => sum + ((c.extraList || []).reduce((s, e) => s + (Number(e.importo) || 0), 0)), 0);
      const extraCount = data.cantieri.reduce((sum, c) => sum + (c.extraList ? c.extraList.length : 0), 0);
      return {
        totali: data.cantieri.length,
        aperti: data.cantieri.filter(c => c.stato === 'aperto' || c.stato === 'in apertura').length,
        sospesiChiusi: data.cantieri.filter(c => c.stato === 'sospeso' || c.stato === 'chiuso').length,
        importoTotale: importoBase + importoExtra,
        importoBase,
        importoExtra,
        extraCount,
      };
    })() : null;

    const personaleStats = type === 'personale' ? {
      totali: data.personale.filter(p => p.inForza).length,
      amministratori: data.personale.filter(p => p.inForza && p.categoria === 'amministratore').length,
      impiegati: data.personale.filter(p => p.inForza && p.categoria === 'impiegato').length,
      operai: data.personale.filter(p => p.inForza && p.categoria === 'operaio').length,
      visiteCritiche: data.personale.filter(p => p.inForza && p.scadenzaVisitaMedica && getDateStatus(p.scadenzaVisitaMedica).status !== 'ok').length,
    } : null;

    const mezziStats = type === 'mezzo' ? {
      totali: data.mezzi.length,
      disponibili: data.mezzi.filter(m => m.stato === 'disponibile').length,
      nonInUso: data.mezzi.filter(m => m.stato === 'non in uso' || m.stato === 'non_in_uso').length,
      manutenzione: data.mezzi.filter(m => m.stato === 'manutenzione').length,
      scadenzeCritiche: data.mezzi.filter(m => 
        (m.scadenzaAssicurazione && getDateStatus(m.scadenzaAssicurazione).status !== 'ok') ||
        (m.prossimaRevisione && getDateStatus(m.prossimaRevisione).status !== 'ok')
      ).length,
    } : null;

    const docStats = type === 'documento' ? {
      totali: data.documenti.length,
      alta: data.documenti.filter(d => d.priorita === 'alta').length,
      scadenzeCritiche: data.documenti.filter(d => d.scadenza && getDateStatus(d.scadenza).status !== 'ok').length,
    } : null;

    return (
      <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-6">
        {/* KPI Top Bar */}
        {type === 'cantiere' && cantieriStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cantieri Totali</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{cantieriStats.totali}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attivi / In Corso</p>
              <p className="text-2xl font-black text-emerald-600">{cantieriStats.aperti}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lavori Extra</p>
                {cantieriStats.extraCount > 0 && (
                  <span className="text-[9px] font-black px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-md">
                    {cantieriStats.extraCount}
                  </span>
                )}
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                + € {cantieriStats.importoExtra.toLocaleString('it-IT')}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volume Complessivo</p>
              <p className="text-2xl font-black text-blue-600">€ {cantieriStats.importoTotale.toLocaleString('it-IT')}</p>
            </div>
          </div>
        )}

        {type === 'personale' && personaleStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Forza</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{personaleStats.totali}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amministratori</p>
              <p className="text-2xl font-black text-blue-600">{personaleStats.amministratori}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impiegati</p>
              <p className="text-2xl font-black text-indigo-600">{personaleStats.impiegati}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operai</p>
              <p className="text-2xl font-black text-slate-600 dark:text-slate-300">{personaleStats.operai}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visite da Rinnovare</p>
              <p className={`text-2xl font-black ${personaleStats.visiteCritiche > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{personaleStats.visiteCritiche}</p>
            </div>
          </div>
        )}

        {type === 'mezzo' && mezziStats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parco Mezzi</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{mezziStats.totali}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponibili</p>
              <p className="text-2xl font-black text-emerald-600">{mezziStats.disponibili}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Non in Uso</p>
              <p className="text-2xl font-black text-slate-500">{mezziStats.nonInUso}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manutenzione</p>
              <p className="text-2xl font-black text-amber-500">{mezziStats.manutenzione}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scadenze Mezzi</p>
              <p className={`text-2xl font-black ${mezziStats.scadenzeCritiche > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{mezziStats.scadenzeCritiche}</p>
            </div>
          </div>
        )}

        {type === 'documento' && docStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Archivio Documenti</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{docStats.totali}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Priorità Alta</p>
              <p className="text-2xl font-black text-red-500">{docStats.alta}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">In Scadenza / Scaduti</p>
              <p className={`text-2xl font-black ${docStats.scadenzeCritiche > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>{docStats.scadenzeCritiche}</p>
            </div>
          </div>
        )}

        {/* Section Header with Controls */}
        <div className="bg-white dark:bg-slate-900 px-6 py-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
           <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
                {type === 'cantiere' && <Icons.Cantiere />}
                {type === 'personale' && <Icons.Personale />}
                {type === 'mezzo' && <Icons.Mezzi />}
                {type === 'documento' && <Icons.Documenti />}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {type === 'cantiere' ? 'Elenco Cantieri' : type === 'personale' ? 'Elenco Personale' : type === 'mezzo' ? 'Elenco Parco Mezzi' : 'Elenco Archivio Documenti'}
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase">{items.length} elementi trovati</p>
              </div>
           </div>

           <div className="flex items-center flex-wrap gap-3">
              {type === 'cantiere' && (
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={hideClosedCantieri} 
                    onChange={(e) => setHideClosedCantieri(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-800 cursor-pointer"
                  />
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest select-none">Nascondi chiusi</span>
                </label>
              )}

              {type === 'personale' && (
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={showOnlyActivePersonale} 
                    onChange={(e) => setShowOnlyActivePersonale(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-800 cursor-pointer"
                  />
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest select-none">Solo in forza</span>
                </label>
              )}

              {type === 'mezzo' && (
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={hideNotInUseMezzi} 
                    onChange={(e) => setHideNotInUseMezzi(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-800 cursor-pointer"
                  />
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest select-none">Nascondi non in uso</span>
                </label>
              )}

              {/* View Mode Switcher */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => setViewMode('list')} 
                  title="Vista Elenco Tabella" 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  <Icons.List /> Elenco
                </button>
                <button 
                  onClick={() => setViewMode('grid')} 
                  title="Vista Schede" 
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  <Icons.Grid /> Schede
                </button>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-2">
                 <button onClick={() => exportToPdf(type)} title="Esporta PDF" className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-slate-100 dark:border-slate-700">
                   <Icons.Pdf />
                 </button>
                 <button onClick={() => exportToExcel(type)} title="Esporta Excel" className="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 rounded-xl transition-all border border-slate-100 dark:border-slate-700">
                   <Icons.Excel />
                 </button>
              </div>

              {/* Tesserini Cantiere Quick Button for Personale */}
              {type === 'personale' && (
                <button
                  onClick={() => {
                    setBadgePersonaleId(undefined);
                    setIsBadgeModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-600/20"
                  title="Genera tesserini di riconoscimento cantiere D.Lgs 81/08"
                >
                  <Icons.Badge /> Tesserini Cantiere
                </button>
              )}

              {/* Add Button */}
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
              >
                <Icons.Plus /> Aggiungi {type}
              </button>
           </div>
        </div>

        {/* LIST / TABLE VIEW (ELENCO COMPATTO E RAPIDO) */}
        {viewMode === 'list' ? (
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    {type === 'cantiere' && (
                      <>
                        <th className="py-4 px-6">Cantiere & Cliente</th>
                        <th className="py-4 px-4">Stato</th>
                        <th className="py-4 px-4">Progresso</th>
                        <th className="py-4 px-4">Importo</th>
                        <th className="py-4 px-4">Scadenza Lavori</th>
                        <th className="py-4 px-4">DNL / Suolo</th>
                        <th className="py-4 px-4">Direzione Lavori</th>
                        <th className="py-4 px-6 text-right">Azioni</th>
                      </>
                    )}
                    {type === 'personale' && (
                      <>
                        <th className="py-4 px-6">Dipendente</th>
                        <th className="py-4 px-4">Ruolo & Categoria</th>
                        <th className="py-4 px-4">Stato</th>
                        <th className="py-4 px-4">Data Assunzione</th>
                        <th className="py-4 px-4">Scadenza Contratto</th>
                        <th className="py-4 px-4">Visita Medica</th>
                        <th className="py-4 px-4">Formazione</th>
                        <th className="py-4 px-6 text-right">Azioni</th>
                      </>
                    )}
                    {type === 'mezzo' && (
                      <>
                        <th className="py-4 px-6">Mezzo / Modello</th>
                        <th className="py-4 px-4">Targa</th>
                        <th className="py-4 px-4">Stato Operativo</th>
                        <th className="py-4 px-4">Assicurazione</th>
                        <th className="py-4 px-4">Revisione</th>
                        <th className="py-4 px-4">Verifica Periodica</th>
                        <th className="py-4 px-4">Manutenzioni</th>
                        <th className="py-4 px-6 text-right">Azioni</th>
                      </>
                    )}
                    {type === 'documento' && (
                      <>
                        <th className="py-4 px-6">Documento</th>
                        <th className="py-4 px-4">Categoria</th>
                        <th className="py-4 px-4">Ente Rilascio</th>
                        <th className="py-4 px-4">Priorità</th>
                        <th className="py-4 px-4">Scadenza</th>
                        <th className="py-4 px-6 text-right">Azioni</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                          <p className="text-sm font-bold">Nessun record trovato in questa visualizzazione.</p>
                          <button 
                            onClick={() => setIsModalOpen(true)}
                            className="text-xs font-black text-blue-600 hover:underline uppercase tracking-wider"
                          >
                            + Aggiungi il primo elemento
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item: any) => (
                      <tr 
                        key={item.id}
                        onClick={() => {
                          if (type==='cantiere') setSelectedCantiere(item);
                          if (type==='personale') setSelectedPersonale(item);
                          if (type==='mezzo') setSelectedMezzo(item);
                          if (type==='documento') setSelectedDocumento(item);
                        }}
                        className="hover:bg-blue-50/50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer group"
                      >
                        {/* ================= CANTIERE ROW ================= */}
                        {type === 'cantiere' && (
                          <>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  <Icons.Cantiere />
                                </div>
                                <div className="min-w-0 max-w-xs">
                                  <p className="font-black text-slate-900 dark:text-white text-sm truncate">{item.nome}</p>
                                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                    {item.cliente || 'Nessun cliente'} {item.indirizzo ? `• ${item.indirizzo}` : ''}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                item.stato === 'aperto' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                                item.stato === 'in apertura' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                item.stato === 'sospeso' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}>
                                {item.stato || 'Aperto'}
                              </span>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="w-28 space-y-1">
                                <div className="flex justify-between text-[10px] font-black text-slate-600 dark:text-slate-300">
                                  <span>{item.progresso || 0}%</span>
                                  {item.salList && item.salList.length > 0 && (
                                    <span className="text-slate-400">{item.salList.length} SAL</span>
                                  )}
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full ${item.progresso >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                    style={{ width: `${Math.min(item.progresso || 0, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-black text-xs text-slate-800 dark:text-slate-200">
                                  € {(item.importoTotale || 0).toLocaleString('it-IT')}
                                </span>
                                {item.extraList && item.extraList.length > 0 && (() => {
                                  const totExtra = item.extraList.reduce((s: number, e: any) => s + (Number(e.importo) || 0), 0);
                                  return (
                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                      + € {totExtra.toLocaleString('it-IT')} ({item.extraList.length} extra)
                                    </span>
                                  );
                                })()}
                              </div>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1">
                                <div>{renderDatePill(item.scadenza)}</div>
                                {item.dataConsegna && (
                                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                    Consegna: {new Date(item.dataConsegna).toLocaleDateString('it-IT')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex flex-col gap-1 text-[10px]">
                                {item.scadenzaDNL ? (
                                  <span className="font-bold text-amber-600 dark:text-amber-400">DNL: {new Date(item.scadenzaDNL).toLocaleDateString('it-IT')}</span>
                                ) : (
                                  <span className="text-slate-400">DNL: -</span>
                                )}
                                {item.scadenzaSuoloPubblico ? (
                                  <span className="font-bold text-indigo-600 dark:text-indigo-400">Suolo: {new Date(item.scadenzaSuoloPubblico).toLocaleDateString('it-IT')}</span>
                                ) : null}
                              </div>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                <p className="truncate max-w-[140px]">{item.direttoreLavori || 'Non specificato'}</p>
                                {item.tecnici && item.tecnici.length > 0 && (
                                  <p className="text-[10px] text-slate-400">{item.tecnici.length} tecnici assegnati</p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); generateTemplatePdf('Dichiarazione Cantiere', item); }} 
                                  title="Stampa Dichiarazione Cantiere PDF" 
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                  <Icons.Pdf />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedCantiere(item); }} 
                                  title="Modifica / Dettagli" 
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                  <Icons.Edit />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); deleteEntity(type, item.id); }} 
                                  title="Elimina" 
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                  <Icons.Trash />
                                </button>
                              </div>
                            </td>
                          </>
                        )}

                        {/* ================= PERSONALE ROW ================= */}
                        {type === 'personale' && (
                          <>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                {item.foto ? (
                                  <img 
                                    src={item.foto} 
                                    alt={`${item.nome} ${item.cognome}`} 
                                    className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs" 
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs shrink-0">
                                    {item.nome?.[0]}{item.cognome?.[0]}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-black text-slate-900 dark:text-white text-sm">{item.nome} {item.cognome}</p>
                                  <p className="text-xs font-bold text-slate-400 dark:text-slate-500">{item.ruolo}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {item.categoria || 'Operaio'}
                              </span>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                item.inForza 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
                                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                              }`}>
                                {item.inForza ? '● In Forza' : '○ Cessato'}
                              </span>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              {item.dataAssunzione ? (
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                  {new Date(item.dataAssunzione).toLocaleDateString('it-IT')}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-400 italic">Non impostata</span>
                              )}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              {item.scadenzaContratto ? (
                                renderDatePill(item.scadenzaContratto)
                              ) : (
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                                  Indeterminato
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              {renderDatePill(item.scadenzaVisitaMedica, 'Nessuna visita')}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                  {(item.corsiFormazione || []).length} Corsi
                                </span>
                                {item.corsiFormazione?.some((c: any) => c.scadenza && getDateStatus(c.scadenza).status === 'expired') && (
                                  <span title="Corso scaduto" className="text-red-500 font-bold text-xs">⚠️</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setBadgePersonaleId(item.id);
                                    setIsBadgeModalOpen(true); 
                                  }} 
                                  title="Stampa Tesserino Dipendente" 
                                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                  <Icons.Badge />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedPersonale(item); }} 
                                  title="Modifica / Scheda Personale" 
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                  <Icons.Edit />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); deleteEntity(type, item.id); }} 
                                  title="Elimina" 
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                  <Icons.Trash />
                                </button>
                              </div>
                            </td>
                          </>
                        )}

                        {/* ================= MEZZI ROW ================= */}
                        {type === 'mezzo' && (
                          <>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  <Icons.Mezzi />
                                </div>
                                <p className="font-black text-slate-900 dark:text-white text-sm">{item.modello}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-md font-mono font-black text-xs tracking-wider border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase shadow-2xs">
                                {item.targa}
                              </span>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                item.stato === 'disponibile' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                                (item.stato === 'non in uso' || item.stato === 'non_in_uso') ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' :
                                'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                              }`}>
                                {item.stato === 'disponibile' ? 'Disponibile' : (item.stato === 'non in uso' || item.stato === 'non_in_uso') ? 'Non in uso' : 'Manutenzione'}
                              </span>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              {renderDatePill(item.scadenzaAssicurazione)}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              {renderDatePill(item.prossimaRevisione)}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              {renderDatePill(item.scadenzaVerificaPeriodica, '-')}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {(item.storicoManutenzioni || []).length} Interventi
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedMezzo(item); }} 
                                  title="Modifica / Scheda Mezzo" 
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                  <Icons.Edit />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); deleteEntity(type, item.id); }} 
                                  title="Elimina" 
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                  <Icons.Trash />
                                </button>
                              </div>
                            </td>
                          </>
                        )}

                        {/* ================= DOCUMENTI ROW ================= */}
                        {type === 'documento' && (
                          <>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  <Icons.Documenti />
                                </div>
                                <p className="font-black text-slate-900 dark:text-white text-sm">{item.titolo}</p>
                              </div>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                {item.categoria || 'Generale'}
                              </span>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap font-bold text-xs text-slate-700 dark:text-slate-300">
                              {item.ente || 'N/D'}
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                item.priorita === 'alta' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                item.priorita === 'media' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-500'
                              }`}>
                                {item.priorita || 'Media'}
                              </span>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              {renderDatePill(item.scadenza)}
                            </td>
                            <td className="py-4 px-6 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setSelectedDocumento(item); }} 
                                  title="Modifica / Dettagli" 
                                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                  <Icons.Edit />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); deleteEntity(type, item.id); }} 
                                  title="Elimina" 
                                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                  <Icons.Trash />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* GRID VIEW FALLBACK */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((item: any) => (
              <div key={item.id} onClick={() => {
                if (type==='cantiere') setSelectedCantiere(item);
                if (type==='personale') setSelectedPersonale(item);
                if (type==='mezzo') setSelectedMezzo(item);
                if (type==='documento') setSelectedDocumento(item);
              }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
                <div className="flex justify-between items-start mb-6">
                  {type === 'personale' && item.foto ? (
                    <img src={item.foto} alt="Foto" className="w-14 h-16 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm" />
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                      {type === 'cantiere' && <Icons.Cantiere />}
                      {type === 'personale' && <Icons.Personale />}
                      {type === 'mezzo' && <Icons.Mezzi />}
                      {type === 'documento' && <Icons.Documenti />}
                    </div>
                  )}
                  <div className="flex gap-1">
                    {type === 'cantiere' && (
                      <button onClick={(e) => { e.stopPropagation(); generateTemplatePdf('Dichiarazione Cantiere', item); }} title="Genera PDF" className="p-2 text-slate-300 dark:text-slate-600 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Icons.Pdf />
                      </button>
                    )}
                    {type === 'personale' && (
                      <button onClick={(e) => { e.stopPropagation(); setBadgePersonaleId(item.id); setIsBadgeModalOpen(true); }} title="Genera Tesserino Cantiere" className="p-2 text-slate-300 dark:text-slate-600 hover:text-emerald-500 opacity-0 group-hover:opacity-100 transition-all">
                        <Icons.Badge />
                      </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); deleteEntity(type, item.id); }} title="Elimina" className="p-2 text-slate-300 dark:text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white truncate">{item.nome || item.modello || item.titolo} {item.cognome || ''}</h4>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mt-1">{item.cliente || item.ruolo || item.targa || item.ente}</p>
                {type === 'personale' && item.dataAssunzione && (
                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                    Assunto il: {new Date(item.dataAssunzione).toLocaleDateString('it-IT')}
                  </p>
                )}
                <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase">Scadenza</span>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      {renderDatePill(item.scadenza || (type === 'personale' ? item.scadenzaContratto : item.scadenzaAssicurazione))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${type === 'personale' && !item.inForza ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      {type === 'personale' ? (item.inForza ? 'In Forza' : 'Cessato') : (item.stato || item.priorita || 'Attivo')}
                    </div>
                    {type === 'personale' && (
                      <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase mt-1">{item.categoria}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <button onClick={() => setIsModalOpen(true)} className="border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 text-slate-300 dark:text-slate-700 hover:text-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all">
              <Icons.Plus />
              <span className="text-[10px] font-black uppercase tracking-widest">Aggiungi {type}</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderSettings = () => (
    <div className="max-w-2xl mx-auto space-y-8 animate-in zoom-in-95 duration-500">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase mb-8">Configurazione Sistema</h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Impresa</label>
            <input type="text" value={data.settings.nomeAzienda} onChange={(e)=>setData({...data, settings: {...data.settings, nomeAzienda: e.target.value}})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tema Applicazione</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setData({...data, settings: {...data.settings, theme: 'light'}})}
                className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all ${data.settings.theme === 'light' ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'}`}
              >
                ☀️ Chiaro
              </button>
              <button 
                onClick={() => setData({...data, settings: {...data.settings, theme: 'dark'}})}
                className={`p-4 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest transition-all ${data.settings.theme === 'dark' ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'}`}
              >
                🌙 Scuro
              </button>
            </div>
          </div>
          
          {/* ================= GEMINI AI ASSISTANT ================= */}
          <div className="pt-8 border-t border-slate-50 dark:border-slate-800">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                      <Icons.AI />
                   </div>
                   <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Gemini AI Assistant</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Analisi predittiva scadenze & consigli operativi</p>
                   </div>
                </div>
                <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  geminiKeyInput ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${geminiKeyInput ? 'bg-blue-500 animate-pulse' : 'bg-slate-400'}`} />
                  {geminiKeyInput ? 'Configurato' : 'Non Configurato'}
                </div>
             </div>

             <div className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Google Gemini API Key</label>
                   <input 
                     type="password" 
                     placeholder="AIzaSy..." 
                     value={geminiKeyInput} 
                     onChange={(e) => setGeminiKeyInput(e.target.value)} 
                     className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-mono text-xs font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all" 
                   />
                </div>
                <button
                  onClick={handleSaveGeminiKey}
                  disabled={isTestingGemini}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  <Icons.AI /> {isTestingGemini ? 'Test Connessione AI...' : 'Salva & Attiva Assistente AI'}
                </button>
             </div>
             <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
               Puoi ottenere una chiave gratuita su <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-bold">Google AI Studio</a> oppure impostarla come variabile d'ambiente <code>GEMINI_API_KEY</code> su Render.
             </p>
          </div>

          {/* ================= SUPABASE CLOUD DATABASE ================= */}
          <div className="pt-8 border-t border-slate-50 dark:border-slate-800">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                      <Icons.Database />
                   </div>
                   <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Database Cloud Supabase</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Sincronizzazione Real-Time & Cloud PostgreSQL</p>
                   </div>
                </div>

                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  supabaseStatus.connected ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' :
                  supabaseStatus.checking ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    supabaseStatus.connected ? 'bg-emerald-500 animate-pulse' :
                    supabaseStatus.checking ? 'bg-amber-500 animate-ping' :
                    'bg-slate-400'
                  }`} />
                  {supabaseStatus.checking ? 'Verifica in corso...' :
                   supabaseStatus.connected ? `Connesso (${supabaseStatus.latencyMs || 0}ms)` :
                   'Non Connesso'}
                </div>
             </div>

             {/* Connection Status Message */}
             <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/60 mb-6 text-xs font-bold text-slate-600 dark:text-slate-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                   <span>Stato: <strong className="text-slate-900 dark:text-white">{supabaseStatus.message}</strong></span>
                   <div className="flex items-center gap-2">
                     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Auto-Sync Attivo
                     </span>
                     {lastCloudSync && (
                       <span className="text-[10px] text-slate-400 uppercase">Ultimo sync: {lastCloudSync}</span>
                     )}
                   </div>
                </div>
                <p className="text-[11px] text-slate-400 font-normal mt-2">
                  ⚡ <strong>Sincronizzazione Automatica:</strong> Ogni modifica, nuovo cantiere, mezzo o documento viene salvato istantaneamente su Supabase Cloud. All'apertura su qualsiasi browser o dispositivo, i dati verranno caricati automaticamente.
                </p>
             </div>

             {/* Credentials Form */}
             <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supabase Project URL</label>
                   <input 
                     type="text" 
                     placeholder="https://xyzcompany.supabase.co" 
                     value={supabaseConfig.url} 
                     onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })} 
                     className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-mono text-xs font-bold text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all" 
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Supabase Anon Public API Key</label>
                   <input 
                     type="password" 
                     placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                     value={supabaseConfig.anonKey} 
                     onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value })} 
                     className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-mono text-xs font-bold text-slate-900 dark:text-white focus:border-emerald-500 outline-none transition-all" 
                   />
                </div>
                <div className="flex gap-3">
                   <button
                     onClick={() => verifySupabaseConnection(supabaseConfig, false)}
                     disabled={supabaseStatus.checking}
                     className="flex-1 py-3 bg-slate-900 dark:bg-slate-750 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 shadow-sm"
                   >
                     <Icons.Sync /> Salva & Verifica Connessione
                   </button>
                   <button
                     onClick={handleCopySupabaseSql}
                     className="py-3 px-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-blue-200 dark:border-blue-800"
                   >
                     <Icons.Copy /> {copiedSql ? '✓ Copiato!' : 'Copia Schema SQL'}
                   </button>
                </div>
             </div>

             {/* Cloud Actions Buttons */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={handleSyncToSupabase} 
                  disabled={isSyncingToCloud}
                  className="flex items-center justify-center gap-2 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  <Icons.Sync /> {isSyncingToCloud ? 'Sincronizzazione in corso...' : '⬆️ Invia Dati Locali a Supabase'}
                </button>
                <button 
                  onClick={handlePullFromSupabase} 
                  disabled={isPullingFromCloud}
                  className="flex items-center justify-center gap-2 p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  <Icons.Cloud /> {isPullingFromCloud ? 'Download in corso...' : '⬇️ Scarica Dati da Supabase'}
                </button>
             </div>

             {/* Guida Rapida Configurazione */}
             <div className="mt-6 p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 space-y-2 text-xs">
                <p className="font-black text-blue-900 dark:text-blue-300 uppercase text-[10px] tracking-wider">
                   📌 Come configurare Supabase in 3 passi:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400 font-medium">
                   <li>Crea un account/progetto gratuito su <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-bold underline">supabase.com</a>.</li>
                   <li>Clicca su <strong>"Copia Schema SQL"</strong> qui sopra e incollalo nel <em>SQL Editor</em> di Supabase, poi clicca <em>Run</em>.</li>
                   <li>Copia da Supabase (<em>Project Settings &gt; API</em>) l'<strong>URL</strong> e la <strong>Anon Key</strong> e incollali nei campi qui sopra (oppure in <code>.env.example</code>).</li>
                </ol>
             </div>
          </div>

          <div className="pt-8 border-t border-slate-50 dark:border-slate-800">
             <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">Profilo Utente & Sicurezza</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                   <input type="text" value={data.settings.username} onChange={(e)=>setData({...data, settings: {...data.settings, username: e.target.value}})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nuova Password</label>
                   <input type="password" value={data.settings.password} onChange={(e)=>setData({...data, settings: {...data.settings, password: e.target.value}})} className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-bold text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all" />
                </div>
                <button onClick={() => setIsLoggedIn(false)} className="md:col-span-2 flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">
                   Disconnetti Sessione
                </button>
             </div>
          </div>

          <div className="pt-8 border-t border-slate-50 dark:border-slate-800">
             <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">Backup & Esportazione Dati</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={handleJsonExport} className="flex items-center justify-center gap-2 p-4 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-500 transition-all">
                   <Icons.Export /> Backup JSON (Totale)
                </button>
                <button onClick={handleFullExcelExport} className="flex items-center justify-center gap-2 p-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all">
                   <Icons.Excel /> Export Excel (Totale)
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all md:col-span-2">
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

  const handleLogin = (u: string, p: string, remember: boolean = true) => {
    if (u === data.settings.username && p === data.settings.password) {
      setIsLoggedIn(true);
      if (remember) {
        localStorage.setItem('scadenze_plus_is_logged_in', 'true');
      }
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('scadenze_plus_is_logged_in');
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex bg-[#f8fafc] dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      {/* Sidebar ERP */}
      <aside className="w-24 md:w-72 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col shrink-0 z-30 transition-all duration-500">
        <div className="p-8 flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/30 shrink-0"><Icons.Cantiere /></div>
          <div className="hidden md:flex flex-col">
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none text-slate-900 dark:text-white">SCADENZE +</h1>
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
            { id: 'calcolatore', label: 'Calcolatore', icon: <Icons.Calculator /> },
            { id: 'impostazioni', label: 'Setup', icon: <Icons.Settings /> },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200'}`}>
              {item.icon}
              <span className="hidden md:block font-black text-[10px] uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Firma Azienda & Stato Supabase Cloud in Sidebar */}
        <div className="p-4 md:p-6 border-t border-slate-50 dark:border-slate-800 space-y-3">
           <div className="hidden md:block bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Impresa attiva</p>
              <p className="text-xs font-black text-slate-900 dark:text-white truncate">{data.settings.nomeAzienda}</p>
           </div>
           <button 
             onClick={() => setActiveTab('impostazioni')}
             className="w-full hidden md:flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/70 transition-all text-left"
           >
              <div className="flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${supabaseStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                 <div>
                    <p className="text-[9px] font-black uppercase tracking-wider">Supabase Cloud</p>
                    <p className="text-[8px] font-semibold text-emerald-600 dark:text-emerald-400">
                      {supabaseStatus.connected ? 'Attivo & Connesso' : 'Configura Cloud'}
                    </p>
                 </div>
              </div>
              <Icons.Database />
           </button>

           <button 
             onClick={handleLogout}
             title="Disconnetti sessione"
             className="w-full flex items-center justify-center md:justify-start gap-2 p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all text-left text-[10px] font-black uppercase tracking-wider"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
             <span className="hidden md:inline">Disconnetti</span>
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 md:px-10 shrink-0 relative z-40">
          <div ref={searchContainerRef} className="relative flex-1 max-w-lg">
            <span className="absolute inset-y-0 left-4 flex items-center text-slate-400 dark:text-slate-500">
              <Icons.Search />
            </span>
            <input 
              type="text" 
              placeholder="Ricerca rapida database (cantieri, persone, targhe, doc)..." 
              className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-750 outline-none transition-all dark:text-white border border-transparent focus:border-blue-500" 
              value={search} 
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsSearchFocused(true);
              }} 
            />
            {search && (
              <button 
                onClick={() => {
                  setSearch('');
                  setIsSearchFocused(false);
                }} 
                title="Cancella ricerca"
                className="absolute inset-y-0 right-3 flex items-center justify-center w-7 h-7 my-auto text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-200/60 dark:bg-slate-700/60 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-xl transition-all"
              >
                ✕
              </button>
            )}

            {/* Quick Live Search Popover Dropdown */}
            {isSearchFocused && search.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[460px] overflow-y-auto custom-scrollbar p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {totalSearchResultsCount} RISULTATI TROVATI
                  </span>
                  <button 
                    onClick={() => {
                      setActiveTab('dashboard');
                      setIsSearchFocused(false);
                    }}
                    className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-wider"
                  >
                    Vedi su Dashboard →
                  </button>
                </div>

                {totalSearchResultsCount === 0 ? (
                  <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs font-bold">
                    Nessuna corrispondenza trovata per "{search}".
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    {/* Cantieri */}
                    {filteredData.cantieri.length > 0 && (
                      <div>
                        <p className="px-3 text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <Icons.Cantiere /> Cantieri ({filteredData.cantieri.length})
                        </p>
                        <div className="space-y-1">
                          {filteredData.cantieri.slice(0, 3).map(c => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setSelectedCantiere(c);
                                setIsSearchFocused(false);
                              }}
                              className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-2 group"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-600">{c.nome}</p>
                                <p className="text-[10px] font-medium text-slate-400 truncate">{c.cliente} {c.indirizzo ? `• ${c.indirizzo}` : ''}</p>
                              </div>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">{c.stato}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Personale */}
                    {filteredData.personale.length > 0 && (
                      <div>
                        <p className="px-3 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <Icons.Personale /> Personale ({filteredData.personale.length})
                        </p>
                        <div className="space-y-1">
                          {filteredData.personale.slice(0, 3).map(p => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setSelectedPersonale(p);
                                setIsSearchFocused(false);
                              }}
                              className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-2 group"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600">{p.nome} {p.cognome}</p>
                                <p className="text-[10px] font-medium text-slate-400 truncate">{p.ruolo} • {p.categoria}</p>
                              </div>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 ${p.inForza ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {p.inForza ? 'In Forza' : 'Cessato'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Mezzi */}
                    {filteredData.mezzi.length > 0 && (
                      <div>
                        <p className="px-3 text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <Icons.Mezzi /> Mezzi ({filteredData.mezzi.length})
                        </p>
                        <div className="space-y-1">
                          {filteredData.mezzi.slice(0, 3).map(m => (
                            <button
                              key={m.id}
                              onClick={() => {
                                setSelectedMezzo(m);
                                setIsSearchFocused(false);
                              }}
                              className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-2 group"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate group-hover:text-amber-600">{m.modello}</p>
                                <p className="text-[10px] font-medium text-slate-400 truncate">Targa: {m.targa}</p>
                              </div>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">{m.stato}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Documenti */}
                    {filteredData.documenti.length > 0 && (
                      <div>
                        <p className="px-3 text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                          <Icons.Documenti /> Documenti ({filteredData.documenti.length})
                        </p>
                        <div className="space-y-1">
                          {filteredData.documenti.slice(0, 3).map(d => (
                            <button
                              key={d.id}
                              onClick={() => {
                                setSelectedDocumento(d);
                                setIsSearchFocused(false);
                              }}
                              className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-2 group"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-600">{d.titolo}</p>
                                <p className="text-[10px] font-medium text-slate-400 truncate">{d.ente} • {d.categoria}</p>
                              </div>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">{d.priorita}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Quick Supabase Cloud Sync Button */}
            <button 
              onClick={handleSyncToSupabase}
              disabled={isSyncingToCloud}
              title={supabaseStatus.connected ? "Sincronizza subito con Supabase Cloud" : "Configura o connetti Supabase"}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                supabaseStatus.connected 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${supabaseStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <Icons.Cloud />
              <span className="hidden sm:inline">
                {isSyncingToCloud ? 'Sync...' : 'Cloud Sync'}
              </span>
            </button>

            <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 dark:bg-blue-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-lg hover:scale-105 active:scale-95">
              + NUOVO RECORD
            </button>
          </div>
        </header>

        {/* Global Toast Notification */}
        {cloudToast && (
          <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
            <div className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 max-w-md text-xs font-bold ${
              cloudToast.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30' :
              cloudToast.type === 'error' ? 'bg-rose-600 text-white border-rose-500 shadow-rose-600/30' :
              'bg-blue-600 text-white border-blue-500 shadow-blue-600/30'
            }`}>
              <div className="shrink-0">
                {cloudToast.type === 'success' ? '✓' : cloudToast.type === 'error' ? '⚠️' : 'ℹ️'}
              </div>
              <p className="flex-1">{cloudToast.message}</p>
              <button 
                onClick={() => setCloudToast(null)} 
                className="text-white/80 hover:text-white text-sm font-black ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10">
          {activeTab === 'dashboard' ? renderDashboard() : 
           activeTab === 'impostazioni' ? renderSettings() : 
           activeTab === 'calcolatore' ? <GaraCalculator /> :
           renderList(activeTab)}
        </div>
      </main>

      {/* MODALI */}
      <AddModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAdd={(t, d) => {
          const key = getPluralKey(t);
          setData(prev => ({ ...prev, [key]: [...(prev[key] as any[]), d] }));
        }} 
        defaultType={activeTab !== 'dashboard' && activeTab !== 'impostazioni' ? activeTab as EntityType : 'cantiere'} 
      />
      <EditCantiereModal isOpen={!!selectedCantiere} cantiere={selectedCantiere} onClose={()=>setSelectedCantiere(null)} onSave={(u)=>updateEntity('cantiere', u)} />
      <EditPersonaleModal 
        isOpen={!!selectedPersonale} 
        personale={selectedPersonale} 
        onClose={()=>setSelectedPersonale(null)} 
        onSave={(u)=>updateEntity('personale', u)} 
        onOpenBadge={(p) => {
          setSelectedPersonale(null);
          setBadgePersonaleId(p.id);
          setIsBadgeModalOpen(true);
        }}
      />
      <EditMezzoModal isOpen={!!selectedMezzo} mezzo={selectedMezzo} onClose={()=>setSelectedMezzo(null)} onSave={(u)=>updateEntity('mezzo', u)} />
      <EditDocumentoModal isOpen={!!selectedDocumento} documento={selectedDocumento} onClose={()=>setSelectedDocumento(null)} onSave={(u)=>updateEntity('documento', u)} />
      <BadgeGeneratorModal
        isOpen={isBadgeModalOpen}
        onClose={() => {
          setIsBadgeModalOpen(false);
          setBadgePersonaleId(undefined);
        }}
        personaleList={data.personale}
        cantieriList={data.cantieri}
        settings={data.settings}
        initialPersonaleId={badgePersonaleId}
        onUpdatePersonale={(u) => updateEntity('personale', u)}
      />
    </div>
  );
};

export default App;
