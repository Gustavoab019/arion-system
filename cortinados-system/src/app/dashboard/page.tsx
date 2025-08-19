// Arquivo: /src/app/dashboard/page.tsx - DESIGN SYSTEM INDUSTRIAL
'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { UserRole } from '@/types';

// =============================================================================
// DESIGN SYSTEM - SISTEMA INDUSTRIAL DE CORTINADOS
// =============================================================================

// Cores do sistema (seguindo especificação)
const COLORS = {
  primary: {
    600: '#1e40af', // Azul corporativo principal
    500: '#3b82f6', // Azul corporativo secundário
  },
  gray: {
    500: '#64748b', // Cinza técnico
    400: '#94a3b8', // Cinza claro
    300: '#cbd5e1',
    200: '#e2e8f0',
    100: '#f1f5f9',
    50: '#f8fafc',  // Background cinza
  },
  status: {
    success: '#10b981', // Verde - concluído
    warning: '#f59e0b', // Amarelo - em andamento
    error: '#ef4444',   // Vermelho - problemas
    pending: '#6b7280', // Cinza - pendente
  },
  white: '#ffffff',
} as const;

// Componente: Card de Métrica Industrial
interface MetricCardProps {
  title: string;
  value: string | number;
  status: 'success' | 'warning' | 'error' | 'pending' | 'primary';
  subtitle?: string;
}

function MetricCard({ title, value, status, subtitle }: MetricCardProps) {
  const statusColors = {
    success: COLORS.status.success,
    warning: COLORS.status.warning,
    error: COLORS.status.error,
    pending: COLORS.status.pending,
    primary: COLORS.primary[600],
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
          {title}
        </h3>
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: statusColors[status] }}
        />
      </div>
      <div className="mb-2">
        <span className="text-3xl font-bold text-gray-900">
          {value}
        </span>
      </div>
      {subtitle && (
        <p className="text-sm text-gray-500">
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Componente: Botão de Ação Industrial
interface ActionButtonProps {
  title: string;
  description: string;
  onClick: () => void;
  variant: 'primary' | 'secondary' | 'success';
  disabled?: boolean;
  badge?: string | number;
}

function ActionButton({ title, description, onClick, variant, disabled, badge }: ActionButtonProps) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600',
    success: 'bg-green-600 hover:bg-green-700 text-white border-green-600',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
        w-full p-6 border-2 rounded-lg transition-all duration-200 text-left relative
      `}
    >
      {badge && (
        <div className="absolute top-4 right-4 bg-white/20 text-xs font-bold px-2 py-1 rounded">
          {badge}
        </div>
      )}
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
    </button>
  );
}

// Componente: Status Badge
interface StatusBadgeProps {
  label: string;
  count: number;
  status: 'success' | 'warning' | 'error' | 'pending';
}

function StatusBadge({ label, count, status }: StatusBadgeProps) {
  const statusConfig = {
    success: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
    warning: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
    error: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
    pending: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
  };

  const config = statusConfig[status];

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg px-4 py-3 flex items-center justify-between min-w-[140px]`}>
      <span className={`${config.text} text-sm font-medium`}>
        {label}
      </span>
      <span className={`${config.text} text-xl font-bold`}>
        {count}
      </span>
    </div>
  );
}

// Componente: Seção com Header
interface SectionProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

