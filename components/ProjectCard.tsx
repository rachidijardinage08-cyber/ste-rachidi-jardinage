import React from 'react';
import { Project } from '../types';

interface ProjectCardProps {
  project: Project;
  onExplore?: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onExplore }) => {
  return (
    <div 
      onClick={onExplore}
      className="group bg-white rounded-[35px] md:rounded-[45px] border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 ease-out cursor-pointer flex flex-col shadow-sm h-full"
    >
      {/* Image Section */}
      <div className="relative h-56 md:h-72 overflow-hidden bg-emerald-50">
        <img 
          src={project.imageUrl} 
          alt={project.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=800&auto=format&fit=crop";
          }}
        />

        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 bg-white/40 backdrop-blur-xl rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/20">
            Détails
          </span>
        </div>

        {/* Overlay Tags */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-8 pointer-events-none">
          <div className="flex flex-wrap gap-2">
            {project.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-white/20 backdrop-blur-xl rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/20">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 md:p-10 flex-grow flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Safi Excellence</span>
        </div>
        <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-3 group-hover:text-emerald-600 transition-colors tracking-tighter leading-none uppercase">
          {project.title}
        </h3>
        <p className="text-slate-500 text-[11px] md:text-sm leading-relaxed mb-6 line-clamp-2 md:line-clamp-3 font-medium opacity-80 italic">
          {project.description}
        </p>
        <div className="mt-auto pt-4 md:pt-6 border-t border-slate-50 flex items-center justify-between">
           <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Explorer l'explication</span>
           <svg className="w-4 h-4 text-emerald-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
           </svg>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;