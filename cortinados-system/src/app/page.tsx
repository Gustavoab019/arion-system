'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [items, setItems] = useState([]);

  // Função para criar usuário gestor
  const criarGestor = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'Gestor Sistema',
          email: 'gestor@cortinados.pt',
          senha: '123456',
          role: 'gestor',
          telefone: '+351 912345678',
          empresa: 'Cortinados Portugal'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Gestor criado com sucesso!');
        buscarUsuarios();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Erro ao criar gestor');
    }
    setLoading(false);
  };

  // Função para criar projeto
  const criarProjeto = async () => {
    setLoading(true);
    try {
      // Buscar primeiro usuário para usar como criador
      const userResponse = await fetch('/api/users');
      const userData = await userResponse.json();
      
      if (!userData.data || userData.data.length === 0) {
        alert('Crie um usuário primeiro!');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeHotel: 'Hotel Dom Pedro Lisboa',
          endereco: 'Rua Augusta, 123',
          cidade: 'Lisboa',
          distrito: 'Lisboa',
          codigoPostal: '1100-048',
          contato: {
            nome: 'João Santos',
            telefone: '+351 912345678',
            email: 'joao@hoteldompedro.pt'
          },
          criadoPor: userData.data[0]._id
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Projeto criado: ${data.data.codigo}`);
        buscarProjetos();
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Erro ao criar projeto');
    }
    setLoading(false);
  };

  // Função para criar itens
  const criarItens = async () => {
    setLoading(true);
    try {
      // Buscar primeiro projeto
      const projectResponse = await fetch('/api/projects');
      const projectData = await projectResponse.json();
      
      if (!projectData.data || projectData.data.length === 0) {
        alert('Crie um projeto primeiro!');
        setLoading(false);
        return;
      }

      // Criar calha
      await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projeto: projectData.data[0]._id,
          tipo: 'calha',
          ambiente: 'Quarto 101'
        })
      });

      // Criar cortina
      await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projeto: projectData.data[0]._id,
          tipo: 'cortina',
          ambiente: 'Quarto 101'
        })
      });

      alert('Itens criados com sucesso!');
      buscarItens();
    } catch (error) {
      alert('Erro ao criar itens');
    }
    setLoading(false);
  };

  // Funções para buscar dados
  const buscarUsuarios = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const buscarProjetos = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
    }
  };

  const buscarItens = async () => {
    try {
      const response = await fetch('/api/items');
      const data = await response.json();
      setItems(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar itens:', error);
    }
  };

  // Carregar dados ao iniciar
  useEffect(() => {
    buscarUsuarios();
    buscarProjetos();
    buscarItens();
  }, []);

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🏨 Sistema de Gestão de Cortinados
        </h1>

        {/* Botões de Ação */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
          <div className="flex gap-4 flex-wrap">
            <button
              onClick={criarGestor}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              👤 Criar Gestor
            </button>
            <button
              onClick={criarProjeto}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              🏨 Criar Projeto
            </button>
            <button
              onClick={criarItens}
              disabled={loading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              📦 Criar Itens
            </button>
          </div>
        </div>

        {/* Grid de Dados */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Usuários */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">👥 Usuários ({users.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {users.map((user: any) => (
                <div key={user._id} className="p-3 border rounded">
                  <div className="font-medium">{user.nome}</div>
                  <div className="text-sm text-gray-600">{user.email}</div>
                  <div className="text-xs text-blue-600">{user.role}</div>
                </div>
              ))}
              {users.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  Nenhum usuário encontrado
                </div>
              )}
            </div>
          </div>

          {/* Projetos */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">🏨 Projetos ({projects.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {projects.map((project: any) => (
                <div key={project._id} className="p-3 border rounded">
                  <div className="font-medium">{project.codigo}</div>
                  <div className="text-sm text-gray-600">{project.nomeHotel}</div>
                  <div className="text-xs text-green-600">{project.status}</div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  Nenhum projeto encontrado
                </div>
              )}
            </div>
          </div>

          {/* Itens */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">📦 Itens ({items.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {items.map((item: any) => (
                <div key={item._id} className="p-3 border rounded">
                  <div className="font-medium">{item.codigo}</div>
                  <div className="text-sm text-gray-600">{item.tipo} - {item.ambiente}</div>
                  <div className="text-xs text-purple-600">{item.status}</div>
                  {item.qrCodeUrl && (
                    <a 
                      href={item.qrCodeUrl} 
                      className="text-xs text-blue-500 hover:underline"
                      target="_blank"
                    >
                      🔗 QR Code
                    </a>
                  )}
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  Nenhum item encontrado
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status do Sistema */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">⚡ Status do Sistema</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{users.length}</div>
              <div className="text-sm text-gray-600">Usuários</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{projects.length}</div>
              <div className="text-sm text-gray-600">Projetos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{items.length}</div>
              <div className="text-sm text-gray-600">Itens</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}