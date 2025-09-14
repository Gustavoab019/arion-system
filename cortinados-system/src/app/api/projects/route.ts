// Arquivo: /src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Project, { ProjectUtils } from '@/models/Project';
import { StatusProjeto } from '@/types';

// Interface para tipagem da requisição
interface CreateProjectRequest {
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
  dataPrevista?: string;
  observacoes?: string;
  criadoPor: string;
}

// GET /api/projects - Listar projetos
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Não autenticado'
      }, { status: 401 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as StatusProjeto;
    const cidade = searchParams.get('cidade');
    const codigo = searchParams.get('codigo');
    const limit = searchParams.get('limit');
    
    let projetos;
    
    // Busca específica por código
    if (codigo) {
      const projeto = await Project.buscarPorCodigo(codigo);
      return NextResponse.json({
        success: true,
        data: projeto ? [projeto] : [],
        total: projeto ? 1 : 0
      });
    }
    
    // Construir query baseada nos filtros
    let query = Project.find().populate('criadoPor', 'nome email');
    
    if (status) {
      query = query.where('status').equals(status);
    }
    
    if (cidade) {
      query = query.where('cidade').regex(new RegExp(cidade, 'i'));
    }
    
    // Aplicar limite se especificado
    if (limit && !isNaN(parseInt(limit))) {
      query = query.limit(parseInt(limit));
    }
    
    // Ordenar por data de criação (mais recentes primeiro)
    projetos = await query.sort({ criadoEm: -1 });
    
    return NextResponse.json({
      success: true,
      data: projetos,
      total: projetos.length
    });
    
  } catch (error: unknown) {
    console.error('Erro ao buscar projetos:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

// POST /api/projects - Criar projeto
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Não autenticado'
      }, { status: 401 });
    }

    // Verificar permissões (apenas gestores podem criar projetos)
    const userRole = (session.user as any)?.role;
    if (userRole !== 'gestor') {
      return NextResponse.json({
        success: false,
        message: 'Apenas gestores podem criar projetos'
      }, { status: 403 });
    }

    await connectDB();
    
    const body: CreateProjectRequest = await request.json();
    const { 
      nomeHotel, 
      endereco, 
      cidade, 
      distrito, 
      codigoPostal, 
      contato, 
      dataPrevista, 
      observacoes, 
      criadoPor 
    } = body;
    
    // Validações básicas
    if (!nomeHotel?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Nome do hotel é obrigatório'
      }, { status: 400 });
    }
    
    if (!endereco?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Endereço é obrigatório'
      }, { status: 400 });
    }
    
    if (!cidade?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Cidade é obrigatória'
      }, { status: 400 });
    }
    
    if (!distrito?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Distrito é obrigatório'
      }, { status: 400 });
    }
    
    if (!codigoPostal?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Código postal é obrigatório'
      }, { status: 400 });
    }
    
    if (!criadoPor?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'ID do criador é obrigatório'
      }, { status: 400 });
    }
    
    // Validar formato do código postal português
    if (!/^\d{4}-\d{3}$/.test(codigoPostal)) {
      return NextResponse.json({
        success: false,
        message: 'Código postal deve ter o formato XXXX-XXX'
      }, { status: 400 });
    }
    
    // Validar contato
    if (!contato || typeof contato !== 'object') {
      return NextResponse.json({
        success: false,
        message: 'Informações de contato são obrigatórias'
      }, { status: 400 });
    }
    
    if (!contato.nome?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Nome do contato é obrigatório'
      }, { status: 400 });
    }
    
    if (!contato.telefone?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Telefone do contato é obrigatório'
      }, { status: 400 });
    }
    
    if (!contato.email?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Email do contato é obrigatório'
      }, { status: 400 });
    }
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contato.email)) {
      return NextResponse.json({
        success: false,
        message: 'Email do contato é inválido'
      }, { status: 400 });
    }
    
    // Validar telefone (formato português)
    const telefoneRegex = /^(\+351\s?)?[0-9]{9}$/;
    if (!telefoneRegex.test(contato.telefone.replace(/\s/g, ''))) {
      return NextResponse.json({
        success: false,
        message: 'Telefone deve ter formato português válido'
      }, { status: 400 });
    }
    
    // Criar projeto usando ProjectUtils
    const projetoData = {
      nomeHotel: nomeHotel.trim(),
      endereco: endereco.trim(),
      cidade: cidade.trim(),
      distrito: distrito.trim(),
      codigoPostal: codigoPostal.trim(),
      contato: {
        nome: contato.nome.trim(),
        telefone: contato.telefone.trim(),
        email: contato.email.trim().toLowerCase()
      },
      dataPrevista: dataPrevista ? new Date(dataPrevista) : undefined,
      observacoes: observacoes?.trim() || undefined,
      criadoPor
    };
    
    const projeto = await ProjectUtils.criarProjeto(projetoData);
    
    // Log da operação
    console.log(`✅ Projeto criado: ${projeto.codigo} por ${session.user?.name}`);
    
    return NextResponse.json({
      success: true,
      message: 'Projeto criado com sucesso',
      data: {
        id: projeto._id,
        codigo: projeto.codigo,
        nomeHotel: projeto.nomeHotel,
        cidade: projeto.cidade,
        status: projeto.status,
        criadoEm: projeto.criadoEm
      }
    }, { status: 201 });
    
  } catch (error: unknown) {
    console.error('Erro ao criar projeto:', error);
    
    // Tratamento específico para erros de validação do Mongoose
    if ((error as any).name === 'ValidationError') {
      const errors = Object.values((error as any).errors).map((err: any) => err.message);
      return NextResponse.json({
        success: false,
        message: `Erro de validação: ${errors.join(', ')}`
      }, { status: 400 });
    }
    
    // Tratamento para código duplicado
    if ((error as any).code === 11000) {
      return NextResponse.json({
        success: false,
        message: 'Já existe um projeto com essas informações'
      }, { status: 409 });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}