// Arquivo: /src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import { UserUtils } from '@/models/User';

// Configuração do NextAuth integrada com o sistema existente
const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email e Senha',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: 'gestor@cortinados.pt'
        },
        senha: {
          label: 'Senha',
          type: 'password',
          placeholder: 'Digite sua senha'
        }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) {
          throw new Error('Email e senha são obrigatórios');
        }

        try {
          // Conectar ao MongoDB usando a função existente
          await connectDB();
          
          // Usar o método de autenticação já implementado no UserUtils
          const usuario = await UserUtils.autenticar(
            credentials.email,
            credentials.senha
          );

          if (!usuario) {
            throw new Error('Credenciais inválidas ou usuário inativo');
          }

          // Retornar dados do usuário para a sessão
          // Estrutura baseada no modelo User existente
          return {
            id: (usuario._id as any).toString(),
            name: usuario.nome,
            email: usuario.email,
            role: usuario.role,
            empresa: usuario.empresa || '',
            telefone: usuario.telefone || '',
            ativo: usuario.ativo,
          };
          
        } catch (error: any) {
          console.error('❌ Erro na autenticação NextAuth:', error.message);
          throw new Error(error.message || 'Erro interno na autenticação');
        }
      }
    })
  ],

  // Configurações de sessão
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas (turno de trabalho)
  },

  // Configurações JWT
  jwt: {
    maxAge: 8 * 60 * 60, // 8 horas
  },

  // Callbacks para customizar sessão e JWT
  callbacks: {
    // Callback JWT - executa sempre que um JWT é criado/atualizado
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.empresa = (user as any).empresa;
        token.telefone = (user as any).telefone;
        token.ativo = (user as any).ativo;
      }
      return token;
    },

    // Callback Session - executa sempre que a sessão é acessada
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).empresa = token.empresa as string;
        (session.user as any).telefone = token.telefone as string;
        (session.user as any).ativo = token.ativo as boolean;
      }
      return session;
    },

    // Redirecionamento baseado no role do usuário
    async redirect({ url, baseUrl }) {
      // Se for logout, vai para login
      if (url === `${baseUrl}/api/auth/signout`) {
        return `${baseUrl}/auth/login`;
      }
      
      // Se for login bem-sucedido sem URL específica, vai para dashboard
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/dashboard`;
      }

      // Se for URL relativa, adiciona baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Se for da mesma origem, permite
      if (new URL(url).origin === baseUrl) {
        return url;
      }
      
      // Senão, redireciona para dashboard
      return `${baseUrl}/dashboard`;
    }
  },

  // Páginas customizadas
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },

  // Usar a secret do .env (já configurada no .env.example)
  secret: process.env.NEXTAUTH_SECRET,
  
  // Debug apenas em desenvolvimento
  debug: process.env.NODE_ENV === 'development',

  // Eventos para logging no sistema
  events: {
    async signIn({ user }) {
      console.log(`✅ Login: ${user.email} (${(user as any).role}) - ${new Date().toLocaleString('pt-PT')}`);
    },
    async signOut({ token }) {
      console.log(`👋 Logout: ${token?.email} - ${new Date().toLocaleString('pt-PT')}`);
    }
  }
};

// Handler para Next.js 13+ App Router
const handler = NextAuth(authOptions);

// Exportar para métodos HTTP
export { handler as GET, handler as POST };

// Exportar configurações para uso em middleware e outras partes
export { authOptions };