function Section({ title, children, action }: SectionProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

// Componente Principal: Dashboard
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    projetos: { total: 0, ativos: 0, concluidos: 0 },
    itens: { total: 0, pendente: 0, medido: 0, producao: 0, produzido: 0, logistica: 0, instalado: 0, cancelado: 0 }
  });

  // Buscar dados do sistema
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [projectsRes, itemsRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/items')
        ]);

        const projectsData = await projectsRes.json();
        const itemsData = await itemsRes.json();

        if (projectsData.success && itemsData.success) {
          const projetos = projectsData.data || [];
          const projetoStats = {
            total: projetos.length,
            ativos: projetos.filter((p: any) => !['concluido', 'cancelado'].includes(p.status)).length,
            concluidos: projetos.filter((p: any) => p.status === 'concluido').length
          };

          const itens = itemsData.data || [];
          const itemStats = {
            total: itens.length,
            pendente: itens.filter((i: any) => i.status === 'pendente').length,
            medido: itens.filter((i: any) => i.status === 'medido').length,
            producao: itens.filter((i: any) => i.status === 'producao').length,
            produzido: itens.filter((i: any) => i.status === 'produzido').length,
            logistica: itens.filter((i: any) => i.status === 'logistica').length,
            instalado: itens.filter((i: any) => i.status === 'instalado').length,
            cancelado: itens.filter((i: any) => i.status === 'cancelado').length
          };

          setStats({ projetos: projetoStats, itens: itemStats });
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchStats();
    }
  }, [session]);

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user as any;
  const userRole = user.role as UserRole;

  // Configurações por tipo de usuário
  const getRoleConfig = (role: UserRole) => {
    const configs = {
      medidor: {
        title: 'Estação de Medição',
        subtitle: 'Registro de dimensões e especificações',
        metrics: [
          { title: 'Pendentes', value: stats.itens.pendente, status: 'warning' as const, subtitle: 'Aguardando medição' },
          { title: 'Medidos', value: stats.itens.medido, status: 'success' as const, subtitle: 'Concluídos hoje' },
          { title: 'Total', value: stats.itens.total, status: 'primary' as const, subtitle: 'Itens no sistema' }
        ],
        actions: [
          {
            title: 'Iniciar Medição',
            description: 'Registrar dimensões de novos itens',
            variant: 'primary' as const,
            badge: stats.itens.pendente > 0 ? stats.itens.pendente : undefined
          },
          {
            title: 'Consultar Histórico',
            description: 'Ver medições anteriores',
            variant: 'secondary' as const
          }
        ]
      },
      fabrica_trk: {
        title: 'Linha TRK - Calhas',
        subtitle: 'Produção de trilhos e calhas',
        metrics: [
          { title: 'Fila', value: stats.itens.medido, status: 'warning' as const, subtitle: 'Para produzir' },
          { title: 'Produção', value: stats.itens.producao, status: 'warning' as const, subtitle: 'Em andamento' },
          { title: 'Finalizados', value: stats.itens.produzido, status: 'success' as const, subtitle: 'Hoje' }
        ],
        actions: [
          {
            title: 'Iniciar Produção',
            description: 'Marcar itens em produção',
            variant: 'primary' as const,
            badge: stats.itens.medido > 0 ? stats.itens.medido : undefined
          },
          {
            title: 'Finalizar Lote',
            description: 'Confirmar itens produzidos',
            variant: 'success' as const,
            badge: stats.itens.producao > 0 ? stats.itens.producao : undefined
          }
        ]
      },
      fabrica_crt: {
        title: 'Linha CRT - Cortinas',
        subtitle: 'Produção de cortinas e tecidos',
        metrics: [
          { title: 'Fila', value: stats.itens.medido, status: 'warning' as const, subtitle: 'Para produzir' },
          { title: 'Produção', value: stats.itens.producao, status: 'warning' as const, subtitle: 'Em andamento' },
          { title: 'Finalizados', value: stats.itens.produzido, status: 'success' as const, subtitle: 'Hoje' }
        ],
        actions: [
          {
            title: 'Iniciar Produção',
            description: 'Marcar itens em produção',
            variant: 'primary' as const,
            badge: stats.itens.medido > 0 ? stats.itens.medido : undefined
          },
          {
            title: 'Finalizar Lote',
            description: 'Confirmar itens produzidos',
            variant: 'success' as const,
            badge: stats.itens.producao > 0 ? stats.itens.producao : undefined
          }
        ]
      },
      logistica: {
        title: 'Centro de Distribuição',
        subtitle: 'Montagem de kits e expedição',
        metrics: [
          { title: 'Para Kits', value: stats.itens.produzido, status: 'warning' as const, subtitle: 'Aguardando' },
          { title: 'Prontos', value: stats.itens.logistica, status: 'success' as const, subtitle: 'Para entrega' },
          { title: 'Expedidos', value: stats.itens.instalado, status: 'success' as const, subtitle: 'Entregues' }
        ],
        actions: [
          {
            title: 'Montar Kits',
            description: 'Organizar itens para entrega',
            variant: 'primary' as const,
            badge: stats.itens.produzido > 0 ? stats.itens.produzido : undefined
          },
          {
            title: 'Agendar Entrega',
            description: 'Programar instalação',
            variant: 'secondary' as const
          }
        ]
      },
      instalador: {
        title: 'Central de Instalação',
        subtitle: 'Instalação e finalização',
        metrics: [
          { title: 'Agendados', value: stats.itens.logistica, status: 'warning' as const, subtitle: 'Para instalar' },
          { title: 'Instalados', value: stats.itens.instalado, status: 'success' as const, subtitle: 'Concluídos' },
          { title: 'Eficiência', value: `${stats.itens.total ? Math.round((stats.itens.instalado / stats.itens.total) * 100) : 0}%`, status: 'primary' as const, subtitle: 'Taxa sucesso' }
        ],
        actions: [
          {
            title: 'Scanner QR',
            description: 'Confirmar instalação',
            variant: 'primary' as const,
            badge: stats.itens.logistica > 0 ? stats.itens.logistica : undefined
          },
          {
            title: 'Relatório Campo',
            description: 'Registrar observações',
            variant: 'secondary' as const
          }
        ]
      },
      gestor: {
        title: 'Centro de Controle',
        subtitle: 'Supervisão e análise operacional',
        metrics: [
          { title: 'Projetos Ativos', value: stats.projetos.ativos, status: 'primary' as const, subtitle: 'Em andamento' },
          { title: 'Eficiência', value: `${stats.itens.total ? Math.round((stats.itens.instalado / stats.itens.total) * 100) : 0}%`, status: 'success' as const, subtitle: 'Taxa conclusão' },
          { title: 'Em Fluxo', value: stats.itens.total - stats.itens.instalado - stats.itens.cancelado, status: 'warning' as const, subtitle: 'Processando' }
        ],
        actions: [
          {
            title: 'Relatórios',
            description: 'Análise e KPIs executivos',
            variant: 'primary' as const
          },
          {
            title: 'Gestão Usuários',
            description: 'Administrar equipe',
            variant: 'secondary' as const
          },
          {
            title: 'Projetos',
            description: 'Supervisionar operações',
            variant: 'success' as const,
            badge: stats.projetos.ativos > 0 ? stats.projetos.ativos : undefined
          }
        ]
      }
    };

    return configs[role];
  };

  const config = getRoleConfig(userRole);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da Página */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {config.title}
              </h1>
              <p className="text-gray-600">
                {config.subtitle}
              </p>
            </div>
            <div className="text-right bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Operador
              </p>
              <p className="text-lg font-bold text-gray-900">
                {user.name}
              </p>
              {user.empresa && (
                <p className="text-sm text-gray-600">
                  {user.empresa}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Métricas Principais */}
        <Section title="Indicadores Operacionais">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {config.metrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>
        </Section>

        {/* Ações Principais */}
        <Section title="Ações Disponíveis">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {config.actions.map((action, index) => (
              <ActionButton
                key={index}
                {...action}
                onClick={() => {}}
                disabled={true}
              />
            ))}
          </div>
          
          {/* Aviso de Desenvolvimento */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-yellow-100 p-2 rounded">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-yellow-800 font-medium">
                  Funcionalidades em Desenvolvimento
                </h3>
                <p className="text-yellow-700 text-sm mt-1">
                  As interfaces operacionais estão sendo implementadas. 
                  Sistema entrará em produção nas próximas iterações.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* Status Global - Apenas Gestor */}
        {userRole === 'gestor' && (
          <Section title="Status Global do Sistema">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
                <StatusBadge label="Pendente" count={stats.itens.pendente} status="pending" />
                <StatusBadge label="Medido" count={stats.itens.medido} status="success" />
                <StatusBadge label="Produção" count={stats.itens.producao} status="warning" />
                <StatusBadge label="Produzido" count={stats.itens.produzido} status="success" />
                <StatusBadge label="Logística" count={stats.itens.logistica} status="warning" />
                <StatusBadge label="Instalado" count={stats.itens.instalado} status="success" />
                <StatusBadge label="Cancelado" count={stats.itens.cancelado} status="error" />
              </div>
              
              {/* Barra de Progresso */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Progresso Global
                  </span>
                  <span className="text-sm font-bold text-gray-900">
                    {stats.itens.total ? Math.round((stats.itens.instalado / stats.itens.total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${stats.itens.total ? (stats.itens.instalado / stats.itens.total) * 100 : 0}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.itens.instalado} de {stats.itens.total} itens finalizados
                </p>
              </div>
            </div>
          </Section>
        )}

        {/* Resumo Operacional */}
        <Section title="Resumo da Operação">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="space-y-4">
              {userRole === 'medidor' && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Prioridades de Medição</h4>
                  <p className="text-gray-700">
                    <strong>{stats.itens.pendente}</strong> itens aguardam medição. 
                    Processe os mais antigos primeiro para manter o fluxo de produção.
                    Precisão é fundamental para evitar retrabalho.
                  </p>
                </div>
              )}

              {(userRole === 'fabrica_trk' || userRole === 'fabrica_crt') && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Status da Produção</h4>
                  <p className="text-gray-700">
                    <strong>{stats.itens.medido}</strong> itens com medidas aprovadas na fila. 
                    <strong>{stats.itens.producao}</strong> em produção ativa.
                    Mantenha ritmo constante para não criar gargalos.
                  </p>
                </div>
              )}

              {userRole === 'logistica' && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Centro de Distribuição</h4>
                  <p className="text-gray-700">
                    <strong>{stats.itens.produzido}</strong> itens prontos para montagem de kits.
                    Organize por projeto para otimizar entregas e reduzir custos.
                  </p>
                </div>
              )}

              {userRole === 'instalador' && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Agenda de Instalação</h4>
                  <p className="text-gray-700">
                    <strong>{stats.itens.logistica}</strong> kits prontos para instalação.
                    Use scanner QR para confirmar cada instalação e manter rastreabilidade.
                  </p>
                </div>
              )}

              {userRole === 'gestor' && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Análise Executiva</h4>
                  <p className="text-gray-700">
                    Sistema operando com <strong>{stats.itens.total ? Math.round((stats.itens.instalado / stats.itens.total) * 100) : 0}%</strong> de eficiência.
                    {stats.itens.pendente > 10 && ' Gargalo identificado na medição.'}
                    {stats.itens.producao > 20 && ' Sobrecarga na produção.'}
                    {stats.itens.pendente <= 10 && stats.itens.producao <= 20 && ' Operações normalizadas.'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}