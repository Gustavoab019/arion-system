// Arquivo: /src/app/dashboard/projetos/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Project {
  _id: string;
  codigo: string;
  nomeHotel: string;
  cidade: string;
  distrito: string;
  status: string;
  dataInicio: Date;
  dataPrevista?: Date;
  dataConclusao?: Date;
  criadoPor: {
    nome: string;
    email: string;
  };
  contato: {
    nome: string;
    telefone: string;
    email: string;
  };
  criadoEm: Date;
  atualizadoEm: Date;
}

interface ProjectStats {
  total: number;
  medicao: number;
  producao: number;
  logistica: number;
  instalacao: number;
  concluido: number;
  cancelado: number;
  ativos: number;
}

export default function ProjetosPage() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<ProjectStats>({
    total: 0,
    medicao: 0,
    producao: 0,
    logistica: 0,
    instalacao: 0,
    concluido: 0,
    cancelado: 0,
    ativos: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Estados das modais
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    carregarProjetos();
  }, [timeRange]);

  useEffect(() => {
    aplicarFiltros();
  }, [projects, statusFilter, cityFilter, searchQuery]);

  const carregarProjetos = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/projects');
      const data = await response.json();
      
      if (data.success) {
        const projectsData = data.data || [];
        setProjects(projectsData);
        
        // Calcular estatísticas
        const statsData = {
          total: projectsData.length,
          medicao: projectsData.filter((p: Project) => p.status === 'medicao').length,
          producao: projectsData.filter((p: Project) => p.status === 'producao').length,
          logistica: projectsData.filter((p: Project) => p.status === 'logistica').length,
          instalacao: projectsData.filter((p: Project) => p.status === 'instalacao').length,
          concluido: projectsData.filter((p: Project) => p.status === 'concluido').length,
          cancelado: projectsData.filter((p: Project) => p.status === 'cancelado').length,
          ativos: projectsData.filter((p: Project) => !['concluido', 'cancelado'].includes(p.status)).length
        };
        
        setStats(statsData);
      } else {
        console.error('Erro ao carregar projetos:', data.message);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtered = [...projects];

    // Filtro por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    // Filtro por cidade
    if (cityFilter) {
      filtered = filtered.filter(project => 
        project.cidade.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }

    // Busca por texto
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.nomeHotel.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProjects(filtered);
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

  // Funções das modais
  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setShowDetailsModal(true);
  };

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/projects/${projectToDelete._id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setProjects(prev => prev.filter(p => p._id !== projectToDelete._id));
        setShowDeleteModal(false);
        setProjectToDelete(null);
      } else {
        alert('Erro ao excluir projeto');
      }
    } catch (error) {
      console.error('Erro ao excluir projeto:', error);
      alert('Erro ao excluir projeto');
    } finally {
      setDeleting(false);
    }
  };

  const handleExportReport = () => {
    setShowExportModal(true);
  };

  const executeExport = (format: 'pdf' | 'excel' | 'csv') => {
    // Simulação de exportação
    const data = filteredProjects.map(p => ({
      Código: p.codigo,
      Hotel: p.nomeHotel,
      Cidade: p.cidade,
      Status: getStatusLabel(p.status),
      'Data Início': formatDate(p.dataInicio),
      'Data Prevista': p.dataPrevista ? formatDate(p.dataPrevista) : '',
      Contato: p.contato.nome
    }));
    
    console.log(`Exportando ${data.length} projetos em formato ${format}`, data);
    setShowExportModal(false);
    alert(`Relatório exportado em formato ${format.toUpperCase()}`);
  };

  const cidades = Array.from(new Set(projects.map(p => p.cidade))).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-slate-900 font-semibold text-xl mb-2">Carregando Projetos</h3>
          <p className="text-slate-600">Processando dados dos projetos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header com Actions */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Gestão de Projetos</h1>
              <p className="text-slate-600 mt-2">Controle completo de todos os projetos hoteleiros</p>
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
              
              <button 
                onClick={handleExportReport}
                className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                Exportar Relatório
              </button>
              
              <Link 
                href="/dashboard/projetos/novo"
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
              {stats.total.toLocaleString()}
            </div>
            <div className="text-sm text-blue-600 font-medium">
              Em sistema
            </div>
          </div>

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
              {stats.ativos.toLocaleString()}
            </div>
            <div className="text-sm text-green-600 font-medium">
              Em andamento
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Concluídos
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {stats.concluido.toLocaleString()}
            </div>
            <div className="text-sm text-emerald-600 font-medium">
              Finalizados
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Taxa Sucesso
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {stats.total > 0 ? Math.round((stats.concluido / stats.total) * 100) : 0}%
            </div>
            <div className="text-sm text-purple-600 font-medium">
              De conclusão
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Filtros e Busca</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Código ou nome do hotel..."
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="todos">Todos os Status</option>
                <option value="medicao">Medição</option>
                <option value="producao">Produção</option>
                <option value="logistica">Logística</option>
                <option value="instalacao">Instalação</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cidade
              </label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="">Todas as Cidades</option>
                {cidades.map(cidade => (
                  <option key={cidade} value={cidade}>{cidade}</option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('todos');
                  setCityFilter('');
                  setSearchQuery('');
                }}
                className="w-full bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 font-medium transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Projetos */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏨</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                {projects.length === 0 ? 'Nenhum projeto encontrado' : 'Nenhum projeto corresponde aos filtros'}
              </h3>
              <p className="text-slate-600 text-lg mb-6">
                {projects.length === 0 
                  ? 'Comece criando seu primeiro projeto hoteleiro.'
                  : 'Tente ajustar os filtros para encontrar os projetos desejados.'
                }
              </p>
              {projects.length === 0 && (
                <Link
                  href="/dashboard/projetos/novo"
                  className="bg-sky-500 text-white px-6 py-3 rounded-lg hover:bg-sky-600 font-medium transition-colors inline-flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Criar Primeiro Projeto</span>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Projeto
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Localização
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Datas
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Contato
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map((project) => (
                    <tr key={project._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-mono font-semibold text-slate-900 mb-1">
                            {project.codigo}
                          </div>
                          <div className="font-medium text-slate-900">
                            {project.nomeHotel}
                          </div>
                          <div className="text-sm text-slate-500">
                            Criado por {project.criadoPor.nome}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                          {getStatusLabel(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-900 font-medium">{project.cidade}</div>
                        <div className="text-sm text-slate-500">{project.distrito}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-slate-900">
                          <strong>Início:</strong> {formatDate(project.dataInicio)}
                        </div>
                        {project.dataPrevista && (
                          <div className="text-slate-600">
                            <strong>Prevista:</strong> {formatDate(project.dataPrevista)}
                          </div>
                        )}
                        {project.dataConclusao && (
                          <div className="text-green-600">
                            <strong>Conclusão:</strong> {formatDate(project.dataConclusao)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="text-slate-900 font-medium">{project.contato.nome}</div>
                        <div className="text-slate-600">{project.contato.telefone}</div>
                        <div className="text-slate-600">{project.contato.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewDetails(project)}
                            className="bg-sky-100 text-sky-700 hover:bg-sky-200 px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Ver Detalhes
                          </button>
                          <Link
                            href={`/dashboard/projetos/${project._id}/itens`}
                            className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Ver Itens
                          </Link>
                          {(session?.user as any)?.role === 'gestor' && (
                            <>
                              <Link
                                href={`/dashboard/projetos/${project._id}/editar`}
                                className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-3 py-1 rounded text-xs font-medium transition-colors"
                              >
                                Editar
                              </Link>
                              <button
                                onClick={() => handleDeleteProject(project)}
                                className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded text-xs font-medium transition-colors"
                              >
                                Excluir
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Estatísticas por Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Distribuição por Status</h2>
              <p className="text-slate-600 text-sm mt-1">Status atual dos projetos</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { key: 'medicao', label: 'Medição', count: stats.medicao, color: 'bg-yellow-500' },
                  { key: 'producao', label: 'Produção', count: stats.producao, color: 'bg-blue-500' },
                  { key: 'logistica', label: 'Logística', count: stats.logistica, color: 'bg-purple-500' },
                  { key: 'instalacao', label: 'Instalação', count: stats.instalacao, color: 'bg-orange-500' },
                  { key: 'concluido', label: 'Concluído', count: stats.concluido, color: 'bg-green-500' },
                  { key: 'cancelado', label: 'Cancelado', count: stats.cancelado, color: 'bg-red-500' }
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
                          style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-slate-500 text-sm w-12 text-right">
                        {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Performance Geral</h2>
              <p className="text-slate-600 text-sm mt-1">Indicadores de desempenho</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Taxa de Conclusão</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {stats.total > 0 ? Math.round((stats.concluido / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.total > 0 ? (stats.concluido / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Projetos Ativos</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {stats.total > 0 ? Math.round((stats.ativos / stats.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.total > 0 ? (stats.ativos / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {filteredProjects.length}
                    </div>
                    <div className="text-slate-600">
                      {filteredProjects.length === projects.length 
                        ? 'Projetos no total'
                        : `de ${projects.length} projetos mostrados`
                      }
                    </div>
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
                <span className="text-slate-900 font-semibold">Sistema Operacional</span>
              </div>
              <div className="hidden sm:block text-slate-400">•</div>
              <span className="text-slate-600 font-medium">
                Gestão de Projetos Ativa
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <span>Última sincronização: {new Date().toLocaleTimeString('pt-PT')}</span>
              <div className="hidden sm:block text-slate-400">•</div>
              <span>Versão 2.1.0</span>
            </div>
          </div>
        </footer>

        {/* Modal de Detalhes do Projeto */}
        {showDetailsModal && selectedProject && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 text-center">
              <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowDetailsModal(false)} />
              
              <div className="relative bg-white rounded-xl max-w-2xl w-full shadow-xl">
                <div className="px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Detalhes do Projeto</h3>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="px-6 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Informações Básicas</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-slate-600">Código:</span>
                          <div className="font-mono font-bold text-slate-900">{selectedProject.codigo}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-600">Hotel:</span>
                          <div className="font-medium text-slate-900">{selectedProject.nomeHotel}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-600">Status:</span>
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedProject.status)}`}>
                              {getStatusLabel(selectedProject.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Localização</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-slate-600">Cidade:</span>
                          <div className="text-slate-900">{selectedProject.cidade}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-600">Distrito:</span>
                          <div className="text-slate-900">{selectedProject.distrito}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Cronograma</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-slate-600">Data de Início:</span>
                          <div className="text-slate-900">{formatDate(selectedProject.dataInicio)}</div>
                        </div>
                        {selectedProject.dataPrevista && (
                          <div>
                            <span className="text-sm font-medium text-slate-600">Data Prevista:</span>
                            <div className="text-slate-900">{formatDate(selectedProject.dataPrevista)}</div>
                          </div>
                        )}
                        {selectedProject.dataConclusao && (
                          <div>
                            <span className="text-sm font-medium text-slate-600">Data de Conclusão:</span>
                            <div className="text-green-700">{formatDate(selectedProject.dataConclusao)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Contato</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-slate-600">Nome:</span>
                          <div className="text-slate-900">{selectedProject.contato.nome}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-600">Telefone:</span>
                          <div className="text-slate-900">{selectedProject.contato.telefone}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-600">Email:</span>
                          <div className="text-slate-900">{selectedProject.contato.email}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium transition-colors"
                    >
                      Fechar
                    </button>
                    <Link
                      href={`/dashboard/projetos/${selectedProject._id}/itens`}
                      className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 font-medium transition-colors"
                    >
                      Ver Itens
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação de Exclusão */}
        {showDeleteModal && projectToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 text-center">
              <div className="fixed inset-0 bg-black opacity-50" onClick={() => !deleting && setShowDeleteModal(false)} />
              
              <div className="relative bg-white rounded-xl max-w-md w-full shadow-xl">
                <div className="px-6 py-4 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900">Confirmar Exclusão</h3>
                </div>
                
                <div className="px-6 py-6">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                      <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-medium text-slate-900 mb-2">
                      Tem certeza?
                    </h4>
                    <p className="text-slate-600 mb-1">
                      Você está prestes a excluir o projeto:
                    </p>
                    <p className="font-bold text-slate-900 mb-1">
                      {projectToDelete.codigo} - {projectToDelete.nomeHotel}
                    </p>
                    <p className="text-red-600 text-sm">
                      Esta ação não pode ser desfeita e todos os itens relacionados também serão removidos.
                    </p>
                  </div>
                </div>
                
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      disabled={deleting}
                      className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmDelete}
                      disabled={deleting}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                      {deleting && (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                      <span>{deleting ? 'Excluindo...' : 'Excluir Projeto'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Exportação */}
        {showExportModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 text-center">
              <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowExportModal(false)} />
              
              <div className="relative bg-white rounded-xl max-w-md w-full shadow-xl">
                <div className="px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Exportar Relatório</h3>
                    <button
                      onClick={() => setShowExportModal(false)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="px-6 py-6">
                  <p className="text-slate-600 mb-4">
                    Selecione o formato para exportar os dados dos {filteredProjects.length} projetos filtrados:
                  </p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => executeExport('pdf')}
                      className="w-full flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-slate-900">PDF</div>
                        <div className="text-sm text-slate-500">Relatório formatado para impressão</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => executeExport('excel')}
                      className="w-full flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-slate-900">Excel</div>
                        <div className="text-sm text-slate-500">Planilha para análise avançada</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => executeExport('csv')}
                      className="w-full flex items-center space-x-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-slate-900">CSV</div>
                        <div className="text-sm text-slate-500">Dados brutos separados por vírgula</div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}