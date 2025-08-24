// Arquivo: /src/app/qr/item/[codigo]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { StatusBadge, Button, Loading, Input } from '@/components/ui/DesignSystem';
import Link from 'next/link';

interface ItemTracking {
  _id: string;
  codigo: string;
  tipo: 'calha' | 'cortina';
  ambiente: string;
  status: string;
  medidas?: {
    largura: number;
    altura: number;
    profundidade?: number;
    observacoes?: string;
  };
  projeto: {
    codigo: string;
    nomeHotel: string;
    cidade: string;
    endereco: string;
  };
  qrCodeUrl: string;
  medicao?: {
    medidoPor: {
      nome: string;
      role: string;
    };
    dataEm: Date;
    observacoes?: string;
  };
  producao?: {
    iniciadoEm?: Date;
    finalizadoEm?: Date;
    produzidoPor?: {
      nome: string;
      role: string;
    };
    observacoes?: string;
  };
  logistica?: {
    processadoEm?: Date;
    processadoPor?: {
      nome: string;
      role: string;
    };
    observacoes?: string;
  };
  instalacao?: {
    instaladoEm?: Date;
    instaladoPor?: {
      nome: string;
      role: string;
    };
    observacoes?: string;
  };
  criadoEm: Date;
  atualizadoEm: Date;
}

interface Props {
  params: {
    codigo: string;
  };
}

