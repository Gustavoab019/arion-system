// Arquivo: /src/app/layout.tsx (ATUALIZAR o existente)
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { Header } from '@/components/layout/Header'

// Importar e conectar banco no startup (só no servidor)
if (typeof window === 'undefined') {
  import('@/lib/mongodb').then(({ default: connectDB }) => {
    connectDB().catch(console.error);
  });
  
  // Registrar modelos
  import('@/models/User');
  import('@/models/Project');
  import('@/models/Item');
}

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Gestão de Cortinados',
  description: 'Sistema para gestão completa de cortinados em hotéis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  )
}