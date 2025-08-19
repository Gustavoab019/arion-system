// Arquivo: /src/types/next-auth.d.ts
// Extensão dos tipos NextAuth baseada nos types existentes do repositório

import { UserRole } from '@/types/index';
import { DefaultSession, DefaultUser } from 'next-auth';
import { DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  /**
   * Sessão retornada pelo `useSession`, `getSession` e SessionProvider
   * Baseada na interface User existente em /src/types/index.ts
   */
  interface Session {
    user: {
      /** ID do usuário no MongoDB */
      id: string;
      /** Role do sistema de cortinados */
      role: UserRole;
      /** Empresa do usuário (opcional) */
      empresa?: string;
      /** Telefone do usuário (opcional) */
      telefone?: string;
      /** Status ativo do usuário */
      ativo: boolean;
    } & DefaultSession['user']; // Mantém name, email, image
  }

  /**
   * User retornado pelos providers
   * Estrutura baseada no modelo User do MongoDB
   */
  interface User extends DefaultUser {
    /** Role: medidor | fabrica_trk | fabrica_crt | logistica | instalador | gestor */
    role: UserRole;
    /** Empresa do usuário */
    empresa?: string;
    /** Telefone português (+351...) */
    telefone?: string;
    /** Se o usuário está ativo no sistema */
    ativo: boolean;
  }
}

declare module 'next-auth/jwt' {
  /**
   * JWT Token customizado
   * Contém os dados necessários para o sistema de cortinados
   */
  interface JWT extends DefaultJWT {
    /** ObjectId do MongoDB como string */
    id: string;
    /** Role do usuário para controle de acesso */
    role: UserRole;
    /** Empresa (pode ser null) */
    empresa?: string;
    /** Telefone (pode ser null) */
    telefone?: string;
    /** Status ativo */
    ativo: boolean;
  }
}