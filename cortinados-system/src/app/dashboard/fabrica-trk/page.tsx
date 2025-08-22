'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { StatusBadge, Button, Card, Loading } from '@/components/ui/DesignSystem';

interface Item {
  _id: string;
  codigo: string;
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
  medicao?: {
    dataEm: Date;
    medidoPor: {
      nome: string;
    };
  };
}

export default function FabricaTRKDashboard() {
  const { data: session } = useSession();
  const [itens, setItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'medido' | 'producao' | 'produzido'>('medido');
  const [updating, setUpdating] = useState<string | null>(null);

  // Carregar itens do tipo calha
  useEffect(() => {
    carregarItens();
  }, [filter]);

  const carregarItens = async () => {
    try {
      setLoading(true);
      const statusFilter = filter === 'todos' ? '' : `&status=${filter}`;
      const response = await fetch(`/api/items/type/calha?${statusFilter}`);
      const data = await response.json();
      
      if (data.success) {
        setItens(data.data || []);
      } else {
        console.error('Erro ao carregar itens:', data.message);
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (itemId: string, novoStatus: string) => {
    try {
      setUpdating(itemId);
      
      const response = await fetch(`/api/items/${itemId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: novoStatus,
          observacoes: `Status atualizado pela fábrica TRK - ${session?.user?.name}`
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Atualizar lista local
        setItens(prev => 
          prev.map(item => 
            item._id === itemId 
              ? { ...item, status: novoStatus }
              : item
          )
        );
        
        // Recarregar se mudou de filtro
        if (filter !== 'todos' && filter !== novoStatus) {
          carregarItens();
        }
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro de conexão');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'medido': return 'warning';
      case 'producao': return 'info';
      case 'produzido': return 'success';
      default: return 'pending';
    }
  };

  const getProximoStatus = (statusAtual: string) => {
    switch (statusAtual) {
      case 'medido': return 'producao';
      case 'producao': return 'produzido';
      default: return null;
    }
  };

  const getAcaoTexto = (statusAtual: string) => {
    switch (statusAtual) {
      case 'medido': return 'Iniciar Produção';
      case 'producao': return 'Finalizar Produção';
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="Carregando itens TRK..." />
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
                <div className="w-12 h-12 bg-indigo-700 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                  🏗️
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Fábrica TRK
                  </h1>
                  <p className="text-gray-600 text-base lg:text-lg">
                    Produção de Calhas Técnicas
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
        {/* Painel Principal - Seguindo padrão */}
        <div className="bg-indigo-50 border-4 border-indigo-300 rounded-2xl p-8 lg:p-10 shadow-lg">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-indigo-700 rounded-2xl flex items-center justify-center text-white text-3xl lg:text-4xl shadow-lg">
                🏗️
              </div>
              <div>
                <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Centro de Produção TRK
                </h2>
                <p className="text-gray-700 mb-4 text-lg lg:text-xl">
                  Gestão de Produção de Calhas Técnicas
                </p>
                <p className="text-gray-600 mb-6 text-base lg:text-lg">
                  Controle completo do fluxo de produção de calhas
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
          <h3 className="text-xl font-bold text-gray-900 mb-4">Filtros de Produção</h3>
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'medido', label: 'Aguardando Produção', count: itens.filter(i => i.status === 'medido').length },
              { key: 'producao', label: 'Em Produção', count: itens.filter(i => i.status === 'producao').length },
              { key: 'produzido', label: 'Produzido', count: itens.filter(i => i.status === 'produzido').length },
              { key: 'todos', label: 'Todos', count: itens.length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  filter === key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Itens */}
        {itens.length === 0 ? (
          <div className="bg-white rounded-xl border-4 border-gray-200 p-8 shadow-lg">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Nenhum item encontrado
              </h3>
              <p className="text-gray-600 text-lg">
                {filter === 'medido' 
                  ? 'Não há itens aguardando produção no momento.'
                  : `Não há itens com status "${filter}".`
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {itens.map((item) => {
              const proximoStatus = getProximoStatus(item.status);
              const acaoTexto = getAcaoTexto(item.status);
              
              return (
                <div key={item._id} className="bg-white rounded-xl border-4 border-gray-200 hover:border-indigo-400 hover:shadow-xl transition-all duration-300 p-6 shadow-lg">
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

                    {/* Medidas */}
                    {item.medidas && (
                      <div className="bg-indigo-50 p-4 rounded-xl border-2 border-indigo-200">
                        <h4 className="font-bold text-indigo-900 mb-2 text-lg">📐 Medidas:</h4>
                        <div className="text-indigo-800">
                          <p>Largura: {item.medidas.largura} cm</p>
                          <p>Altura: {item.medidas.altura} cm</p>
                          {item.medidas.profundidade && (
                            <p>Profundidade: {item.medidas.profundidade} cm</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Informações de Medição */}
                    {item.medicao && (
                      <div className="text-sm text-gray-500 bg-gray-50 p-2 rounded">
                        Medido por {item.medicao.medidoPor.nome} em{' '}
                        {new Date(item.medicao.dataEm).toLocaleDateString('pt-PT')}
                      </div>
                    )}

                    {/* Ações */}
                    {proximoStatus && acaoTexto && (
                      <Button
                        onClick={() => atualizarStatus(item._id, proximoStatus)}
                        disabled={updating === item._id}
                        loading={updating === item._id}
                        variant="primary"
                        fullWidth
                      >
                        {acaoTexto}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Estatísticas - Seguindo padrão do dashboard principal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border-4 border-blue-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Aguardando</span>
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {itens.filter(i => i.status === 'medido').length}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Para produzir</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-yellow-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Em Produção</span>
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {itens.filter(i => i.status === 'producao').length}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Fabricando</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-green-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Produzido</span>
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {itens.filter(i => i.status === 'produzido').length}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Concluído</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-indigo-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Total TRK</span>
              <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {itens.length}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Calhas total</div>
          </div>
        </div>

        {/* Status do Sistema - Seguindo padrão */}
        <footer className="bg-white rounded-xl border-4 border-gray-200 p-6 lg:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-900 font-bold text-lg">Fábrica TRK Operacional</span>
              </div>
              <div className="hidden sm:block text-gray-400">•</div>
              <span className="text-gray-600 text-lg font-semibold">
                Produção de Calhas Ativa
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