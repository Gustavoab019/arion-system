/**
 * Caminho do arquivo: src/app/dashboard/page.tsx
 *
 * Objetivo:
 * - Detectar a role do usuário autenticado e redirecionar para a dashboard correta.
 * - Se não houver sessão, redirecionar para /auth/login preservando o callback.
 *
 * Observações:
 * - Usa getServerSession (NextAuth) no server.
 * - Ajuste o import de authOptions se sua configuração exigir (comentado abaixo).
 */

import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
// import { authOptions } from '@/app/api/auth/[...nextauth]/options'; // descomente se necessário

type UserRole = 'gestor' | 'medidor' | 'fabrica_trk' | 'fabrica_crt' | 'logistica' | 'instalador';

const ROLE_DASH_PATH: Record<UserRole, string> = {
  gestor: '/dashboard/gestor',
  medidor: '/dashboard/medidor',
  fabrica_trk: '/dashboard/fabrica-trk',
  fabrica_crt: '/dashboard/fabrica-crt',
  logistica: '/dashboard/logistica',
  instalador: '/dashboard/instalador',
};

export default async function DashboardIndexPage() {
  // const session = await getServerSession(authOptions);
  const session = await getServerSession();

  if (!session) {
    redirect('/auth/login?callbackUrl=%2Fdashboard');
  }

  const user = session.user as (typeof session.user & { role?: UserRole });
  const role = (user?.role as UserRole) ?? 'gestor'; // fallback seguro

  const target = ROLE_DASH_PATH[role] || ROLE_DASH_PATH.gestor;
  redirect(target);
}
