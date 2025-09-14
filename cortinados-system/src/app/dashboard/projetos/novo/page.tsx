// Arquivo: /src/app/dashboard/projetos/novo/page.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
// Removido dependências do design system para usar inputs nativos

interface FormData {
  nomeHotel: string;
  endereco: string;
  cidade: string;
  distrito: string;
  codigoPostal: string;
  contato: {
    nome: string;
    telefone: string;
    email: string;
  };
  dataPrevista: string;
  observacoes: string;
}

interface FormErrors {
  nomeHotel?: string;
  endereco?: string;
  cidade?: string;
  distrito?: string;
  codigoPostal?: string;
  'contato.nome'?: string;
  'contato.telefone'?: string;
  'contato.email'?: string;
  dataPrevista?: string;
}

export default function NovoProjetoPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState<FormData>({
    nomeHotel: '',
    endereco: '',
    cidade: '',
    distrito: '',
    codigoPostal: '',
    contato: {
      nome: '',
      telefone: '',
      email: ''
    },
    dataPrevista: '',
    observacoes: ''
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Lista de distritos portugueses
  const distritos = [
    'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra',
    'Évora', 'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre', 'Porto',
    'Santarém', 'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu',
    'Região Autónoma dos Açores', 'Região Autónoma da Madeira'
  ];

  const handleChange = (field: string, value: string) => {
    if (field.startsWith('contato.')) {
      const contactField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contato: {
          ...prev.contato,
          [contactField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateStep = (stepNumber: number): boolean => {
    const newErrors: FormErrors = {};

    if (stepNumber === 1) {
      // Validações básicas do projeto
      if (!formData.nomeHotel.trim()) {
        newErrors.nomeHotel = 'Nome do hotel é obrigatório';
      }
      if (!formData.endereco.trim()) {
        newErrors.endereco = 'Endereço é obrigatório';
      }
      if (!formData.cidade.trim()) {
        newErrors.cidade = 'Cidade é obrigatória';
      }
      if (!formData.distrito) {
        newErrors.distrito = 'Distrito é obrigatório';
      }
      if (!formData.codigoPostal.trim()) {
        newErrors.codigoPostal = 'Código postal é obrigatório';
      } else if (!/^\d{4}-\d{3}$/.test(formData.codigoPostal)) {
        newErrors.codigoPostal = 'Formato inválido (ex: 1000-001)';
      }
    }

    if (stepNumber === 2) {
      // Validações do contato
      if (!formData.contato.nome.trim()) {
        newErrors['contato.nome'] = 'Nome do contato é obrigatório';
      }
      if (!formData.contato.telefone.trim()) {
        newErrors['contato.telefone'] = 'Telefone é obrigatório';
      } else if (!/^(\+351\s?)?[0-9]{9}$/.test(formData.contato.telefone.replace(/\s/g, ''))) {
        newErrors['contato.telefone'] = 'Formato inválido (ex: +351 912345678)';
      }
      if (!formData.contato.email.trim()) {
        newErrors['contato.email'] = 'Email é obrigatório';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contato.email)) {
        newErrors['contato.email'] = 'Email inválido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(1) || !validateStep(2)) {
      setStep(1); // Voltar ao primeiro step se houver erros
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          criadoPor: (session?.user as any)?.id
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirecionar para a página do projeto criado
        router.push(`/dashboard/projetos?success=created&codigo=${data.data.codigo}`);
      } else {
        setErrors({ nomeHotel: data.message || 'Erro ao criar projeto' });
        setStep(1);
      }
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      setErrors({ nomeHotel: 'Erro de conexão. Tente novamente.' });
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-slate-900 font-semibold text-xl mb-2">Carregando...</h3>
          <p className="text-slate-600">Autenticando usuário...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/projetos"
                className="text-slate-600 hover:text-slate-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="w-12 h-12 bg-sky-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Criar Novo Projeto</h1>
                <p className="text-slate-600 mt-2">Adicione um novo projeto hoteleiro ao sistema</p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= 1 ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                1
              </div>
              <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-sky-500' : 'bg-slate-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= 2 ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                2
              </div>
              <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-sky-500' : 'bg-slate-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step >= 3 ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                3
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1: Informações do Projeto */}
          {step === 1 && (
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Informações do Projeto</h2>
                    <p className="text-slate-600 text-sm mt-1">Dados básicos do hotel e localização</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Nome do Hotel */}
                <div>
                  <label htmlFor="nomeHotel" className="block text-sm font-semibold text-slate-700 mb-2">
                    Nome do Hotel *
                  </label>
                  <input
                    id="nomeHotel"
                    name="nomeHotel"
                    type="text"
                    value={formData.nomeHotel}
                    onChange={(e) => handleChange('nomeHotel', e.target.value)}
                    placeholder="Ex: Pestana Palace Hotel"
                    className={`block w-full px-4 py-3 border rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors ${
                      errors.nomeHotel ? 'border-red-300' : 'border-slate-300'
                    }`}
                  />
                  {errors.nomeHotel && (
                    <p className="mt-1 text-sm text-red-600">{errors.nomeHotel}</p>
                  )}
                </div>

                {/* Endereço */}
                <div>
                  <label htmlFor="endereco" className="block text-sm font-semibold text-slate-700 mb-2">
                    Endereço Completo *
                  </label>
                  <input
                    id="endereco"
                    name="endereco"
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => handleChange('endereco', e.target.value)}
                    placeholder="Ex: Rua Jau, 54"
                    className={`block w-full px-4 py-3 border rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors ${
                      errors.endereco ? 'border-red-300' : 'border-slate-300'
                    }`}
                  />
                  {errors.endereco && (
                    <p className="mt-1 text-sm text-red-600">{errors.endereco}</p>
                  )}
                </div>

                {/* Cidade e Distrito */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="cidade" className="block text-sm font-semibold text-slate-700 mb-2">
                      Cidade *
                    </label>
                    <input
                      id="cidade"
                      name="cidade"
                      type="text"
                      value={formData.cidade}
                      onChange={(e) => handleChange('cidade', e.target.value)}
                      placeholder="Ex: Lisboa"
                      className={`block w-full px-4 py-3 border rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors ${
                        errors.cidade ? 'border-red-300' : 'border-slate-300'
                      }`}
                    />
                    {errors.cidade && (
                      <p className="mt-1 text-sm text-red-600">{errors.cidade}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="distrito" className="block text-sm font-semibold text-slate-700 mb-2">
                      Distrito *
                    </label>
                    <select
                      id="distrito"
                      name="distrito"
                      value={formData.distrito}
                      onChange={(e) => handleChange('distrito', e.target.value)}
                      className={`block w-full px-4 py-3 border rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors ${
                        errors.distrito ? 'border-red-300' : 'border-slate-300'
                      }`}
                    >
                      <option value="">Selecione o distrito...</option>
                      {distritos.map(distrito => (
                        <option key={distrito} value={distrito}>{distrito}</option>
                      ))}
                    </select>
                    {errors.distrito && (
                      <p className="mt-1 text-sm text-red-600">{errors.distrito}</p>
                    )}
                  </div>
                </div>

                {/* Código Postal */}
                <div className="md:w-1/2">
                  <label htmlFor="codigoPostal" className="block text-sm font-semibold text-slate-700 mb-2">
                    Código Postal *
                  </label>
                  <input
                    id="codigoPostal"
                    name="codigoPostal"
                    type="text"
                    value={formData.codigoPostal}
                    onChange={(e) => handleChange('codigoPostal', e.target.value)}
                    placeholder="Ex: 1000-001"
                    className={`block w-full px-4 py-3 border rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors ${
                      errors.codigoPostal ? 'border-red-300' : 'border-slate-300'
                    }`}
                  />
                  {errors.codigoPostal && (
                    <p className="mt-1 text-sm text-red-600">{errors.codigoPostal}</p>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-sky-500 text-white px-6 py-2 rounded-lg hover:bg-sky-600 font-medium transition-colors inline-flex items-center space-x-2"
                  >
                    <span>Continuar</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contato */}
          {step === 2 && (
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Contato do Hotel</h2>
                    <p className="text-slate-600 text-sm mt-1">Informações de contato para coordenação</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Nome do Contato */}
                <div>
                  <label htmlFor="contato-nome" className="block text-sm font-semibold text-slate-700 mb-2">
                    Nome do Responsável *
                  </label>
                  <input
                    id="contato-nome"
                    name="contato-nome"
                    type="text"
                    value={formData.contato.nome}
                    onChange={(e) => handleChange('contato.nome', e.target.value)}
                    placeholder="Ex: João Silva"
                    className={`block w-full px-4 py-3 border rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors ${
                      errors['contato.nome'] ? 'border-red-300' : 'border-slate-300'
                    }`}
                  />
                  {errors['contato.nome'] && (
                    <p className="mt-1 text-sm text-red-600">{errors['contato.nome']}</p>
                  )}
                </div>

                {/* Telefone e Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="contato-telefone" className="block text-sm font-semibold text-slate-700 mb-2">
                      Telefone *
                    </label>
                    <input
                      id="contato-telefone"
                      name="contato-telefone"
                      type="tel"
                      value={formData.contato.telefone}
                      onChange={(e) => handleChange('contato.telefone', e.target.value)}
                      placeholder="Ex: +351 912345678"
                      className={`block w-full px-4 py-3 border rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors ${
                        errors['contato.telefone'] ? 'border-red-300' : 'border-slate-300'
                      }`}
                    />
                    {errors['contato.telefone'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['contato.telefone']}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contato-email" className="block text-sm font-semibold text-slate-700 mb-2">
                      Email *
                    </label>
                    <input
                      id="contato-email"
                      name="contato-email"
                      type="email"
                      value={formData.contato.email}
                      onChange={(e) => handleChange('contato.email', e.target.value)}
                      placeholder="Ex: joao@hotel.pt"
                      className={`block w-full px-4 py-3 border rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors ${
                        errors['contato.email'] ? 'border-red-300' : 'border-slate-300'
                      }`}
                    />
                    {errors['contato.email'] && (
                      <p className="mt-1 text-sm text-red-600">{errors['contato.email']}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-50 font-medium transition-colors inline-flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Voltar</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="bg-sky-500 text-white px-6 py-2 rounded-lg hover:bg-sky-600 font-medium transition-colors inline-flex items-center space-x-2"
                  >
                    <span>Continuar</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Finalização */}
          {step === 3 && (
            <div className="bg-white border border-slate-200 rounded-xl">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4M3 13h18v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Detalhes Adicionais</h2>
                    <p className="text-slate-600 text-sm mt-1">Informações opcionais e revisão final</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Data Prevista */}
                <div className="md:w-1/2">
                  <label htmlFor="dataPrevista" className="block text-sm font-semibold text-slate-700 mb-2">
                    Data Prevista de Conclusão
                  </label>
                  <input
                    id="dataPrevista"
                    name="dataPrevista"
                    type="date"
                    value={formData.dataPrevista}
                    onChange={(e) => handleChange('dataPrevista', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="block w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                  />
                </div>

                {/* Observações */}
                <div>
                  <label htmlFor="observacoes" className="block text-sm font-semibold text-slate-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    id="observacoes"
                    name="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => handleChange('observacoes', e.target.value)}
                    rows={4}
                    placeholder="Detalhes adicionais sobre o projeto..."
                    className="block w-full px-4 py-3 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors resize-none"
                  />
                </div>

                {/* Resumo */}
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Resumo do Projeto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-500">Hotel:</span>
                      <p className="text-slate-900 font-semibold">{formData.nomeHotel}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Localização:</span>
                      <p className="text-slate-900 font-semibold">{formData.cidade}, {formData.distrito}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Endereço:</span>
                      <p className="text-slate-900">{formData.endereco}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Código Postal:</span>
                      <p className="text-slate-900 font-mono">{formData.codigoPostal}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Contato:</span>
                      <p className="text-slate-900 font-semibold">{formData.contato.nome}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Telefone:</span>
                      <p className="text-slate-900">{formData.contato.telefone}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-500">Email:</span>
                      <p className="text-slate-900">{formData.contato.email}</p>
                    </div>
                    {formData.dataPrevista && (
                      <div>
                        <span className="font-medium text-slate-500">Data Prevista:</span>
                        <p className="text-slate-900">{new Date(formData.dataPrevista).toLocaleDateString('pt-PT')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={loading}
                    className="bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-lg hover:bg-slate-50 font-medium transition-colors inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Voltar</span>
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 font-semibold transition-colors inline-flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Criando Projeto...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Criar Projeto</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-blue-900 font-semibold mb-2">Dicas para Criar Projeto</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Certifique-se de que todas as informações estão corretas</li>
                <li>• O código do projeto será gerado automaticamente</li>
                <li>• Após criar, você poderá adicionar itens (cortinas/calhas)</li>
                <li>• O projeto iniciará com status "Medição"</li>
                <li>• Todos os campos marcados com (*) são obrigatórios</li>
              </ul>
            </div>
          </div>
        </div>

        {/* System Status Footer */}
        <footer className="bg-white border border-slate-200 rounded-xl p-6 mt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-slate-900 font-semibold">Sistema Operacional</span>
              </div>
              <div className="hidden sm:block text-slate-400">•</div>
              <span className="text-slate-600 font-medium">
                Todas as operações funcionando normalmente
              </span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-slate-500">
              <span>Última sincronização: {new Date().toLocaleTimeString('pt-PT')}</span>
              <div className="hidden sm:block text-slate-400">•</div>
              <span>Versão 2.1.0</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}