// Arquivo: /src/app/dashboard/layout.tsx
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      
      <main>
        {children}
      </main>
    </div>
  );
}