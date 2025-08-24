// Arquivo: /src/app/dashboard/logistica/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { StatusBadge, Button, Loading, Card } from '@/components/ui/DesignSystem';

interface Item {
  _id: string;
  codigo: string;
  tipo: 'calha' | 'cortina';
  ambiente: string;
  status: string;
  medidas?: {
    largura: number;
    altura: number;
    profundidade?: number;
  };
  projeto: {
    codigo: string;
    nomeHotel: string;
    cidade: string;
  };
  producao?: {
    finalizadoEm: Date;
  };
}

interface Kit {
  _id: string;
  codigo: string;
  projectId: string;
  roomNumber: string;
  items: Item[];
  status: 'montagem' | 'pronto_envio' | 'entregue';
  createdAt: Date;
  projeto: {
    codigo: string;
    nomeHotel: string;
    cidade: string;
  };
}

export default function LogisticaDashboard() {
  const { data: session } = useSession();
  const [itensDisponiveis, setItensDisponiveis] = useState<Item[]>([]);
  const [kitsAtivos, setKitsAtivos] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'produzido' | 'todos'>('produzido');
  const [montandoKit, setMontandoKit] = useState<string | null>(null);
  const [atualizandoStatus, setAtualizandoStatus] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, [filter]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar itens produzidos disponíveis para logística
      const statusFilter = filter === 'produzido' ? '&status=produzido' : '';
      const itensResponse = await fetch(`/api/items?${statusFilter}`);
      const itensData = await itensResponse.json();
      
      if (itensData.success) {
        setItensDisponiveis(itensData.data || []);
      }
      
      // Carregar kits ativos (simulado - API seria implementada depois)
      // Por enquanto vamos simular alguns kits
      setKitsAtivos([]);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const processarParaLogistica = async (itemId: string) => {
    try {
      setMontandoKit(itemId);
      
      const response = await fetch(`/api/items/${itemId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'logistica',
          observacoes: `Processado pela logística - ${session?.user?.name}`
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Atualizar lista local
        setItensDisponiveis(prev => 
          prev.map(item => 
            item._id === itemId 
              ? { ...item, status: 'logistica' }
              : item
          )
        );
        
        // Recarregar se mudou de filtro
        if (filter !== 'todos') {
          carregarDados();
        }
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error('Erro ao processar item:', error);
      alert('Erro de conexão');
    } finally {
      setMontandoKit(null);
    }
  };

  const atualizarStatusKit = async (kitId: string, novoStatus: string) => {
    try {
      setAtualizandoStatus(kitId);
      // TODO: Implementar API de kits
      console.log(`Atualizando kit ${kitId} para ${novoStatus}`);
      
      // Simulação por enquanto
      setTimeout(() => {
        setAtualizandoStatus(null);
        alert(`Kit ${kitId} marcado como ${novoStatus}`);
      }, 1000);
    } catch (error) {
      console.error('Erro ao atualizar kit:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'produzido': return 'success';
      case 'logistica': return 'info';
      case 'montagem': return 'warning';
      case 'pronto_envio': return 'success';
      case 'entregue': return 'success';
      default: return 'pending';
    }
  };

  // Agrupar itens por projeto/ambiente para sugerir kits
  const itensAgrupadosPorProjeto = itensDisponiveis.reduce((acc, item) => {
    const chave = `${item.projeto.codigo}-${item.ambiente}`;
    if (!acc[chave]) {
      acc[chave] = {
        projeto: item.projeto,
        ambiente: item.ambiente,
        itens: []
      };
    }
    acc[chave].itens.push(item);
    return acc;
  }, {} as Record<string, { projeto: any; ambiente: string; itens: Item[] }>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="Carregando dados da logística..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header seguindo padrão do dashboard principal */}
      <header className="bg-white border-b-4 border-gray-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-amber-700 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                  📦
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Centro Logístico
                  </h1>
                  <p className="text-gray-600 text-base lg:text-lg">
                    Gestão de Stocks e Expedição
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <div className="text-center sm:text-right">
                <div className="text-gray-900 font-bold text-lg">{session?.user?.name}</div>
                <div className="text-gray-600 text-base">
                  {(session?.user as any)?.empresa || 'Cortinados Portugal'}
                </div>
              </div>
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center border-2 border-gray-400">
                <span className="text-gray-700 text-lg font-bold">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8">
        
        {/* Painel Principal */}
        <div className="bg-amber-50 border-4 border-amber-300 rounded-2xl p-8 lg:p-10 shadow-lg">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-amber-700 rounded-2xl flex items-center justify-center text-white text-3xl lg:text-4xl shadow-lg">
                📦
              </div>
              <div>
                <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Centro Logístico
                </h2>
                <p className="text-gray-700 mb-4 text-lg lg:text-xl">
                  Gestão de Stocks e Preparação de Kits
                </p>
                <p className="text-gray-600 mb-6 text-base lg:text-lg">
                  Controle completo do fluxo logístico
                </p>
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

        {/* Filtros */}
        <div className="bg-white rounded-xl border-4 border-gray-200 p-6 lg:p-8 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Gestão de Stocks</h3>
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'produzido', label: 'Recém Produzidos', count: itensDisponiveis.filter(i => i.status === 'produzido').length },
              { key: 'todos', label: 'Todos Disponíveis', count: itensDisponiveis.length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  filter === key
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Sugestões de Kits por Ambiente */}
        {Object.keys(itensAgrupadosPorProjeto).length > 0 && (
          <div className="bg-white rounded-xl border-4 border-blue-200 p-6 lg:p-8 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-6">💡 Sugestões de Kits por Ambiente</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {Object.entries(itensAgrupadosPorProjeto).map(([chave, grupo]) => (
                <div key={chave} className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 transition-colors">
                  <div className="mb-4">
                    <h4 className="font-bold text-lg text-gray-900">
                      {grupo.projeto.nomeHotel}
                    </h4>
                    <p className="text-gray-600">{grupo.ambiente}</p>
                    <p className="text-sm text-gray-500">{grupo.projeto.codigo} • {grupo.projeto.cidade}</p>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {grupo.itens.map(item => (
                      <div key={item._id} className="flex items-center justify-between text-sm">
                        <span className="font-mono">{item.codigo}</span>
                        <StatusBadge status={getStatusColor(item.status)}>
                          {item.status.toUpperCase()}
                        </StatusBadge>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-center">
                    <span className="text-2xl font-bold text-amber-600">
                      {grupo.itens.length} item{grupo.itens.length !== 1 ? 's' : ''}
                    </span>
                    <p className="text-sm text-gray-600">Pronto para kit</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Itens Individuais */}
        <div className="bg-white rounded-xl border-4 border-gray-200 p-6 lg:p-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              Itens Disponíveis
            </h3>
            <div className="text-lg font-semibold text-gray-600">
              {itensDisponiveis.length} item(ns)
            </div>
          </div>

          {itensDisponiveis.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Nenhum item disponível
              </h3>
              <p className="text-gray-600 text-lg">
                {filter === 'produzido' 
                  ? 'Não há itens recém produzidos no momento.'
                  : 'Não há itens disponíveis para logística.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {itensDisponiveis.map((item) => (
                <div key={item._id} className="bg-white rounded-xl border-4 border-gray-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300 p-6 shadow-lg">
                  <div className="space-y-4">
                    {/* Header do Item */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-xl text-gray-900">
                          {item.codigo}
                        </h3>
                        <p className="text-gray-600 text-lg">{item.ambiente}</p>
                      </div>
                      <StatusBadge status={getStatusColor(item.status)}>
                        {item.status.toUpperCase()}
                      </StatusBadge>
                    </div>

                    {/* Informações do Projeto */}
                    <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                      <p className="font-bold text-gray-900 text-lg">
                        {item.projeto.nomeHotel}
                      </p>
                      <p className="text-gray-600">
                        {item.projeto.codigo} • {item.projeto.cidade}
                      </p>
                    </div>

                    {/* Tipo e Medidas */}
                    <div className="bg-amber-50 p-4 rounded-xl border-2 border-amber-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-amber-900">
                          {item.tipo === 'calha' ? '🏗️ Calha (TRK)' : '🪟 Cortina (CRT)'}
                        </span>
                      </div>
                      {item.medidas && (
                        <div className="text-amber-800 text-sm">
                          {item.medidas.largura} × {item.medidas.altura}
                          {item.medidas.profundidade && ` × ${item.medidas.profundidade}`} cm
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    {item.status === 'produzido' && (
                      <Button
                        onClick={() => processarParaLogistica(item._id)}
                        disabled={montandoKit === item._id}
                        loading={montandoKit === item._id}
                        variant="primary"
                        fullWidth
                      >
                        📦 Processar para Logística
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border-4 border-green-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Produzidos</span>
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {itensDisponiveis.filter(i => i.status === 'produzido').length}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Aguardando processo</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-blue-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Em Logística</span>
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {itensDisponiveis.filter(i => i.status === 'logistica').length}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Sendo processados</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-amber-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Kits Ativos</span>
              <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {kitsAtivos.length}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Em montagem</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-purple-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Total Itens</span>
              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {itensDisponiveis.length}
            </div>
            <div className="text-sm lg:text-base text-gray-600">No sistema</div>
          </div>
        </div>

        {/* Status do Sistema */}
        <footer className="bg-white rounded-xl border-4 border-gray-200 p-6 lg:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-900 font-bold text-lg">Centro Logístico Operacional</span>
              </div>
              <div className="hidden sm:block text-gray-400">•</div>
              <span className="text-gray-600 text-lg font-semibold">
                Sistema de Gestão de Stocks Ativo
              </span>
            </div>
            <div className="text-gray-600 text-lg font-semibold bg-gray-50 px-4 py-2 rounded-lg border-2 border-gray-200">
              Última atualização: {new Date().toLocaleTimeString('pt-PT')}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}