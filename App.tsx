import React, { useState, useEffect } from 'react';
import { AppView, ServiceCategory, Project, QuoteRequest } from './types';
import ProjectCard from './components/ProjectCard';
import { GoogleGenAI } from "@google/genai";

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
      { name: "Ponçage de Sols", desc: "Nettoyage et traitement des marbres et pierres naturelles." }
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
    description: "Plus de 3 ans de collaboration continue avec l'OCP pour le service de jardinage et nettoyage.",
    fullDetails: [
      "Marché de nettoyage et entretien des salles de réunion (Service de haute qualité).",
      "Marché d'entretien complet des espaces verts industriels sur plus de 3 ans.",
      "Gestion rigoureuse des normes HSE sur les sites OCP.",
      "Maintenance préventive des installations paysagères."
    ]
  },
  {
    title: "Villas de Prestige (A à Z)",
    imageUrl: "https://images.unsplash.com/photo-1558905619-1714249d9727?q=80&w=1000&auto=format&fit=crop",
    tags: ["Résidentiel", "Création"],
    description: "Conception et création complète d'espaces verts pour villas de luxe à Safi.",
    fullDetails: [
      "Création intégrale à partir de zéro (terrassement, terre végétale, design).",
      "Installation de systèmes d'arrosage automatique intelligents.",
      "Plantation de spécimens rares et palmiers ornementaux.",
      "Aménagement de zones de détente et bordures paysagères."
    ]
  },
  {
    title: "Impact Social & Associatif",
    imageUrl: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1000&auto=format&fit=crop",
    tags: ["Social", "National"],
    description: "Engagement bénévole et professionnel auprès des associations nationales.",
    fullDetails: [
      "Aménagement et entretien de jardins pour maisons de retraite (Mossinin).",
      "Création d'espaces de jeux et jardins pour centres d'enfants abandonnés.",
      "Entretien des jardins pour centres de personnes handicapées.",
      "Organisation de sessions de formation en jardinage (Bastana) pour les jeunes."
    ]
  }
];

const HERO_IMAGE = "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=1200&q=80";
const LOGO_URL = "https://i.ibb.co/LdF8wDg0/Empreinte-verte-et-nature.png";
const MY_PHONE = "212664381028";
const MY_PHONE_DISPLAY = "06 64 38 10 28";
const MY_EMAIL = "rachidijardinage08@gmail.com";
const MY_ADDRESS = "17 RUE E HAY OUMNIA EL BOUAB, SAFI, MAROC";
const WHATSAPP_URL = `https://wa.me/${MY_PHONE}`;
const ADMIN_PASSWORD = "Rjns2025@@";

