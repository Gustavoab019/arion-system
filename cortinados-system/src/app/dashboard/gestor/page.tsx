// Arquivo: /src/app/dashboard/gestor/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
// Remover import do Header - será usado via layout

interface DashboardStats {
  totalProjetos: number;
  totalItens: number;
  itensPendentes: number;
  itensProducao: number;
  itensInstalados: number;
  projetosAtivos: number;
  eficienciaGeral: number;
  faturamentoMensal: number;
}

interface RecentActivity {
  id: string;
  tipo: 'projeto' | 'medicao' | 'producao' | 'instalacao';
  titulo: string;
  descricao: string;
  usuario: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'info';
}

interface ProjectOverview {
  id: string;
  codigo: string;
  nomeHotel: string;
  cidade: string;
  status: string;
  progresso: number;
  totalItens: number;
  itensCompletos: number;
  prioridade: 'alta' | 'media' | 'baixa';
  dataInicio: Date;
  dataPrevista?: Date;
}

export default function GestorDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalProjetos: 0,
    totalItens: 0,
    itensPendentes: 0,
    itensProducao: 0,
    itensInstalados: 0,
    projetosAtivos: 0,
    eficienciaGeral: 0,
    faturamentoMensal: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [projectsOverview, setProjectsOverview] = useState<ProjectOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    carregarDados();
  }, [timeRange]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas
      const [projetosRes, itensRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/items')
      ]);
      
      const projetosData = await projetosRes.json();
      const itensData = await itensRes.json();
      
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
          itensInstalados: itens.filter((i: any) => i.status === 'instalado').length,
          eficienciaGeral: Math.round((itens.filter((i: any) => i.status === 'instalado').length / Math.max(1, itens.length)) * 100),
          faturamentoMensal: Math.random() * 500000 + 200000 // Simulado
        });
        
        // Simular atividade recente
        setRecentActivity([
          {
            id: '1',
            tipo: 'medicao',
            titulo: 'Medição concluída',
            descricao: 'LIS-0315-01 - Hotel Dom Pedro Lisboa',
            usuario: 'João Silva',
            timestamp: new Date(Date.now() - 30 * 60 * 1000),
            status: 'success'
          },
          {
            id: '2',
            tipo: 'producao',
            titulo: 'Produção iniciada',
            descricao: 'Lote CRT-2024-03 - 15 cortinas',
            usuario: 'Fábrica CRT',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            status: 'info'
          },
          {
            id: '3',
            tipo: 'projeto',
            titulo: 'Novo projeto criado',
            descricao: 'POR-0317 - Pestana Palace Porto',
            usuario: 'Maria Santos',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            status: 'info'
          },
          {
            id: '4',
            tipo: 'instalacao',
            titulo: 'Instalação atrasada',
            descricao: 'LIS-0312 - Atraso de 2 dias',
            usuario: 'Sistema',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            status: 'warning'
          }
        ]);
        
        // Simular visão geral de projetos
        setProjectsOverview(
          projetos.slice(0, 5).map((p: any, index: number) => ({
            id: p._id,
            codigo: p.codigo,
            nomeHotel: p.nomeHotel,
            cidade: p.cidade,
            status: p.status,
            progresso: Math.round(Math.random() * 100),
            totalItens: Math.floor(Math.random() * 50) + 10,
            itensCompletos: Math.floor(Math.random() * 30) + 5,
            prioridade: ['alta', 'media', 'baixa'][index % 3] as any,
            dataInicio: new Date(p.criadoEm),
            dataPrevista: p.dataPrevista ? new Date(p.dataPrevista) : undefined
          }))
        );
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return formatDate(date);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixa': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'medicao':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'producao':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M12 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
          </svg>
        );
      case 'projeto':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'instalacao':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-slate-900 font-semibold text-xl mb-2">Carregando Dashboard</h3>
          <p className="text-slate-600">Processando dados executivos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header com Time Range Selector */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard Executivo</h1>
              <p className="text-slate-600 mt-2">Visão geral completa das operações e performance</p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="text-sm border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500 bg-white px-3 py-2"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
              </select>
              
              <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium transition-colors">
                Exportar Relatório
              </button>
              <Link 
                href="/dashboard/gestor/projetos/novo"
                className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 font-medium transition-colors inline-flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Novo Projeto</span>
              </Link>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total de Projetos */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Projetos
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {stats.totalProjetos.toLocaleString()}
            </div>
            <div className="text-sm text-green-600 font-medium">
              +12.3% vs mês anterior
            </div>
          </div>

          {/* Projetos Ativos */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Ativos
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {stats.projetosAtivos.toLocaleString()}
            </div>
            <div className="text-sm text-green-600 font-medium">
              +5.7% vs mês anterior
            </div>
          </div>

          {/* Eficiência Geral */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Eficiência
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {stats.eficienciaGeral}%
            </div>
            <div className="text-sm text-green-600 font-medium">
              +2.1% vs mês anterior
            </div>
          </div>

          {/* Faturamento */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Faturamento
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {formatCurrency(stats.faturamentoMensal)}
            </div>
            <div className="text-sm text-green-600 font-medium">
              +18.5% vs mês anterior
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Projects Overview */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Projetos em Andamento</h2>
                  <Link 
                    href="/dashboard/projetos"
                    className="text-sky-600 hover:text-sky-500 font-medium text-sm"
                  >
                    Ver todos →
                  </Link>
                </div>
              </div>
              
              <div className="overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Projeto
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Progresso
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Prazo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {projectsOverview.map((project) => (
                      <tr key={project.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center space-x-3">
                              <div className="font-mono font-semibold text-slate-900">
                                {project.codigo}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(project.prioridade)}`}>
                                {project.prioridade}
                              </span>
                            </div>
                            <div className="text-slate-600 mt-1">{project.nomeHotel}</div>
                            <div className="text-xs text-slate-500">{project.cidade}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <div className="w-full bg-slate-200 rounded-full h-2">
                                <div 
                                  className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${project.progresso}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-sm font-medium text-slate-900 min-w-0">
                              {project.progresso}%
                            </div>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {project.itensCompletos}/{project.totalItens} itens
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {project.dataPrevista 
                            ? formatDate(project.dataPrevista)
                            : 'Não definido'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Atividade Recente</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${
                        activity.status === 'success' ? 'bg-green-100 text-green-600' :
                        activity.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {getActivityIcon(activity.tipo)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900">
                          {activity.titulo}
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          {activity.descricao}
                        </div>
                        <div className="flex items-center space-x-2 mt-2 text-xs text-slate-500">
                          <span>{activity.usuario}</span>
                          <span>•</span>
                          <span>{getTimeAgo(activity.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-slate-200 rounded-xl mt-6">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Ações Rápidas</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  <Link
                    href="/dashboard/projetos/novo"
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center group-hover:bg-sky-200 transition-colors">
                        <svg className="w-4 h-4 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-900">Novo Projeto</span>
                    </div>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  <Link
                    href="/dashboard/usuarios"
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-900">Gerir Utilizadores</span>
                    </div>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  <Link
                    href="/dashboard/relatorios"
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-900">Relatórios</span>
                    </div>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>

                  <Link
                    href="/dashboard/configuracoes"
                    className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                        <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-900">Configurações</span>
                    </div>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Production Pipeline */}
          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Pipeline de Produção</h2>
              <p className="text-slate-600 text-sm mt-1">Status atual dos itens em produção</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <div className="font-semibold text-yellow-900">Pendentes de Medição</div>
                      <div className="text-sm text-yellow-700">{stats.itensPendentes} itens aguardando</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-yellow-900">
                    {stats.itensPendentes}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <div className="font-semibold text-blue-900">Em Produção</div>
                      <div className="text-sm text-blue-700">{stats.itensProducao} itens sendo fabricados</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {stats.itensProducao}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="font-semibold text-green-900">Instalados</div>
                      <div className="text-sm text-green-700">{stats.itensInstalados} itens concluídos</div>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-900">
                    {stats.itensInstalados}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Métricas de Performance</h2>
              <p className="text-slate-600 text-sm mt-1">Indicadores chave de desempenho</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Tempo Médio de Produção */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Tempo Médio de Produção</span>
                    <span className="text-sm font-semibold text-slate-900">12.5 dias</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-sky-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Meta: 15 dias</div>
                </div>

                {/* Taxa de Conclusão no Prazo */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Taxa de Conclusão no Prazo</span>
                    <span className="text-sm font-semibold text-slate-900">87%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Meta: 85%</div>
                </div>

                {/* Satisfação do Cliente */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Satisfação do Cliente</span>
                    <span className="text-sm font-semibold text-slate-900">4.8/5</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '96%' }}></div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Baseado em 127 avaliações</div>
                </div>

                {/* Utilização da Capacidade */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Utilização da Capacidade</span>
                    <span className="text-sm font-semibold text-slate-900">92%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Capacidade otimizada</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Status Footer */}
        <footer className="bg-white border border-slate-200 rounded-xl p-6 mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-slate-900 font-semibold">Sistema Operacional</span>
              </div>
              <div className="hidden sm:block text-slate-400">•</div>
              <span className="text-slate-600 font-medium">
                Todas as operações funcionando normalmente
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <span>Última sincronização: {new Date().toLocaleTimeString('pt-PT')}</span>
              <div className="hidden sm:block text-slate-400">•</div>
              <span>Versão 2.1.0</span>
            </div>
          </div>
                </footer>
        
        </div>
    </div>
  );
}