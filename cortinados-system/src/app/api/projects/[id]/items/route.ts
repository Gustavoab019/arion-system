// Arquivo: /src/app/api/projects/[id]/items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Item, { ItemUtils } from '@/models/Item';
import Project from '@/models/Project';
import mongoose from 'mongoose';

// Interface para tipagem da requisição de criação de item
interface CreateItemRequest {
  tipo: 'cortina' | 'calha';
  ambiente: string;
  quantidade?: number;
  observacoes?: string;
}

// GET /api/projects/[id]/items - Listar itens de um projeto
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Não autenticado'
      }, { status: 401 });
    }

    await connectDB();
    const { id: projectId } = params;

    // Validar se o ID do projeto é válido
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json({
        success: false,
        message: 'ID do projeto inválido'
      }, { status: 400 });
    }

    // Verificar se o projeto existe
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({
        success: false,
        message: 'Projeto não encontrado'
      }, { status: 404 });
    }

    // Parâmetros de query
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tipo = searchParams.get('tipo');
    const limit = searchParams.get('limit');

    // Construir query
    let query = Item.find({ projeto: projectId });

    // Aplicar filtros se fornecidos
    if (status) {
      query = query.where('status').equals(status);
    }

    if (tipo && ['cortina', 'calha'].includes(tipo)) {
      query = query.where('tipo').equals(tipo);
    }

    // Aplicar limite se especificado
    if (limit && !isNaN(parseInt(limit))) {
      query = query.limit(parseInt(limit));
    }

    // Buscar itens com populate
    const items = await query
      .populate('projeto', 'codigo nomeHotel cidade')
      .populate('medicao.medidoPor', 'nome role empresa')
      .sort({ criadoEm: -1 });

    // Log da operação
    console.log(`📊 Listagem de itens do projeto ${project.codigo}: ${items.length} itens encontrados`);

    return NextResponse.json({
      success: true,
      data: items,
      total: items.length,
      projeto: {
        id: project._id,
        codigo: project.codigo,
        nomeHotel: project.nomeHotel,
        status: project.status
      }
    });

  } catch (error: unknown) {
    console.error('❌ Erro ao buscar itens do projeto:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

// POST /api/projects/[id]/items - Criar item(ns) em um projeto
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Não autenticado'
      }, { status: 401 });
    }

    // Verificar permissões (apenas gestores podem criar itens)
    const userRole = (session.user as any)?.role;
    if (userRole !== 'gestor') {
      return NextResponse.json({
        success: false,
        message: 'Apenas gestores podem criar itens'
      }, { status: 403 });
    }

    await connectDB();
    const { id: projectId } = params;
    
    // Validar se o ID do projeto é válido
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json({
        success: false,
        message: 'ID do projeto inválido'
      }, { status: 400 });
    }

    // Verificar se o projeto existe e está ativo
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({
        success: false,
        message: 'Projeto não encontrado'
      }, { status: 404 });
    }

    // Verificar se o projeto permite criação de novos itens
    if (['concluido', 'cancelado'].includes(project.status)) {
      return NextResponse.json({
        success: false,
        message: 'Não é possível criar itens em projetos concluídos ou cancelados'
      }, { status: 400 });
    }

    const body: CreateItemRequest = await request.json();
    const { tipo, ambiente, quantidade = 1, observacoes } = body;
    
    // Validações básicas
    if (!tipo || !['cortina', 'calha'].includes(tipo)) {
      return NextResponse.json({
        success: false,
        message: 'Tipo deve ser "cortina" ou "calha"'
      }, { status: 400 });
    }

    if (!ambiente?.trim()) {
      return NextResponse.json({
        success: false,
        message: 'Ambiente é obrigatório'
      }, { status: 400 });
    }

    // Validar quantidade
    const qtd = parseInt(String(quantidade));
    if (isNaN(qtd) || qtd < 1 || qtd > 50) {
      return NextResponse.json({
        success: false,
        message: 'Quantidade deve ser um número entre 1 e 50'
      }, { status: 400 });
    }

    const itens = [];
    
    try {
      // Criar múltiplos itens se quantidade > 1
      for (let i = 0; i < qtd; i++) {
        const ambienteItem = qtd > 1 ? `${ambiente.trim()} (${i + 1})` : ambiente.trim();
        
        const itemData = {
          projeto: projectId,
          tipo,
          ambiente: ambienteItem,
          observacoes: observacoes?.trim() || undefined
        };
        
        const item = await ItemUtils.criarItem(itemData);
        
        // Adicionar dados básicos para resposta
        itens.push({
          id: item._id,
          codigo: item.codigo,
          tipo: item.tipo,
          ambiente: item.ambiente,
          status: item.status,
          qrCodeUrl: item.qrCodeUrl,
          criadoEm: item.criadoEm
        });
      }
      
      // Log da operação
      console.log(`✅ ${qtd} item(ns) criado(s) no projeto ${project.codigo} por ${session.user?.name}`);
      console.log(`📝 Tipo: ${tipo}, Ambiente: ${ambiente}`);
      
      return NextResponse.json({
        success: true,
        message: `${qtd} item${qtd > 1 ? 'ns' : ''} criado${qtd > 1 ? 's' : ''} com sucesso`,
        data: itens,
        projeto: {
          codigo: project.codigo,
          nomeHotel: project.nomeHotel
        }
      }, { status: 201 });
      
    } catch (error: unknown) {
      // Se houve erro na criação, tentar limpar itens já criados
      if (itens.length > 0) {
        console.warn('⚠️ Limpando itens criados devido a erro:', itens.map(i => i.codigo));
        try {
          await Item.deleteMany({ 
            _id: { $in: itens.map(i => i.id) } 
          });
        } catch (cleanupError) {
          console.error('❌ Erro ao limpar itens:', cleanupError);
        }
      }
      
      throw error; // Re-throw para ser tratado pelo catch principal
    }
    
  } catch (error: unknown) {
    console.error('❌ Erro ao criar item(ns):', error);
    
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
        message: 'Já existe um item com essas especificações'
      }, { status: 409 });
    }
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}

