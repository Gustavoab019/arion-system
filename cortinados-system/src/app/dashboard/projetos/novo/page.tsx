// Arquivo: /src/app/dashboard/projetos/novo/page.tsx
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Loading } from '@/components/ui/DesignSystem';

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
        <Loading size="lg" text="Carregando..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
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
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Criar Novo Projeto</h1>
                <p className="text-slate-600">Adicione um novo projeto hoteleiro ao sistema</p>
              </div>
            </div>
            
            {/* Progress Indicator */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 1 ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                1
              </div>
              <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-sky-500' : 'bg-slate-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 2 ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                2
              </div>
              <div className={`w-12 h-0.5 ${step >= 3 ? 'bg-sky-500' : 'bg-slate-200'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= 3 ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                3
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit}>
          {/* Step 1: Informações do Projeto */}
          {step === 1 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">📍 Informações do Projeto</h2>
                <p className="text-slate-600 mt-1">Dados básicos do hotel e localização</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Nome do Hotel */}
                <div>
                  <Input
                    label="Nome do Hotel *"
                    value={formData.nomeHotel}
                    onChange={(value) => handleChange('nomeHotel', value)}
                    placeholder="Ex: Pestana Palace Hotel"
                    error={errors.nomeHotel}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    }
                  />
                </div>

                {/* Endereço */}
                <div>
                  <Input
                    label="Endereço Completo *"
                    value={formData.endereco}
                    onChange={(value) => handleChange('endereco', value)}
                    placeholder="Ex: Rua Jau, 54"
                    error={errors.endereco}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                  />
                </div>

                {/* Cidade e Distrito */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input
                      label="Cidade *"
                      value={formData.cidade}
                      onChange={(value) => handleChange('cidade', value)}
                      placeholder="Ex: Lisboa"
                      error={errors.cidade}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Distrito *
                    </label>
                    <select
                      value={formData.distrito}
                      onChange={(e) => handleChange('distrito', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors ${
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
                  <Input
                    label="Código Postal *"
                    value={formData.codigoPostal}
                    onChange={(value) => handleChange('codigoPostal', value)}
                    placeholder="Ex: 1000-001"
                    error={errors.codigoPostal}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    variant="primary"
                  >
                    Continuar
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Contato */}
          {step === 2 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">👤 Contato do Hotel</h2>
                <p className="text-slate-600 mt-1">Informações de contato para coordenação</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Nome do Contato */}
                <div>
                  <Input
                    label="Nome do Responsável *"
                    value={formData.contato.nome}
                    onChange={(value) => handleChange('contato.nome', value)}
                    placeholder="Ex: João Silva"
                    error={errors['contato.nome']}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    }
                  />
                </div>

                {/* Telefone e Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input
                      label="Telefone *"
                      value={formData.contato.telefone}
                      onChange={(value) => handleChange('contato.telefone', value)}
                      placeholder="Ex: +351 912345678"
                      error={errors['contato.telefone']}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      }
                    />
                  </div>

                  <div>
                    <Input
                      label="Email *"
                      value={formData.contato.email}
                      onChange={(value) => handleChange('contato.email', value)}
                      placeholder="Ex: joao@hotel.pt"
                      error={errors['contato.email']}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                <div className="flex justify-between">
                  <Button
                    type="button"
                    onClick={handlePrevStep}
                    variant="secondary"
                  >
                    <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Voltar
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    variant="primary"
                  >
                    Continuar
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Finalização */}
          {step === 3 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">📅 Detalhes Adicionais</h2>
                <p className="text-slate-600 mt-1">Informações opcionais e revisão final</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Data Prevista */}
                <div className="md:w-1/2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Data Prevista de Conclusão
                  </label>
                  <input
                    type="date"
                    value={formData.dataPrevista}
                    onChange={(e) => handleChange('dataPrevista', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
                  />
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => handleChange('observacoes', e.target.value)}
                    rows={4}
                    placeholder="Detalhes adicionais sobre o projeto..."
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors resize-none"
                  />
                </div>

                {/* Resumo */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">📋 Resumo do Projeto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-700">Hotel:</span>
                      <p className="text-slate-900">{formData.nomeHotel}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Localização:</span>
                      <p className="text-slate-900">{formData.cidade}, {formData.distrito}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Contato:</span>
                      <p className="text-slate-900">{formData.contato.nome}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Telefone:</span>
                      <p className="text-slate-900">{formData.contato.telefone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                <div className="flex justify-between">
                  <Button
                    type="button"
                    onClick={handlePrevStep}
                    variant="secondary"
                    disabled={loading}
                  >
                    <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Voltar
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="success"
                    loading={loading}
                    disabled={loading}
                  >
                    <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {loading ? 'Criando Projeto...' : 'Criar Projeto'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-blue-900 font-semibold mb-2">💡 Dicas para Criar Projeto</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• Certifique-se de que todas as informações estão corretas</li>
                <li>• O código do projeto será gerado automaticamente</li>
                <li>• Após criar, você poderá adicionar itens (cortinas/calhas)</li>
                <li>• O projeto iniciará com status "Medição"</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}