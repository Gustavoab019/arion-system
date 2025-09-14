// Arquivo: /src/app/dashboard/projetos/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Project {
  _id: string;
  codigo: string;
  nomeHotel: string;
  endereco: string;
  cidade: string;
  distrito: string;
  codigoPostal: string;
  status: string;
  dataInicio: Date;
  dataPrevista?: Date;
  dataConclusao?: Date;
  criadoPor: {
    _id: string;
    nome: string;
    email: string;
  };
  contato: {
    nome: string;
    telefone: string;
    email: string;
  };
  observacoes?: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

interface ProjectStats {
  totalItens: number;
  itensPendentes: number;
  itensMedidos: number;
  itensProducao: number;
  itensProduzidos: number;
  itensLogistica: number;
  itensInstalados: number;
  itensCancelados: number;
  cortinas: number;
  calhas: number;
  progresso: number;
}

interface RecentActivity {
  id: string;
  tipo: 'medicao' | 'producao' | 'logistica' | 'instalacao';
  titulo: string;
  descricao: string;
  usuario: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'info';
}

export default function ProjetoDetalhesPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats>({
    totalItens: 0,
    itensPendentes: 0,
    itensMedidos: 0,
    itensProducao: 0,
    itensProduzidos: 0,
    itensLogistica: 0,
    itensInstalados: 0,
    itensCancelados: 0,
    cortinas: 0,
    calhas: 0,
    progresso: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      carregarDadosProjeto();
    }
  }, [params.id]);

  const carregarDadosProjeto = async () => {
    try {
      setLoading(true);
      
      // Carregar dados do projeto
      const [projetoRes, itensRes] = await Promise.all([
        fetch(`/api/projects/${params.id}`),
        fetch(`/api/projects/${params.id}/items`)
      ]);
      
      const projetoData = await projetoRes.json();
      const itensData = await itensRes.json();
      
      if (projetoData.success) {
        setProject(projetoData.data);
        
        if (itensData.success) {
          const itens = itensData.data || [];
          
          // Calcular estatísticas
          const statsData = {
            totalItens: itens.length,
            itensPendentes: itens.filter((i: any) => i.status === 'pendente').length,
            itensMedidos: itens.filter((i: any) => i.status === 'medido').length,
            itensProducao: itens.filter((i: any) => i.status === 'producao').length,
            itensProduzidos: itens.filter((i: any) => i.status === 'produzido').length,
            itensLogistica: itens.filter((i: any) => i.status === 'logistica').length,
            itensInstalados: itens.filter((i: any) => i.status === 'instalado').length,
            itensCancelados: itens.filter((i: any) => i.status === 'cancelado').length,
            cortinas: itens.filter((i: any) => i.tipo === 'cortina').length,
            calhas: itens.filter((i: any) => i.tipo === 'calha').length,
            progresso: itens.length > 0 ? Math.round((itens.filter((i: any) => i.status === 'instalado').length / itens.length) * 100) : 0
          };
          
          setStats(statsData);
          
          // Simular atividade recente específica do projeto
          setRecentActivity([
            {
              id: '1',
              tipo: 'medicao',
              titulo: 'Nova medição registrada',
              descricao: `Item ${itens[0]?.codigo || 'N/A'} medido`,
              usuario: 'João Silva',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
              status: 'success'
            },
            {
              id: '2',
              tipo: 'producao',
              titulo: 'Item em produção',
              descricao: `${statsData.itensProducao} itens sendo fabricados`,
              usuario: 'Sistema',
              timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
              status: 'info'
            },
            {
              id: '3',
              tipo: 'instalacao',
              titulo: 'Instalação concluída',
              descricao: `${statsData.itensInstalados} itens já instalados`,
              usuario: 'Equipe de Instalação',
              timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
              status: 'success'
            }
          ]);
        }
      } else {
        setError(projetoData.message || 'Projeto não encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar projeto:', error);
      setError('Erro ao carregar dados do projeto');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'medicao': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'producao': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'logistica': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'instalacao': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'concluido': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'medicao': 'Medição',
      'producao': 'Produção',
      'logistica': 'Logística',
      'instalacao': 'Instalação',
      'concluido': 'Concluído',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status.toUpperCase();
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
      case 'logistica':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
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

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return formatDate(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-slate-900 font-semibold text-xl mb-2">Carregando Projeto</h3>
          <p className="text-slate-600">Processando dados do projeto...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md w-full mx-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-2xl font-bold text-slate-900 mb-4">Projeto não encontrado</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link
            href="/dashboard/projetos"
            className="bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 font-medium transition-colors inline-flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Voltar aos Projetos</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/projetos"
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-slate-900 font-mono">
                    {project.codigo}
                  </h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(project.status)}`}>
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                <h2 className="text-xl text-slate-700 font-medium">{project.nomeHotel}</h2>
                <p className="text-slate-600">{project.cidade}, {project.distrito}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Link
                href={`/dashboard/projetos/${project._id}/itens`}
                className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 font-medium transition-colors inline-flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>Gerir Itens</span>
              </Link>
              
              {(session?.user as any)?.role === 'gestor' && (
                <Link
                  href={`/dashboard/projetos/${project._id}/editar`}
                  className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium transition-colors inline-flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Editar</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* KPI Cards - Estatísticas do Projeto */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-violet-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Total Itens
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {stats.totalItens.toLocaleString()}
            </div>
            <div className="text-sm text-violet-600 font-medium">
              No projeto
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Pendentes
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {stats.itensPendentes.toLocaleString()}
            </div>
            <div className="text-sm text-yellow-600 font-medium">
              Aguardando medição
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M12 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Em Produção
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {(stats.itensProducao + stats.itensProduzidos).toLocaleString()}
            </div>
            <div className="text-sm text-blue-600 font-medium">
              Sendo fabricados
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Progresso
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {stats.progresso}%
            </div>
            <div className="text-sm text-green-600 font-medium">
              Concluído
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações do Projeto */}
          <div className="lg:col-span-2 space-y-8">
            {/* Informações Básicas */}
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Informações do Projeto</h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-4">Localização</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-slate-600">Hotel:</span>
                        <div className="font-medium text-slate-900">{project.nomeHotel}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Endereço:</span>
                        <div className="text-slate-900">{project.endereco}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Cidade:</span>
                        <div className="text-slate-900">{project.cidade}, {project.distrito}</div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-slate-600">Código Postal:</span>
                        <div className="text-slate-900 font-mono">{project.codigoPostal}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-4">Cronograma</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-slate-600">Data de Início:</span>
                        <div className="text-slate-900">{formatDate(project.dataInicio)}</div>
                      </div>
                      {project.dataPrevista && (
                        <div>
                          <span className="text-sm font-medium text-slate-600">Data Prevista:</span>
                          <div className="text-slate-900">{formatDate(project.dataPrevista)}</div>
                        </div>
                      )}
                      {project.dataConclusao && (
                        <div>
                          <span className="text-sm font-medium text-slate-600">Data de Conclusão:</span>
                          <div className="text-green-700">{formatDate(project.dataConclusao)}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-slate-600">Criado por:</span>
                        <div className="text-slate-900">{project.criadoPor.nome}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {project.observacoes && (
                  <div className="mt-6 pt-6 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-900 mb-3">Observações</h4>
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <p className="text-slate-700">{project.observacoes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pipeline de Produção */}
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Pipeline de Produção</h3>
                <p className="text-slate-600 text-sm mt-1">Status dos itens no projeto</p>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {[
                    { key: 'pendente', label: 'Aguardando Medição', count: stats.itensPendentes, color: 'bg-gray-500' },
                    { key: 'medido', label: 'Medidas Registradas', count: stats.itensMedidos, color: 'bg-yellow-500' },
                    { key: 'producao', label: 'Em Produção', count: stats.itensProducao, color: 'bg-blue-500' },
                    { key: 'produzido', label: 'Produção Finalizada', count: stats.itensProduzidos, color: 'bg-indigo-500' },
                    { key: 'logistica', label: 'Processamento Logístico', count: stats.itensLogistica, color: 'bg-purple-500' },
                    { key: 'instalado', label: 'Instalação Concluída', count: stats.itensInstalados, color: 'bg-green-500' }
                  ].map(({ key, label, count, color }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 ${color} rounded-full`}></div>
                        <span className="text-slate-700 font-medium">{label}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-900 font-bold">{count}</span>
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div 
                            className={`${color} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${stats.totalItens > 0 ? (count / stats.totalItens) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-slate-500 text-sm w-12 text-right">
                          {stats.totalItens > 0 ? Math.round((count / stats.totalItens) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                </div>
            </div>
          </div>

          {/* Sidebar - Contatos e Atividade Recente */}
          <div className="space-y-8">
            {/* Informações de Contato */}
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Contato</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <span className="text-sm font-medium text-slate-600">Nome:</span>
                  <div className="text-slate-900 font-medium">{project.contato.nome}</div>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">Telefone:</span>
                  <div className="text-slate-900">
                    <a href={`tel:${project.contato.telefone}`} className="hover:text-sky-600 transition-colors">
                      {project.contato.telefone}
                    </a>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-slate-600">Email:</span>
                  <div className="text-slate-900">
                    <a href={`mailto:${project.contato.email}`} className="hover:text-sky-600 transition-colors">
                      {project.contato.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Atividade Recente */}
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Atividade Recente</h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
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
                        <div className="text-sm text-slate-600">
                          {activity.descricao}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {activity.usuario} • {getTimeAgo(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <Link
                    href={`/dashboard/projetos/${project._id}/atividade`}
                    className="text-sky-600 hover:text-sky-700 text-sm font-medium transition-colors"
                  >
                    Ver toda atividade →
                  </Link>
                </div>
              </div>
            </div>

            {/* Resumo do Projeto */}
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Resumo</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Cortinas:</span>
                  <span className="text-slate-900 font-bold">{stats.cortinas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Calhas:</span>
                  <span className="text-slate-900 font-bold">{stats.calhas}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Cancelados:</span>
                  <span className="text-red-600 font-bold">{stats.itensCancelados}</span>
                </div>
                
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-600">Progresso Geral:</span>
                    <span className="text-slate-900 font-bold">{stats.progresso}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${stats.progresso}%` }}
                    />
                  </div>
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
                <span className="text-slate-900 font-semibold">Projeto {getStatusLabel(project.status)}</span>
              </div>
              <div className="hidden sm:block text-slate-400">•</div>
              <span className="text-slate-600 font-medium">
                Sistema Operacional
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <span>Atualizado: {formatDate(project.atualizadoEm)}</span>
              <div className="hidden sm:block text-slate-400">•</div>
              <span>Criado: {formatDate(project.criadoEm)}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}