// DELETE /api/projects/[id]/items - Excluir todos os itens de um projeto (apenas gestor)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Não autenticado'
      }, { status: 401 });
    }

    // Apenas gestores podem excluir itens em massa
    const userRole = (session.user as any)?.role;
    if (userRole !== 'gestor') {
      return NextResponse.json({
        success: false,
        message: 'Apenas gestores podem excluir itens'
      }, { status: 403 });
    }

    await connectDB();
    const { id: projectId } = params;
    
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return NextResponse.json({
        success: false,
        message: 'ID do projeto inválido'
      }, { status: 400 });
    }

    // Verificar se o projeto existe
    const project = await Project.findById(projectId);
    if (!project) {
      return NextResponse.json({
        success: false,
        message: 'Projeto não encontrado'
      }, { status: 404 });
    }

    // Contar itens antes da exclusão
    const itemCount = await Item.countDocuments({ projeto: projectId });
    
    if (itemCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum item para excluir',
        deleted: 0
      });
    }

    // Excluir todos os itens do projeto
    const result = await Item.deleteMany({ projeto: projectId });
    
    // Log da operação
    console.log(`🗑️ ${result.deletedCount} itens excluídos do projeto ${project.codigo} por ${session.user?.name}`);
    
    return NextResponse.json({
      success: true,
      message: `${result.deletedCount} item${result.deletedCount !== 1 ? 'ns' : ''} excluído${result.deletedCount !== 1 ? 's' : ''} com sucesso`,
      deleted: result.deletedCount,
      projeto: {
        codigo: project.codigo,
        nomeHotel: project.nomeHotel
      }
    });
    
  } catch (error: unknown) {
    console.error('❌ Erro ao excluir itens:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 });
  }
}