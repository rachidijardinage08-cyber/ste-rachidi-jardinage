import React, { useState, useEffect, useRef } from 'react';
import { AppView, ServiceCategory, Project, QuoteRequest, VisitorLog } from './types';
import ProjectCard from './components/ProjectCard';
import { supabase, isSupabaseConfigured, getSafeConfigStatus, saveFallbackKeys, clearFallbackKeys, mockDb } from './services/supabaseClient';

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
    title: "Aménagement Villa Royale",
    imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1200&auto=format&fit=crop",
    tags: ["Résidentiel", "Premium"],
    description: "Création d'un jardin méditerranéen avec système d'arrosage automatisé intelligent.",
    fullDetails: ["Étude topographique complète", "Installation pompe solaire 3HP", "Gazon naturel 'Bermuda Grass'", "Plantation de 12 palmiers Washingtonia", "Éclairage LED RGB télécommandé"]
  },
  {
    title: "Maintenance Parc Industriel",
    imageUrl: "https://images.unsplash.com/photo-1589923188900-85dae523342b?q=80&w=1200&auto=format&fit=crop",
    tags: ["Industriel", "HSE"],
    description: "Entretien trimestriel des espaces verts industriels pour les grands comptes de Safi.",
    fullDetails: ["Taille ornementale des haies", "Traitement phytosanitaire certifié", "Désherbage manuel des zones de stockage", "Reporting hebdomadaire HSE", "Gestion centralisée de l'irrigation"]
  },
  {
    title: "Espace Vert Copropriété",
    imageUrl: "https://images.unsplash.com/photo-1598902108854-10e335adac99?q=80&w=1200&auto=format&fit=crop",
    tags: ["Urbain", "Maintenance"],
    description: "Réhabilitation complète des jardins d'une résidence de haut standing.",
    fullDetails: ["Remplacement du gazon synthétique", "Création de l'arrosage auto", "Installation de l'éclairage nocturne", "Aménagement allées piétonnes", "Plantation de fleurs saisonnières"]
  }
];

const QUALITY_ITEMS = [
  { id: 1, icon: "🧹", t: "Nettoyage intégral", d: "Zéro déchet laissé sur place. Chantier propre chaque soir." },
  { id: 2, icon: "🩺", t: "Bilan phytosanitaire", d: "Contrôle de santé pour chaque plante avant plantation." },
  { id: 3, icon: "📐", t: "Bordures au laser", d: "Alignement millimétré des séparations et allées." },
  { id: 4, icon: "💧", t: "Test d'irrigation", d: "Vérification individuelle de chaque goutteur et turbine." },
  { id: 5, icon: "⚖️", t: "Niveaux & Drainage", d: "Évacuation des eaux pluviales testée sous 48h." },
  { id: 6, icon: "🦺", t: "Sécurité HSE", d: "Équipements de protection et balisage 100% conformes." },
  { id: 7, icon: "♻️", t: "Tri des déchets", d: "Valorisation des déchets verts en compostage certifié." },
  { id: 8, icon: "🧪", t: "Analyse du sol", d: "Amendements organiques dosés sur mesure par parcelle." },
  { id: 9, icon: "✂️", t: "Taille de précision", d: "Respect des périodes de sève pour une croissance saine." },
  { id: 10, icon: "🏗️", t: "Ancrage des arbres", d: "Haubanage invisible pour palmiers et arbres de haute tige." },
  { id: 11, icon: "💡", t: "Éclairage Basse Tension", d: "Test d'étanchéité IP68 sur tout le réseau extérieur." },
  { id: 12, icon: "✍️", t: "Validation PV", d: "Signature finale après inspection point par point avec vous." }
];

const LOGO_URL = "https://i.ibb.co/LdF8wDg0/Empreinte-verte-et-nature.png";
const MY_PHONE = "212664381028";
const WHATSAPP_URL = `https://wa.me/${MY_PHONE}`;
const ADMIN_USER = "admin";
const ADMIN_PASSWORD = "Rjns2025@@";

