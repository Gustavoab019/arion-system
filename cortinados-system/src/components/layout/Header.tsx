// Arquivo: /src/components/layout/Header.tsx - DESIGN SYSTEM INDUSTRIAL LIMPO
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { UserRole } from '@/types';
import { useState } from 'react';

// Configuração de roles - cores funcionais apenas
const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  medidor: { label: 'MEDIDOR', color: 'bg-yellow-600' },
  fabrica_trk: { label: 'TRK', color: 'bg-blue-600' },
  fabrica_crt: { label: 'CRT', color: 'bg-blue-600' },
  logistica: { label: 'LOGÍSTICA', color: 'bg-green-600' },
  instalador: { label: 'INSTALADOR', color: 'bg-green-600' },
  gestor: { label: 'GESTOR', color: 'bg-gray-700' }
};

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Loading state - simples e direto
  if (status === 'loading') {
    return (
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-16 items-center">
            <div className="animate-pulse flex items-center space-x-3">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="h-5 w-48 bg-gray-200 rounded"></div>
            </div>
            <div className="animate-pulse h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  if (!session) return null;

  const user = session.user as any;
  const roleConfig = ROLE_CONFIG[user.role as UserRole];

  // Navegação funcional baseada em roles
  const getNavigation = (role: UserRole) => {
    const baseNav = [
      { name: 'Dashboard', href: '/dashboard' }
    ];

    const roleNav = {
      medidor: [{ name: 'Medições', href: '/dashboard/medicao' }],
      fabrica_trk: [{ name: 'Produção', href: '/dashboard/producao/calhas' }],
      fabrica_crt: [{ name: 'Produção', href: '/dashboard/producao/cortinas' }],
      logistica: [{ name: 'Logística', href: '/dashboard/logistica' }],
      instalador: [{ name: 'Instalações', href: '/dashboard/instalacao' }],
      gestor: [
        { name: 'Relatórios', href: '/dashboard/relatorios' },
        { name: 'Usuários', href: '/dashboard/usuarios' },
        { name: 'Projetos', href: '/dashboard/projetos' }
      ]
    };

    return [...baseNav, ...roleNav[role]];
  };

  const navigation = getNavigation(user.role);

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-16">
          {/* Logo e Brand - funcional, sem frescuras */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              {/* Ícone simples e funcional */}
              <div className="bg-blue-600 p-2 rounded group-hover:bg-blue-700 transition-colors duration-200">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h6m-6 4h6m-6 4h6" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  Sistema de Cortinados
                </h1>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                  Industrial Management
                </p>
              </div>
            </Link>
            
            {/* Navegação Desktop - limpa e direta */}
            <nav className="hidden lg:ml-8 lg:flex lg:space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Área do Usuário - informações essenciais */}
          <div className="flex items-center space-x-4">
            {/* Badge de Role - identificação clara */}
            <div className={`${roleConfig.color} px-3 py-1 rounded text-white text-xs font-bold uppercase tracking-wide`}>
              {roleConfig.label}
            </div>

            {/* Info do Usuário - Desktop */}
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-gray-900">{user.name}</p>
              {user.empresa && (
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{user.empresa}</p>
              )}
            </div>

            {/* Botão Logout - funcional e claro */}
            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded text-sm font-medium transition-colors duration-200"
            >
              <span className="hidden md:block">SAIR</span>
              <svg className="w-4 h-4 md:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>

            {/* Toggle Mobile Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Menu Mobile - funcional quando necessário */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            {/* Info do Usuário Mobile */}
            <div className="px-4 py-3 border-b border-gray-100 mb-4">
              <div className="flex items-center space-x-3">
                <div className={`${roleConfig.color} p-2 rounded text-white`}>
                  <span className="text-xs font-bold">{roleConfig.label}</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">{user.name}</p>
                  {user.empresa && (
                    <p className="text-sm text-gray-600 uppercase tracking-wide">{user.empresa}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Navegação Mobile */}
            <div className="space-y-1 px-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}