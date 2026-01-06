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
    fullDetails: ["Remplacement du gazon synthétique", "Création de l'arrosage auto", "Installation de jardinières modernes", "Aménagement allées piétonnes", "Plantation de fleurs saisonnières"]
  }
];

const QUALITY_PHASES = [
  {
    title: "Phase 01: Logistique & Sécurité",
    points: [
      { id: 1, t: "Propreté du Site", d: "Nettoyage systématique avant, pendant et après chaque intervention." },
      { id: 6, t: "Conformité HSE", d: "Port des EPI et balisage de sécurité sur tout périmètre de travail." },
      { id: 7, t: "Gestion des Déchets", d: "Évacuation écologique et tri des résidus verts vers centres agréés." }
    ]
  },
  {
    title: "Phase 02: Technique & Précision",
    points: [
      { id: 3, t: "Géométrie des Bordures", d: "Alignement au laser pour des séparations gazon/allées parfaites." },
      { id: 4, t: "Performance d'Arrosage", d: "Test de pression et couverture de 100% de la zone ciblée." },
      { id: 11, t: "Systèmes Électriques", d: "Isolation et test de fonctionnement de l'éclairage extérieur." }
    ]
  },
  {
    title: "Phase 03: Biologie & Végétal",
    points: [
      { id: 2, t: "Santé du Végétal", d: "Vérification rigoureuse de l'état racinaire et foliaire de chaque plante." },
      { id: 8, t: "Équilibre Nutritif", d: "Dosage précis des engrais bio adapté à chaque type de sol." },
      { id: 9, t: "Précision de Taille", d: "Coupes cicatrisantes pour préserver la vigueur des arbres et haies." }
    ]
  },
  {
    title: "Phase 04: Finitions & Livraison",
    points: [
      { id: 5, t: "Finition des Sols", d: "Contrôle d'étanchéité et de niveau pour les surfaces minérales." },
      { id: 10, t: "Stabilité Structurelle", d: "Vérification de l'ancrage des gros sujets (palmiers/arbres)." },
      { id: 12, t: "Validation Client", d: "Visite guidée finale et signature du procès-verbal de livraison." }
    ]
  }
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
  const [adminSubTab, setAdminSubTab] = useState<'MESSAGES' | 'VISITS'>('MESSAGES');
  const [phoneError, setPhoneError] = useState('');
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('OFF');
  
  const [formData, setFormData] = useState<QuoteRequest>({
    clientName: '', phone: '', email: '', serviceType: 'Jardinage', subject: '', budget: ''
  });
  
  const currentVisitorId = useRef<string | null>(localStorage.getItem('rachidi_visit_id'));
  const pagesTracked = useRef<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 500);
    initVisitorTracking();
    
    if (isSupabaseConfigured && supabase) {
      setRealtimeStatus('CONNECTING');
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
          if (status === 'SUBSCRIBED') setRealtimeStatus('CONNECTED');
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeStatus('ERROR');
          if (status === 'CLOSED') setRealtimeStatus('OFF');
        });
        
      return () => {
        supabase.removeChannel(channel);
        clearTimeout(timer);
      };
    } else {
      setRealtimeStatus('OFF');
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

  const getStatusColor = () => {
    switch(realtimeStatus) {
      case 'CONNECTED': return 'bg-emerald-500 animate-pulse';
      case 'CONNECTING': return 'bg-amber-400 animate-bounce';
      case 'ERROR': return 'bg-red-500';
      default: return 'bg-slate-300';
    }
  };

  const getStatusText = () => {
    switch(realtimeStatus) {
      case 'CONNECTED': return 'Real-time Linked';
      case 'CONNECTING': return 'Syncing...';
      case 'ERROR': return 'Connection Error';
      default: return 'Offline Mode';
    }
  };

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
               <span className={`w-2 h-2 rounded-full ${getStatusColor()}`}></span>
               <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{getStatusText()}</span>
             </div>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto custom-scroll bg-slate-50/30 p-6 md:p-12">
          {view === 'HOME' && (
            <div className="max-w-7xl mx-auto view-enter space-y-24 py-12">
              <div className="flex flex-col lg:flex-row gap-16 items-center">
                <div className="space-y-8 lg:w-1/2">
                   <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-emerald-50 border border-emerald-100 rounded-full"><span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span><span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Safi Excellence Paysagère</span></div>
                   <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.85] tracking-tighter uppercase">Pure <span className="text-emerald-600">Nature</span> Professionnelle.</h1>
                   <p className="text-lg text-slate-500 font-medium italic">Expert en aménagement et entretien des espaces verts à Safi.</p>
                   <div className="flex gap-4">
                      <button onClick={() => setView('CONTACT')} className="px-10 py-5 bg-emerald-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl">Start Project</button>
                      <button onClick={() => setView('SERVICES')} className="px-10 py-5 bg-white border border-slate-100 text-slate-800 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all">Our Services</button>
                   </div>
                </div>
                <div className="lg:w-1/2 relative">
                   <img src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80" className="rounded-[80px] shadow-2xl relative z-10 aspect-[4/5] object-cover" alt="Hero" />
                </div>
              </div>
            </div>
          )}

          {view === 'SERVICES' && (
            <div className="max-w-7xl mx-auto view-enter space-y-16 py-12">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-4">Nos <span className="text-emerald-600">Expertises</span></h2>
                <p className="text-slate-500 font-medium italic">Une vision globale pour des espaces verts durables et harmonieux.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {SERVICES.map((cat, i) => (
                  <div key={i} className="bg-white p-10 rounded-[45px] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                    <div className="text-4xl mb-6">{cat.icon}</div>
                    <h4 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tighter">{cat.title}</h4>
                    <div className="space-y-6">
                      {cat.items.map((item, j) => (
                        <div key={j}>
                          <h5 className="text-[10px] font-black text-emerald-600 uppercase mb-2 tracking-widest">{item.name}</h5>
                          <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'PORTFOLIO' && (
            <div className="max-w-7xl mx-auto view-enter py-12">
              <div className="text-center max-w-2xl mx-auto mb-20">
                <h2 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-4">Projets <span className="text-emerald-600">Phare</span></h2>
                <p className="text-slate-500 font-medium italic uppercase tracking-widest text-[10px]">Découvrez nos réalisations à Safi.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {PROJECTS.map((project, i) => (
                  <ProjectCard key={i} project={project} onExplore={() => setSelectedProject(project)} />
                ))}
              </div>
            </div>
          )}

          {view === 'QUALITY' && (
            <div className="max-w-6xl mx-auto view-enter py-12 pb-32">
               <div className="text-center mb-24 relative">
                  <div className="inline-block px-6 py-2 bg-emerald-50 border border-emerald-100 rounded-full mb-6">
                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.4em]">Audit de Performance & Qualité</span>
                  </div>
                  <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9] mb-8">
                    Notre <span className="text-emerald-600 underline decoration-emerald-200 underline-offset-8">Protocole</span> de Livraison.
                  </h2>
                  <p className="text-slate-400 text-lg font-medium italic max-w-2xl mx-auto">
                    Une rigueur absolue appliquée à chaque m² aménagé. Les 12 piliers de l'excellence STE RACHIDI.
                  </p>
               </div>
               
               <div className="relative border-l-2 border-emerald-100 ml-4 md:ml-8 pl-8 md:pl-16 space-y-32">
                  {QUALITY_PHASES.map((phase, pIdx) => (
                    <div key={pIdx} className="relative group">
                      {/* Phase Marker */}
                      <div className="absolute -left-[45px] md:-left-[77px] top-0 w-8 h-8 md:w-14 md:h-14 bg-[#064e3b] rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-xl group-hover:bg-emerald-600 transition-colors duration-500">
                        <span className="text-xs md:text-base font-black">0{pIdx + 1}</span>
                      </div>
                      
                      <div className="mb-12">
                         <h3 className="text-2xl md:text-4xl font-black text-slate-800 uppercase tracking-tighter mb-2 group-hover:text-emerald-700 transition-colors">{phase.title}</h3>
                         <div className="w-20 h-1.5 bg-emerald-500 rounded-full"></div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                        {phase.points.map((point) => (
                          <div key={point.id} className="bg-white p-8 md:p-10 rounded-[40px] border border-slate-50 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col group/card">
                            <div className="flex justify-between items-start mb-8">
                               <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center text-[10px] font-black group-hover/card:bg-emerald-100 group-hover/card:text-emerald-700 transition-colors">
                                 {point.id < 10 ? `0${point.id}` : point.id}
                               </div>
                               <div className="w-6 h-6 rounded-full border-2 border-emerald-50 flex items-center justify-center group-hover/card:border-emerald-400 group-hover/card:bg-emerald-50 transition-all">
                                  <svg className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover/card:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                  </svg>
                               </div>
                            </div>
                            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-4 leading-tight group-hover/card:text-emerald-800">{point.t}</h4>
                            <p className="text-[11px] text-slate-400 font-bold leading-relaxed mb-6 italic">{point.d}</p>
                            <div className="mt-auto flex items-center gap-3">
                               <div className="h-1 bg-emerald-50 flex-grow rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500 w-full translate-x-[-100%] group-hover/card:translate-x-0 transition-transform duration-700"></div>
                               </div>
                               <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest group-hover/card:text-emerald-500 transition-colors">Opérationnel</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
               </div>

               <div className="mt-32 bg-[#064e3b] rounded-[60px] md:rounded-[100px] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(6,78,59,0.3)]">
                  <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.1),transparent)]"></div>
                  <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent)]"></div>
                  
                  <div className="relative z-10 space-y-8">
                    <div className="w-24 h-24 bg-emerald-500/20 backdrop-blur-xl rounded-[40px] flex items-center justify-center mx-auto mb-10 border border-emerald-500/30">
                       <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                       </svg>
                    </div>
                    <h4 className="text-[12px] font-black uppercase tracking-[0.6em] text-emerald-400">Rachidi Quality Assurance</h4>
                    <p className="text-3xl md:text-5xl font-black tracking-tighter uppercase max-w-4xl mx-auto leading-tight">
                      Si un seul point de contrôle est jugé non-conforme, l'équipe technique intervient en <span className="text-emerald-400">48h maximum</span> pour correction gratuite.
                    </p>
                    <div className="pt-10 flex flex-wrap justify-center gap-6">
                       <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
                         <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                         Audit Interne Hebdomadaire
                       </div>
                       <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm">
                         <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                         Sourcing Matières Premium
                       </div>
                    </div>
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
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Nom Complet</label>
                      <input type="text" placeholder="VOTRE NOM" required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-emerald-500 transition-all" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Téléphone</label>
                      <div className="relative">
                        <input type="tel" placeholder="06XXXXXXXX" required className={`w-full bg-slate-50 border ${phoneError ? 'border-red-300' : 'border-slate-100'} p-5 rounded-2xl text-[10px] font-black outline-none focus:border-emerald-500 transition-all`} value={formData.phone} onChange={handlePhoneChange} />
                        {phoneError && <span className="absolute -bottom-5 left-4 text-[8px] text-red-500 font-black uppercase">{phoneError}</span>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Email</label>
                      <input type="email" placeholder="EXEMPLE@MAIL.COM" required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[10px] font-black outline-none focus:border-emerald-500 uppercase transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Service Souhaité</label>
                      <select required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[10px] font-black outline-none focus:border-emerald-500 uppercase transition-all bg-white" value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value as any})}>
                        <option value="Jardinage">Jardinage</option>
                        <option value="Nettoyage">Nettoyage</option>
                        <option value="Fourniture des plantes">Fourniture des plantes</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Budget Estimé (DH)</label>
                      <input type="text" placeholder="EX: 5000" required className="w-full bg-slate-50 border border-slate-100 p-5 rounded-2xl text-[10px] font-black outline-none focus:border-emerald-500 transition-all" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})} />
                    </div>
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Détails du projet</label>
                      <textarea placeholder="DÉCRIVEZ VOTRE BESOIN..." required className="w-full bg-slate-50 border border-slate-100 p-6 rounded-[30px] text-xs font-bold h-32 resize-none outline-none focus:border-emerald-500 transition-all" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                    </div>
                    <button type="submit" disabled={dbLoading || !!phoneError} className={`md:col-span-2 py-6 ${dbLoading || !!phoneError ? 'bg-slate-200 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'} text-white rounded-[25px] font-black text-[10px] tracking-[0.3em] uppercase transition-all shadow-xl active:scale-95`}>
                      {dbLoading ? "SYCHRONISATION..." : "Envoyer la Demande"}
                    </button>
                  </form>
                )}
              </div>
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
              
              {!isSupabaseConfigured && (
                <div className="p-6 bg-red-50 border border-red-100 rounded-[30px] flex items-center gap-4 text-red-600">
                   <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                   <p className="text-[10px] font-black uppercase tracking-widest">Alerte System: Supabase non configuré. Les données sont en mode lecture-seule ou locales.</p>
                </div>
              )}

              {adminSubTab === 'MESSAGES' ? (
                <div className="grid grid-cols-1 gap-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-start animate-in fade-in slide-in-from-right-4 duration-300">
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
        </div>

        {/* Modal d'explication des projets */}
        {selectedProject && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-[#064e3b]/40 backdrop-blur-md" onClick={() => setSelectedProject(null)}></div>
            <div className="bg-white w-full max-w-5xl rounded-[40px] md:rounded-[60px] overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh]">
              <div className="w-full md:w-1/2 h-64 md:h-auto min-h-[250px] md:min-h-full shrink-0 relative bg-slate-100">
                <img 
                  src={selectedProject.imageUrl} 
                  className="absolute inset-0 w-full h-full object-cover" 
                  alt={selectedProject.title}
                  onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                  style={{ opacity: 0, transition: 'opacity 0.5s ease-in-out' }}
                />
              </div>
              
              <div className="p-8 md:p-14 flex flex-col overflow-y-auto custom-scroll w-full">
                <div className="flex justify-between items-start mb-8">
                   <div className="flex flex-wrap gap-2">
                     {selectedProject.tags.map(t => <span key={t} className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded-full uppercase tracking-widest">{t}</span>)}
                   </div>
                   <button onClick={() => setSelectedProject(null)} className="p-2 text-slate-300 hover:text-emerald-600 transition-colors bg-slate-50 rounded-xl">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>
                
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tighter uppercase leading-[0.9]">{selectedProject.title}</h3>
                <p className="text-slate-500 font-medium italic mb-8 border-l-4 border-emerald-500 pl-5 text-sm md:text-base leading-relaxed">{selectedProject.description}</p>
                
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                    <span className="w-8 h-[1px] bg-slate-200"></span>
                    Explication Technique
                  </h4>
                  <ul className="space-y-4">
                    {selectedProject.fullDetails.map((detail, idx) => (
                      <li key={idx} className="flex gap-4 items-start group">
                        <div className="w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center shrink-0 text-[11px] font-black shadow-lg shadow-emerald-200">{idx + 1}</div>
                        <span className="text-sm md:text-base font-bold text-slate-700 leading-tight pt-1 group-hover:text-emerald-600 transition-colors">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="mt-auto pt-10 border-t border-slate-100 flex gap-4">
                  <button onClick={() => {setSelectedProject(null); setView('CONTACT');}} className="flex-grow py-5 bg-[#064e3b] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-emerald-900 transition-all active:scale-95">Commander un projet similaire</button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <footer className="h-16 flex items-center justify-between px-10 bg-white border-t border-slate-100 text-[8px] font-black uppercase tracking-[0.3em] text-slate-300 shrink-0">
          <p>© 2025 STE RACHIDI • SAFI • REALTIME HQ</p>
          <div className="flex gap-4">
             <span>Status: Stable</span>
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