type RealtimeStatus = 'OFF' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

const App: React.FC = () => {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [view, setView] = useState<AppView>('HOME');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [adminUserInput, setAdminUserInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [messages, setMessages] = useState<QuoteRequest[]>([]);
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState<'MESSAGES' | 'VISITS' | 'DIAGNOSTIC'>('MESSAGES');
  const [phoneError, setPhoneError] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('OFF');
  
  const [tempUrl, setTempUrl] = useState(getSafeConfigStatus().urlValue);
  const [tempKey, setTempKey] = useState(getSafeConfigStatus().keyValue);

  const [formData, setFormData] = useState<QuoteRequest>({
    clientName: '', phone: '', email: '', serviceType: 'Jardinage', subject: '', budget: ''
  });
  
  const currentVisitorId = useRef<string | null>(localStorage.getItem('rachidi_visit_id'));
  const pagesTracked = useRef<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 500);
    initVisitorTracking();
    
    if (isSupabaseConfigured && supabase) {
      connectToRealtime();
    } else {
      setRealtimeStatus('OFF');
      setMessages(mockDb.getMessages());
    }
    
    return () => clearTimeout(timer);
  }, []);

  const connectToRealtime = () => {
    if (!supabase) return;
    setRealtimeStatus('CONNECTING');
    fetchData();
    
    const channel = supabase.channel('rachidi-hq-main')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        if (payload.eventType === 'INSERT') setMessages(prev => [payload.new as QuoteRequest, ...prev]);
        if (payload.eventType === 'DELETE') setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_logs' }, (payload) => {
        if (payload.eventType === 'INSERT') setVisitorLogs(prev => [payload.new as VisitorLog, ...prev]);
        if (payload.eventType === 'UPDATE') setVisitorLogs(prev => prev.map(l => l.id === payload.new.id ? (payload.new as VisitorLog) : l));
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('CONNECTED');
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setRealtimeStatus('ERROR');
          setTimeout(connectToRealtime, 10000);
        }
      });
  };

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
    if (!isSupabaseConfigured || !supabase) {
      setMessages(mockDb.getMessages());
      return;
    }
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
      setMessages(mockDb.getMessages());
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
    } else {
      mockDb.deleteMessage(id);
      setMessages(mockDb.getMessages());
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
      if (!error) setShowSuccess(true);
    } else {
      mockDb.saveMessage(formData);
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

  return (
    <div className="flex h-screen w-screen bg-slate-100 text-slate-800 overflow-hidden font-sans">
      {/* Sidebar - Fix mobile overflow and transition */}
      <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static w-72 md:w-80 bg-[#064e3b] flex flex-col shadow-2xl z-[60] transition-transform duration-300 ease-in-out`}>
        <div className="p-8 flex flex-col items-center border-b border-emerald-800/30">
          <img src={LOGO_URL} className="w-32 md:w-40" alt="Logo" />
        </div>
        <nav className="flex-grow p-4 md:p-6 space-y-1.5 overflow-y-auto custom-scroll">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => {setView(item.id as AppView); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold transition-all ${view === item.id ? 'nav-active' : 'text-emerald-100/60 hover:text-white hover:bg-emerald-800/20'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              <span className="text-[10px] uppercase tracking-[0.2em]">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-emerald-800/20">
          <button onClick={() => {setView('LOGIN'); setIsSidebarOpen(false);}} className={`w-full p-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${view === 'LOGIN' || view === 'ADMIN' ? 'bg-white text-emerald-900 shadow-xl' : 'bg-emerald-900/40 text-emerald-100 hover:bg-emerald-900'}`}>
             <span className="text-[9px] font-black uppercase tracking-widest">RACHIDI SYSTEM</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <main className="flex-grow flex flex-col relative overflow-hidden bg-white lg:rounded-l-[40px]">
        {/* Header - Optimized for mobile title */}
        <header className="h-20 flex items-center justify-between px-5 md:px-12 bg-white/80 backdrop-blur-md border-b border-slate-100 shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-emerald-600 bg-emerald-50 rounded-lg active:scale-90 transition-transform"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg></button>
            <h3 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tighter truncate max-w-[150px] md:max-w-none">{view}</h3>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-slate-50 rounded-full border border-slate-100" onClick={() => {
               if (view === 'ADMIN') setAdminSubTab('DIAGNOSTIC');
               else setView('LOGIN');
             }}>
               <span className={`w-2 h-2 rounded-full ${realtimeStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`}></span>
               <span className="text-[7px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest">
                 {realtimeStatus === 'CONNECTED' ? 'Synchronisé' : 'Local'}
               </span>
             </div>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto custom-scroll bg-slate-50/30 p-4 md:p-12">
          {view === 'HOME' && (
            <div className="max-w-7xl mx-auto view-enter space-y-12 md:space-y-24 py-8 md:py-12">
              <div className="flex flex-col lg:flex-row gap-10 md:gap-16 items-center">
                <div className="space-y-6 md:space-y-8 lg:w-1/2 text-center lg:text-left">
                   <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span><span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Safi Excellence Paysagère</span></div>
                   <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter uppercase">Pure <span className="text-emerald-600">Nature</span> Professionnelle.</h1>
                   <p className="text-base md:text-lg text-slate-500 font-medium italic px-4 md:px-0">Expert en aménagement et entretien des espaces verts à Safi.</p>
                   <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start px-8 md:px-0">
                      <button onClick={() => setView('CONTACT')} className="px-10 py-5 bg-emerald-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Démarrer</button>
                      <button onClick={() => setView('SERVICES')} className="px-10 py-5 bg-white border border-slate-100 text-slate-800 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 active:scale-95 transition-all">Services</button>
                   </div>
                </div>
                <div className="w-full lg:w-1/2 relative px-4 md:px-0">
                   <img src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80" className="rounded-[40px] md:rounded-[80px] shadow-2xl relative z-10 aspect-square md:aspect-[4/5] object-cover" alt="Hero" />
                </div>
              </div>
            </div>
          )}

          {view === 'QUALITY' && (
            <div className="max-w-7xl mx-auto view-enter space-y-12 md:space-y-16 py-8 md:py-12 pb-32">
               <div className="text-center max-w-4xl mx-auto mb-10 md:mb-20">
                  <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 mb-6">
                    <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">QUALITÉ GARANTIE 2025</span>
                  </div>
                  <h2 className="text-4xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9] mb-6">Standard de <span className="text-emerald-600">Confiance.</span></h2>
                  <p className="text-slate-400 text-sm md:text-lg font-medium italic px-4">Nous appliquons 12 points de contrôle rigoureux sur chaque chantier à Safi.</p>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                  {QUALITY_ITEMS.map((item) => (
                    <div key={item.id} className="group bg-white p-6 md:p-10 rounded-[30px] md:rounded-[50px] border border-slate-50 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col h-full overflow-hidden relative">
                       <div className="flex justify-between items-start mb-6 md:mb-10 relative z-10">
                          <div className="text-3xl md:text-4xl bg-slate-50 w-16 h-16 md:w-20 md:h-20 rounded-[20px] md:rounded-[30px] flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500 shadow-inner">
                            {item.icon}
                          </div>
                          <span className="text-3xl md:text-4xl font-black text-slate-100 group-hover:text-emerald-200 transition-colors leading-none">
                            {item.id < 10 ? `0${item.id}` : item.id}
                          </span>
                       </div>
                       <h4 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tighter mb-3 md:mb-4 group-hover:text-emerald-700 transition-colors">{item.t}</h4>
                       <p className="text-xs md:text-sm text-slate-400 font-bold leading-relaxed mb-6 italic">{item.d}</p>
                       <div className="mt-auto pt-4 border-t border-slate-50 flex items-center gap-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-700">Contrôlé</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {view === 'SERVICES' && (
            <div className="max-w-7xl mx-auto view-enter space-y-10 md:space-y-16 py-8 md:py-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {SERVICES.map((cat, i) => (
                  <div key={i} className="bg-white p-8 md:p-10 rounded-[35px] md:rounded-[45px] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                    <div className="text-4xl mb-6">{cat.icon}</div>
                    <h4 className="text-xl md:text-2xl font-black text-slate-900 mb-6 md:mb-8 uppercase tracking-tighter">{cat.title}</h4>
                    <div className="space-y-5 md:space-y-6">
                      {cat.items.map((item, j) => (
                        <div key={j}>
                          <h5 className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-widest">{item.name}</h5>
                          <p className="text-[11px] md:text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'PORTFOLIO' && (
            <div className="max-w-7xl mx-auto view-enter py-8 md:py-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                {PROJECTS.map((project, i) => (
                  <ProjectCard key={i} project={project} onExplore={() => setSelectedProject(project)} />
                ))}
              </div>
            </div>
          )}

          {view === 'CONTACT' && (
            <div className="max-w-3xl mx-auto view-enter pb-24">
              <div className="bg-white rounded-[40px] md:rounded-[60px] p-8 md:p-16 shadow-2xl border border-slate-50">
                <h4 className="text-3xl md:text-4xl font-black text-slate-900 mb-10 md:mb-12 tracking-tighter uppercase text-center">Estimation <span className="text-emerald-600">Directe.</span></h4>
                {showSuccess ? (
                  <div className="bg-emerald-50 p-12 md:p-16 rounded-[40px] text-center space-y-4 animate-in zoom-in">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-600 text-white rounded-3xl flex items-center justify-center mx-auto mb-4"><svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                    <h5 className="text-xl md:text-2xl font-black text-emerald-900 uppercase tracking-tighter">C'est Reçu !</h5>
                    <p className="text-xs md:text-sm font-bold text-emerald-600 px-4">Nous reviendrons vers vous dans les plus brefs délais.</p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Nom</label>
                      <input type="text" placeholder="VOTRE NOM" required className="w-full bg-slate-50 border border-slate-100 p-4 md:p-5 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-emerald-500" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Phone</label>
                      <input type="tel" placeholder="06XXXXXXXX" required className={`w-full bg-slate-50 border ${phoneError ? 'border-red-300' : 'border-slate-100'} p-4 md:p-5 rounded-2xl text-[10px] font-black outline-none focus:border-emerald-500`} value={formData.phone} onChange={handlePhoneChange} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-4">Service</label>
                      <select required className="w-full bg-slate-50 border border-slate-100 p-4 md:p-5 rounded-2xl text-[10px] font-black outline-none bg-white focus:border-emerald-500 uppercase" value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value as any})}>
                        <option value="Jardinage">Jardinage</option>
                        <option value="Nettoyage">Nettoyage</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <textarea placeholder="VOTRE BESOIN..." required className="w-full bg-slate-50 border border-slate-100 p-5 md:p-6 rounded-[25px] md:rounded-[30px] text-xs font-bold h-32 md:h-40 resize-none outline-none focus:border-emerald-500" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                    </div>
                    <button type="submit" disabled={dbLoading || !!phoneError} className="md:col-span-2 py-5 md:py-6 bg-emerald-600 text-white rounded-[20px] md:rounded-[25px] font-black text-[10px] tracking-widest shadow-xl uppercase active:scale-95 transition-all">
                      {dbLoading ? "Chargement..." : "Envoyer la Demande"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {view === 'LOGIN' && (
            <div className="min-h-[50vh] flex items-center justify-center view-enter px-4">
              <div className="bg-white p-8 md:p-12 rounded-[40px] md:rounded-[50px] shadow-2xl border border-slate-100 w-full max-w-md text-center">
                <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-8 uppercase tracking-tighter">Accès Gérant</h2>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <input type="text" placeholder="LOGIN" required className="w-full bg-slate-50 border border-slate-100 p-4 md:p-5 rounded-2xl font-black focus:border-emerald-500 outline-none uppercase text-xs" value={adminUserInput} onChange={(e) => setAdminUserInput(e.target.value)} />
                  <input type="password" placeholder="PASSWORD" required className="w-full bg-slate-50 border border-slate-100 p-4 md:p-5 rounded-2xl font-black focus:border-emerald-500 outline-none text-xs" value={adminPasswordInput} onChange={(e) => setAdminPasswordInput(e.target.value)} />
                  {loginError && <p className="text-[10px] text-red-500 font-bold">{loginError}</p>}
                  <button type="submit" className="w-full mt-2 py-4 md:py-5 bg-emerald-600 text-white rounded-2xl font-black text-[9px] md:text-[10px] tracking-widest shadow-xl uppercase active:scale-95 transition-all">Se Connecter</button>
                </form>
              </div>
            </div>
          )}

          {view === 'ADMIN' && (
            <div className="max-w-6xl mx-auto view-enter space-y-6 md:space-y-8 pb-24">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase">CONTROL <span className="text-emerald-600">HUB</span></h2>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto w-full md:w-auto scrollbar-hide">
                   <button onClick={() => setAdminSubTab('MESSAGES')} className={`flex-1 md:flex-none px-4 md:px-6 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${adminSubTab === 'MESSAGES' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>Messages</button>
                   <button onClick={() => setAdminSubTab('VISITS')} className={`flex-1 md:flex-none px-4 md:px-6 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${adminSubTab === 'VISITS' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400'}`}>Visites</button>
                   <button onClick={() => setAdminSubTab('DIAGNOSTIC')} className={`flex-1 md:flex-none px-4 md:px-6 py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${adminSubTab === 'DIAGNOSTIC' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>Réglages</button>
                </div>
              </div>

              {adminSubTab === 'MESSAGES' && (
                <div className="grid grid-cols-1 gap-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="bg-white p-6 md:p-8 rounded-[30px] md:rounded-[35px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 md:gap-6 items-start">
                      <div className="flex-grow space-y-3 w-full">
                        <div className="flex justify-between items-center">
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-lg uppercase tracking-widest">{msg.serviceType}</span>
                          <span className="text-[8px] text-slate-300 font-bold uppercase">{new Date(msg.timestamp!).toLocaleDateString()}</span>
                        </div>
                        <h4 className="text-lg md:text-xl font-black text-slate-900">{msg.clientName}</h4>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 text-[11px] font-bold">
                          <a href={`tel:${msg.phone}`} className="text-emerald-600">📞 {msg.phone}</a>
                          <span className="text-slate-900 font-black px-2 py-0.5 bg-slate-100 rounded-md inline-block w-max">{msg.budget} DH</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl text-xs md:text-[13px] italic text-slate-600 border border-slate-100">"{msg.subject}"</div>
                      </div>
                      <button onClick={() => deleteMessage(msg.id!)} className="self-end md:self-start p-3 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                    </div>
                  ))}
                </div>
              )}
              
              {adminSubTab === 'DIAGNOSTIC' && (
                <div className="bg-white p-6 md:p-10 rounded-[35px] md:rounded-[50px] border border-slate-100 shadow-xl space-y-8">
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      <div className="p-5 md:p-6 bg-slate-50 rounded-[25px] border border-slate-100">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Variables</span>
                         <span className={`font-black text-xs ${getSafeConfigStatus().configured ? 'text-emerald-600' : 'text-red-500'}`}>{getSafeConfigStatus().configured ? 'DÉTECTÉES' : 'NON DÉTECTÉES'}</span>
                      </div>
                      <div className="p-5 md:p-6 bg-slate-50 rounded-[25px] border border-slate-100">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Realtime</span>
                         <span className="font-black text-xs text-slate-800 uppercase">{realtimeStatus}</span>
                      </div>
                   </div>
                   <div className="bg-amber-50 p-6 md:p-8 rounded-[30px] md:rounded-[40px] border border-amber-100 space-y-4">
                      <h4 className="text-lg font-black text-amber-900 uppercase tracking-tighter">Injection Manuelle</h4>
                      <input type="text" placeholder="URL SUPABASE" className="w-full bg-white border border-amber-200 p-4 rounded-xl text-[10px] font-mono outline-none" value={tempUrl} onChange={(e) => setTempUrl(e.target.value)} />
                      <input type="password" placeholder="KEY ANON" className="w-full bg-white border border-amber-200 p-4 rounded-xl text-[10px] font-mono outline-none" value={tempKey} onChange={(e) => setTempKey(e.target.value)} />
                      <div className="flex gap-3">
                        <button onClick={() => saveFallbackKeys(tempUrl, tempKey)} className="flex-1 py-4 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Enregistrer</button>
                        <button onClick={() => clearFallbackKeys()} className="py-4 px-6 bg-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest">Reset</button>
                      </div>
                   </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal d'explication des projets - Optimized for mobile */}
        {selectedProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-12 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-[#064e3b]/60 backdrop-blur-md" onClick={() => setSelectedProject(null)}></div>
            <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:rounded-[60px] overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden">
              <div className="w-full md:w-1/2 h-64 md:h-auto shrink-0 relative">
                <img src={selectedProject.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt={selectedProject.title} />
                <button onClick={() => setSelectedProject(null)} className="md:hidden absolute top-4 right-4 p-3 bg-black/30 backdrop-blur-md text-white rounded-full">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="p-8 md:p-14 flex flex-col w-full md:overflow-y-auto custom-scroll">
                <div className="hidden md:flex justify-between items-start mb-8">
                   <div className="flex flex-wrap gap-2">
                     {selectedProject.tags.map(t => <span key={t} className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-full uppercase tracking-widest">{t}</span>)}
                   </div>
                   <button onClick={() => setSelectedProject(null)} className="p-2 text-slate-300 hover:text-emerald-600 transition-colors bg-slate-50 rounded-xl">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
                <div className="md:hidden flex flex-wrap gap-2 mb-4">
                  {selectedProject.tags.map(t => <span key={t} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[7px] font-black rounded-full uppercase tracking-widest">{t}</span>)}
                </div>
                <h3 className="text-2xl md:text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase leading-tight">{selectedProject.title}</h3>
                <p className="text-slate-500 font-medium italic mb-8 border-l-4 border-emerald-500 pl-5 text-sm leading-relaxed">{selectedProject.description}</p>
                <div className="space-y-4 md:space-y-6 mb-8 md:mb-0">
                  {selectedProject.fullDetails.map((detail, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black">{idx + 1}</div>
                      <span className="text-sm font-bold text-slate-700 pt-1 leading-snug">{detail}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => {setSelectedProject(null); setView('CONTACT');}} className="md:hidden w-full py-5 bg-[#064e3b] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest mt-4">Demander Devis</button>
              </div>
            </div>
          </div>
        )}
        
        <footer className="h-14 md:h-16 flex items-center justify-between px-6 md:px-10 bg-white border-t border-slate-100 text-[7px] md:text-[8px] font-black uppercase tracking-[0.3em] text-slate-300 shrink-0">
          <p>© 2025 STE RACHIDI • SAFI</p>
          <div className="hidden sm:flex gap-4">
             <span>Status: {realtimeStatus}</span>
          </div>
        </footer>
      </main>

      {/* Floating WhatsApp - Responsive position */}
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-[60] w-14 h-14 md:w-16 md:h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all animate-bounce-slow">
        <svg className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </a>
    </div>
  );
};

export default App;