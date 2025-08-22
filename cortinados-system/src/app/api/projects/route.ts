import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Project, { ProjectUtils } from '@/models/Project';
import { StatusProjeto } from '@/types';

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
    
    let projetos;
    
    if (codigo) {
      const projeto = await Project.buscarPorCodigo(codigo);
      return NextResponse.json({
        success: true,
        data: projeto ? [projeto] : [],
        total: projeto ? 1 : 0
      });
    }
    
    if (status) {
      projetos = await Project.buscarPorStatus(status);
    } else if (cidade) {
      projetos = await Project.buscarPorCidade(cidade);
    } else {
      projetos = await Project.find()
        .populate('criadoPor', 'nome email')
        .sort({ criadoEm: -1 });
    }
    
    return NextResponse.json({
      success: true,
      data: projetos,
      total: projetos.length
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Erro ao buscar projetos',
      error: error.message
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

    await connectDB();
    
    const body = await request.json();
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
    if (!nomeHotel || !endereco || !cidade || !distrito || !codigoPostal || !contato || !criadoPor) {
      return NextResponse.json({
        success: false,
        message: 'Dados obrigatórios: nomeHotel, endereco, cidade, distrito, codigoPostal, contato, criadoPor'
      }, { status: 400 });
    }
    
    // Validar contato
    if (!contato.nome || !contato.telefone || !contato.email) {
      return NextResponse.json({
        success: false,
        message: 'Contato deve ter nome, telefone e email'
      }, { status: 400 });
    }
    
    // Criar projeto
    const projeto = await ProjectUtils.criarProjeto({
      nomeHotel,
      endereco,
      cidade,
      distrito,
      codigoPostal,
      contato,
      dataPrevista: dataPrevista ? new Date(dataPrevista) : undefined,
      observacoes,
      criadoPor
    });
    
    return NextResponse.json({
      success: true,
      message: 'Projeto criado com sucesso',
      data: {
        id: projeto._id,
        codigo: projeto.codigo,
        nomeHotel: projeto.nomeHotel,
        cidade: projeto.cidade,
        status: projeto.status
      }
    }, { status: 201 });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Erro ao criar projeto',
      error: error.message
    }, { status: 500 });
  }
}