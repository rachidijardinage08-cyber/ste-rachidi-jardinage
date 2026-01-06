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
      className="group bg-white rounded-[35px] border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-out cursor-pointer flex flex-col shadow-sm h-full"
    >
      {/* Image Section */}
      <div className="relative h-48 md:h-72 overflow-hidden bg-emerald-50">
        <img 
          src={project.imageUrl} 
          alt={project.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        <div className="absolute top-4 right-4">
          <span className="px-3 py-1 bg-white/60 backdrop-blur-md rounded-full text-[7px] md:text-[8px] font-black text-emerald-900 uppercase tracking-widest border border-white/20">
            Explorer
          </span>
        </div>
      </div>

      <div className="p-6 md:p-10 flex-grow flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">Safi Excellence</span>
        </div>
        <h3 className="text-lg md:text-2xl font-black text-slate-800 mb-2 md:mb-3 group-hover:text-emerald-600 transition-colors tracking-tighter leading-tight uppercase">
          {project.title}
        </h3>
        <p className="text-slate-500 text-[11px] md:text-sm leading-relaxed mb-6 line-clamp-2 font-medium opacity-80 italic">
          {project.description}
        </p>
        <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
           <span className="text-[8px] md:text-[9px] font-black text-emerald-600 uppercase tracking-widest">Voir l'expertise</span>
           <svg className="w-4 h-4 text-emerald-300 group-hover:text-emerald-500 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
           </svg>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;