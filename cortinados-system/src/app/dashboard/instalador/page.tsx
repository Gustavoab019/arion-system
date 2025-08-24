// Arquivo: /src/app/dashboard/instalador/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { StatusBadge, Button, Loading, Input } from '@/components/ui/DesignSystem';

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
  qrCodeUrl?: string;
  logistica?: {
    processadoEm: Date;
  };
}

export default function InstaladorDashboard() {
  const { data: session } = useSession();
  const [itensParaInstalar, setItensParaInstalar] = useState<Item[]>([]);
  const [itensInstalados, setItensInstalados] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'logistica' | 'instalado' | 'todos'>('logistica');
  const [instalando, setInstalando] = useState<string | null>(null);
  const [codigoQR, setCodigoQR] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [itemSelecionado, setItemSelecionado] = useState<string | null>(null);

  useEffect(() => {
    carregarItens();
  }, [filter]);

  const carregarItens = async () => {
    try {
      setLoading(true);
      
      let url = '/api/items';
      if (filter !== 'todos') {
        url += `?status=${filter}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        const itens = data.data || [];
        
        if (filter === 'logistica') {
          setItensParaInstalar(itens.filter((item: Item) => item.status === 'logistica'));
          setItensInstalados([]);
        } else if (filter === 'instalado') {
          setItensParaInstalar([]);
          setItensInstalados(itens.filter((item: Item) => item.status === 'instalado'));
        } else {
          setItensParaInstalar(itens.filter((item: Item) => item.status === 'logistica'));
          setItensInstalados(itens.filter((item: Item) => item.status === 'instalado'));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoInstalado = async (itemId: string, obs?: string) => {
    try {
      setInstalando(itemId);
      
      const response = await fetch(`/api/items/${itemId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'instalado',
          observacoes: obs || `Instalado por ${session?.user?.name}`
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Mover item da lista "para instalar" para "instalados"
        const itemInstalado = itensParaInstalar.find(item => item._id === itemId);
        if (itemInstalado) {
          setItensParaInstalar(prev => prev.filter(item => item._id !== itemId));
          setItensInstalados(prev => [...prev, { ...itemInstalado, status: 'instalado' }]);
        }
        
        // Se está no filtro específico, recarregar
        if (filter !== 'todos') {
          carregarDados();
        }
        
        alert(`✅ ${data.data?.item?.codigo || 'Item'} marcado como instalado!`);
        
        // Reset
        setObservacoes('');
        setItemSelecionado(null);
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error('Erro ao marcar como instalado:', error);
      alert('Erro de conexão');
    } finally {
      setInstalando(null);
    }
  };

  const carregarDados = async () => {
    carregarItens();
  };

  const handleQRSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!codigoQR.trim()) {
      alert('Digite o código QR do item');
      return;
    }

    // Encontrar item pelo código
    const item = itensParaInstalar.find(item => item.codigo.toUpperCase() === codigoQR.toUpperCase());
    
    if (item) {
      marcarComoInstalado(item._id, `Instalado via QR Scanner: ${codigoQR} por ${session?.user?.name}`);
      setCodigoQR('');
    } else {
      alert(`Item ${codigoQR} não encontrado ou não está pronto para instalação`);
    }
  };

  const handleInstalarComObservacao = (itemId: string) => {
    const obsCompleta = observacoes 
      ? `${observacoes} - Instalado por ${session?.user?.name}`
      : `Instalado por ${session?.user?.name}`;
    
    marcarComoInstalado(itemId, obsCompleta);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'logistica': return 'warning';
      case 'instalado': return 'success';
      default: return 'pending';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'logistica': return 'PRONTO P/ INSTALAR';
      case 'instalado': return 'INSTALADO';
      default: return status.toUpperCase();
    }
  };

  // Agrupar itens por projeto para melhor organização
  const itensAgrupadosPorProjeto = itensParaInstalar.reduce((acc, item) => {
    const chave = item.projeto.codigo;
    if (!acc[chave]) {
      acc[chave] = {
        projeto: item.projeto,
        itens: []
      };
    }
    acc[chave].itens.push(item);
    return acc;
  }, {} as Record<string, { projeto: any; itens: Item[] }>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="Carregando instalações..." />
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
                <div className="w-12 h-12 bg-rose-700 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                  🔧
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Departamento de Instalação
                  </h1>
                  <p className="text-gray-600 text-base lg:text-lg">
                    Execução e Controlo de Qualidade
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
        <div className="bg-rose-50 border-4 border-rose-300 rounded-2xl p-8 lg:p-10 shadow-lg">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-rose-700 rounded-2xl flex items-center justify-center text-white text-3xl lg:text-4xl shadow-lg">
                🔧
              </div>
              <div>
                <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Central de Instalações
                </h2>
                <p className="text-gray-700 mb-4 text-lg lg:text-xl">
                  Confirmação e Controlo de Qualidade
                </p>
                <p className="text-gray-600 mb-6 text-base lg:text-lg">
                  Scanner QR e gestão de instalações
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

        {/* Scanner QR */}
        <div className="bg-white rounded-xl border-4 border-blue-200 p-6 lg:p-8 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">📱 Scanner QR / Código Manual</h3>
          <form onSubmit={handleQRSubmit} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  label="Código do Item (QR ou Manual)"
                  value={codigoQR}
                  onChange={setCodigoQR}
                  placeholder="Ex: LIS-01-TRK ou escaneie QR code"
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!codigoQR.trim()}
                >
                  🔍 Instalar Item
                </Button>
              </div>
            </div>
          </form>
          
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <p className="text-blue-800 text-sm">
              💡 <strong>Dica:</strong> Escaneie o QR code do item ou digite o código manualmente. O item deve estar com status "PRONTO P/ INSTALAR" (vindo da logística).
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl border-4 border-gray-200 p-6 lg:p-8 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Gestão de Instalações</h3>
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'logistica', label: 'Prontos para Instalar', count: itensParaInstalar.length },
              { key: 'instalado', label: 'Já Instalados', count: itensInstalados.length },
              { key: 'todos', label: 'Todos os Itens', count: itensParaInstalar.length + itensInstalados.length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-6 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                  filter === key
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Lista por Projeto - Para Instalar */}
        {filter !== 'instalado' && Object.keys(itensAgrupadosPorProjeto).length > 0 && (
          <div className="bg-white rounded-xl border-4 border-green-200 p-6 lg:p-8 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-6">🏨 Instalações por Projeto</h3>
            <div className="space-y-6">
              {Object.entries(itensAgrupadosPorProjeto).map(([codigo, grupo]) => (
                <div key={codigo} className="border-2 border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-bold text-xl text-gray-900">
                        {grupo.projeto.nomeHotel}
                      </h4>
                      <p className="text-gray-600">{grupo.projeto.codigo} • {grupo.projeto.cidade}</p>
                    </div>
                    <div className="text-center">
                      <span className="text-2xl font-bold text-rose-600">
                        {grupo.itens.length}
                      </span>
                      <p className="text-sm text-gray-600">itens</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {grupo.itens.map((item) => (
                      <div key={item._id} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-sm font-bold">{item.codigo}</span>
                          <StatusBadge status={getStatusColor(item.status)}>
                            {getStatusLabel(item.status)}
                          </StatusBadge>
                        </div>
                        
                        <p className="text-gray-700 mb-2">{item.ambiente}</p>
                        <p className="text-sm text-gray-600 mb-3">
                          {item.tipo === 'calha' ? '🏗️ Calha (TRK)' : '🪟 Cortina (CRT)'}
                        </p>

                        {item.medidas && (
                          <p className="text-xs text-gray-500 mb-3">
                            {item.medidas.largura} × {item.medidas.altura}
                            {item.medidas.profundidade && ` × ${item.medidas.profundidade}`} cm
                          </p>
                        )}

                        <div className="space-y-2">
                          {itemSelecionado === item._id ? (
                            <div className="space-y-2">
                              <Input
                                label="Observações (opcional)"
                                value={observacoes}
                                onChange={setObservacoes}
                                placeholder="Ex: Instalação concluída sem problemas"
                              />
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => handleInstalarComObservacao(item._id)}
                                  disabled={instalando === item._id}
                                  loading={instalando === item._id}
                                  variant="success"
                                  size="sm"
                                >
                                  ✅ Confirmar
                                </Button>
                                <button
                                  onClick={() => {
                                    setItemSelecionado(null);
                                    setObservacoes('');
                                  }}
                                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              onClick={() => setItemSelecionado(item._id)}
                              variant="primary"
                              size="sm"
                              fullWidth
                            >
                              🔧 Marcar como Instalado
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Instalados */}
        {filter !== 'logistica' && itensInstalados.length > 0 && (
          <div className="bg-white rounded-xl border-4 border-green-200 p-6 lg:p-8 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-6">✅ Itens Já Instalados</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {itensInstalados.map((item) => (
                <div key={item._id} className="bg-green-50 rounded-xl border-2 border-green-200 p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono font-bold">{item.codigo}</span>
                    <StatusBadge status="success">
                      INSTALADO
                    </StatusBadge>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="font-bold text-gray-900">{item.projeto.nomeHotel}</p>
                    <p className="text-gray-600">{item.ambiente}</p>
                    <p className="text-sm text-gray-600">
                      {item.projeto.codigo} • {item.projeto.cidade}
                    </p>
                    <p className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                      {item.tipo === 'calha' ? '🏗️ Calha (TRK)' : '🪟 Cortina (CRT)'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty States */}
        {filter === 'logistica' && itensParaInstalar.length === 0 && (
          <div className="bg-white rounded-xl border-4 border-gray-200 p-8 shadow-lg">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔧</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Nenhum item pronto para instalação
              </h3>
              <p className="text-gray-600 text-lg">
                Aguarde itens chegarem da logística para instalação.
              </p>
            </div>
          </div>
        )}

        {filter === 'instalado' && itensInstalados.length === 0 && (
          <div className="bg-white rounded-xl border-4 border-gray-200 p-8 shadow-lg">
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Nenhum item instalado ainda
              </h3>
              <p className="text-gray-600 text-lg">
                Instalações confirmadas aparecerão aqui.
              </p>
            </div>
          </div>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border-4 border-yellow-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Prontos</span>
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {itensParaInstalar.length}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Para instalar</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-green-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Instalados</span>
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {itensInstalados.length}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Concluídos</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-blue-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Projetos Ativos</span>
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {Object.keys(itensAgrupadosPorProjeto).length}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Em andamento</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-rose-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Total</span>
              <div className="w-4 h-4 bg-rose-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {itensParaInstalar.length + itensInstalados.length}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Itens geridos</div>
          </div>
        </div>

        {/* Status do Sistema */}
        <footer className="bg-white rounded-xl border-4 border-gray-200 p-6 lg:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-900 font-bold text-lg">Departamento de Instalação Operacional</span>
              </div>
              <div className="hidden sm:block text-gray-400">•</div>
              <span className="text-gray-600 text-lg font-semibold">
                Sistema de Controlo de Qualidade Ativo
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