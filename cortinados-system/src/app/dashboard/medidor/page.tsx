'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { StatusBadge, Button, Loading } from '@/components/ui/DesignSystem';

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

  if (loadingProjetos) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="Carregando projetos..." />
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
                <div className="w-12 h-12 bg-blue-700 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                  📐
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Centro de Medição
                  </h1>
                  <p className="text-gray-600 text-base lg:text-lg">
                    Gestão de Medidas e Levantamentos
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
        <div className="bg-blue-50 border-4 border-blue-300 rounded-2xl p-8 lg:p-10 shadow-lg">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-blue-700 rounded-2xl flex items-center justify-center text-white text-3xl lg:text-4xl shadow-lg">
                📐
              </div>
              <div>
                <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Central de Medição
                </h2>
                <p className="text-gray-700 mb-4 text-lg lg:text-xl">
                  Sistema de Registro de Medidas
                </p>
                <p className="text-gray-600 mb-6 text-base lg:text-lg">
                  Registre medidas precisas para produção
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

        {/* Seleção de Projeto */}
        <div className="bg-white rounded-xl border-4 border-gray-200 p-6 lg:p-8 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Selecionar Projeto</h3>
          <select
            value={projetoSelecionado}
            onChange={handleProjetoChange}
            className="w-full bg-white border-2 border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
          >
            <option value="">Selecione um projeto ativo...</option>
            {projetos.map((projeto) => (
              <option key={projeto._id} value={projeto._id}>
                {projeto.codigo} - {projeto.nomeHotel} ({projeto.cidade})
              </option>
            ))}
          </select>
        </div>

        {/* Lista de Itens Pendentes */}
        {projetoSelecionado && (
          <div className="bg-white rounded-xl border-4 border-gray-200 p-6 lg:p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                Itens Pendentes de Medição
              </h3>
              <div className="text-lg font-semibold text-gray-600">
                {itensPendentes.length} item(ns) aguardando
              </div>
            </div>

            {itensPendentes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Todos os itens foram medidos!
                </h3>
                <p className="text-gray-600 text-lg">
                  Este projeto está pronto para produção.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {itensPendentes.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleItemSelect(item._id)}
                    className={`text-left p-6 border-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg ${
                      itemSelecionado === item._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-400 bg-white hover:shadow-xl'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-blue-600 text-lg font-bold">
                        {item.codigo}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        item.tipo === 'calha' 
                          ? 'bg-indigo-100 text-indigo-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.tipo === 'calha' ? '🏗️ TRK' : '🪟 CRT'}
                      </span>
                    </div>
                    <div className="text-gray-900 font-bold text-lg mb-2">
                      {item.ambiente}
                    </div>
                    <div className="text-gray-600">
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
          <div className="bg-white rounded-xl border-4 border-blue-300 p-6 lg:p-8 shadow-lg">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <h2 className="text-xl font-bold text-gray-900">
                Registrar Medidas - {itemAtual.codigo}
              </h2>
            </div>

            {/* Info do Item */}
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600 font-medium">Ambiente:</span>
                  <div className="text-gray-900 font-bold text-lg">{itemAtual.ambiente}</div>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Tipo:</span>
                  <div className="text-gray-900 font-bold text-lg">
                    {itemAtual.tipo === 'calha' ? '🏗️ Calha (TRK)' : '🪟 Cortina (CRT)'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 font-medium">Hotel:</span>
                  <div className="text-gray-900 font-bold text-lg">{itemAtual.projeto.nomeHotel}</div>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            {error && (
              <div className="bg-red-50 border-4 border-red-200 text-red-800 px-6 py-4 rounded-xl mb-6 shadow-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">❌</span>
                  <span className="font-bold text-lg">{error}</span>
                </div>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border-4 border-green-200 text-green-800 px-6 py-4 rounded-xl mb-6 shadow-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">✅</span>
                  <span className="font-bold text-lg">{success}</span>
                </div>
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Medidas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-3">
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
                    className="w-full bg-white border-2 border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    placeholder="Ex: 150.5"
                  />
                </div>
                
                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-3">
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
                    className="w-full bg-white border-2 border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                    placeholder="Ex: 200.0"
                  />
                </div>
              </div>

              {/* Profundidade (opcional) */}
              <div>
                <label className="block text-lg font-bold text-gray-900 mb-3">
                  Profundidade (cm) - Opcional
                </label>
                <input
                  type="number"
                  name="profundidade"
                  value={formData.profundidade}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  className="w-full md:w-1/2 bg-white border-2 border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  placeholder="Ex: 15.0"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-lg font-bold text-gray-900 mb-3">
                  Observações
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-white border-2 border-gray-300 text-gray-900 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  placeholder="Detalhe qualquer particularidade da medição..."
                />
              </div>

              {/* Preview das Medidas */}
              {formData.largura && formData.altura && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  <h4 className="text-lg font-bold text-blue-900 mb-3">📐 Preview das Medidas:</h4>
                  <div className="text-blue-900">
                    <span className="font-mono text-2xl font-bold text-blue-600">
                      {formData.largura} × {formData.altura}
                      {formData.profundidade && ` × ${formData.profundidade}`} cm
                    </span>
                  </div>
                  <div className="text-blue-700 text-lg font-semibold mt-2">
                    Área: {(parseFloat(formData.largura || '0') * parseFloat(formData.altura || '0') / 10000).toFixed(2)} m²
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  type="submit"
                  disabled={loading || !formData.largura || !formData.altura}
                  loading={loading}
                  variant="primary"
                  fullWidth
                >
                  📐 Registrar Medidas
                </Button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setItemSelecionado('');
                    resetForm();
                  }}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 hover:text-gray-900 hover:border-gray-400 rounded-xl transition-colors font-bold text-lg"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Estatísticas - Seguindo padrão do dashboard principal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border-4 border-blue-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Projetos Ativos</span>
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {projetos.length}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Para medir</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-yellow-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Pendentes</span>
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {itensPendentes.length}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Aguardando</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-green-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Status</span>
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {projetoSelecionado ? '✓' : '⏸'}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Sistema</div>
          </div>
          
          <div className="bg-white rounded-xl border-4 border-blue-200 p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700 text-base lg:text-lg font-bold">Hora Atual</span>
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-sm lg:text-base text-gray-600">Operacional</div>
          </div>
        </div>

        {/* Status do Sistema - Seguindo padrão */}
        <footer className="bg-white rounded-xl border-4 border-gray-200 p-6 lg:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-900 font-bold text-lg">Central de Medição Operacional</span>
              </div>
              <div className="hidden sm:block text-gray-400">•</div>
              <span className="text-gray-600 text-lg font-semibold">
                Sistema de Registro Ativo
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