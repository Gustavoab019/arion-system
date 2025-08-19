// Arquivo: /src/components/layout/Header.tsx
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { UserRole } from '@/types';

const ROLE_LABELS: Record<UserRole, string> = {
  medidor: '📏 Medidor',
  fabrica_trk: '🏭 Fábrica TRK',
  fabrica_crt: '🏭 Fábrica CRT',
  logistica: '📦 Logística',
  instalador: '🔧 Instalador',
  gestor: '👑 Gestor'
};

export function Header() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="animate-pulse h-8 bg-gray-200 rounded w-48"></div>
            <div className="animate-pulse h-8 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </header>
    );
  }

  if (!session) {
    return null; // Não mostra header se não estiver logado
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/login' });
  };

  const user = session.user as any; // Type casting para acessar propriedades customizadas

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo e navegação principal */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                🏨 Sistema de Cortinados
              </h1>
            </Link>
            
            {/* Navegação baseada no role */}
            <nav className="hidden md:ml-6 md:flex md:space-x-8">
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              
              {/* Links específicos por role */}
              {user.role === 'medidor' && (
                <Link
                  href="/medicao"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Medições
                </Link>
              )}
              
              {user.role === 'fabrica_trk' && (
                <Link
                  href="/producao/calhas"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Produção Calhas
                </Link>
              )}
              
              {user.role === 'fabrica_crt' && (
                <Link
                  href="/producao/cortinas"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Produção Cortinas
                </Link>
              )}
              
              {user.role === 'logistica' && (
                <Link
                  href="/logistica"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logística
                </Link>
              )}
              
              {user.role === 'instalador' && (
                <Link
                  href="/instalacao"
                  className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Instalações
                </Link>
              )}
              
              {user.role === 'gestor' && (
                <>
                  <Link
                    href="/relatorios"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Relatórios
                  </Link>
                  <Link
                    href="/usuarios"
                    className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Usuários
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Informações do usuário e logout */}
          <div className="flex items-center space-x-4">
            {/* Informações do usuário */}
            <div className="hidden md:block text-sm">
              <div className="font-medium text-gray-900">
                {user.name}
              </div>
              <div className="text-gray-500">
                {ROLE_LABELS[user.role as UserRole]}
                {user.empresa && ` • ${user.empresa}`}
              </div>
            </div>

            {/* Botão de logout */}
            <button
              onClick={handleLogout}
              className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Navegação mobile */}
      <div className="md:hidden border-t border-gray-200">
        <div className="px-2 py-3 space-y-1">
          {/* Info do usuário mobile */}
          <div className="px-3 py-2">
            <div className="text-base font-medium text-gray-800">{user.name}</div>
            <div className="text-sm text-gray-500">
              {ROLE_LABELS[user.role as UserRole]}
            </div>
          </div>
          
          {/* Links mobile */}
          <Link
            href="/dashboard"
            className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-700"
          >
            Dashboard
          </Link>
          
          {/* Links específicos por role mobile */}
          {user.role === 'gestor' && (
            <>
              <Link
                href="/relatorios"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-700"
              >
                Relatórios
              </Link>
              <Link
                href="/usuarios"
                className="block px-3 py-2 text-base font-medium text-gray-500 hover:text-gray-700"
              >
                Usuários
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}