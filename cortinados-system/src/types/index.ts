// ========================================
// TIPOS DE USUÁRIOS E PERMISSÕES
// ========================================

export type UserRole = 
  | 'medidor'      // Registra medidas nos hotéis
  | 'fabrica_trk'  // Produz calhas
  | 'fabrica_crt'  // Produz cortinas
  | 'logistica'    // Monta kits para entrega
  | 'instalador'   // Confirma instalação via QR
  | 'gestor';      // Supervisiona tudo

export interface User {
  _id: string;
  nome: string;
  email: string;
  senha: string;
  role: UserRole;
  ativo: boolean;
  telefone?: string;
  empresa?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

// ========================================
// TIPOS DE PROJETOS
// ========================================

export type StatusProjeto = 
  | 'medicao'      // Aguardando ou em processo de medição
  | 'producao'     // Em produção nas fábricas
  | 'logistica'    // Preparando kits para entrega
  | 'instalacao'   // Pronto para ou em instalação
  | 'concluido'    // Projeto finalizado
  | 'cancelado';   // Projeto cancelado

export interface Project {
  _id: string;
  codigo: string;           // Ex: "ATL-0315"
  nomeHotel: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  contato: {
    nome: string;
    telefone: string;
    email: string;
  };
  status: StatusProjeto;
  dataInicio: Date;
  dataPrevista?: Date;
  dataConclusao?: Date;
  observacoes?: string;
  criadoPor: string;        // ID do usuário
  criadoEm: Date;
  atualizadoEm: Date;
}

// ========================================
// TIPOS DE ITENS (CORTINAS/CALHAS)
// ========================================

export type TipoItem = 'cortina' | 'calha';

export type StatusItem = 
  | 'pendente'     // Aguardando medição
  | 'medido'       // Medidas registradas
  | 'producao'     // Em produção
  | 'produzido'    // Finalizado na fábrica
  | 'logistica'    // No setor de logística
  | 'instalado'    // Instalado no hotel
  | 'cancelado';   // Item cancelado

export interface Medidas {
  largura: number;
  altura: number;
  profundidade?: number;
  observacoes?: string;
}

export interface Item {
  _id: string;
  codigo: string;           // Ex: "ATL-0315-01-TRK" ou "ATL-0315-01-CRT"
  projeto: string;          // ID do projeto
  tipo: TipoItem;
  ambiente: string;         // Ex: "Quarto 101", "Lobby", etc.
  medidas?: Medidas;
  status: StatusItem;
  qrCode: string;           // String do QR code
  qrCodeUrl: string;        // URL completa para o QR
  
  // Histórico de produção
  medicao?: {
    medidoPor: string;      // ID do usuário medidor
    dataEm: Date;
    observacoes?: string;
  };
  
  producao?: {
    iniciadoEm?: Date;
    finalizadoEm?: Date;
    produzidoPor?: string;  // ID do usuário da fábrica
    observacoes?: string;
  };
  
  logistica?: {
    processadoEm?: Date;
    processadoPor?: string; // ID do usuário da logística
    observacoes?: string;
  };
  
  instalacao?: {
    instaladoEm?: Date;
    instaladoPor?: string;  // ID do usuário instalador
    observacoes?: string;
  };
  
  criadoEm: Date;
  atualizadoEm: Date;
}

// ========================================
// TIPOS PARA QR CODE E RASTREAMENTO
// ========================================

export interface QRTrackingData {
  itemId: string;
  codigo: string;
  projeto: string;
  tipo: TipoItem;
  status: StatusItem;
  ambiente: string;
  ultimaAtualizacao: Date;
}

// ========================================
// TIPOS PARA DASHBOARD E RELATÓRIOS
// ========================================

export interface DashboardStats {
  totalProjetos: number;
  projetosAtivos: number;
  projetosConcluidos: number;
  itensTotal: number;
  itensPendentes: number;
  itensProducao: number;
  itensInstalados: number;
}

export interface RelatorioProjeto {
  projeto: Project;
  itens: Item[];
  progresso: {
    total: number;
    medidos: number;
    produzidos: number;
    instalados: number;
    percentualConclusao: number;
  };
}

// ========================================
// TIPOS PARA FORMULÁRIOS E APIs
// ========================================

export interface CreateProjectData {
  codigo: string;
  nomeHotel: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  contato: {
    nome: string;
    telefone: string;
    email: string;
  };
  dataPrevista?: Date;
  observacoes?: string;
}

export interface CreateItemData {
  projeto: string;
  tipo: TipoItem;
  ambiente: string;
  quantidade?: number; // Para criar múltiplos itens do mesmo tipo
}

export interface UpdateItemMedidasData {
  medidas: Medidas;
  observacoes?: string;
}

export interface UpdateItemStatusData {
  status: StatusItem;
  observacoes?: string;
}

// ========================================
// TIPOS PARA AUTENTICAÇÃO
// ========================================

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
}

// ========================================
// TIPOS PARA RESPOSTAS DA API
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}