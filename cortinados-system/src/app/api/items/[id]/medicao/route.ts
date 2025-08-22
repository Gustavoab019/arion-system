// Arquivo: /src/app/api/items/[id]/medicao/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';
import mongoose from 'mongoose';

// PUT /api/items/[id]/medicao - Registrar medidas
export async function PUT(
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

    // Verificar se é medidor ou gestor
    const userRole = (session.user as any).role;
    if (!['medidor', 'gestor'].includes(userRole)) {
      return NextResponse.json({
        success: false,
        message: 'Sem permissão para registrar medidas'
      }, { status: 403 });
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
    const { largura, altura, profundidade, observacoes } = body;

    // Validações obrigatórias
    if (!largura || !altura) {
      return NextResponse.json({
        success: false,
        message: 'Largura e altura são obrigatórias'
      }, { status: 400 });
    }

    // Validar valores numéricos
    const larguraNum = parseFloat(largura);
    const alturaNum = parseFloat(altura);
    const profundidadeNum = profundidade ? parseFloat(profundidade) : undefined;

    if (isNaN(larguraNum) || larguraNum <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Largura deve ser um número positivo'
      }, { status: 400 });
    }

    if (isNaN(alturaNum) || alturaNum <= 0) {
      return NextResponse.json({
        success: false,
        message: 'Altura deve ser um número positivo'
      }, { status: 400 });
    }

    if (profundidadeNum !== undefined && (isNaN(profundidadeNum) || profundidadeNum < 0)) {
      return NextResponse.json({
        success: false,
        message: 'Profundidade deve ser um número não negativo'
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

    // Verificar se item pode ser medido
    if (item.status !== 'pendente') {
      return NextResponse.json({
        success: false,
        message: `Item já foi medido (status atual: ${item.status})`
      }, { status: 400 });
    }

    // Preparar dados de atualização
    const updateData = {
      status: 'medido',
      medidas: {
        largura: larguraNum,
        altura: alturaNum,
        ...(profundidadeNum !== undefined && { profundidade: profundidadeNum }),
        ...(observacoes && { observacoes: observacoes.trim() })
      },
      medicao: {
        medidoPor: new mongoose.Types.ObjectId((session.user as any).id),
        dataEm: new Date(),
        ...(observacoes && { observacoes: observacoes.trim() })
      },
      atualizadoEm: new Date()
    };

    // Atualizar item
    const itemAtualizado = await Item.findByIdAndUpdate(
      itemId,
      { $set: updateData },
      { 
        new: true,
        runValidators: true 
      }
    ).populate([
      {
        path: 'projeto',
        select: 'codigo nomeHotel cidade'
      },
      {
        path: 'medicao.medidoPor',
        select: 'nome role empresa'
      }
    ]);

    if (!itemAtualizado) {
      return NextResponse.json({
        success: false,
        message: 'Erro ao atualizar item'
      }, { status: 500 });
    }

    // Log da operação
    console.log(`✅ Medição registrada: ${item.codigo} por ${session.user?.name} (${userRole})`);
    console.log(`📐 Medidas: ${larguraNum}x${alturaNum}${profundidadeNum ? `x${profundidadeNum}` : ''} cm`);

    // Preparar resposta com dados do item atualizado
    const response = {
      success: true,
      message: `Medidas registradas com sucesso para ${item.codigo}`,
      data: {
        item: {
          id: (itemAtualizado._id as mongoose.Types.ObjectId).toString(),
          codigo: itemAtualizado.codigo,
          tipo: itemAtualizado.tipo,
          ambiente: itemAtualizado.ambiente,
          status: itemAtualizado.status,
          medidas: itemAtualizado.medidas,
          projeto: {
            codigo: (itemAtualizado.projeto as any)?.codigo || 'N/A',
            nomeHotel: (itemAtualizado.projeto as any)?.nomeHotel || 'N/A',
            cidade: (itemAtualizado.projeto as any)?.cidade || 'N/A'
          },
          medidoPor: {
            nome: (itemAtualizado.medicao?.medidoPor as any)?.nome || session.user?.name || 'N/A',
            role: (itemAtualizado.medicao?.medidoPor as any)?.role || userRole
          },
          dataEm: itemAtualizado.medicao?.dataEm || new Date()
        }
      }
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error: any) {
    console.error('❌ Erro ao registrar medidas:', error);
    
    // Tratamento específico para erros de validação
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json({
        success: false,
        message: `Erro de validação: ${errors.join(', ')}`
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Erro interno ao registrar medidas',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// GET /api/items/[id]/medicao - Buscar detalhes de medição
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

    const { id: itemId } = params;
    
    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return NextResponse.json({
        success: false,
        message: 'ID do item inválido'
      }, { status: 400 });
    }

    const item = await Item.findById(itemId)
      .populate('projeto', 'codigo nomeHotel endereco cidade')
      .populate('medicao.medidoPor', 'nome role empresa');

    if (!item) {
      return NextResponse.json({
        success: false,
        message: 'Item não encontrado'
      }, { status: 404 });
    }

    // Preparar dados da resposta
    const itemData = {
      id: (item._id as mongoose.Types.ObjectId).toString(),
      codigo: item.codigo,
      tipo: item.tipo,
      ambiente: item.ambiente,
      status: item.status,
      medidas: item.medidas,
      medicao: item.medicao,
      projeto: {
        codigo: (item.projeto as any)?.codigo || 'N/A',
        nomeHotel: (item.projeto as any)?.nomeHotel || 'N/A',
        endereco: (item.projeto as any)?.endereco || 'N/A',
        cidade: (item.projeto as any)?.cidade || 'N/A'
      },
      qrCodeUrl: item.qrCodeUrl
    };

    return NextResponse.json({
      success: true,
      data: itemData
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar dados de medição:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno ao buscar dados',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}