export type AppView = 'HOME' | 'SERVICES' | 'PORTFOLIO' | 'QUALITY' | 'CONTACT' | 'LOGIN' | 'ADMIN';

export interface QuoteRequest {
  id?: string;
  timestamp?: string;
  clientName: string;
  phone: string;
  email: string;
  serviceType: 'Jardinage' | 'Nettoyage' | 'Fourniture des plantes' | 'Autre';
  subject: string;
  budget: string;
}

export interface VisitorLog {
  id?: string;
  timestamp: string;
  ip: string;
  location: string;
  pagesViewed: string[]; // Ex: ["HOME", "QUALITY"]
  userAgent: string;
}

export interface ServiceItem {
  name: string;
  desc: string;
}

export interface ServiceCategory {
  title: string;
  icon: string;
  items: ServiceItem[];
}

export interface Project {
  imageUrl: string;
  title: string;
  tags: string[];
  description: string;
  fullDetails: string[];
}

export interface AISuggestionRequest {
  userName: string;
  profession: string;
  tone: 'professional' | 'creative' | 'minimalist';
}