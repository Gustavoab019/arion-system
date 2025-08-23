import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Item, { ItemUtils } from '@/models/Item';
import { StatusItem, TipoItem } from '@/types';

// GET /api/items - Listar itens
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
    const projeto = searchParams.get('projeto');
    const status = searchParams.get('status') as StatusItem;
    const tipo = searchParams.get('tipo') as TipoItem;
    const codigo = searchParams.get('codigo');
    
    let itens;
    
    if (codigo) {
      const item = await Item.buscarPorCodigo(codigo);
      return NextResponse.json({
        success: true,
        data: item ? [item] : [],
        total: item ? 1 : 0
      });
    }
    
    if (projeto) {
      itens = await Item.buscarPorProjeto(projeto);
    } else if (status) {
      itens = await Item.buscarPorStatus(status);
    } else if (tipo) {
      itens = await Item.buscarPorTipo(tipo);
    } else {
      itens = await Item.find()
        .populate('projeto', 'codigo nomeHotel')
        .sort({ criadoEm: -1 })
        .limit(100); // Limitar para performance
    }
    
    return NextResponse.json({
      success: true,
      data: itens,
      total: itens.length
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Erro ao buscar itens',
      error: error.message
    }, { status: 500 });
  }
}

// POST /api/items - Criar item
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
    const { projeto, tipo, ambiente, quantidade = 1 } = body;
    
    // Validações básicas
    if (!projeto || !tipo || !ambiente) {
      return NextResponse.json({
        success: false,
        message: 'Projeto, tipo e ambiente são obrigatórios'
      }, { status: 400 });
    }
    
    // Validar tipo
    if (!['cortina', 'calha'].includes(tipo)) {
      return NextResponse.json({
        success: false,
        message: 'Tipo deve ser "cortina" ou "calha"'
      }, { status: 400 });
    }
    
    const itens = [];
    
    // Criar múltiplos itens se quantidade > 1
    for (let i = 0; i < quantidade; i++) {
      const item = await ItemUtils.criarItem({
        projeto,
        tipo,
        ambiente: quantidade > 1 ? `${ambiente} (${i + 1})` : ambiente
      });
      
      itens.push({
        id: item._id,
        codigo: item.codigo,
        tipo: item.tipo,
        ambiente: item.ambiente,
        status: item.status,
        qrCodeUrl: item.qrCodeUrl
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `${quantidade} item(ns) criado(s) com sucesso`,
      data: itens
    }, { status: 201 });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Erro ao criar item',
      error: error.message
    }, { status: 500 });
  }
}