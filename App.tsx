import React, { useState, useEffect, useRef } from 'react';
import { AppView, ServiceCategory, Project, QuoteRequest, VisitorLog } from './types';
import ProjectCard from './components/ProjectCard';
import { GoogleGenAI } from "@google/genai";
import { supabase, isSupabaseConfigured } from './services/supabaseClient';

const SERVICES: ServiceCategory[] = [
  {
    title: "Espaces Verts",
    icon: "🌿",
    items: [
      { name: "Conception 3D", desc: "Modélisation de jardins modernes adaptés aux villas et résidences de Safi." },
      { name: "Arrosage Goutte-à-Goutte", desc: "Systèmes automatiques pour une gestion optimale de l'eau." },
      { name: "Gazon & Fleurs", desc: "Pose de gazon naturel ou synthétique et plantations ornementales." }
    ]
  },
  {
    title: "Entretien & Hygiène",
    icon: "🧹",
    items: [
      { name: "Maintenance Annuelle", desc: "Entretien régulier pour copropriétés et jardins privés." },
      { name: "Nettoyage Façades", desc: "Restauration professionnelle des façades par jet haute pression." },
      { name: "Ponçage de Sols", desc: "Ponçage et traitement des marbres et pierres naturelles." }
    ]
  },
  {
    title: "Fourniture & HSE",
    icon: "🛡️",
    items: [
      { name: "Vente de Plantes", desc: "Palmiers, arbres fruitiers et arbustes issus de notre pépinière." },
      { name: "Matériel HSE", desc: "Équipements de protection individuelle pour les chantiers." },
      { name: "Produits Bio", desc: "Engrais et traitements respectueux de l'environnement." }
    ]
  }
];

const PROJECTS: Project[] = [
  {
    title: "Partenariat OCP Group",
    imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=1000&auto=format&fit=crop",
    tags: ["Industriel", "Maintenance"],
    description: "Collaboration continue avec l'OCP pour le service de jardinage et nettoyage.",
    fullDetails: ["Nettoyage industriel", "Maintenance espaces verts", "HSE strict"]
  },
  {
    title: "Villas de Prestige",
    imageUrl: "https://images.unsplash.com/photo-1558905619-1714249d9727?q=80&w=1000&auto=format&fit=crop",
    tags: ["Résidentiel", "Création"],
    description: "Conception et création complète d'espaces verts pour villas de luxe à Safi.",
    fullDetails: ["Design 3D", "Arrosage automatique", "Plantations rares"]
  }
];

