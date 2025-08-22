import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';
import mongoose from 'mongoose';

// PATCH /api/items/[id]/status - Atualizar status do item
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Não autenticado'
      }, { status: 401 });
    }

    await connectDB();

    const { id: itemId } = params;
    
    // Validar ObjectId
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return NextResponse.json({
        success: false,
        message: 'ID do item inválido'
      }, { status: 400 });
    }

    // Parsear dados da requisição
    const body = await request.json();
    const { status: novoStatus, observacoes } = body;

    if (!novoStatus) {
      return NextResponse.json({
        success: false,
        message: 'Status é obrigatório'
      }, { status: 400 });
    }

    // Validar status
    const statusValidos = ['pendente', 'medido', 'producao', 'produzido', 'logistica', 'instalado', 'cancelado'];
    if (!statusValidos.includes(novoStatus)) {
      return NextResponse.json({
        success: false,
        message: 'Status inválido'
      }, { status: 400 });
    }

    // Buscar item
    const item = await Item.findById(itemId).populate('projeto', 'codigo nomeHotel');
    
    if (!item) {
      return NextResponse.json({
        success: false,
        message: 'Item não encontrado'
      }, { status: 404 });
    }

    // Verificar permissões por role e tipo
    const userRole = (session.user as any).role;
    const canUpdate = validarPermissaoStatus(userRole, item.tipo, item.status, novoStatus);
    
    if (!canUpdate.permitido) {
      return NextResponse.json({
        success: false,
        message: canUpdate.motivo
      }, { status: 403 });
    }

    // Usar método utilitário para atualizar status
    const itemAtualizado = await Item.findByIdAndUpdate(
      itemId,
      {
        status: novoStatus,
        ...(observacoes && { observacoes }),
        atualizadoEm: new Date()
      },
      { new: true, runValidators: true }
    ).populate([
      {
        path: 'projeto',
        select: 'codigo nomeHotel cidade'
      }
    ]);

    if (!itemAtualizado) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao atualizar item'
      }, { status: 500 });
    }

    // Log da operação
    console.log(`✅ Status atualizado: ${item.codigo} ${item.status} → ${novoStatus} por ${session.user?.name}`);

    return NextResponse.json({
      success: true,
      message: `Status atualizado para ${novoStatus}`,
      data: {
        item: {
          id: (itemAtualizado._id as mongoose.Types.ObjectId).toString(),
          codigo: itemAtualizado.codigo,
          status: itemAtualizado.status,
          statusAnterior: item.status,
          projeto: itemAtualizado.projeto
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao atualizar status:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({
        success: false,
        message: `Erro de validação: ${errors.join(', ')}`
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Erro interno ao atualizar status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// Função para validar permissões de mudança de status
function validarPermissaoStatus(
  userRole: string, 
  tipoItem: string, 
  statusAtual: string, 
  novoStatus: string
) {
  // Gestor pode tudo
  if (userRole === 'gestor') {
    return { permitido: true };
  }

  // Regras específicas por role e tipo
  switch (userRole) {
    case 'fabrica_trk':
      if (tipoItem !== 'calha') {
        return { permitido: false, motivo: 'Fábrica TRK só pode atualizar calhas' };
      }
      if (statusAtual === 'medido' && novoStatus === 'producao') {
        return { permitido: true };
      }
      if (statusAtual === 'producao' && novoStatus === 'produzido') {
        return { permitido: true };
      }
      return { permitido: false, motivo: 'Transição de status não permitida para TRK' };

    case 'fabrica_crt':
      if (tipoItem !== 'cortina') {
        return { permitido: false, motivo: 'Fábrica CRT só pode atualizar cortinas' };
      }
      if (statusAtual === 'medido' && novoStatus === 'producao') {
        return { permitido: true };
      }
      if (statusAtual === 'producao' && novoStatus === 'produzido') {
        return { permitido: true };
      }
      return { permitido: false, motivo: 'Transição de status não permitida para CRT' };

    case 'logistica':
      if (statusAtual === 'produzido' && novoStatus === 'logistica') {
        return { permitido: true };
      }
      return { permitido: false, motivo: 'Logística só pode receber itens produzidos' };

    case 'instalador':
      if (statusAtual === 'logistica' && novoStatus === 'instalado') {
        return { permitido: true };
      }
      return { permitido: false, motivo: 'Instalador só pode marcar como instalado itens da logística' };

    default:
      return { permitido: false, motivo: 'Role não autorizado a alterar status' };
  }
}