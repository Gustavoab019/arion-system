// Arquivo: /src/app/dashboard/scanner/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button, Input, Loading, StatusBadge } from '@/components/ui/DesignSystem';

interface ScannedItem {
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
  };
  medicao?: {
    medidoPor: {
      nome: string;
      role: string;
    };
    dataEm: Date;
  };
  qrCodeUrl: string;
}

export default function ScannerPage() {
  const { data: session } = useSession();
  const [manualCode, setManualCode] = useState('');
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanHistory, setScanHistory] = useState<ScannedItem[]>([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [updating, setUpdating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Carregar histórico ao montar componente
  useEffect(() => {
    const savedHistory = JSON.parse(localStorage.getItem('scanner-history') || '[]');
    setScanHistory(savedHistory);
  }, []);

  // Salvar histórico no localStorage
  const saveToHistory = (item: ScannedItem) => {
    const newHistory = [item, ...scanHistory.filter(h => h._id !== item._id)].slice(0, 10);
    setScanHistory(newHistory);
    localStorage.setItem('scanner-history', JSON.stringify(newHistory));
  };

  const buscarItem = async (codigo: string) => {
    if (!codigo.trim()) {
      setError('Digite ou escaneie um código');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/items?codigo=${encodeURIComponent(codigo.trim())}`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const item = data.data[0];
        setScannedItem(item);
        saveToHistory(item);
        setManualCode('');
        
        // Feedback sonoro de sucesso (se suportado)
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmYgBDGH0fPTgjMGHm7A7+OZVA0PVqzn77BeGAg8ltryxnkpBSl+zPLaizsIGGS57+OdTgwOUarm7LNlIAU2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIRZzd8sFoJAM2jdv0yoExBh1rxOnDZSgELIHM9NiTOQkYY7rs4Z5NEQxPpOLyvmYgBDqD0fPagjMGHm7A7eSaTQ0PVqzl7bVgGgk8ltrzxnkpBSl+zPDaizsIGGS56+OdTgwOUarm7rNlIAU2jdXzzn0vBSJ0xe/glEILElyx5+2sWRUIRZzd7sFoJAU3mNvx1IExB');
          audio.volume = 0.3;
          audio.play().catch(() => {}); // Ignorar se não conseguir tocar
        } catch (e) {}
      } else {
        setError(`Item "${codigo}" não encontrado no sistema`);
        setScannedItem(null);
      }
    } catch (error) {
      console.error('Erro ao buscar item:', error);
      setError('Erro de conexão. Tente novamente.');
      setScannedItem(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    buscarItem(manualCode);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setError('');
      }
    } catch (error) {
      console.error('Erro ao acessar câmara:', error);
      setError('Não foi possível acessar a câmara. Use o input manual.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Simular leitura de QR (em produção usar biblioteca como 'qr-scanner' ou 'jsqr')
  const simulateQRScan = () => {
    // Códigos de exemplo do sistema
    const exemplosCodigos = [
      'LIS-0315-01-TRK',
      'POR-0312-02-CRT',
      'FAR-0318-03-TRK',
      'LIS-0316-04-CRT',
      'BRA-0320-05-TRK'
    ];
    
    const codigoAleatorio = exemplosCodigos[Math.floor(Math.random() * exemplosCodigos.length)];
    buscarItem(codigoAleatorio);
  };

  const atualizarStatus = async (novoStatus: string) => {
    if (!scannedItem || !session) return;

    try {
      setUpdating(true);
      
      const response = await fetch(`/api/items/${scannedItem._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: novoStatus,
          observacoes: `Atualizado via Scanner por ${session.user?.name}`
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Atualizar item local
        setScannedItem(prev => prev ? { ...prev, status: novoStatus } : null);
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

  const getProximaAcao = () => {
    if (!scannedItem || !session) return null;
    
    const userRole = (session.user as any).role;
    const statusAtual = scannedItem.status;
    
    // Lógica simplificada de ações baseada no role
    if (userRole === 'gestor') {
      switch (statusAtual) {
        case 'pendente': return { status: 'medido', texto: '📐 Marcar como Medido' };
        case 'medido': return { status: 'producao', texto: '🏭 Enviar para Produção' };
        case 'producao': return { status: 'produzido', texto: '✅ Marcar como Produzido' };
        case 'produzido': return { status: 'logistica', texto: '📦 Enviar para Logística' };
        case 'logistica': return { status: 'instalado', texto: '🔧 Marcar como Instalado' };
        default: return null;
      }
    }
    
    switch (userRole) {
      case 'medidor':
        return statusAtual === 'pendente' ? { status: 'medido', texto: '📐 Registrar Medição' } : null;
      case 'fabrica_trk':
        if (scannedItem.tipo !== 'calha') return null;
        return statusAtual === 'medido' ? { status: 'producao', texto: '🏭 Iniciar Produção TRK' } : 
               statusAtual === 'producao' ? { status: 'produzido', texto: '✅ Finalizar Produção' } : null;
      case 'fabrica_crt':
        if (scannedItem.tipo !== 'cortina') return null;
        return statusAtual === 'medido' ? { status: 'producao', texto: '🏭 Iniciar Produção CRT' } : 
               statusAtual === 'producao' ? { status: 'produzido', texto: '✅ Finalizar Produção' } : null;
      case 'logistica':
        return statusAtual === 'produzido' ? { status: 'logistica', texto: '📦 Processar na Logística' } : null;
      case 'instalador':
        return statusAtual === 'logistica' ? { status: 'instalado', texto: '🔧 Confirmar Instalação' } : null;
      default:
        return null;
    }
  };

  const proximaAcao = getProximaAcao();

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading size="lg" text="Carregando..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header seguindo padrão EXATO do sistema */}
      <header className="bg-white border-b-4 border-gray-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between py-4 gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-emerald-700 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg">
                  📱
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    Scanner QR Code
                  </h1>
                  <p className="text-gray-600 text-base lg:text-lg">
                    Leitura Rápida de Códigos
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
              <div className="text-center sm:text-right">
                <div className="text-gray-900 font-bold text-lg">{session.user?.name}</div>
                <div className="text-gray-600 text-base">
                  {(session.user as any)?.empresa || 'Cortinados Portugal'}
                </div>
              </div>
              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center border-2 border-gray-400">
                <span className="text-gray-700 text-lg font-bold">
                  {session.user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8">
        
        {/* Painel Principal - Seguindo padrão EXATO */}
        <div className="bg-emerald-50 border-4 border-emerald-300 rounded-2xl p-8 lg:p-10 shadow-lg">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
              <div className="w-20 h-20 lg:w-24 lg:h-24 bg-emerald-700 rounded-2xl flex items-center justify-center text-white text-3xl lg:text-4xl shadow-lg">
                📱
              </div>
              <div>
                <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-2">
                  Central de Scanner
                </h2>
                <p className="text-gray-700 mb-4 text-lg lg:text-xl">
                  Sistema de Leitura QR Code
                </p>
                <p className="text-gray-600 mb-6 text-base lg:text-lg">
                  Escaneie ou digite códigos para rastreamento
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

        {/* Scanner Principal */}
        <div className="bg-white rounded-xl border-4 border-gray-200 p-6 lg:p-8 shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6">📱 Escanear Item</h3>
          
          {/* Câmara */}
          <div className="mb-6">
            <div className="aspect-video bg-gray-900 rounded-xl relative overflow-hidden shadow-lg">
              {cameraActive ? (
                <>
                  <video 
                    ref={videoRef}
                    autoPlay 
                    playsInline 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 border-4 border-emerald-400 border-dashed rounded-lg flex items-center justify-center animate-pulse">
                      <div className="text-center text-white">
                        <div className="text-4xl mb-2">📱</div>
                        <p className="text-sm font-medium">Posicione o QR Code aqui</p>
                      </div>
                    </div>
                  </div>
                  <canvas ref={canvasRef} className="hidden" />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📱</div>
                    <h4 className="text-xl font-bold mb-2">Scanner QR Code</h4>
                    <p className="text-gray-300 mb-6">
                      Active a câmara para escanear códigos QR automaticamente
                    </p>
                    <div className="space-x-4">
                      <Button
                        onClick={startCamera}
                        variant="primary"
                      >
                        📷 Ativar Câmara
                      </Button>
                      <Button
                        onClick={simulateQRScan}
                        variant="secondary"
                      >
                        🎯 Demo (Teste)
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {cameraActive && (
              <div className="mt-4 flex justify-center space-x-4">
                <Button
                  onClick={simulateQRScan}
                  variant="primary"
                >
                  📱 Simular Leitura QR
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="secondary"
                >
                  ❌ Parar Câmara
                </Button>
              </div>
            )}
          </div>

          {/* Input Manual */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-bold text-gray-900 mb-4">💻 Inserção Manual</h4>
            <form onSubmit={handleManualSubmit} className="flex gap-4">
              <div className="flex-1">
                <Input
                  label=""
                  value={manualCode}
                  onChange={setManualCode}
                  placeholder="Digite o código do item (ex: LIS-0315-01-TRK)"
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
                  loading={loading}
                  disabled={loading || !manualCode.trim()}
                >
                  🔍 Buscar
                </Button>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-50 border-4 border-red-200 text-red-800 px-6 py-4 rounded-xl shadow-lg">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">❌</span>
                <span className="font-bold text-lg">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl border-4 border-gray-200 p-8 shadow-lg">
            <div className="text-center">
              <Loading size="lg" text="Buscando item..." />
            </div>
          </div>
        )}

        {/* Item Escaneado */}
        {scannedItem && !loading && (
          <div className="bg-white rounded-xl border-4 border-green-200 p-6 lg:p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">✅ Item Encontrado</h3>
              <StatusBadge status={getStatusColor(scannedItem.status)}>
                {scannedItem.status.toUpperCase()}
              </StatusBadge>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Informações do Item */}
              <div className="space-y-4">
                <div>
                  <span className="text-gray-600 font-medium">Código:</span>
                  <div className="text-gray-900 font-bold text-lg font-mono">{scannedItem.codigo}</div>
                </div>
                
                <div>
                  <span className="text-gray-600 font-medium">Tipo:</span>
                  <div className="text-gray-900 font-bold">
                    {scannedItem.tipo === 'calha' ? '🏗️ Calha Técnica (TRK)' : '🪟 Cortina (CRT)'}
                  </div>
                </div>
                
                <div>
                  <span className="text-gray-600 font-medium">Ambiente:</span>
                  <div className="text-gray-900 font-bold">{scannedItem.ambiente}</div>
                </div>
                
                {scannedItem.medidas && (
                  <div>
                    <span className="text-gray-600 font-medium">Medidas:</span>
                    <div className="text-gray-900 font-bold">
                      {scannedItem.medidas.largura} × {scannedItem.medidas.altura}
                      {scannedItem.medidas.profundidade && ` × ${scannedItem.medidas.profundidade}`} cm
                    </div>
                  </div>
                )}
              </div>

              {/* Informações do Projeto */}
              <div className="space-y-4">
                <div>
                  <span className="text-gray-600 font-medium">Projeto:</span>
                  <div className="text-gray-900 font-bold text-lg">{scannedItem.projeto.codigo}</div>
                </div>
                
                <div>
                  <span className="text-gray-600 font-medium">Hotel:</span>
                  <div className="text-gray-900 font-bold">{scannedItem.projeto.nomeHotel}</div>
                </div>
                
                <div>
                  <span className="text-gray-600 font-medium">Cidade:</span>
                  <div className="text-gray-900">{scannedItem.projeto.cidade}</div>
                </div>
                
                {scannedItem.medicao && (
                  <div>
                    <span className="text-gray-600 font-medium">Medido por:</span>
                    <div className="text-gray-900">
                      {scannedItem.medicao.medidoPor.nome} em{' '}
                      {new Date(scannedItem.medicao.dataEm).toLocaleDateString('pt-PT')}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                {proximaAcao && (
                  <Button
                    onClick={() => atualizarStatus(proximaAcao.status)}
                    disabled={updating}
                    loading={updating}
                    variant="success"
                  >
                    {proximaAcao.texto}
                  </Button>
                )}
                
                <Link href={`/qr/item/${scannedItem.codigo}`} target="_blank">
                  <Button variant="secondary">
                    🔍 Ver Rastreamento Completo
                  </Button>
                </Link>
                
                <Button
                  onClick={() => {
                    setScannedItem(null);
                    setError('');
                  }}
                  variant="secondary"
                >
                  🔄 Escanear Outro Item
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Histórico */}
        {scanHistory.length > 0 && (
          <div className="bg-white rounded-xl border-4 border-gray-200 p-6 lg:p-8 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">📋 Histórico Recente</h3>
              <button
                onClick={() => {
                  setScanHistory([]);
                  localStorage.removeItem('scanner-history');
                }}
                className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
              >
                🗑️ Limpar Histórico
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scanHistory.slice(0, 6).map((item) => (
                <button
                  key={item._id}
                  onClick={() => buscarItem(item.codigo)}
                  className="text-left p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <div className="font-mono font-bold text-emerald-600 mb-2">
                    {item.codigo}
                  </div>
                  <div className="text-gray-900 font-medium mb-1">
                    {item.projeto.nomeHotel}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {item.ambiente} • {item.tipo}
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={getStatusColor(item.status)} size="sm">
                      {item.status}
                    </StatusBadge>
                    <div className="text-xs text-gray-500">
                      {item.projeto.cidade}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Dicas de Uso */}
        <div className="bg-blue-50 border-4 border-blue-200 rounded-xl p-6 lg:p-8 shadow-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-blue-900 font-semibold mb-2">💡 Como usar o Scanner</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• <strong>Câmara:</strong> Posicione o QR Code dentro do quadrado tracejado</li>
                <li>• <strong>Manual:</strong> Digite o código completo do item (ex: LIS-0315-01-TRK)</li>
                <li>• <strong>Demo:</strong> Use "Demo (Teste)" para simular a leitura de um QR</li>
                <li>• <strong>Histórico:</strong> Clique em itens recentes para recarregá-los rapidamente</li>
                <li>• <strong>Ações:</strong> As ações disponíveis dependem do seu role no sistema</li>
                <li>• <strong>Rastreamento:</strong> Use "Ver Rastreamento" para informações completas</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer do Sistema - Seguindo padrão EXATO */}
        <footer className="bg-white rounded-xl border-4 border-gray-200 p-6 lg:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-900 font-bold text-lg">Scanner QR Operacional</span>
              </div>
              <div className="hidden sm:block text-gray-400">•</div>
              <span className="text-gray-600 text-lg font-semibold">
                Sistema de Leitura Ativo
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