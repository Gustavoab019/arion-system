// Arquivo: /src/app/dashboard/itens/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Item {
  _id: string;
  codigo: string;
  tipo: 'cortina' | 'calha';
  ambiente: string;
  status: string;
  medidas?: {
    largura: number;
    altura: number;
    profundidade?: number;
    observacoes?: string;
  };
  projeto: {
    _id: string;
    codigo: string;
    nomeHotel: string;
    cidade: string;
  };
  qrCodeUrl: string;
  medicao?: {
    dataEm: Date;
    medidoPor: {
      nome: string;
    };
  };
  criadoEm: Date;
  atualizadoEm: Date;
}

interface ItemStats {
  total: number;
  pendente: number;
  medido: number;
  producao: number;
  produzido: number;
  logistica: number;
  instalado: number;
  cancelado: number;
  cortinas: number;
  calhas: number;
}

export default function ItensPage() {
  const { data: session } = useSession();
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<ItemStats>({
    total: 0,
    pendente: 0,
    medido: 0,
    producao: 0,
    produzido: 0,
    logistica: 0,
    instalado: 0,
    cancelado: 0,
    cortinas: 0,
    calhas: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [projetoFilter, setProjetoFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Estados das modais
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [itemForQR, setItemForQR] = useState<Item | null>(null);

  useEffect(() => {
    carregarItens();
  }, [timeRange]);

  useEffect(() => {
    aplicarFiltros();
  }, [items, statusFilter, tipoFilter, projetoFilter, searchQuery]);

  const carregarItens = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/items');
      const data = await response.json();
      
      if (data.success) {
        const itemsData = data.data || [];
        setItems(itemsData);
        
        // Calcular estatísticas
        const statsData = {
          total: itemsData.length,
          pendente: itemsData.filter((i: Item) => i.status === 'pendente').length,
          medido: itemsData.filter((i: Item) => i.status === 'medido').length,
          producao: itemsData.filter((i: Item) => i.status === 'producao').length,
          produzido: itemsData.filter((i: Item) => i.status === 'produzido').length,
          logistica: itemsData.filter((i: Item) => i.status === 'logistica').length,
          instalado: itemsData.filter((i: Item) => i.status === 'instalado').length,
          cancelado: itemsData.filter((i: Item) => i.status === 'cancelado').length,
          cortinas: itemsData.filter((i: Item) => i.tipo === 'cortina').length,
          calhas: itemsData.filter((i: Item) => i.tipo === 'calha').length
        };
        
        setStats(statsData);
      } else {
        console.error('Erro ao carregar itens:', data.message);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = () => {
    let filtered = [...items];

    // Filtro por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Filtro por tipo
    if (tipoFilter !== 'todos') {
      filtered = filtered.filter(item => item.tipo === tipoFilter);
    }

    // Filtro por projeto
    if (projetoFilter) {
      filtered = filtered.filter(item => 
        item.projeto.codigo.toLowerCase().includes(projetoFilter.toLowerCase()) ||
        item.projeto.nomeHotel.toLowerCase().includes(projetoFilter.toLowerCase())
      );
    }

    // Busca por texto
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ambiente.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredItems(filtered);
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
      case 'pendente': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'medido': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'producao': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'produzido': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'logistica': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'instalado': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pendente': 'Pendente',
      'medido': 'Medido',
      'producao': 'Em Produção',
      'produzido': 'Produzido',
      'logistica': 'Na Logística',
      'instalado': 'Instalado',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status.toUpperCase();
  };

  const getTipoIcon = (tipo: string) => {
    if (tipo === 'cortina') {
      return (
        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
          <span className="text-emerald-700 text-lg">🪟</span>
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
          <span className="text-indigo-700 text-lg">🏗️</span>
        </div>
      );
    }
  };

  const handleViewDetails = (item: Item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const handleShowQR = (item: Item) => {
    setItemForQR(item);
    setShowQRModal(true);
  };

  const projetos = Array.from(new Set(items.map(i => i.projeto.codigo))).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-slate-900 font-semibold text-xl mb-2">Carregando Inventário</h3>
          <p className="text-slate-600">Processando dados dos itens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Inventário de Itens</h1>
              <p className="text-slate-600 mt-2">Controle completo de cortinas e calhas em produção</p>
            </div>
            <div className="flex items-center space-x-3">
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
                onClick={() => window.print()}
                className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                Exportar Lista
              </button>
              
              <Link 
                href="/dashboard/scanner"
                className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 font-medium transition-colors inline-flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span>Scanner QR</span>
              </Link>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
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
              {stats.total.toLocaleString()}
            </div>
            <div className="text-sm text-violet-600 font-medium">
              No inventário
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🪟</span>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Cortinas
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {stats.cortinas.toLocaleString()}
            </div>
            <div className="text-sm text-emerald-600 font-medium">
              Fábrica CRT
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏗️</span>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Calhas
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {stats.calhas.toLocaleString()}
            </div>
            <div className="text-sm text-indigo-600 font-medium">
              Fábrica TRK
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Instalados
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-2">
              {stats.instalado.toLocaleString()}
            </div>
            <div className="text-sm text-green-600 font-medium">
              {stats.total > 0 ? Math.round((stats.instalado / stats.total) * 100) : 0}% concluído
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Filtros e Busca</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  placeholder="Código ou ambiente..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="todos">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="medido">Medido</option>
                <option value="producao">Em Produção</option>
                <option value="produzido">Produzido</option>
                <option value="logistica">Na Logística</option>
                <option value="instalado">Instalado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tipo
              </label>
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="todos">Todos</option>
                <option value="cortina">Cortinas</option>
                <option value="calha">Calhas</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Projeto
              </label>
              <input
                type="text"
                value={projetoFilter}
                onChange={(e) => setProjetoFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                placeholder="Código do projeto..."
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('todos');
                  setTipoFilter('todos');
                  setProjetoFilter('');
                  setSearchQuery('');
                }}
                className="w-full bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 font-medium transition-colors"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Itens */}
        {filteredItems.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">
                {items.length === 0 ? 'Nenhum item encontrado' : 'Nenhum item corresponde aos filtros'}
              </h3>
              <p className="text-slate-600 text-lg mb-6">
                {items.length === 0 
                  ? 'Os itens aparecerão aqui quando projetos forem criados.'
                  : 'Tente ajustar os filtros para encontrar os itens desejados.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {filteredItems.map((item) => (
              <div key={item._id} className="bg-white border border-slate-200 rounded-xl hover:shadow-lg transition-all duration-300 p-6">
                <div className="space-y-4">
                  {/* Header do Item */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getTipoIcon(item.tipo)}
                      <div>
                        <div className="font-mono font-bold text-slate-900 text-lg">
                          {item.codigo}
                        </div>
                        <div className="text-slate-600">{item.ambiente}</div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>

                  {/* Informações do Projeto */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="font-medium text-slate-700">Projeto</span>
                    </div>
                    <div className="font-mono font-semibold text-slate-900">{item.projeto.codigo}</div>
                    <div className="text-slate-600">{item.projeto.nomeHotel}</div>
                    <div className="text-sm text-slate-500">{item.projeto.cidade}</div>
                  </div>

                  {/* Medidas */}
                  {item.medidas && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="font-medium text-blue-900">Medidas</span>
                      </div>
                      <div className="text-blue-800">
                        {item.medidas.largura} × {item.medidas.altura}
                        {item.medidas.profundidade && ` × ${item.medidas.profundidade}`} cm
                      </div>
                      {item.medicao && (
                        <div className="text-xs text-blue-700 mt-1">
                          Medido por {item.medicao.medidoPor.nome} em {formatDate(item.medicao.dataEm)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      onClick={() => handleViewDetails(item)}
                      className="flex-1 bg-sky-100 text-sky-700 hover:bg-sky-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Ver Detalhes
                    </button>
                    <button
                      onClick={() => handleShowQR(item)}
                      className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      QR Code
                    </button>
                    <Link
                      href={`/qr/item/${item.codigo}`}
                      target="_blank"
                      className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Rastrear
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pipeline de Produção */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="bg-white border border-slate-200 rounded-xl">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Pipeline de Produção</h2>
              <p className="text-slate-600 text-sm mt-1">Fluxo atual dos itens no sistema</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {[
                  { key: 'pendente', label: 'Aguardando Medição', count: stats.pendente, color: 'bg-gray-500' },
                  { key: 'medido', label: 'Medidas Registradas', count: stats.medido, color: 'bg-yellow-500' },
                  { key: 'producao', label: 'Em Produção', count: stats.producao, color: 'bg-blue-500' },
                  { key: 'produzido', label: 'Produção Finalizada', count: stats.produzido, color: 'bg-indigo-500' },
                  { key: 'logistica', label: 'Processamento Logístico', count: stats.logistica, color: 'bg-purple-500' },
                  { key: 'instalado', label: 'Instalação Concluída', count: stats.instalado, color: 'bg-green-500' }
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
              <h2 className="text-xl font-bold text-slate-900">Distribuição por Tipo</h2>
              <p className="text-slate-600 text-sm mt-1">Cortinas vs Calhas no inventário</p>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🪟</span>
                      <span className="text-slate-700 font-medium">Cortinas (CRT)</span>
                    </div>
                    <span className="text-slate-900 font-bold">{stats.cortinas}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className="bg-emerald-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${stats.total > 0 ? (stats.cortinas / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {stats.total > 0 ? Math.round((stats.cortinas / stats.total) * 100) : 0}% do total
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🏗️</span>
                      <span className="text-slate-700 font-medium">Calhas (TRK)</span>
                    </div>
                    <span className="text-slate-900 font-bold">{stats.calhas}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3">
                    <div 
                      className="bg-indigo-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${stats.total > 0 ? (stats.calhas / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {stats.total > 0 ? Math.round((stats.calhas / stats.total) * 100) : 0}% do total
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-900 mb-1">
                      {filteredItems.length}
                    </div>
                    <div className="text-slate-600">
                      {filteredItems.length === items.length 
                        ? 'Itens no total'
                        : `de ${items.length} itens mostrados`
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
                Inventário Ativo
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <span>Última sincronização: {new Date().toLocaleTimeString('pt-PT')}</span>
              <div className="hidden sm:block text-slate-400">•</div>
              <span>Versão 2.1.0</span>
            </div>
          </div>
        </footer>

        {/* Modal de Detalhes do Item */}
        {showDetailsModal && selectedItem && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 text-center">
              <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowDetailsModal(false)} />
              
              <div className="relative bg-white rounded-xl max-w-2xl w-full shadow-xl">
                <div className="px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Detalhes do Item</h3>
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
                          <div className="font-mono font-bold text-slate-900">{selectedItem.codigo}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-600">Tipo:</span>
                          <div className="flex items-center space-x-2">
                            {getTipoIcon(selectedItem.tipo)}
                            <span className="font-medium text-slate-900 capitalize">
                              {selectedItem.tipo} ({selectedItem.tipo === 'cortina' ? 'CRT' : 'TRK'})
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-600">Ambiente:</span>
                          <div className="font-medium text-slate-900">{selectedItem.ambiente}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-600">Status:</span>
                          <div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedItem.status)}`}>
                              {getStatusLabel(selectedItem.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">Projeto</h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium text-slate-600">Código:</span>
                          <div className="font-mono font-bold text-slate-900">{selectedItem.projeto.codigo}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-600">Hotel:</span>
                          <div className="text-slate-900">{selectedItem.projeto.nomeHotel}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-600">Cidade:</span>
                          <div className="text-slate-900">{selectedItem.projeto.cidade}</div>
                        </div>
                      </div>
                    </div>
                    
                    {selectedItem.medidas && (
                      <div className="md:col-span-2">
                        <h4 className="font-semibold text-slate-900 mb-3">Medidas</h4>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <span className="text-sm font-medium text-blue-700">Largura:</span>
                              <div className="font-bold text-blue-900">{selectedItem.medidas.largura} cm</div>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-blue-700">Altura:</span>
                              <div className="font-bold text-blue-900">{selectedItem.medidas.altura} cm</div>
                            </div>
                            {selectedItem.medidas.profundidade && (
                              <div>
                                <span className="text-sm font-medium text-blue-700">Profundidade:</span>
                                <div className="font-bold text-blue-900">{selectedItem.medidas.profundidade} cm</div>
                              </div>
                            )}
                          </div>
                          {selectedItem.medidas.observacoes && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <span className="text-sm font-medium text-blue-700">Observações:</span>
                              <div className="text-blue-800 mt-1">{selectedItem.medidas.observacoes}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="md:col-span-2">
                      <h4 className="font-semibold text-slate-900 mb-3">Datas</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-medium text-slate-600">Criado em:</span>
                          <div className="text-slate-900">{formatDate(selectedItem.criadoEm)}</div>
                        </div>
                        {selectedItem.medicao && (
                          <div>
                            <span className="text-sm font-medium text-slate-600">Medido em:</span>
                            <div className="text-slate-900">{formatDate(selectedItem.medicao.dataEm)}</div>
                            <div className="text-xs text-slate-500">
                              Por {selectedItem.medicao.medidoPor.nome}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                  <div className="flex justify-between items-center">
                    <Link
                      href={`/qr/item/${selectedItem.codigo}`}
                      target="_blank"
                      className="text-sky-600 hover:text-sky-500 font-medium text-sm inline-flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>Rastrear Item</span>
                    </Link>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowDetailsModal(false)}
                        className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium transition-colors"
                      >
                        Fechar
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          handleShowQR(selectedItem);
                        }}
                        className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 font-medium transition-colors"
                      >
                        Ver QR Code
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal QR Code */}
        {showQRModal && itemForQR && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 text-center">
              <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowQRModal(false)} />
              
              <div className="relative bg-white rounded-xl max-w-md w-full shadow-xl">
                <div className="px-6 py-4 border-b border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">QR Code do Item</h3>
                    <button
                      onClick={() => setShowQRModal(false)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="px-6 py-6 text-center">
                  <div className="mb-4">
                    <div className="font-mono font-bold text-slate-900 text-lg">{itemForQR.codigo}</div>
                    <div className="text-slate-600">{itemForQR.ambiente}</div>
                    <div className="text-slate-500 text-sm">{itemForQR.projeto.nomeHotel}</div>
                  </div>
                  
                  <div className="inline-block p-4 bg-white border-2 border-slate-300 rounded-xl shadow-inner">
                    <div className="w-48 h-48 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-500 border-2 border-dashed border-slate-300 rounded-lg">
                      <div className="text-center">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        <div className="text-sm font-medium">QR Code</div>
                        <div className="text-xs">{itemForQR.codigo}</div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-600 mt-4">
                    Escaneie este código para acessar o rastreamento detalhado do item
                  </p>
                </div>
                
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                  <div className="flex justify-between">
                    <Link
                      href={`/qr/item/${itemForQR.codigo}`}
                      target="_blank"
                      className="text-sky-600 hover:text-sky-500 font-medium text-sm inline-flex items-center space-x-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      <span>Abrir Rastreamento</span>
                    </Link>
                    <button
                      onClick={() => setShowQRModal(false)}
                      className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium transition-colors"
                    >
                      Fechar
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