export default function ItemTrackingPage({ params }: Props) {
  const { data: session } = useSession();
  const [item, setItem] = useState<ItemTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  const { codigo } = params;

  useEffect(() => {
    if (codigo) {
      carregarItem();
    }
  }, [codigo]);

  const carregarItem = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/items?codigo=${encodeURIComponent(codigo)}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setItem(data.data[0]);
      } else {
        setError('Item não encontrado');
      }
    } catch (error) {
      console.error('Erro ao carregar item:', error);
      setError('Erro ao carregar dados do item');
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatus = async (novoStatus: string) => {
    if (!item || !session) return;

    try {
      setUpdating(true);
      
      const response = await fetch(`/api/items/${item._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: novoStatus,
          observacoes: observacoes || `Atualizado via QR por ${session.user?.name}`
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Recarregar item
        await carregarItem();
        setShowUpdateForm(false);
        setObservacoes('');
        alert('✅ Status atualizado com sucesso!');
      } else {
        alert(`Erro: ${data.message}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro de conexão');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'pending';
      case 'medido': return 'warning';
      case 'producao': return 'info';
      case 'produzido': return 'success';
      case 'logistica': return 'warning';
      case 'instalado': return 'success';
      default: return 'pending';
    }
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'pendente': 'Aguardando Medição',
      'medido': 'Medido - Pronto para Produção',
      'producao': 'Em Produção',
      'produzido': 'Produzido - Enviando para Logística',
      'logistica': 'Na Logística - Pronto para Instalação',
      'instalado': 'Instalado com Sucesso'
    };
    return statusMap[status] || status.toUpperCase();
  };

  const getProximoStatus = () => {
    if (!item || !session) return null;
    
    const userRole = (session.user as any).role;
    const statusAtual = item.status;
    
    // Lógica de permissões por role
    if (userRole === 'gestor') {
      // Gestor pode avançar qualquer status
      switch (statusAtual) {
        case 'pendente': return 'medido';
        case 'medido': return 'producao';
        case 'producao': return 'produzido';
        case 'produzido': return 'logistica';
        case 'logistica': return 'instalado';
        default: return null;
      }
    }
    
    // Regras específicas por role
    switch (userRole) {
      case 'medidor':
        return statusAtual === 'pendente' ? 'medido' : null;
      case 'fabrica_trk':
        if (item.tipo !== 'calha') return null;
        return statusAtual === 'medido' ? 'producao' : statusAtual === 'producao' ? 'produzido' : null;
      case 'fabrica_crt':
        if (item.tipo !== 'cortina') return null;
        return statusAtual === 'medido' ? 'producao' : statusAtual === 'producao' ? 'produzido' : null;
      case 'logistica':
        return statusAtual === 'produzido' ? 'logistica' : null;
      case 'instalador':
        return statusAtual === 'logistica' ? 'instalado' : null;
      default:
        return null;
    }
  };

  const getAcaoTexto = () => {
    const proximoStatus = getProximoStatus();
    if (!proximoStatus) return null;
    
    const acoes: Record<string, string> = {
      'medido': '📐 Registrar Medição',
      'producao': '🏭 Iniciar Produção',
      'produzido': '✅ Finalizar Produção',
      'logistica': '📦 Processar na Logística',
      'instalado': '🔧 Confirmar Instalação'
    };
    
    return acoes[proximoStatus];
  };

  const timeline = [
    {
      status: 'pendente',
      label: 'Item Criado',
      icon: '📝',
      completed: true,
      date: item?.criadoEm,
      user: null
    },
    {
      status: 'medido',
      label: 'Medição Realizada',
      icon: '📐',
      completed: item ? ['medido', 'producao', 'produzido', 'logistica', 'instalado'].includes(item.status) : false,
      date: item?.medicao?.dataEm,
      user: item?.medicao?.medidoPor,
      observacoes: item?.medicao?.observacoes
    },
    {
      status: 'producao',
      label: 'Produção Iniciada',
      icon: '🏭',
      completed: item ? ['producao', 'produzido', 'logistica', 'instalado'].includes(item.status) : false,
      date: item?.producao?.iniciadoEm,
      user: item?.producao?.produzidoPor
    },
    {
      status: 'produzido',
      label: 'Produção Finalizada',
      icon: '✅',
      completed: item ? ['produzido', 'logistica', 'instalado'].includes(item.status) : false,
      date: item?.producao?.finalizadoEm,
      user: item?.producao?.produzidoPor,
      observacoes: item?.producao?.observacoes
    },
    {
      status: 'logistica',
      label: 'Processado na Logística',
      icon: '📦',
      completed: item ? ['logistica', 'instalado'].includes(item.status) : false,
      date: item?.logistica?.processadoEm,
      user: item?.logistica?.processadoPor,
      observacoes: item?.logistica?.observacoes
    },
    {
      status: 'instalado',
      label: 'Instalação Concluída',
      icon: '🔧',
      completed: item ? item.status === 'instalado' : false,
      date: item?.instalacao?.instaladoEm,
      user: item?.instalacao?.instaladoPor,
      observacoes: item?.instalacao?.observacoes
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="Carregando informações do item..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border-4 border-red-200 p-8 max-w-md w-full mx-4 shadow-lg">
          <div className="text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Item não encontrado
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <Link href="/dashboard">
              <Button variant="primary">
                Voltar ao Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900">
            Item não encontrado
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Público */}
      <header className="bg-white border-b-4 border-blue-200 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-bold">
                📱
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  Rastreamento de Item
                </h1>
                <p className="text-gray-600">
                  Sistema de Gestão de Cortinados
                </p>
              </div>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <h2 className="text-xl lg:text-2xl font-bold text-blue-900">
                {item.codigo}
              </h2>
              <p className="text-blue-700">
                {item.projeto.nomeHotel} - {item.ambiente}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Status Atual */}
        <div className="bg-white rounded-xl border-4 border-gray-200 p-6 lg:p-8 shadow-lg">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Status Atual</h3>
            <StatusBadge status={getStatusColor(item.status)} size="lg">
              {getStatusLabel(item.status)}
            </StatusBadge>
            <p className="text-gray-600">
              Última atualização: {new Date(item.atualizadoEm).toLocaleDateString('pt-PT', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        {/* Informações do Item */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Detalhes do Item */}
          <div className="bg-white rounded-xl border-4 border-gray-200 p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Detalhes do Item</h3>
            <div className="space-y-4">
              <div>
                <span className="text-gray-600 font-medium">Código:</span>
                <div className="text-gray-900 font-bold text-lg font-mono">{item.codigo}</div>
              </div>
              
              <div>
                <span className="text-gray-600 font-medium">Tipo:</span>
                <div className="text-gray-900 font-bold">
                  {item.tipo === 'calha' ? '🏗️ Calha Técnica (TRK)' : '🪟 Cortina (CRT)'}
                </div>
              </div>
              
              <div>
                <span className="text-gray-600 font-medium">Ambiente:</span>
                <div className="text-gray-900 font-bold">{item.ambiente}</div>
              </div>
              
              {item.medidas && (
                <div>
                  <span className="text-gray-600 font-medium">Medidas:</span>
                  <div className="text-gray-900 font-bold">
                    {item.medidas.largura} × {item.medidas.altura}
                    {item.medidas.profundidade && ` × ${item.medidas.profundidade}`} cm
                  </div>
                  {item.medidas.observacoes && (
                    <div className="text-gray-600 text-sm mt-1">
                      {item.medidas.observacoes}
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <span className="text-gray-600 font-medium">Criado em:</span>
                <div className="text-gray-900">
                  {new Date(item.criadoEm).toLocaleDateString('pt-PT', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Informações do Projeto */}
          <div className="bg-white rounded-xl border-4 border-gray-200 p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">🏨 Projeto</h3>
            <div className="space-y-4">
              <div>
                <span className="text-gray-600 font-medium">Código do Projeto:</span>
                <div className="text-gray-900 font-bold text-lg">{item.projeto.codigo}</div>
              </div>
              
              <div>
                <span className="text-gray-600 font-medium">Hotel:</span>
                <div className="text-gray-900 font-bold">{item.projeto.nomeHotel}</div>
              </div>
              
              <div>
                <span className="text-gray-600 font-medium">Localização:</span>
                <div className="text-gray-900">{item.projeto.cidade}</div>
                <div className="text-gray-600 text-sm">{item.projeto.endereco}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline de Progresso */}
        <div className="bg-white rounded-xl border-4 border-gray-200 p-6 lg:p-8 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6">🚀 Progresso do Item</h3>
          <div className="space-y-6">
            {timeline.map((step, index) => (
              <div key={step.status} className="flex items-start space-x-4">
                {/* Ícone */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                  step.completed 
                    ? 'bg-green-500 text-white' 
                    : item?.status === step.status
                    ? 'bg-blue-500 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {step.icon}
                </div>
                
                {/* Linha conectora */}
                {index < timeline.length - 1 && (
                  <div className={`absolute ml-6 mt-12 w-0.5 h-6 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
                
                {/* Conteúdo */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-bold ${
                      step.completed ? 'text-green-700' : 
                      item?.status === step.status ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </h4>
                    {step.completed && (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                        CONCLUÍDO
                      </span>
                    )}
                    {item?.status === step.status && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded animate-pulse">
                        ATUAL
                      </span>
                    )}
                  </div>
                  
                  {step.date && (
                    <p className="text-sm text-gray-600">
                      {new Date(step.date).toLocaleDateString('pt-PT', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  )}
                  
                  {step.user && (
                    <p className="text-sm text-gray-600">
                      Por: {step.user.nome} ({step.user.role})
                    </p>
                  )}
                  
                  {step.observacoes && (
                    <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mt-2">
                      💬 {step.observacoes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ações (se logado) */}
        {session && getProximoStatus() && (
          <div className="bg-white rounded-xl border-4 border-blue-200 p-6 lg:p-8 shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">⚡ Ações Disponíveis</h3>
            
            {!showUpdateForm ? (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Você pode avançar este item para a próxima fase.
                </p>
                <Button
                  onClick={() => setShowUpdateForm(true)}
                  variant="primary"
                  size="lg"
                >
                  {getAcaoTexto()}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Observações (opcional)"
                  value={observacoes}
                  onChange={setObservacoes}
                  placeholder="Adicione detalhes sobre esta atualização..."
                />
                
                <div className="flex gap-4">
                  <Button
                    onClick={() => atualizarStatus(getProximoStatus()!)}
                    disabled={updating}
                    loading={updating}
                    variant="success"
                    fullWidth
                  >
                    ✅ Confirmar: {getAcaoTexto()}
                  </Button>
                  
                  <button
                    onClick={() => {
                      setShowUpdateForm(false);
                      setObservacoes('');
                    }}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                    disabled={updating}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* QR Code */}
        <div className="bg-white rounded-xl border-4 border-gray-200 p-6 lg:p-8 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">📱 QR Code deste Item</h3>
          <div className="text-center">
            <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-xl">
              {/* QR Code seria renderizado aqui */}
              <div className="w-48 h-48 bg-gray-100 flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-300">
                QR Code<br/>{item.codigo}
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Escaneie este código para acessar rapidamente as informações do item
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white rounded-xl border-4 border-gray-200 p-6 shadow-lg">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-900 font-bold">Sistema Operacional</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-600">
              <span>Cortinados Portugal</span>
              <span className="hidden sm:block">•</span>
              <span>Sistema de Gestão Industrial</span>
              <span className="hidden sm:block">•</span>
              <span>Última atualização: {new Date().toLocaleTimeString('pt-PT')}</span>
            </div>
            
            {session && (
              <div className="mt-4">
                <Link href="/dashboard">
                  <Button variant="primary">
                    🏠 Voltar ao Dashboard
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}