/**
 * Caminho do arquivo: src/app/dashboard/layout.tsx
 *
 * O que faz:
 * - Protege todas as páginas sob /dashboard (se não houver sessão → redireciona p/ /auth/login?callbackUrl=/dashboard)
 * - Monta o layout base (header, nav contextual por role, content wrapper)
 * - Mantém o padrão visual já usado (bg-slate-50, container 7xl, cards, etc.)
 *
 * Observações:
 * - Não altera seu src/middleware.ts existente.
 * - Pressupõe que a role esteja em session.user.role (ajuste se necessário no seu next-auth).
 * - Se o getServerSession da sua versão exigir authOptions, basta importar e passar nas chamadas.
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth'; // se precisar: from 'next-auth/next' e passar authOptions
// import { authOptions } from '@/app/api/auth/[...nextauth]/options'; // use se sua config exigir

type UserRole = 'gestor' | 'medidor' | 'fabrica_trk' | 'fabrica_crt' | 'logistica' | 'instalador';

const ROLE_LABEL: Record<UserRole, string> = {
  gestor: 'Gestor',
  medidor: 'Medidor',
  fabrica_trk: 'Fábrica TRK',
  fabrica_crt: 'Fábrica CRT',
  logistica: 'Logística',
  instalador: 'Instalador',
};

const NAV_BY_ROLE: Record<UserRole, Array<{ label: string; href: string }>> = {
  gestor: [
    { label: 'Visão Geral', href: '/dashboard/gestor' },
    { label: 'Projetos', href: '/dashboard/projetos' },
    { label: 'Itens', href: '/dashboard/itens' },
    { label: 'Usuários', href: '/dashboard/gestor/usuarios' },
  ],
  medidor: [
    { label: 'Medição', href: '/dashboard/medidor' },
    { label: 'Projetos', href: '/dashboard/projetos' },
  ],
  fabrica_trk: [
    { label: 'Produção TRK', href: '/dashboard/fabrica-trk' },
    { label: 'Itens', href: '/dashboard/itens' },
  ],
  fabrica_crt: [
    { label: 'Produção CRT', href: '/dashboard/fabrica-crt' },
    { label: 'Itens', href: '/dashboard/itens' },
  ],
  logistica: [
    { label: 'Logística', href: '/dashboard/logistica' },
    { label: 'Scanner', href: '/dashboard/scanner' },
  ],
  instalador: [
    { label: 'Instalações', href: '/dashboard/instalador' },
    { label: 'Scanner', href: '/dashboard/scanner' },
  ],
};

function RoleBadge({ role }: { role: UserRole }) {
  const colors: Record<UserRole, string> = {
    gestor: 'bg-sky-100 text-sky-800 border-sky-200',
    medidor: 'bg-amber-100 text-amber-800 border-amber-200',
    fabrica_trk: 'bg-blue-100 text-blue-800 border-blue-200',
    fabrica_crt: 'bg-purple-100 text-purple-800 border-purple-200',
    logistica: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    instalador: 'bg-green-100 text-green-800 border-green-200',
  };
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${colors[role]}`}>
      {ROLE_LABEL[role]}
    </span>
  );
}

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  // const session = await getServerSession(authOptions);
  const session = await getServerSession();

  if (!session) {
    return redirect('/auth/login?callbackUrl=%2Fdashboard');
  }

  // Ajuste aqui caso sua tipagem de Session seja diferente
  const user = session.user as (typeof session.user & { role?: UserRole; name?: string; email?: string });
  const role: UserRole = (user?.role as UserRole) || 'gestor';

  const nav = NAV_BY_ROLE[role] ?? [];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header simples (use seu Header.tsx se preferir) */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="font-bold text-slate-900 text-lg">Cortinados</Link>
            <RoleBadge role={role} />
          </div>

          <div className="flex items-center gap-4 text-sm text-slate-600">
            {user?.name && <span className="font-medium text-slate-800">{user.name}</span>}
            {user?.email && <span className="hidden sm:inline">{user.email}</span>}
            <Link
              href="/api/auth/signout"
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50"
            >
              Sair
            </Link>
          </div>
        </div>
      </header>

      {/* Nav contextual por role */}
      <nav className="bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-2 flex gap-2 flex-wrap">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-white hover:shadow border border-transparent hover:border-slate-200"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Conteúdo */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
