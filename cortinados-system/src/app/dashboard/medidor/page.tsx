// Arquivo: /src/app/dashboard/medidor/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Projeto {
  _id: string;
  codigo: string;
  nomeHotel: string;
  cidade: string;
  status: string;
}

interface Item {
  _id: string;
  codigo: string;
  tipo: 'cortina' | 'calha';
  ambiente: string;
  status: string;
  projeto: {
    codigo: string;
    nomeHotel: string;
  };
}

interface FormData {
  itemId: string;
  largura: string;
  altura: string;
  profundidade: string;
  observacoes: string;
}

export default function MedidorDashboard() {
  const { data: session } = useSession();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [itensPendentes, setItensPendentes] = useState<Item[]>([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState('');
  const [itemSelecionado, setItemSelecionado] = useState('');
  const [formData, setFormData] = useState<FormData>({
    itemId: '',
    largura: '',
    altura: '',
    profundidade: '',
    observacoes: ''
  });
  const [loading, setLoading] = useState(false);
  const [loadingProjetos, setLoadingProjetos] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Carregar projetos ativos
  useEffect(() => {
    carregarProjetos();
  }, []);

  // Carregar itens quando projeto for selecionado
  useEffect(() => {
    if (projetoSelecionado) {
      carregarItensPendentes(projetoSelecionado);
    }
  }, [projetoSelecionado]);

  const carregarProjetos = async () => {
    try {
      setLoadingProjetos(true);
      const response = await fetch('/api/projects?status=medicao');
      const data = await response.json();
      
      if (data.success) {
        setProjetos(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
    } finally {
      setLoadingProjetos(false);
    }
  };

  const carregarItensPendentes = async (projetoId: string) => {
    try {
      const response = await fetch(`/api/items?projeto=${projetoId}&status=pendente`);
      const data = await response.json();
      
      if (data.success) {
        setItensPendentes(data.data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    }
  };

  const handleProjetoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valor = e.target.value;
    setProjetoSelecionado(valor);
    setItemSelecionado('');
    setShowForm(false);
    resetForm();
  };

  const handleItemSelect = (itemId: string) => {
    setItemSelecionado(itemId);
    setFormData({ ...formData, itemId });
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      itemId: '',
      largura: '',
      altura: '',
      profundidade: '',
      observacoes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.largura || !formData.altura) {
      setError('Largura e altura são obrigatórias');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/items/${formData.itemId}/medicao`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          largura: parseFloat(formData.largura),
          altura: parseFloat(formData.altura),
          profundidade: formData.profundidade ? parseFloat(formData.profundidade) : undefined,
          observacoes: formData.observacoes.trim() || undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`✅ Medidas registradas com sucesso para ${data.data.item.codigo}`);
        
        // Remover item da lista de pendentes
        setItensPendentes(prev => prev.filter(item => item._id !== formData.itemId));
        
        // Reset form
        resetForm();
        setShowForm(false);
        setItemSelecionado('');
        
        // Se não há mais itens pendentes, recarregar lista
        if (itensPendentes.length === 1) {
          carregarItensPendentes(projetoSelecionado);
        }
      } else {
        setError(data.message || 'Erro ao registrar medidas');
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
      console.error('Erro ao registrar medidas:', error);
    } finally {
      setLoading(false);
    }
  };

  const itemAtual = itensPendentes.find(item => item._id === itemSelecionado);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header Industrial */}
      <div className="bg-gray-800 border-b border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              <h1 className="text-xl font-bold text-white">
                📏 CENTRAL DE MEDIÇÃO
              </h1>
              <div className="hidden md:block text-sm text-gray-400">
                Sistema Operacional • {new Date().toLocaleDateString('pt-PT')}
              </div>
            </div>
            <div className="text-sm text-gray-300">
              {session?.user?.name} • Medidor Ativo
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Seleção de Projeto */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <h2 className="text-lg font-semibold text-white">
              SELECIONAR PROJETO
            </h2>
          </div>
          
          {loadingProjetos ? (
            <div className="animate-pulse">
              <div className="h-12 bg-gray-700 rounded-md"></div>
            </div>
          ) : (
            <select
              value={projetoSelecionado}
              onChange={handleProjetoChange}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="">Selecione um projeto ativo...</option>
              {projetos.map((projeto) => (
                <option key={projeto._id} value={projeto._id}>
                  {projeto.codigo} - {projeto.nomeHotel} ({projeto.cidade})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Lista de Itens Pendentes */}
        {projetoSelecionado && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <h2 className="text-lg font-semibold text-white">
                  ITENS PENDENTES DE MEDIÇÃO
                </h2>
              </div>
              <div className="text-sm text-gray-400">
                {itensPendentes.length} item(ns) aguardando
              </div>
            </div>

            {itensPendentes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-gray-400">
                  Todos os itens deste projeto já foram medidos!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {itensPendentes.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleItemSelect(item._id)}
                    className={`text-left p-4 border-2 rounded-lg transition-all ${
                      itemSelecionado === item._id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-600 hover:border-orange-400 bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-orange-400 text-sm">
                        {item.codigo}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.tipo === 'calha' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-purple-600 text-white'
                      }`}>
                        {item.tipo === 'calha' ? '🏗️ TRK' : '🪟 CRT'}
                      </span>
                    </div>
                    <div className="text-white font-medium mb-1">
                      {item.ambiente}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {item.projeto.nomeHotel}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Formulário de Medição */}
        {showForm && itemAtual && (
          <div className="bg-gray-800 border border-orange-500 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
              <h2 className="text-lg font-semibold text-white">
                REGISTRAR MEDIDAS - {itemAtual.codigo}
              </h2>
            </div>

            {/* Info do Item */}
            <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Ambiente:</span>
                  <div className="text-white font-medium">{itemAtual.ambiente}</div>
                </div>
                <div>
                  <span className="text-gray-400">Tipo:</span>
                  <div className="text-white font-medium">
                    {itemAtual.tipo === 'calha' ? '🏗️ Calha (TRK)' : '🪟 Cortina (CRT)'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Hotel:</span>
                  <div className="text-white font-medium">{itemAtual.projeto.nomeHotel}</div>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            {error && (
              <div className="bg-red-900/50 border border-red-600 text-red-400 px-4 py-3 rounded-lg mb-6">
                ❌ {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-900/50 border border-green-600 text-green-400 px-4 py-3 rounded-lg mb-6">
                {success}
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Medidas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Largura (cm) *
                  </label>
                  <input
                    type="number"
                    name="largura"
                    value={formData.largura}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0.1"
                    required
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Ex: 150.5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Altura (cm) *
                  </label>
                  <input
                    type="number"
                    name="altura"
                    value={formData.altura}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0.1"
                    required
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Ex: 200.0"
                  />
                </div>
              </div>

              {/* Profundidade (opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profundidade (cm) - Opcional
                </label>
                <input
                  type="number"
                  name="profundidade"
                  value={formData.profundidade}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  className="w-full md:w-1/2 bg-gray-700 border border-gray-600 text-white rounded-md px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: 15.0"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-4 py-3 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Detalhe qualquer particularidade da medição..."
                />
              </div>

              {/* Preview das Medidas */}
              {formData.largura && formData.altura && (
                <div className="bg-gray-700 border border-gray-600 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">📐 Preview das Medidas:</h4>
                  <div className="text-white">
                    <span className="font-mono text-lg text-orange-400">
                      {formData.largura} × {formData.altura}
                      {formData.profundidade && ` × ${formData.profundidade}`} cm
                    </span>
                  </div>
                  <div className="text-gray-400 text-sm mt-1">
                    Área: {(parseFloat(formData.largura || '0') * parseFloat(formData.altura || '0') / 10000).toFixed(2)} m²
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading || !formData.largura || !formData.altura}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-md transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Registrando...</span>
                    </div>
                  ) : (
                    '📏 Registrar Medidas'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setItemSelecionado('');
                    resetForm();
                  }}
                  className="px-6 py-3 border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500 rounded-md transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Status Geral */}
        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Status do Sistema</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{projetos.length}</div>
              <div className="text-gray-400 text-sm">Projetos Ativos</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-400">{itensPendentes.length}</div>
              <div className="text-gray-400 text-sm">Pendentes</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-400">
                {projetoSelecionado ? '✓' : '⏸'}
              </div>
              <div className="text-gray-400 text-sm">Status</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-400">
                {new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-gray-400 text-sm">Hora Atual</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}