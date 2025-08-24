'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const QrReader = dynamic(() => import('react-qr-reader'), { ssr: false });

export default function ScannerPage() {
  const router = useRouter();
  const [manualCode, setManualCode] = useState('');

  const handleScan = (value: string | null) => {
    if (value) {
      router.push(`/dashboard/tracking/${encodeURIComponent(value)}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      router.push(`/dashboard/tracking/${encodeURIComponent(manualCode.trim())}`);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Scanner</h1>
      <div className="w-full max-w-md mx-auto">
        <QrReader
          onResult={(result, error) => {
            if (!!result) handleScan((result as any).text || (result as any).getText?.());
          }}
          constraints={{ facingMode: 'environment' }}
        />
      </div>
      <form onSubmit={handleSubmit} className="flex space-x-2 max-w-md mx-auto">
        <input
          type="text"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          placeholder="Insira o código manualmente"
          className="flex-1 border border-gray-300 rounded px-3 py-2"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Buscar
        </button>
      </form>
    </div>
  );
}

