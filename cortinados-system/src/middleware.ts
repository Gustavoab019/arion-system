// Arquivo: /src/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { UserRole } from '@/types';

// Configuração de rotas protegidas por role
const ROLE_ROUTES: Record<string, UserRole[]> = {
  // Dashboard geral - todos podem acessar
  '/dashboard': ['medidor', 'fabrica_trk', 'fabrica_crt', 'logistica', 'instalador', 'gestor'],
  
  // Rotas específicas por função
  '/medicao': ['medidor', 'gestor'],
  '/producao/calhas': ['fabrica_trk', 'gestor'],
  '/producao/cortinas': ['fabrica_crt', 'gestor'],
  '/logistica': ['logistica', 'gestor'],
  '/instalacao': ['instalador', 'gestor'],
  
  // Gestão - apenas gestores
  '/admin': ['gestor'],
  '/usuarios': ['gestor'],
  '/relatorios': ['gestor'],
  '/configuracoes': ['gestor']
};

// Middleware personalizado que usa NextAuth
export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`🛡️ Middleware: ${pathname} - User: ${token?.email} (${token?.role})`);
    }

    // Verificar se a rota precisa de proteção específica por role
    const requiredRoles = getRequiredRoles(pathname);
    
    if (requiredRoles.length > 0) {
      const userRole = token?.role as UserRole;
      
      if (!userRole || !requiredRoles.includes(userRole)) {
        console.log(`❌ Acesso negado: ${token?.email} (${userRole}) tentou acessar ${pathname}`);
        
        // Redirecionar para dashboard com erro
        const url = req.nextUrl.clone();
        url.pathname = '/dashboard';
        url.searchParams.set('error', 'access_denied');
        
        return NextResponse.redirect(url);
      }
    }

    // Redirecionamentos especiais baseados no role
    if (pathname === '/dashboard') {
      const userRole = token?.role as UserRole;
      const redirectPath = getDefaultDashboard(userRole);
      
      if (redirectPath && redirectPath !== '/dashboard') {
        const url = req.nextUrl.clone();
        url.pathname = redirectPath;
        return NextResponse.redirect(url);
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Callback que determina se o middleware deve ser executado
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Rotas públicas - não precisam de autenticação
        if (isPublicRoute(pathname)) {
          return true;
        }
        
        // Se tem token, está autorizado para rotas protegidas
        if (token) {
          return true;
        }
        
        // Se não tem token e não é rota pública, não autorizado
        return false;
      }
    }
  }
);

// Função para determinar se a rota é pública
function isPublicRoute(pathname: string): boolean {
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/register',
    '/api/auth',
    '/api/users',
    '/api/projects', 
    '/api/items',
    '/favicon.ico',
    '/_next',
    '/vercel.svg',
    '/next.svg'
  ];
  
  return publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );
}

// Função para obter roles necessários para uma rota
function getRequiredRoles(pathname: string): UserRole[] {
  // Busca exata primeiro
  if (ROLE_ROUTES[pathname]) {
    return ROLE_ROUTES[pathname];
  }
  
  // Busca por padrão (ex: /producao/calhas/123 -> /producao/calhas)
  for (const route in ROLE_ROUTES) {
    if (pathname.startsWith(route + '/')) {
      return ROLE_ROUTES[route];
    }
  }
  
  return [];
}

// Função para determinar dashboard padrão baseado no role
function getDefaultDashboard(role: UserRole): string {
  const dashboards: Record<UserRole, string> = {
    medidor: '/dashboard', // Pode ir direto para medições
    fabrica_trk: '/dashboard', // Pode ir direto para produção de calhas
    fabrica_crt: '/dashboard', // Pode ir direto para produção de cortinas
    logistica: '/dashboard', // Pode ir direto para logística
    instalador: '/dashboard', // Pode ir direto para instalações
    gestor: '/dashboard' // Dashboard geral com visão completa
  };
  
  return dashboards[role] || '/dashboard';
}

// Configuração do matcher - define quais rotas o middleware deve interceptar
export const config = {
  matcher: [
    /*
     * Intercepta todas as rotas exceto:
     * - api/auth (NextAuth)
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - arquivos públicos (extensões)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ]
};