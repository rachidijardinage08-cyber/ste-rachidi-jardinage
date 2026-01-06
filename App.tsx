import React, { useState, useEffect, useRef } from 'react';
import { AppView, ServiceCategory, Project, QuoteRequest, VisitorLog } from './types';
import ProjectCard from './components/ProjectCard';
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

  // Quick Init Logic
  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 500);
    initVisitorTracking();
    
    if (isSupabaseConfigured && supabase) {
      fetchData();
      
      const channel = supabase.channel('rachidi-hq-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
          if (payload.eventType === 'INSERT') setMessages(prev => [payload.new as QuoteRequest, ...prev]);
          if (payload.eventType === 'DELETE') setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_logs' }, (payload) => {
          if (payload.eventType === 'INSERT') setVisitorLogs(prev => [payload.new as VisitorLog, ...prev]);
          if (payload.eventType === 'UPDATE') setVisitorLogs(prev => prev.map(l => l.id === payload.new.id ? (payload.new as VisitorLog) : l));
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') setIsRealtimeActive(true);
        });

      return () => {
        supabase.removeChannel(channel);
        clearTimeout(timer);
      };
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
    const savedVisitId = localStorage.getItem('rachidi_visit_id');
    if (savedVisitId) {
       currentVisitorId.current = savedVisitId;
       return;
    }

    let ipData = { ip: 'Client', city: 'Safi', country_name: 'Maroc' };
    try {
      const ipRes = await fetch('https://ipapi.co/json/');
      if (ipRes.ok) ipData = await ipRes.json();
    } catch (e) {}
    
    const newLog: VisitorLog = {
      timestamp: new Date().toISOString(),
      ip: ipData.ip || '0.0.0.0',
      location: `${ipData.city || 'Safi'}, ${ipData.country_name || 'Maroc'}`,
      pagesViewed: [view],
      userAgent: navigator.userAgent
    };

    if (isSupabaseConfigured && supabase) {
      const { data } = await supabase.from('visitor_logs').insert([newLog]).select();
      if (data && data.length > 0) {
        currentVisitorId.current = data[0].id;
        localStorage.setItem('rachidi_visit_id', data[0].id);
      }
    }
  };

  const updateVisitorPages = async () => {
    if (!currentVisitorId.current || !isSupabaseConfigured || !supabase) return;
    await supabase.from('visitor_logs').update({ pagesViewed: Array.from(pagesTracked.current) }).eq('id', currentVisitorId.current);
  };

  const fetchData = async () => {
    if (!isSupabaseConfigured || !supabase) return;
    setDbLoading(true);
    try {
      const [msgRes, logRes] = await Promise.all([
        supabase.from('messages').select('*').order('timestamp', { ascending: false }),
        supabase.from('visitor_logs').select('*').order('timestamp', { ascending: false }).limit(40)
      ]);
      if (msgRes.data) setMessages(msgRes.data);
      if (logRes.data) setVisitorLogs(logRes.data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setDbLoading(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUserInput === ADMIN_USER && adminPasswordInput === ADMIN_PASSWORD) {
      setView('ADMIN');
      setAdminUserInput('');
      setAdminPasswordInput('');
      setLoginError('');
      fetchData();
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
    setPhoneError(val.length > 0 && !/^(05|06|07)/.test(val) ? '05, 06 ou 07 requis' : (val.length > 0 && val.length < 10 ? '10 chiffres' : ''));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^(05|06|07)[0-9]{8}$/.test(formData.phone)) return;
    setDbLoading(true);
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('messages').insert([{
        clientName: formData.clientName,
        phone: formData.phone,
        email: formData.email,
        serviceType: formData.serviceType,
        subject: formData.subject,
        budget: formData.budget
      }]);
      if (!error) {
        setShowSuccess(true);
        setFormData({ clientName: '', phone: '', email: '', serviceType: 'Jardinage', subject: '', budget: '' });
      } else {
        console.error("DB Error:", error);
      }
    }
    setDbLoading(false);
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
      <div className="fixed inset-0 bg-[#064e3b] z-[200] flex items-center justify-center">
        <div className="text-center">
          <img src={LOGO_URL} className="w-32 animate-pulse mb-4" alt="Logo" />
          <div className="flex items-center gap-2 justify-center">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-100 text-slate-800 overflow-hidden font-sans">
      <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static w-72 md:w-80 bg-[#064e3b] flex flex-col shadow-2xl z-50 transition-transform duration-300`}>
        <div className="p-8 flex flex-col items-center border-b border-emerald-800/30">
          <img src={LOGO_URL} className="w-40" alt="Logo" />
        </div>
        <nav className="flex-grow p-6 space-y-1.5 overflow-y-auto custom-scroll">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => {setView(item.id as AppView); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold transition-all ${view === item.id ? 'nav-active' : 'text-emerald-100/60 hover:text-white hover:bg-emerald-800/20'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              <span className="text-[10px] uppercase tracking-[0.2em]">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-emerald-800/20">
          <button onClick={() => setView('LOGIN')} className={`w-full p-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${view === 'LOGIN' || view === 'ADMIN' ? 'bg-white text-emerald-900 shadow-xl' : 'bg-emerald-900/40 text-emerald-100 hover:bg-emerald-900'}`}>
             <span className="text-[9px] font-black uppercase tracking-widest">RACHIDI SYSTEM</span>
          </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col relative overflow-hidden bg-white lg:rounded-l-[40px]">
        <header className="h-20 flex items-center justify-between px-6 md:px-12 bg-white/80 backdrop-blur-md border-b border-slate-100 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-emerald-600 bg-emerald-50 rounded-lg"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg></button>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{view}</h3>
          </div>
          <div className="hidden md:flex items-center gap-6">
             <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
               <span className={`w-2 h-2 rounded-full ${isRealtimeActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Real-time Live</span>
             </div>
             <p className="text-sm font-black text-slate-900 mono">{new Date().toLocaleTimeString()}</p>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto custom-scroll bg-slate-50/30 p-6 md:p-12">
          {view === 'ADMIN' && (
            <div className="max-w-6xl mx-auto view-enter space-y-8 pb-24">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">CONTROL <span className="text-emerald-600">HUB</span></h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Safi Live Command Center</p>
                </div>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                   <button onClick={() => setAdminSubTab('MESSAGES')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminSubTab === 'MESSAGES' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Messages ({messages.length})</button>
                   <button onClick={() => setAdminSubTab('VISITS')} className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adminSubTab === 'VISITS' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Visiteurs ({visitorLogs.length})</button>
                </div>
              </div>

              {adminSubTab === 'MESSAGES' ? (
                <div className="grid grid-cols-1 gap-4">
                  {messages.length === 0 && <div className="p-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100 text-slate-300 font-bold uppercase tracking-widest">Aucun message pour le moment</div>}
                  {messages.map((msg) => (
                    <div key={msg.id} className="bg-white p-6 md:p-8 rounded-[35px] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-start animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="flex-grow space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-lg uppercase tracking-widest">{msg.serviceType}</span>
                          <span className="text-[9px] text-slate-300 font-bold uppercase">{new Date(msg.timestamp!).toLocaleString('fr-FR')}</span>
                        </div>
                        <h4 className="text-xl font-black text-slate-900">{msg.clientName}</h4>
                        <div className="flex flex-wrap gap-5 text-xs font-bold">
                          <a href={`tel:${msg.phone}`} className="text-emerald-600 flex items-center gap-2">📞 {msg.phone}</a>
                          <span className="text-slate-400">✉️ {msg.email}</span>
                          <span className="text-slate-900 font-black px-2 py-0.5 bg-slate-100 rounded-md">{msg.budget} DH</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl text-[13px] italic text-slate-600 border border-slate-100">"{msg.subject}"</div>
                      </div>
                      <button onClick={() => deleteMessage(msg.id!)} className="p-4 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visitorLogs.map((log) => (
                    <div key={log.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-4 hover:border-emerald-200 transition-all animate-in zoom-in-95">
                      <div className="flex justify-between items-start">
                        <div className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[8px] font-black uppercase tracking-widest">En Ligne</div>
                        <span className="text-[9px] font-black text-slate-300 uppercase">{new Date(log.timestamp).toLocaleTimeString('fr-FR')}</span>
                      </div>
                      <div>
                        <h5 className="text-lg font-black text-slate-900 tracking-tighter leading-none">{log.ip}</h5>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">📍 {log.location}</p>
                      </div>
                      <div className="pt-4 border-t border-slate-50">
                        <div className="flex flex-wrap gap-1.5">
                          {(log.pagesViewed || []).map((p, idx) => (
                            <span key={idx} className={`px-2 py-0.5 ${idx === log.pagesViewed.length - 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'} text-[8px] font-black rounded-md uppercase`}>{p}</span>
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
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tighter">Accès Gérant</h2>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <input type="text" placeholder="LOGIN" required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-black focus:border-emerald-500 outline-none uppercase" value={adminUserInput} onChange={(e) => setAdminUserInput(e.target.value)} />
                  <input type="password" placeholder="PASSWORD" required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl font-black focus:border-emerald-500 outline-none" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} />
                  {loginError && <p className="text-xs text-red-500 font-bold">{loginError}</p>}
                  <button type="submit" className="w-full mt-2 py-5 bg-emerald-600 text-white rounded-2xl font-black text-[10px] tracking-widest shadow-xl uppercase hover:bg-emerald-700 active:scale-95 transition-all">Se Connecter</button>
                </form>
              </div>
            </div>
          )}

          {view === 'HOME' && (
            <div className="max-w-7xl mx-auto view-enter space-y-24 py-12">
              <div className="flex flex-col lg:flex-row gap-16 items-center">
                <div className="space-y-8 lg:w-1/2">
                   <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-emerald-50 border border-emerald-100 rounded-full"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span><span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Safi Excellence Paysagère</span></div>
                   <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.85] tracking-tighter uppercase">Pure <span className="text-emerald-600">Nature</span> Professionnelle.</h1>
                   <p className="text-lg text-slate-500 font-medium italic">Leader du jardinage et du nettoyage industriel à Safi depuis 2016.</p>
                   <div className="flex gap-4">
                      <button onClick={() => setView('CONTACT')} className="px-10 py-5 bg-emerald-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl">Start Project</button>
                      <button onClick={() => setView('SERVICES')} className="px-10 py-5 bg-white border border-slate-100 text-slate-800 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all">Our Services</button>
                   </div>
                </div>
                <div className="lg:w-1/2 relative">
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-100/50 blur-3xl rounded-full"></div>
                   <img src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80" className="rounded-[80px] shadow-2xl relative z-10 aspect-[4/5] object-cover" alt="Hero" />
                </div>
              </div>
            </div>
          )}

          {view === 'CONTACT' && (
            <div className="max-w-4xl mx-auto view-enter pb-24">
              <div className="bg-white rounded-[60px] p-10 md:p-16 shadow-2xl border border-slate-50">
                <h4 className="text-4xl font-black text-slate-900 mb-12 tracking-tighter uppercase text-center">Estimation <span className="text-emerald-600">Directe.</span></h4>
                {showSuccess ? (
                  <div className="bg-emerald-50 p-16 rounded-[40px] text-center space-y-4 animate-in zoom-in">
                    <div className="w-20 h-20 bg-emerald-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl"><svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                    <h5 className="text-2xl font-black text-emerald-900 uppercase tracking-tighter">Notification Envoyée</h5>
                    <p className="text-sm font-bold text-emerald-600">Le gérant recevra votre demande instantanément sur son tableau de bord.</p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input type="text" placeholder="NOM COMPLET" required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-emerald-500" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
                    <div className="relative">
                      <input type="tel" placeholder="TÉLÉPHONE (06...)" required className={`w-full bg-slate-50 border ${phoneError ? 'border-red-300' : 'border-slate-100'} p-5 rounded-2xl text-[10px] font-black outline-none focus:border-emerald-500`} value={formData.phone} onChange={handlePhoneChange} />
                      {phoneError && <span className="absolute -bottom-5 left-4 text-[8px] text-red-500 font-black uppercase">{phoneError}</span>}
                    </div>
                    <input type="email" placeholder="E-MAIL" required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[10px] font-black outline-none focus:border-emerald-500 uppercase" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    <select required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[10px] font-black outline-none focus:border-emerald-500 uppercase" value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value as any})}>
                      <option value="Jardinage">Jardinage</option>
                      <option value="Nettoyage">Nettoyage</option>
                      <option value="Fourniture des plantes">Fourniture des plantes</option>
                    </select>
                    <div className="md:col-span-2">
                      <textarea placeholder="DÉTAILS DU PROJET..." required className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[30px] text-xs font-bold h-32 resize-none outline-none focus:border-emerald-500" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                    </div>
                    <button type="submit" disabled={dbLoading || !!phoneError} className={`md:col-span-2 py-6 ${dbLoading || !!phoneError ? 'bg-slate-200 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-[25px] font-black text-[10px] tracking-[0.3em] uppercase transition-all shadow-xl active:scale-95`}>
                      {dbLoading ? "SYCHRONISATION..." : "Soumettre la Demande"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
        
        <footer className="h-16 flex items-center justify-between px-10 bg-white border-t border-slate-100 text-[8px] font-black uppercase tracking-[0.3em] text-slate-300 shrink-0">
          <p>© 2025 STE RACHIDI • SAFI • REALTIME HQ</p>
          <div className="flex gap-4">
             <span>Status: Online</span>
             <span>Region: Safi-MA</span>
          </div>
        </footer>
      </main>

      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="fixed bottom-8 right-8 z-[60] w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-all animate-bounce-slow">
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </a>
    </div>
  );
};

export default App;