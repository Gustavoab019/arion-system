'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserRole } from '@/types';

interface DashboardStats {
  totalProjetos: number;
  totalItens: number;
  itensPendentes: number;
  itensProducao: number;
  itensInstalados: number;
  projetosAtivos: number;
}

const ROLE_CONFIG = {
  medidor: {
    title: 'Centro de Medição',
    subtitle: 'Gestão de Medidas e Levantamentos',
    mainAction: '/dashboard/medidor',
    icon: '📐',
    color: 'blue',
    description: 'Registar e consultar medições de projetos'
  },
  fabrica_trk: {
    title: 'Produção TRK',
    subtitle: 'Fabricação de Calhas Técnicas',
    mainAction: '/dashboard/fabrica-trk',
    icon: '🏭',
    color: 'indigo',
    description: 'Gerir produção de calhas técnicas'
  },
  fabrica_crt: {
    title: 'Produção CRT',
    subtitle: 'Fabricação de Cortinas',
    mainAction: '/dashboard/fabrica-crt',
    icon: '🏗️',
    color: 'emerald',
    description: 'Controlar fabricação de cortinas'
  },
  logistica: {
    title: 'Centro Logístico',
    subtitle: 'Gestão de Stocks e Expedição',
    mainAction: '/dashboard/logistica',
    icon: '📦',
    color: 'amber',
    description: 'Gerir stocks e expedições'
  },
  instalador: {
    title: 'Departamento de Instalação',
    subtitle: 'Execução e Controlo de Qualidade',
    mainAction: '/dashboard/instalador',
    icon: '🔧',
    color: 'rose',
    description: 'Executar e controlar instalações'
  },
  gestor: {
    title: 'Painel de Controlo Executivo',
    subtitle: 'Supervisão Geral e Análise',
    mainAction: '/dashboard/gestor',
    icon: '⚡',
    color: 'violet',
    description: 'Supervisionar e analisar operações'
  }
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjetos: 0,
    totalItens: 0,
    itensPendentes: 0,
    itensProducao: 0,
    itensInstalados: 0,
    projetosAtivos: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      carregarEstatisticas();
    }
  }, [session]);

  const carregarEstatisticas = async () => {
    try {
      setLoading(true);
      
      const projetosResponse = await fetch('/api/projects');
      const projetosData = await projetosResponse.json();
      
      const itensResponse = await fetch('/api/items');
      const itensData = await itensResponse.json();
      
      if (projetosData.success && itensData.success) {
        const projetos = projetosData.data || [];
        const itens = itensData.data || [];
        
        setStats({
          totalProjetos: projetos.length,
          projetosAtivos: projetos.filter((p: any) => 
            !['concluido', 'cancelado'].includes(p.status)
          ).length,
          totalItens: itens.length,
          itensPendentes: itens.filter((i: any) => i.status === 'pendente').length,
          itensProducao: itens.filter((i: any) => 
            ['producao', 'produzido'].includes(i.status)
          ).length,
          itensInstalados: itens.filter((i: any) => i.status === 'instalado').length
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-100 p-12 text-center max-w-md w-full">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="text-gray-900 font-bold text-xl mb-3">A Carregar Sistema</h3>
          <p className="text-gray-600 text-lg">Por favor aguarde...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userRole = (session.user as any).role as UserRole;
  const config = ROLE_CONFIG[userRole];

  const colorVariants = {
    blue: {
      bg: 'bg-blue-700',
      hover: 'hover:bg-blue-800',
      text: 'text-blue-700',
      border: 'border-blue-300',
      light: 'bg-blue-50'
    },
    indigo: {
      bg: 'bg-indigo-700',
      hover: 'hover:bg-indigo-800',
      text: 'text-indigo-700',
      border: 'border-indigo-300',
      light: 'bg-indigo-50'
    },
    emerald: {
      bg: 'bg-emerald-700',
      hover: 'hover:bg-emerald-800',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
      light: 'bg-emerald-50'
    },
    amber: {
      bg: 'bg-amber-700',
      hover: 'hover:bg-amber-800',
      text: 'text-amber-700',
      border: 'border-amber-300',
      light: 'bg-amber-50'
    },
    rose: {
      bg: 'bg-rose-700',
      hover: 'hover:bg-rose-800',
      text: 'text-rose-700',
      border: 'border-rose-300',
      light: 'bg-rose-50'
    },
    violet: {
      bg: 'bg-violet-700',
      hover: 'hover:bg-violet-800',
      text: 'text-violet-700',
      border: 'border-violet-300',
      light: 'bg-violet-50'
    }
  };

  const colors = colorVariants[config.color as keyof typeof colorVariants];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Melhorado */}
      <header className="bg-white border-b-4 border-gray-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg`}>
                  CP
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Cortinados Portugal
                  </h1>
                  <p className="text-gray-600 text-base lg:text-lg">
                    Sistema de Gestão Empresarial
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <div className="text-center sm:text-right">
                <div className="text-gray-900 font-bold text-lg">{session.user.name}</div>
                <div className="text-gray-600 text-base">
                  {(session.user as any).empresa || 'Cortinados Portugal'}
                </div>
              </div>
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center border-2 border-gray-400">
                <span className="text-gray-700 text-lg font-bold">
                  {session.user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8">
        
        {/* Painel Principal do Departamento - Mais Destacado */}
        <div className={`${colors.light} border-4 ${colors.border} rounded-2xl p-8 lg:p-10 shadow-lg`}>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
              <div className={`w-20 h-20 lg:w-24 lg:h-24 ${colors.bg} rounded-2xl flex items-center justify-center text-white text-3xl lg:text-4xl shadow-lg`}>
                {config.icon}
              </div>
              <div>
                <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {config.title}
                </h2>
                <p className="text-gray-700 mb-4 text-lg lg:text-xl">
                  {config.subtitle}
                </p>
                <p className="text-gray-600 mb-6 text-base lg:text-lg">
                  {config.description}
                </p>
                <Link
                  href={config.mainAction}
                  className={`inline-flex items-center px-8 py-4 ${colors.bg} ${colors.hover} text-white font-bold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-lg transform hover:scale-105`}
                >
                  Aceder ao Painel
                  <svg className="ml-3 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-md">
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  {new Date().toLocaleDateString('pt-PT', { 
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long'
                  })}
                </div>
                <div className="text-gray-600 text-xl lg:text-2xl font-semibold">
                  {new Date().toLocaleTimeString('pt-PT', { 
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Principais - Mais Visíveis */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          <div className="bg-white rounded-xl border-4 border-blue-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Total Projetos</span>
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {loading ? '−' : stats.totalProjetos.toLocaleString()}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Em sistema</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-emerald-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Projetos Ativos</span>
              <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {loading ? '−' : stats.projetosAtivos.toLocaleString()}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Em execução</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-violet-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Total Itens</span>
              <div className="w-4 h-4 bg-violet-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {loading ? '−' : stats.totalItens.toLocaleString()}
            </div>
            <div className="text-sm lg:text-base text-gray-600">No inventário</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-amber-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Pendentes</span>
              <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {loading ? '−' : stats.itensPendentes.toLocaleString()}
            </div>
            <div className="text-sm lg:text-base text-gray-600">A aguardar</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-orange-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Em Produção</span>
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {loading ? '−' : stats.itensProducao.toLocaleString()}
            </div>
            <div className="text-sm lg:text-base text-gray-600">A fabricar</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-green-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Concluídos</span>
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {loading ? '−' : stats.itensInstalados.toLocaleString()}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Instalados</div>
          </div>
        </div>

        {/* Módulos do Sistema - Simplificados e Maiores */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          
          <Link href="/dashboard/projetos" 
                className="bg-white rounded-xl border-4 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 p-8 group transform hover:scale-105">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-200 transition-colors shadow-lg">
                <svg className="w-10 h-10 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xl lg:text-2xl text-gray-900 group-hover:text-blue-700 mb-2">
                  Gestão de Projetos
                </h3>
                <p className="text-gray-600 text-lg">Consultar e gerir todos os projetos</p>
              </div>
              <div className="text-blue-700 text-lg font-bold group-hover:text-blue-800 flex items-center">
                Ver Projetos 
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/itens" 
                className="bg-white rounded-xl border-4 border-gray-200 hover:border-violet-400 hover:shadow-xl transition-all duration-300 p-8 group transform hover:scale-105">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center group-hover:bg-violet-200 transition-colors shadow-lg">
                <svg className="w-10 h-10 text-violet-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xl lg:text-2xl text-gray-900 group-hover:text-violet-700 mb-2">
                  Inventário de Itens
                </h3>
                <p className="text-gray-600 text-lg">Rastrear todos os componentes</p>
              </div>
              <div className="text-violet-700 text-lg font-bold group-hover:text-violet-800 flex items-center">
                Ver Inventário
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/scanner" 
                className="bg-white rounded-xl border-4 border-gray-200 hover:border-emerald-400 hover:shadow-xl transition-all duration-300 p-8 group transform hover:scale-105">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:bg-emerald-200 transition-colors shadow-lg">
                <svg className="w-10 h-10 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-xl lg:text-2xl text-gray-900 group-hover:text-emerald-700 mb-2">
                  Scanner QR Code
                </h3>
                <p className="text-gray-600 text-lg">Leitura rápida de códigos</p>
              </div>
              <div className="text-emerald-700 text-lg font-bold group-hover:text-emerald-800 flex items-center">
                Abrir Scanner
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Funcionalidades Específicas por Departamento - Melhoradas */}
        {userRole === 'medidor' && (
          <div className="bg-white rounded-xl border-4 border-blue-200 p-8 shadow-lg">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 text-center">
              🔧 Ferramentas de Medição
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Link href="/dashboard/medidor" 
                    className="bg-blue-700 hover:bg-blue-800 text-white p-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
                <div className="text-center">
                  <div className="text-4xl mb-4">📐</div>
                  <div className="font-bold text-xl lg:text-2xl mb-3">Centro de Medição</div>
                  <div className="text-blue-100 text-lg">Registar medidas e levantamentos</div>
                </div>
              </Link>
              <Link href="/dashboard/medidor/historico" 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-900 p-8 rounded-xl transition-all duration-200 border-4 border-gray-300 transform hover:scale-105 shadow-lg">
                <div className="text-center">
                  <div className="text-4xl mb-4">📋</div>
                  <div className="font-bold text-xl lg:text-2xl mb-3">Histórico de Medições</div>
                  <div className="text-gray-600 text-lg">Consultar medições anteriores</div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {userRole === 'gestor' && (
          <div className="bg-white rounded-xl border-4 border-violet-200 p-8 shadow-lg">
            <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-6 text-center">
              ⚡ Painel de Controlo Executivo
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Link href="/dashboard/gestor/usuarios" 
                    className="bg-violet-700 hover:bg-violet-800 text-white p-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
                <div className="text-center">
                  <div className="text-4xl mb-4">👥</div>
                  <div className="font-bold text-lg lg:text-xl mb-3">Gestão de Utilizadores</div>
                  <div className="text-violet-100 text-base">Administrar equipa e permissões</div>
                </div>
              </Link>
              <Link href="/dashboard/gestor/relatorios" 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-900 p-8 rounded-xl transition-all duration-200 border-4 border-gray-300 transform hover:scale-105 shadow-lg">
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <div className="font-bold text-lg lg:text-xl mb-3">Relatórios Executivos</div>
                  <div className="text-gray-600 text-base">Análises e indicadores</div>
                </div>
              </Link>
              <Link href="/dashboard/gestor/configuracoes" 
                    className="bg-gray-100 hover:bg-gray-200 text-gray-900 p-8 rounded-xl transition-all duration-200 border-4 border-gray-300 transform hover:scale-105 shadow-lg">
                <div className="text-center">
                  <div className="text-4xl mb-4">⚙️</div>
                  <div className="font-bold text-lg lg:text-xl mb-3">Configurações</div>
                  <div className="text-gray-600 text-base">Sistema e preferências</div>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Status do Sistema - Melhorado */}
        <footer className="bg-white rounded-xl border-4 border-gray-200 p-6 lg:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-900 font-bold text-lg">Sistema Operacional</span>
              </div>
              <div className="hidden sm:block text-gray-400">•</div>
              <span className="text-gray-600 text-lg font-semibold">
                Versão 2.1.0
              </span>
            </div>
            <div className="text-gray-600 text-lg font-semibold bg-gray-50 px-4 py-2 rounded-lg border-2 border-gray-200">
              Última sincronização: {new Date().toLocaleTimeString('pt-PT')}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}