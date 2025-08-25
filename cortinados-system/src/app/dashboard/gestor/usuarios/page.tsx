'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface FormData {
  id?: string | null;
  nome: string;
  email: string;
  senha: string;
  role: string;
}

export default function UsuariosPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [formData, setFormData] = useState<FormData>({
    id: null,
    nome: '',
    email: '',
    senha: '',
    role: 'medidor'
  });

  useEffect(() => {
    if ((session?.user as any)?.role === 'gestor') {
      carregarUsuarios();
    }
  }, [session]);

  const carregarUsuarios = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar usuários', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (formData.id) {
        await fetch(`/api/users/${formData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: formData.nome,
            email: formData.email,
            role: formData.role
          })
        });
      } else {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: formData.nome,
            email: formData.email,
            senha: formData.senha,
            role: formData.role
          })
        });
      }
      setFormData({ id: null, nome: '', email: '', senha: '', role: 'medidor' });
      carregarUsuarios();
    } catch (error) {
      console.error('Erro ao salvar usuário', error);
    }
  };

  const handleEdit = (user: any) => {
    setFormData({
      id: user._id,
      nome: user.nome,
      email: user.email,
      senha: '',
      role: user.role
    });
  };

  if (!session) return <div className="p-6">Carregando...</div>;
  if ((session.user as any)?.role !== 'gestor') return <div className="p-6">Acesso negado</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Gestão de Utilizadores</h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium">Nome</label>
          <input
            type="text"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            className="mt-1 w-full border rounded p-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 w-full border rounded p-2"
            required
          />
        </div>
        {!formData.id && (
          <div>
            <label className="block text-sm font-medium">Senha</label>
            <input
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              className="mt-1 w-full border rounded p-2"
              required
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium">Role</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="mt-1 w-full border rounded p-2"
          >
            <option value="medidor">Medidor</option>
            <option value="fabrica_trk">Fábrica TRK</option>
            <option value="fabrica_crt">Fábrica CRT</option>
            <option value="logistica">Logística</option>
            <option value="instalador">Instalador</option>
            <option value="gestor">Gestor</option>
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          {formData.id ? 'Atualizar' : 'Criar'} Utilizador
        </button>
      </form>

      <div>
        <h2 className="text-xl font-semibold mb-2">Utilizadores</h2>
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Nome</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Role</th>
              <th className="p-2 border">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="text-sm">
                <td className="p-2 border">{u.nome}</td>
                <td className="p-2 border">{u.email}</td>
                <td className="p-2 border">{u.role}</td>
                <td className="p-2 border">
                  <button
                    onClick={() => handleEdit(u)}
                    className="text-blue-600 hover:underline mr-2"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
