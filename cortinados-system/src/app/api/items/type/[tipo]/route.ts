import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';

// GET /api/items/type/[tipo] - Buscar itens por tipo
export async function GET(
  request: NextRequest,
  { params }: { params: { tipo: string } }
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

    const { tipo } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Validar tipo
    if (!['calha', 'cortina'].includes(tipo)) {
      return NextResponse.json({
        success: false,
        message: 'Tipo inválido. Use "calha" ou "cortina"'
      }, { status: 400 });
    }

    // Verificar permissões por role
    const userRole = (session.user as any).role;
    const canViewType = 
      userRole === 'gestor' ||
      (tipo === 'calha' && ['fabrica_trk', 'logistica', 'instalador'].includes(userRole)) ||
      (tipo === 'cortina' && ['fabrica_crt', 'logistica', 'instalador'].includes(userRole));

    if (!canViewType) {
      return NextResponse.json({
        success: false,
        message: 'Sem permissão para ver este tipo de item'
      }, { status: 403 });
    }

    // Construir query
    const query: any = { tipo };
    
    if (status && status !== 'todos') {
      query.status = status;
    }

    // Buscar itens
    const itens = await Item.find(query)
      .populate('projeto', 'codigo nomeHotel cidade')
      .populate('medicao.medidoPor', 'nome')
      .sort({ 
        // Priorizar por status e data
        status: 1, 
        'medicao.dataEm': -1,
        criadoEm: -1 
      })
      .limit(100); // Limitar para performance

    console.log(`📊 Busca por tipo: ${tipo} | Status: ${status || 'todos'} | ${itens.length} itens encontrados`);

    return NextResponse.json({
      success: true,
      data: itens,
      total: itens.length,
      filter: { tipo, status: status || 'todos' }
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar itens por tipo:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Erro interno ao buscar itens',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}