// Arquivo: /src/app/api/items/buscar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import { ItemUtils } from '@/models/Item';

// GET /api/items/buscar?q=termo - Busca rápida e inteligente de itens
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const termo = searchParams.get('q');
    const limite = parseInt(searchParams.get('limite') || '10');

    if (!termo || termo.length < 2) {
      return NextResponse.json({
        success: false,
        message: 'Termo de busca deve ter pelo menos 2 caracteres'
      }, { status: 400 });
    }

    try {
      // Busca inteligente usando o ItemUtils
      const resultados = await ItemUtils.buscarInteligente(termo, limite);

      // Formatear resultados
      const resultadosFormatados = resultados.map((item: any) => ({
        id: item._id.toString(),
        codigo: item.codigo,
        tipo: item.tipo,
        ambiente: item.ambiente,
        status: item.status,
        projeto: {
          id: item.projeto?._id?.toString(),
          codigo: item.projeto?.codigo || 'N/A',
          nomeHotel: item.projeto?.nomeHotel || 'N/A',
          cidade: item.projeto?.cidade || 'N/A'
        },
        criadoEm: item.criadoEm,
        // Campo para destacar o match
        matchType: item.codigo.toUpperCase().includes(termo.toUpperCase()) 
          ? 'codigo' 
          : 'ambiente'
      }));

      const response = {
        success: true,
        data: resultadosFormatados,
        total: resultadosFormatados.length,
        busca: {
          termo,
          limite,
          temMaisResultados: resultadosFormatados.length === limite
        }
      };

      return NextResponse.json(response);

    } catch (error: any) {
      console.error('❌ Erro na busca:', error);
      return NextResponse.json({
        success: false,
        message: 'Erro ao realizar busca',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Erro na API de busca:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}