const LOGO_URL = "https://i.ibb.co/LdF8wDg0/Empreinte-verte-et-nature.png";
const MY_PHONE = "212664381028";
const MY_PHONE_DISPLAY = "06 64 38 10 28";
const MY_ADDRESS = "17 RUE E HAY OUMNIA EL BOUAB, SAFI, MAROC";
const WHATSAPP_URL = `https://wa.me/${MY_PHONE}`;
const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "Rjns2025@@";

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [view, setView] = useState<AppView>('HOME');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminUserInput, setAdminUserInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [messages, setMessages] = useState<QuoteRequest[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState<'MESSAGES' | 'VISITS'>('MESSAGES');
  const [phoneError, setPhoneError] = useState('');
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  
  const [formData, setFormData] = useState<QuoteRequest>({
    clientName: '', phone: '', email: '', serviceType: 'Jardinage', subject: '', budget: ''
  });
  
  const currentVisitorId = useRef<string | null>(localStorage.getItem('rachidi_visit_id'));
  const pagesTracked = useRef<Set<string>>(new Set());

  // Real-time synchronization Effect
  useEffect(() => {
    const loadTimer = setTimeout(() => setIsAppLoading(false), 1800);
    initVisitorTracking();
    
    if (isSupabaseConfigured && supabase) {
      fetchData();
      
      // Subscribe to messages
      const msgChannel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          setMessages(prev => [payload.new as QuoteRequest, ...prev]);
          // Audio alert for new message can be added here if desired
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') setIsRealtimeActive(true);
        });

      // Subscribe to visitors
      const visitChannel = supabase
        .channel('visitor-updates')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'visitor_logs' }, (payload) => {
          setVisitorLogs(prev => [payload.new as VisitorLog, ...prev]);
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'visitor_logs' }, (payload) => {
          setVisitorLogs(prev => prev.map(l => l.id === payload.new.id ? (payload.new as VisitorLog) : l));
        })
        .subscribe();

      return () => {
        supabase.removeChannel(msgChannel);
        supabase.removeChannel(visitChannel);
        clearTimeout(loadTimer);
      };
    } else {
      loadFromLocal();
    }
  }, []);

  useEffect(() => {
    if (view === 'ADMIN' || view === 'LOGIN') return;
    if (!pagesTracked.current.has(view)) {
      pagesTracked.current.add(view);
      updateVisitorPages();
    }
  }, [view]);

  const initVisitorTracking = async () => {
    const lastVisit = localStorage.getItem('rachidi_visit_time');
    const savedVisitId = localStorage.getItem('rachidi_visit_id');
    const now = Date.now();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    if (lastVisit && savedVisitId && (now - parseInt(lastVisit) < TWENTY_FOUR_HOURS)) {
      currentVisitorId.current = savedVisitId;
      return;
    }

    let ipData = { ip: 'Client Local', city: 'Safi', country_name: 'Maroc' };
    try {
      const ipRes = await fetch('https://ipapi.co/json/');
      if (ipRes.ok) {
        const data = await ipRes.json();
        ipData = { ip: data.ip, city: data.city, country_name: data.country_name };
      }
    } catch (e) { console.warn("IP API unreachable"); }
    
    const newLog: VisitorLog = {
      timestamp: new Date().toISOString(),
      ip: ipData.ip || 'Inconnue',
      location: `${ipData.city || 'Maroc'}, ${ipData.country_name || ''}`,
      pagesViewed: [view],
      userAgent: navigator.userAgent
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('visitor_logs').insert([newLog]).select();
      if (!error && data) {
        currentVisitorId.current = data[0].id;
        localStorage.setItem('rachidi_visit_id', data[0].id);
      }
    } else {
      const id = "v_" + Date.now().toString();
      currentVisitorId.current = id;
      localStorage.setItem('rachidi_visit_id', id);
      saveVisitorToLocal(newLog, id);
    }
    localStorage.setItem('rachidi_visit_time', now.toString());
  };

  const updateVisitorPages = async () => {
    if (!currentVisitorId.current) return;
    const pages = Array.from(pagesTracked.current);
    if (isSupabaseConfigured && supabase) {
      await supabase.from('visitor_logs').update({ pagesViewed: pages }).eq('id', currentVisitorId.current);
    }
  };

  const saveVisitorToLocal = (log: VisitorLog, id: string) => {
    const logs = JSON.parse(localStorage.getItem('rachidi_visitor_logs') || '[]');
    localStorage.setItem('rachidi_visitor_logs', JSON.stringify([{ ...log, id }, ...logs].slice(0, 50)));
  };

  const fetchData = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setDbLoading(true);
    try {
      const [msgRes, logRes] = await Promise.all([
        supabase.from('messages').select('*').order('timestamp', { ascending: false }),
        supabase.from('visitor_logs').select('*').order('timestamp', { ascending: false }).limit(50)
      ]);
      if (msgRes.data) setMessages(msgRes.data);
      if (logRes.data) setVisitorLogs(logRes.data);
    } catch (err) { console.error(err); loadFromLocal(); }
    finally { setDbLoading(false); }
  };

  const loadFromLocal = () => {
    setMessages(JSON.parse(localStorage.getItem('rachidi_messages') || '[]'));
    setVisitorLogs(JSON.parse(localStorage.getItem('rachidi_visitor_logs') || '[]'));
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUserInput === ADMIN_USER && adminPasswordInput === ADMIN_PASSWORD) {
      setView('ADMIN');
      setAdminUserInput('');
      setAdminPasswordInput('');
      setLoginError('');
      if (isSupabaseConfigured) fetchData();
    } else {
      setLoginError('Identifiants incorrects.');
    }
  };

  const deleteMessage = async (id: string) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('messages').delete().eq('id', id);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, phone: val });
    if (val.length > 0 && !/^(05|06|07)/.test(val)) {
      setPhoneError('Le numéro doit commencer par 05, 06 ou 07');
    } else if (val.length > 0 && val.length < 10) {
      setPhoneError('Le numéro doit comporter 10 chiffres');
    } else {
      setPhoneError('');
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^(05|06|07)[0-9]{8}$/.test(formData.phone)) {
      setPhoneError('Numéro invalide (doit être 05/06/07 + 8 chiffres)');
      return;
    }
    setDbLoading(true);
    const newMessage = { ...formData, timestamp: new Date().toISOString() };
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('messages').insert([newMessage]);
      if (!error) setShowSuccess(true);
    } else {
      const updated = [{ ...newMessage, id: Date.now().toString() }, ...messages];
      setMessages(updated);
      localStorage.setItem('rachidi_messages', JSON.stringify(updated));
      setShowSuccess(true);
    }
    setDbLoading(false);
    setFormData({ clientName: '', phone: '', email: '', serviceType: 'Jardinage', subject: '', budget: '' });
    setTimeout(() => setShowSuccess(false), 5000);
  };

  const navItems = [
    { id: 'HOME', label: 'Accueil', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3' },
    { id: 'SERVICES', label: 'Services', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z' },
    { id: 'PORTFOLIO', label: 'Projets', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14' },
    { id: 'QUALITY', label: 'Qualité', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944' },
    { id: 'CONTACT', label: 'Contact', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8' }
  ];

  if (isAppLoading) {
    return (
      <div className="fixed inset-0 bg-[#064e3b] z-[200] flex flex-col items-center justify-center">
        <img src={LOGO_URL} className="w-48 md:w-64 animate-pulse" alt="Logo" />
        <div className="mt-12 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-400 animate-[loading_1.8s_ease-in-out_forwards]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-100 text-slate-800 overflow-hidden font-sans">
      <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static w-72 md:w-80 bg-[#064e3b] flex flex-col shadow-2xl z-50 transition-transform duration-300`}>
        <div className="p-6 flex flex-col items-center border-b border-emerald-800/30">
          <img src={LOGO_URL} className="w-40" alt="Logo" />
        </div>
        <nav className="flex-grow p-6 space-y-2 overflow-y-auto custom-scroll">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => {setView(item.id as AppView); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold transition-all ${view === item.id ? 'nav-active' : 'text-emerald-100/60 hover:text-white hover:bg-emerald-800/20'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              <span className="text-[11px] uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-emerald-800/30">
          <button onClick={() => setView('LOGIN')} className={`w-full p-4 rounded-2xl flex items-center justify-center gap-3 ${view === 'LOGIN' || view === 'ADMIN' ? 'bg-white text-emerald-900 shadow-xl' : 'bg-emerald-900/50 text-white'}`}>
             <span className="text-[10px] font-black uppercase tracking-widest">Espace Gérant</span>
          </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col relative overflow-hidden bg-white lg:rounded-l-[40px]">
        <header className="h-20 flex items-center justify-between px-6 md:px-12 bg-white border-b border-slate-100 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-emerald-600 bg-emerald-50 rounded-lg"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg></button>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{view}</h3>
          </div>
          <div className="hidden md:flex items-center gap-6">
             {isSupabaseConfigured && (
               <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
                 <span className={`w-2 h-2 rounded-full ${isRealtimeActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                 <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">RACHIDI LIVE SYNC</span>
               </div>
             )}
             <p className="text-lg font-black text-slate-900 mono">{new Date().toLocaleTimeString()}</p>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto custom-scroll bg-slate-50/50 p-6 md:p-12">
          {view === 'ADMIN' && (
            <div className="max-w-6xl mx-auto view-enter space-y-10 pb-24">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">RACHIDI <span className="text-emerald-600">CLOUD</span></h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Mise à jour en temps réel • Hub Centralisé</p>
                </div>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                   <button onClick={() => setAdminSubTab('MESSAGES')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminSubTab === 'MESSAGES' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Messages ({messages.length})</button>
                   <button onClick={() => setAdminSubTab('VISITS')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminSubTab === 'VISITS' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Visiteurs ({visitorLogs.length})</button>
                </div>
              </div>

              {adminSubTab === 'MESSAGES' ? (
                <div className="grid grid-cols-1 gap-6">
                  {messages.map((msg) => (
                    <div key={msg.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row gap-8 items-start animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="flex-grow space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-lg uppercase border border-emerald-100">{msg.serviceType}</span>
                          <span className="text-[9px] text-slate-300 font-bold uppercase">{new Date(msg.timestamp!).toLocaleString('fr-FR')}</span>
                        </div>
                        <h4 className="text-2xl font-black text-slate-900">{msg.clientName}</h4>
                        <div className="flex flex-wrap gap-6 text-sm font-bold">
                          <a href={`tel:${msg.phone}`} className="text-emerald-600 flex items-center gap-2">📞 {msg.phone}</a>
                          <span className="text-slate-500 flex items-center gap-2">✉️ {msg.email}</span>
                          <span className="text-slate-900 font-black px-3 py-1 bg-slate-100 rounded-lg">💰 {msg.budget} DH</span>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-[25px] text-sm italic text-slate-600 border border-slate-100">"{msg.subject}"</div>
                      </div>
                      <button onClick={() => deleteMessage(msg.id!)} className="p-4 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all shadow-sm shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visitorLogs.map((log) => (
                    <div key={log.id} className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm space-y-5 hover:border-emerald-200 transition-all animate-in zoom-in-95">
                      <div className="flex justify-between items-start">
                        <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">Activité Live</div>
                        <span className="text-[9px] font-black text-slate-300 uppercase">{new Date(log.timestamp).toLocaleTimeString('fr-FR')}</span>
                      </div>
                      <div>
                        <h5 className="text-xl font-black text-slate-900 tracking-tighter leading-none">{log.ip}</h5>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">📍 {log.location}</p>
                      </div>
                      <div className="pt-4 border-t border-slate-50 space-y-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Navigation :</p>
                        <div className="flex flex-wrap gap-2">
                          {log.pagesViewed.map((p, idx) => (
                            <span key={idx} className={`px-2 py-1 ${idx === log.pagesViewed.length - 1 ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-600'} text-[8px] font-black rounded-lg uppercase`}>{p}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {view === 'LOGIN' && (
            <div className="min-h-[60vh] flex items-center justify-center view-enter">
              <div className="bg-white p-12 rounded-[50px] shadow-2xl border border-slate-100 w-full max-w-md text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-[25px] flex items-center justify-center mx-auto mb-8">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <h2 className="text-3xl font-black text-slate-900 mb-8 uppercase tracking-tighter">Accès Gérant</h2>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="text-left space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Identifiant</label>
                    <input type="text" placeholder="LOGIN" required className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl font-black focus:border-emerald-500 uppercase outline-none" value={adminUserInput} onChange={(e) => setAdminUserInput(e.target.value)} />
                  </div>
                  <div className="text-left space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Mot de passe</label>
                    <input type="password" placeholder="MOT DE PASSE" required className="w-full bg-slate-50 border border-slate-200 p-5 rounded-2xl font-black focus:border-emerald-500 outline-none" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} />
                  </div>
                  {loginError && <p className="text-xs text-red-500 font-bold">{loginError}</p>}
                  <button type="submit" className="w-full mt-4 py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs tracking-widest shadow-lg uppercase hover:bg-emerald-700 active:scale-95 transition-all">Se Connecter</button>
                </form>
              </div>
            </div>
          )}

          {view === 'HOME' && (
            <div className="max-w-7xl mx-auto view-enter space-y-24 py-12">
              <div className="flex flex-col lg:flex-row gap-12 items-center">
                <div className="space-y-8 lg:w-1/2">
                   <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-100 rounded-full shadow-sm"><span className="w-2.5 h-2.5 bg-emerald-600 rounded-full animate-pulse"></span><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Safi • Expert Paysagiste</span></div>
                   <h1 className="text-5xl md:text-8xl font-black text-slate-900 leading-[0.85] tracking-tighter">Votre jardin, notre <span className="text-emerald-600">priorité.</span></h1>
                   <p className="text-lg text-slate-500 font-medium italic">L'excellence paysagère pour villas, résidences et industries à Safi et partout au Maroc.</p>
                   <div className="flex gap-4">
                      <button onClick={() => setView('CONTACT')} className="px-10 py-5 bg-emerald-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl">Démarrer un projet</button>
                      <button onClick={() => setView('SERVICES')} className="px-10 py-5 bg-white border-2 border-slate-100 text-slate-800 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-emerald-500 transition-all">Nos services</button>
                   </div>
                </div>
                <div className="lg:w-1/2">
                   <img src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80" className="rounded-[60px] shadow-2xl border-[12px] border-white aspect-[4/5] object-cover" alt="Hero" />
                </div>
              </div>
            </div>
          )}

          {view === 'CONTACT' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 view-enter max-w-7xl mx-auto pb-24">
              <div className="lg:col-span-5 space-y-8">
                <div className="bg-slate-900 p-14 rounded-[50px] shadow-2xl text-white border-b-[12px] border-emerald-600">
                  <h4 className="text-[14px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-12">Contact Direct</h4>
                  <div className="space-y-12">
                    <div><p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2 opacity-60">Adresse</p><p className="text-lg font-black tracking-tighter uppercase">{MY_ADDRESS}</p></div>
                    <div className="space-y-8">
                      <a href={`tel:+${MY_PHONE}`} className="flex items-center gap-6 group">
                        <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:bg-emerald-50 transition-colors"><svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></div>
                        <span className="text-3xl font-black tracking-tighter font-mono">{MY_PHONE_DISPLAY}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 bg-white rounded-[60px] p-12 md:p-16 shadow-2xl border border-slate-100">
                <h4 className="text-4xl font-black text-slate-900 mb-10 tracking-tighter uppercase leading-none">Demande de <span className="text-emerald-600">Devis.</span></h4>
                {showSuccess ? (
                  <div className="bg-emerald-50 p-12 rounded-[40px] text-center space-y-4 animate-in zoom-in">
                    <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                    <h5 className="text-xl font-black text-emerald-900 uppercase tracking-tighter">Transmission Réussie</h5>
                    <p className="text-xs font-bold text-emerald-600">Votre demande est visible instantanément par M. Rachidi.</p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Nom Complet</label>
                        <input type="text" placeholder="VOTRE NOM" required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xs font-black uppercase outline-none focus:border-emerald-500" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Téléphone (05/06/07)</label>
                        <input type="tel" placeholder="06XXXXXXXX" required className={`w-full bg-slate-50 border ${phoneError ? 'border-red-300' : 'border-slate-100'} p-5 rounded-2xl text-xs font-black outline-none focus:border-emerald-500`} value={formData.phone} onChange={handlePhoneChange} />
                        {phoneError && <p className="text-[9px] text-red-500 font-bold ml-4">{phoneError}</p>}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail</label>
                        <input type="email" placeholder="EXEMPLE@MAIL.COM" required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xs font-black outline-none focus:border-emerald-500 uppercase" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Type de Service</label>
                        <select required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xs font-black outline-none focus:border-emerald-500 uppercase" value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value as any})}>
                          <option value="Jardinage">Jardinage</option>
                          <option value="Nettoyage">Nettoyage</option>
                          <option value="Fourniture des plantes">Fourniture des plantes</option>
                          <option value="Autre">Autre</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Budget Estimé (DH)</label>
                      <input type="number" placeholder="5000" required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xs font-black outline-none focus:border-emerald-500" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Détails du Projet</label>
                      <textarea placeholder="DÉCRIVEZ VOTRE BESOIN..." required className="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl text-xs font-bold h-32 resize-none outline-none focus:border-emerald-500" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                    </div>

                    <button type="submit" disabled={dbLoading || !!phoneError} className={`w-full py-6 ${dbLoading || !!phoneError ? 'bg-slate-300' : 'bg-emerald-600 hover:bg-emerald-700 shadow-xl'} text-white rounded-[25px] font-black text-[11px] tracking-widest shadow-xl uppercase transition-all`}>
                      {dbLoading ? "TRANSMISSION..." : "Envoyer la Demande"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {['SERVICES', 'PORTFOLIO', 'QUALITY'].includes(view) && (
            <div className="max-w-7xl mx-auto view-enter pb-24 text-center">
               <h2 className="text-4xl font-black text-slate-900 mb-10 uppercase">{view}</h2>
               <p className="text-slate-400 font-bold italic">Données synchronisées en temps réel depuis le cloud Rachidi.</p>
            </div>
          )}
        </div>
        
        <footer className="h-16 flex items-center justify-between px-8 bg-white border-t border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">
          <p>© 2025 STE RACHIDI JARDINAGE • SAFI • REALTIME HUB</p>
        </footer>
      </main>

      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-[60] w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all animate-bounce-slow">
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </a>
    </div>
  );
};

export default App;