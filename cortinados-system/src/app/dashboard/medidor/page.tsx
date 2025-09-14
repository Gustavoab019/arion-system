'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Projeto {
  _id: string;
  codigo: string;
  nomeHotel: string;
  cidade: string;
  status: string;
  totalItensPendentes: number;
}

interface Item {
  _id: string;
  codigo: string;
  tipo: 'cortina' | 'calha';
  ambiente: string;
  status: string;
  projeto: {
    id?: string;
    codigo: string;
    nomeHotel: string;
    cidade: string;
  };
  matchType?: 'codigo' | 'ambiente';
}

interface FormData {
  itemId: string;
  largura: string;
  altura: string;
  profundidade: string;
  observacoes: string;
}

interface Stats {
  medicoes: {
    hoje: number;
    estaSemana: number;
    esteMes: number;
  };
  metas: {
    diaria: number;
    semanal: number;
    mensal: number;
  };
  percentuais: {
    diario: number;
    semanal: number;
    mensal: number;
  };
  historicoRecente: any[];
}

export default function MedidorDashboard() {
  const { data: session } = useSession();
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [itensPendentes, setItensPendentes] = useState<Item[]>([]);
  const [resultadosBusca, setResultadosBusca] = useState<Item[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [projetoSelecionado, setProjetoSelecionado] = useState('');
  const [itemSelecionado, setItemSelecionado] = useState('');
  const [termoBusca, setTermoBusca] = useState('');
  const [modoBusca, setModoBusca] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    itemId: '',
    largura: '',
    altura: '',
    profundidade: '',
    observacoes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingDados, setLoadingDados] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  // Busca em tempo real
  useEffect(() => {
    if (termoBusca.length >= 2) {
      const timer = setTimeout(() => {
        realizarBusca();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setResultadosBusca([]);
      setModoBusca(false);
    }
  }, [termoBusca]);

  const carregarDadosIniciais = async () => {
    try {
      setLoadingDados(true);
      
      const [projetosRes, statsRes] = await Promise.all([
        fetch('/api/projects/com-pendentes'),
        fetch('/api/medidor/stats')
      ]);

      if (projetosRes.ok) {
        const projetosData = await projetosRes.json();
        if (projetosData.success) {
          setProjetos(projetosData.data || []);
        }
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) {
          setStats(statsData.data);
        }
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    } finally {
      setLoadingDados(false);
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

  const realizarBusca = async () => {
    try {
      const response = await fetch(`/api/items/buscar?q=${encodeURIComponent(termoBusca)}`);
      const data = await response.json();
      
      if (data.success) {
        setResultadosBusca(data.data || []);
        setModoBusca(true);
      }
    } catch (error) {
      console.error('Erro na busca:', error);
    }
  };

  const handleProjetoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valor = e.target.value;
    setProjetoSelecionado(valor);
    setItemSelecionado('');
    setShowForm(false);
    setModoBusca(false);
    setTermoBusca('');
    resetForm();
    
    if (valor) {
      carregarItensPendentes(valor);
    }
  };

  const handleItemSelect = (item: Item) => {
    setItemSelecionado(item._id);
    setFormData({ ...formData, itemId: item._id });
    setShowForm(true);
    setError('');
    setSuccess('');
    
    if (modoBusca && item.projeto.id) {
      setProjetoSelecionado(item.projeto.id);
      carregarItensPendentes(item.projeto.id);
    }
  };

  const handleBuscaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value;
    setTermoBusca(valor);
    
    if (valor.length < 2) {
      setModoBusca(false);
      setResultadosBusca([]);
    }
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
        setSuccess(`Medidas registradas com sucesso para ${data.data.item.codigo}`);
        
        setItensPendentes(prev => prev.filter(item => item._id !== formData.itemId));
        setResultadosBusca(prev => prev.filter(item => item._id !== formData.itemId));
        
        resetForm();
        setShowForm(false);
        setItemSelecionado('');
        
        carregarDadosIniciais();
        
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

  const itemAtual = [...itensPendentes, ...resultadosBusca].find(item => item._id === itemSelecionado);
  const itensParaExibir = modoBusca ? resultadosBusca : itensPendentes;

  if (loadingDados) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-slate-900 font-semibold text-xl mb-2">Carregando Projetos</h3>
          <p className="text-slate-600">Preparando sistema de medição...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Medição Inteligente</h1>
              <p className="text-slate-600 mt-1">Sistema inteligente de medição por ambiente</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Projetos
            </div>
            <div className="text-2xl font-bold text-slate-900">{projetos.length}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Pendentes
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {modoBusca ? resultadosBusca.length : itensPendentes.length}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Hoje
            </div>
            <div className="text-2xl font-bold text-green-600">{stats?.medicoes.hoje || 0}</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Progresso
            </div>
            <div className="text-2xl font-bold text-sky-600">{stats?.percentuais.diario || 0}%</div>
          </div>
        </div>

        {/* Busca Rápida */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Busca Rápida</h3>
            <div className="text-sm text-slate-600">
              Digite código ou ambiente do item
            </div>
          </div>
          
          <div className="relative">
            <input
              type="text"
              value={termoBusca}
              onChange={handleBuscaChange}
              placeholder="Ex: LIS-0001-01-TRK ou Quarto 101..."
              className="w-full px-3 py-2 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {termoBusca.length > 0 && termoBusca.length < 2 && (
            <div className="mt-2 text-slate-500 text-sm">
              Digite pelo menos 2 caracteres para buscar
            </div>
          )}
        </div>

        {/* Seleção de Projeto (se não estiver buscando) */}
        {!modoBusca && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4">Selecionar Projeto</h3>
            <select
              value={projetoSelecionado}
              onChange={handleProjetoChange}
              className="w-full px-3 py-2 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            >
              <option value="">Selecione um projeto com itens pendentes...</option>
              {projetos.map((projeto) => (
                <option key={projeto._id} value={projeto._id}>
                  {projeto.codigo} - {projeto.nomeHotel} ({projeto.cidade}) - {projeto.totalItensPendentes} pendentes
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Lista de Itens */}
        {(itensParaExibir.length > 0 || (projetoSelecionado && !modoBusca)) && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-slate-900">
                {modoBusca ? 'Resultados da Busca' : 'Itens Pendentes de Medição'}
              </h3>
              <div className="text-sm text-slate-600">
                {itensParaExibir.length} item(ns) {modoBusca ? 'encontrado(s)' : 'aguardando'}
              </div>
            </div>

            {itensParaExibir.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-slate-900 font-semibold mb-2">
                  {modoBusca ? 'Nenhum item encontrado!' : 'Todos os itens foram medidos!'}
                </h3>
                <p className="text-slate-600">
                  {modoBusca 
                    ? 'Tente um termo diferente ou selecione um projeto.'
                    : 'Este projeto está pronto para produção.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {itensParaExibir.map((item) => (
                  <button
                    key={item._id}
                    onClick={() => handleItemSelect(item)}
                    className={`w-full text-left p-4 border border-slate-200 rounded-lg transition-colors hover:bg-slate-50 ${
                      itemSelecionado === item._id
                        ? 'border-sky-300 bg-sky-50'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <span className={`font-mono font-medium ${
                            item.matchType === 'codigo' ? 'text-yellow-600 bg-yellow-100 px-2 py-1 rounded text-sm' : 'text-sky-600'
                          }`}>
                            {item.codigo}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.tipo === 'calha' 
                              ? 'bg-indigo-100 text-indigo-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {item.tipo === 'calha' ? 'TRK' : 'CRT'}
                          </span>
                        </div>
                        <div className={`text-slate-900 font-medium mb-1 ${
                          item.matchType === 'ambiente' ? 'bg-yellow-100 px-2 py-1 rounded' : ''
                        }`}>
                          {item.ambiente}
                        </div>
                        <div className="text-slate-600 text-sm">
                          {item.projeto.nomeHotel} - {item.projeto.cidade}
                        </div>
                      </div>
                      <div className="text-slate-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Formulário de Medição */}
        {showForm && itemAtual && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-2 h-2 bg-sky-500 rounded-full"></div>
              <h2 className="font-semibold text-slate-900">
                Registrar Medidas - {itemAtual.codigo}
              </h2>
            </div>

            {/* Info do Item */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <span className="text-slate-600 text-sm font-medium">Ambiente:</span>
                  <div className="text-slate-900 font-medium">{itemAtual.ambiente}</div>
                </div>
                <div>
                  <span className="text-slate-600 text-sm font-medium">Tipo:</span>
                  <div className="text-slate-900 font-medium">
                    {itemAtual.tipo === 'calha' ? 'Calha (TRK)' : 'Cortina (CRT)'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-600 text-sm font-medium">Hotel:</span>
                  <div className="text-slate-900 font-medium">{itemAtual.projeto.nomeHotel}</div>
                </div>
                <div>
                  <span className="text-slate-600 text-sm font-medium">Cidade:</span>
                  <div className="text-slate-900 font-medium">{itemAtual.projeto.cidade}</div>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
                <div className="flex items-center space-x-2">
                  <span>⚠️</span>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
                <div className="flex items-center space-x-2">
                  <span>✅</span>
                  <span className="font-medium">{success}</span>
                </div>
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Medidas Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    className="w-full px-3 py-2 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Ex: 150.5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    className="w-full px-3 py-2 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                    placeholder="Ex: 200.0"
                  />
                </div>
              </div>

              {/* Profundidade (opcional) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Profundidade (cm) - Opcional
                </label>
                <input
                  type="number"
                  name="profundidade"
                  value={formData.profundidade}
                  onChange={handleInputChange}
                  step="0.1"
                  min="0"
                  className="w-full md:w-1/2 px-3 py-2 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Ex: 15.0"
                />
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Observações
                </label>
                <textarea
                  name="observacoes"
                  value={formData.observacoes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="Detalhe qualquer particularidade da medição..."
                />
              </div>

              {/* Preview das Medidas */}
              {formData.largura && formData.altura && (
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                  <h4 className="font-medium text-sky-900 mb-2">Preview das Medidas:</h4>
                  <div className="text-sky-900">
                    <span className="font-mono text-lg font-medium text-sky-600">
                      {formData.largura} × {formData.altura}
                      {formData.profundidade && ` × ${formData.profundidade}`} cm
                    </span>
                  </div>
                  <div className="text-sky-700 font-medium mt-1">
                    Área: {(parseFloat(formData.largura || '0') * parseFloat(formData.altura || '0') / 10000).toFixed(2)} m²
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading || !formData.largura || !formData.altura}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    loading || !formData.largura || !formData.altura
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-sky-500 hover:bg-sky-600 text-white'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Salvando...</span>
                    </div>
                  ) : (
                    'Registrar Medidas'
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setItemSelecionado('');
                    resetForm();
                  }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:text-slate-900 hover:border-slate-400 rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Histórico Recente */}
        {stats?.historicoRecente && stats.historicoRecente.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4">Últimas Medições Realizadas</h3>
            <div className="space-y-3">
              {stats.historicoRecente.map((item: any, index: number) => (
                <div 
                  key={item._id || index} 
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium ${
                      item.tipo === 'calha' ? 'bg-indigo-500' : 'bg-emerald-500'
                    }`}>
                      {item.tipo === 'calha' ? 'T' : 'C'}
                    </div>
                    <div>
                      <div className="font-mono font-medium text-sky-600 text-sm">
                        {item.codigo}
                      </div>
                      <div className="text-slate-900 font-medium text-sm">
                        {item.ambiente}
                      </div>
                      <div className="text-slate-600 text-xs">
                        {item.projeto?.nomeHotel} - {item.projeto?.cidade}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-mono font-medium text-slate-900 text-sm">
                      {item.medidas?.largura}×{item.medidas?.altura}
                      {item.medidas?.profundidade && `×${item.medidas.profundidade}`} cm
                    </div>
                    <div className="text-slate-500 text-xs">
                      {item.medicao?.dataEm ? 
                        new Date(item.medicao.dataEm).toLocaleString('pt-PT', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Data não disponível'
                      }
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <button 
                onClick={() => window.open('/api/medidor/historico', '_blank')}
                className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors font-medium text-sm"
              >
                Ver Histórico Completo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}