interface WeatherStatus {
  temp: number;
  condition: string;
  suitability: 'GOOD' | 'OK' | 'BAD';
  advice: string;
}

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('HOME');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [messages, setMessages] = useState<QuoteRequest[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [weather, setWeather] = useState<WeatherStatus | null>(null);
  
  const [formData, setFormData] = useState<QuoteRequest>({
    clientName: '',
    phone: '',
    email: '',
    serviceType: 'Jardinage',
    subject: '',
    budget: ''
  });
  
  const [errors, setErrors] = useState<{phone?: string; clientName?: string; email?: string; subject?: string}>({});
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rachidi_messages');
      if (saved) setMessages(JSON.parse(saved));
    } catch (e) { console.error("Storage error", e); }
    
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    fetchWeatherAndAnalyze();

    return () => clearInterval(timer);
  }, []);

  const fetchWeatherAndAnalyze = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const data = await res.json();
        const cw = data.current_weather;
        
        const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : null;
        if (!apiKey) {
          setWeather({ temp: cw.temperature, condition: "Météo locale", suitability: 'GOOD', advice: "Ciel clair" });
          return;
        }

        const ai = new GoogleGenAI({ apiKey });
        const prompt = `En tant qu'expert en jardinage chez STE RACHIDI, analyse cette météo : ${cw.temperature}°C. Dis si c'est propice au jardinage. JSON: {"advice": "Ensoleillé", "suitability": "GOOD"}`;
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        
        let text = response.text || "{}";
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const analysis = JSON.parse(text);
        setWeather({ 
          temp: cw.temperature, 
          condition: analysis.advice || "Ok", 
          suitability: analysis.suitability || 'GOOD', 
          advice: analysis.advice || "Ok" 
        });
      } catch (err) { 
        console.error("Weather AI Error", err);
      }
    });
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === ADMIN_PASSWORD) {
      setView('ADMIN');
      setAdminPasswordInput('');
      setLoginError('');
    } else {
      setLoginError('Mot de passe incorrect.');
    }
  };

  const logout = () => {
    setView('HOME');
    setAdminPasswordInput('');
  };

  const deleteMessage = (id: string) => {
    const updated = messages.filter(m => m.id !== id);
    setMessages(updated);
    localStorage.setItem('rachidi_messages', JSON.stringify(updated));
  };

  const validatePhone = (phone: string) => /^(05|06|07)\d{8}$/.test(phone);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); 
    if (val.length > 10) val = val.slice(0, 10);
    setFormData({ ...formData, phone: val });
    if (errors.phone) setErrors({ ...errors, phone: undefined });
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: any = {};
    if (!formData.clientName.trim()) newErrors.clientName = "Nom obligatoire.";
    if (!formData.email.trim()) newErrors.email = "Email obligatoire.";
    if (!formData.subject.trim()) newErrors.subject = "Message obligatoire.";
    if (!validatePhone(formData.phone)) newErrors.phone = "Format invalide.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    const newMessage = { ...formData, id: Date.now().toString(), timestamp: new Date().toLocaleString() };
    const updated = [newMessage, ...messages];
    setMessages(updated);
    localStorage.setItem('rachidi_messages', JSON.stringify(updated));
    setTimeout(() => {
      setLoading(false);
      setShowSuccess(true);
      setFormData({ clientName: '', phone: '', email: '', serviceType: 'Jardinage', subject: '', budget: '' });
      setErrors({});
      setTimeout(() => setShowSuccess(false), 5000);
    }, 1000);
  };

  const navItems = [
    { id: 'HOME', label: 'Accueil', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'SERVICES', label: 'Services', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'PORTFOLIO', label: 'Projets', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'QUALITY', label: 'Qualité', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { id: 'CONTACT', label: 'Contact', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' }
  ];

  return (
    <div className="flex h-screen w-screen bg-slate-100 text-slate-800 overflow-hidden font-sans">
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}

      <aside className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static w-72 md:w-80 bg-[#064e3b] flex flex-col shadow-2xl z-50 transition-transform duration-300 ease-in-out`}>
        <div className="p-6 flex flex-col items-center border-b border-emerald-800/30">
          <img src={LOGO_URL} className="w-40 md:w-48 object-contain" alt="Logo" />
          <h1 className="text-white text-[10px] font-black uppercase tracking-widest text-center mt-2 opacity-80">STE RACHIDI JARDINAGE</h1>
        </div>
        <nav className="flex-grow p-6 space-y-2 overflow-y-auto custom-scroll">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => {setView(item.id as AppView); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 p-4 rounded-xl font-bold transition-all ${view === item.id ? 'nav-active' : 'text-emerald-100/60 hover:text-white hover:bg-emerald-800/20'}`}>
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
              <span className="text-[11px] uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-emerald-800/30">
          <button onClick={() => {setView('LOGIN'); setIsSidebarOpen(false);}} className={`w-full p-4 rounded-2xl flex items-center justify-center gap-3 transition-all ${view === 'LOGIN' || view === 'ADMIN' ? 'bg-white text-emerald-900 shadow-xl' : 'bg-emerald-900/50 text-white border border-emerald-700/50 hover:bg-emerald-800'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            <span className="text-[10px] font-black uppercase tracking-widest">Espace Gérant</span>
          </button>
        </div>
      </aside>

      <main className="flex-grow flex flex-col relative overflow-hidden bg-white lg:rounded-l-[40px]">
        <header className="h-20 flex items-center justify-between px-6 md:px-12 bg-white border-b border-slate-100 shrink-0 z-30">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-emerald-600 bg-emerald-50 rounded-lg"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg></button>
             <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{view === 'ADMIN' ? 'Dashboard' : view === 'LOGIN' ? 'Connexion' : view}</h3>
          </div>
          <div className="flex items-center gap-6">
            {weather && <div className="hidden sm:flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100"><div className={`w-2 h-2 rounded-full ${weather.suitability === 'GOOD' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-400'}`}></div><p className="text-[10px] font-black text-slate-700 uppercase">{weather.advice} • {weather.temp}°C</p></div>}
            <div className="hidden md:block text-right"><p className="text-lg font-black text-slate-900 tracking-tighter mono leading-none">{currentTime}</p></div>
          </div>
        </header>

        <div className="flex-grow overflow-y-auto custom-scroll bg-slate-50/50 p-6 md:p-12">
          {view === 'HOME' && (
            <div className="max-w-7xl mx-auto view-enter space-y-24 md:space-y-32 pb-24 pt-6">
              <section className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center px-2">
                <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
                  <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-100 rounded-full shadow-sm"><span className="flex h-2.5 w-2.5 rounded-full bg-emerald-600 animate-pulse"></span><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Safi • Expert Paysagiste</span></div>
                  <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[0.95] tracking-tighter">Votre jardin,<br/> notre <span className="text-emerald-600">priorité.</span></h1>
                  <p className="text-base md:text-xl text-slate-500 font-medium leading-relaxed max-w-xl italic mx-auto lg:mx-0">L'aménagement paysager professionnel pour villas, résidences et industries à Safi et partout au Maroc.</p>
                  <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                    <button onClick={() => setView('CONTACT')} className="px-10 py-5 bg-emerald-600 text-white rounded-3xl font-black text-xs tracking-widest shadow-xl hover:bg-emerald-700 transition-all uppercase">Démarrer un projet</button>
                    <button onClick={() => setView('SERVICES')} className="px-10 py-5 bg-white text-slate-800 border-2 border-slate-100 rounded-3xl font-black text-xs tracking-widest hover:border-emerald-500 transition-all uppercase">Nos services</button>
                  </div>
                </div>
                <div className="relative w-full max-w-md lg:max-w-none order-1 lg:order-2">
                  <div className="rounded-[50px] overflow-hidden shadow-2xl border-[12px] border-white aspect-[4/5]"><img src={HERO_IMAGE} className="w-full h-full object-cover" alt="Hero" /></div>
                </div>
              </section>
            </div>
          )}

          {view === 'SERVICES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 view-enter max-w-7xl mx-auto pb-24 px-2">
              {SERVICES.map((cat, i) => (
                <div key={i} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col group hover:-translate-y-2 transition-transform">
                  <div className="text-6xl mb-10">{cat.icon}</div>
                  <h4 className="text-3xl font-black text-slate-900 mb-10 tracking-tighter leading-none">{cat.title}</h4>
                  <div className="space-y-6 flex-grow">
                    {cat.items.map((item, ii) => (
                      <div key={ii} className="border-l-4 border-slate-50 pl-6 py-1"><p className="font-black text-sm text-slate-800 uppercase leading-tight">{item.name}</p><p className="text-xs text-slate-400 font-medium italic mt-1 leading-relaxed">{item.desc}</p></div>
                    ))}
                  </div>
                  <button onClick={() => setView('CONTACT')} className="mt-12 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg active:scale-95 uppercase">Devis Gratuit</button>
                </div>
              ))}
            </div>
          )}

          {view === 'PORTFOLIO' && (
            <div className="max-w-7xl mx-auto view-enter pb-24 px-2">
              <div className="text-center mb-16 px-4">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] block mb-4">Galerie Projets</span>
                <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase">Nos <span className="text-emerald-600">Réalisations</span></h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                {PROJECTS.map((project, i) => (
                  <div key={i} onClick={() => setSelectedProject(project)} className="w-full"><ProjectCard project={project} /></div>
                ))}
              </div>
            </div>
          )}

          {view === 'QUALITY' && (
            <div className="max-w-5xl mx-auto view-enter pb-24 px-2">
              <div className="text-center mb-16">
                <h2 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tighter uppercase">Engagement <span className="text-emerald-600">Total.</span></h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { t: "Zéro Défaut", d: "Chaque chantier est contrôlé par le gérant lui-même.", i: "🎯" },
                  { t: "Matériel Pro", d: "Usage de technologies haute performance.", i: "⚡" },
                  { t: "Éco-Responsable", d: "Gestion durable de l'eau et engrais bio.", i: "🌱" },
                  { t: "Rapidité", d: "Intervention sous 48h.", i: "🚀" }
                ].map((item, i) => (
                  <div key={i} className="bg-white p-10 rounded-[40px] border border-slate-100 flex flex-col sm:flex-row gap-8 shadow-sm">
                    <span className="text-6xl shrink-0">{item.i}</span>
                    <div className="space-y-2">
                      <h5 className="font-black text-xl text-slate-900 uppercase tracking-tighter">{item.t}</h5>
                      <p className="text-sm text-slate-500 leading-relaxed font-medium italic">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'CONTACT' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-16 view-enter max-w-7xl mx-auto pb-24 px-2">
              <div className="lg:col-span-5 space-y-8">
                <div className="bg-slate-900 p-10 md:p-14 rounded-[40px] md:rounded-[50px] shadow-2xl text-white border-b-[12px] border-emerald-600">
                  <h4 className="text-[14px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-12">STE RACHIDI JARDINAGE</h4>
                  <div className="space-y-12">
                    <div>
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2 opacity-60">Localisation</p>
                      <p className="text-base md:text-lg font-black leading-snug tracking-tighter uppercase">{MY_ADDRESS}</p>
                    </div>
                    <div className="space-y-8">
                      <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest opacity-60">Num de tel</p>
                      <a href={`tel:+${MY_PHONE}`} className="flex items-center gap-6 group">
                        <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/40 group-hover:bg-emerald-500 transition-colors"><svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></div>
                        <span className="text-2xl md:text-3xl font-black tracking-tighter font-mono">{MY_PHONE_DISPLAY}</span>
                      </a>
                      <div>
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2 opacity-60">Email</p>
                        <p className="text-sm md:text-base text-slate-300 font-bold uppercase tracking-widest break-all leading-tight">{MY_EMAIL}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 bg-white rounded-[40px] md:rounded-[60px] p-8 md:p-16 shadow-2xl border border-slate-100">
                <h4 className="text-3xl md:text-4xl font-black text-slate-900 mb-10 tracking-tighter uppercase leading-none">Demande de <span className="text-emerald-600">Devis.</span></h4>
                {showSuccess ? (
                  <div className="bg-emerald-50 p-10 rounded-[30px] text-center space-y-4 shadow-inner">
                    <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                    <h5 className="text-xl font-black text-emerald-900 uppercase tracking-tighter">Transmission Réussie</h5>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest">Nom Complet *</label>
                        <input type="text" placeholder="VOTRE NOM" required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-black uppercase outline-none focus:border-emerald-500 shadow-inner" value={formData.clientName} onChange={e => setFormData({...formData, clientName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest">Téléphone *</label>
                        <input type="tel" placeholder="06XXXXXXXX" required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-black outline-none focus:border-emerald-500 shadow-inner" value={formData.phone} onChange={handlePhoneChange} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest">Email *</label>
                        <input type="email" placeholder="MAIL@EXEMPLE.COM" required className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-black outline-none focus:border-emerald-500 shadow-inner" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest">Service</label>
                        <select className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs font-black outline-none focus:border-emerald-500 shadow-inner" value={formData.serviceType} onChange={e => setFormData({...formData, serviceType: e.target.value as any})}>
                          <option value="Jardinage">Jardinage</option>
                          <option value="Nettoyage">Nettoyage</option>
                          <option value="Entretien">Entretien</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase ml-4 tracking-widest">Votre Message *</label>
                      <textarea placeholder="DÉTAILS DU PROJET..." required className="w-full bg-slate-50 border border-slate-100 p-6 rounded-3xl text-xs font-bold h-36 resize-none outline-none focus:border-emerald-500 shadow-inner" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-6 bg-emerald-600 text-white rounded-[25px] font-black text-[11px] tracking-widest hover:bg-emerald-700 transition-all shadow-xl active:scale-95 uppercase">{loading ? "ENVOI..." : "Envoyer la Demande"}</button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
        
        <footer className="h-16 flex items-center justify-between px-8 bg-white border-t border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400 shrink-0">
          <p>© 2025 STE RACHIDI JARDINAGE</p>
        </footer>
      </main>

      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-slate-950/95 backdrop-blur-md">
          <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-[40px] overflow-hidden flex flex-col lg:flex-row shadow-2xl animate-in zoom-in-95">
            <div className="lg:w-1/2 h-64 lg:h-auto bg-slate-100 relative">
              <img src={selectedProject.imageUrl} className="w-full h-full object-cover" alt={selectedProject.title} />
              <button onClick={() => setSelectedProject(null)} className="absolute top-6 right-6 p-4 bg-white/20 backdrop-blur-md text-white rounded-full lg:hidden">✕</button>
            </div>
            <div className="lg:w-1/2 p-8 md:p-16 overflow-y-auto custom-scroll space-y-10">
              <div className="flex justify-between items-start">
                <h4 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">{selectedProject.title}</h4>
                <button onClick={() => setSelectedProject(null)} className="hidden lg:block p-4 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400">✕</button>
              </div>
              <p className="text-sm md:text-base text-slate-500 font-medium italic border-l-4 border-emerald-500 pl-8 py-4 bg-slate-50 rounded-r-3xl">{selectedProject.description}</p>
              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Détails</h5>
                <ul className="space-y-4">
                  {selectedProject.fullDetails.map((detail, idx) => (
                    <li key={idx} className="flex gap-4 items-start"><div className="w-5 h-5 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5"><svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div><span className="text-sm font-bold text-slate-700">{detail}</span></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 z-[60] w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-90 transition-all animate-bounce-slow">
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
      </a>
    </div>
  );
};

export default App;