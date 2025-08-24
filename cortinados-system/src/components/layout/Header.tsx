// Arquivo: /src/components/layout/Header.tsx - VERSÃO ATUALIZADA
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { UserRole } from '@/types';
import { useState } from 'react';

// Configuração de roles com cores e ícones modernos
const ROLE_CONFIG: Record<UserRole, { 
  label: string; 
  color: string; 
  bgColor: string;
  icon: JSX.Element;
}> = {
  medidor: { 
    label: 'MEDIDOR', 
    color: 'text-amber-800', 
    bgColor: 'bg-amber-100 border-amber-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  fabrica_trk: { 
    label: 'FÁBRICA TRK', 
    color: 'text-blue-800', 
    bgColor: 'bg-blue-100 border-blue-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M12 6.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
      </svg>
    )
  },
  fabrica_crt: { 
    label: 'FÁBRICA CRT', 
    color: 'text-emerald-800', 
    bgColor: 'bg-emerald-100 border-emerald-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    )
  },
  logistica: { 
    label: 'LOGÍSTICA', 
    color: 'text-orange-800', 
    bgColor: 'bg-orange-100 border-orange-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  },
  instalador: { 
    label: 'INSTALADOR', 
    color: 'text-purple-800', 
    bgColor: 'bg-purple-100 border-purple-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      </svg>
    )
  },
  gestor: { 
    label: 'GESTOR', 
    color: 'text-slate-800', 
    bgColor: 'bg-slate-100 border-slate-200',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    )
  }
};

export function Header() {
  const { data: session, status } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Loading state
  if (status === 'loading') {
    return (
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between h-16 items-center">
            <div className="animate-pulse flex items-center space-x-3">
              <div className="h-10 w-10 bg-slate-200 rounded-lg"></div>
              <div className="h-5 w-48 bg-slate-200 rounded"></div>
            </div>
            <div className="animate-pulse h-10 w-32 bg-slate-200 rounded-lg"></div>
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
      medidor: [
        { name: 'Medições', href: '/dashboard/medidor' },
        { name: 'Projetos', href: '/dashboard/projetos' }
      ],
      fabrica_trk: [
        { name: 'Produção TRK', href: '/dashboard/fabrica-trk' },
        { name: 'Inventário', href: '/dashboard/itens' }
      ],
      fabrica_crt: [
        { name: 'Produção CRT', href: '/dashboard/fabrica-crt' },
        { name: 'Inventário', href: '/dashboard/itens' }
      ],
      logistica: [
        { name: 'Logística', href: '/dashboard/logistica' },
        { name: 'Expedição', href: '/dashboard/expedicao' }
      ],
      instalador: [
        { name: 'Instalações', href: '/dashboard/instalador' },
        { name: 'Scanner', href: '/dashboard/scanner' }
      ],
      gestor: [
        { name: 'Relatórios', href: '/dashboard/relatorios' },
        { name: 'Usuários', href: '/dashboard/usuarios' },
        { name: 'Projetos', href: '/dashboard/projetos' },
        { name: 'Configurações', href: '/dashboard/configuracoes' }
      ]
    };

    return [...baseNav, ...roleNav[role]];
  };

  const navigation = getNavigation(user.role);

  const handleLogout = () => {
    signOut({ callbackUrl: '/auth/login' });
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between h-16">
          {/* Brand Section */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-4 group">
              {/* Logo moderno */}
              <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold shadow-lg group-hover:bg-sky-600 transition-colors">
                CP
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                  Cortinados Portugal
                </h1>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  Sistema de Gestão Industrial
                </p>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden lg:ml-8 lg:flex lg:space-x-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative p-2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.3 21.9c-.3.1-.6 0-.8-.2l-3.1-3.1c-.3-.3-.3-.7 0-1L19.6 4.4c.3-.3.7-.3 1 0l3.1 3.1c.3.3.3.7 0 1L10.5 21.7c-.1.1-.1.1-.2.2z" />
              </svg>
              <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>

            {/* Role Badge */}
            <div className={`hidden md:flex items-center space-x-2 px-3 py-2 rounded-lg border font-semibold text-xs uppercase tracking-wide ${roleConfig.bgColor} ${roleConfig.color}`}>
              {roleConfig.icon}
              <span>{roleConfig.label}</span>
            </div>

            {/* User Info - Desktop */}
            <div className="hidden lg:flex items-center space-x-3 bg-slate-100 rounded-lg px-3 py-2">
              <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center text-sm font-semibold text-slate-700">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-500">
                  {user.empresa || 'Cortinados Portugal'}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:block">Sair</span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 py-4">
            {/* User Info Mobile */}
            <div className="px-4 py-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center text-sm font-semibold text-slate-700">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{user.name}</div>
                  <div className="text-sm text-slate-500">
                    {user.empresa || 'Cortinados Portugal'}
                  </div>
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded border text-xs font-semibold ${roleConfig.bgColor} ${roleConfig.color}`}>
                  {roleConfig.icon}
                  <span>{roleConfig.label}</span>
                </div>
              </div>
            </div>
            
            {/* Navigation Mobile */}
            <div className="space-y-1 px-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-200"
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