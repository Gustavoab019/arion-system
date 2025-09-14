// Arquivo: /src/app/api/medidor/historico/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Item from '@/models/Item';

// GET /api/medidor/historico - Histórico de medições do medidor
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

    // Verificar se é medidor ou gestor
    const userRole = (session.user as any).role;
    if (!['medidor', 'gestor'].includes(userRole)) {
      return NextResponse.json({
        success: false,
        message: 'Acesso não autorizado'
      }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limite = parseInt(searchParams.get('limite') || '50');
    const pagina = parseInt(searchParams.get('pagina') || '1');
    const skip = (pagina - 1) * limite;

    const userId = (session.user as any).id;

    try {
      // Buscar histórico do medidor
      const [historico, total] = await Promise.all([
        Item.historicoMedidor(userId, limite, skip),
        Item.countDocuments({ 'medicao.medidoPor': userId })
      ]);

      // Formatear dados para o frontend
      const historicoFormatado = historico.map((item: any) => ({
        id: item._id.toString(),
        codigo: item.codigo,
        tipo: item.tipo,
        ambiente: item.ambiente,
        projeto: {
          codigo: item.projeto?.codigo || 'N/A',
          nomeHotel: item.projeto?.nomeHotel || 'N/A',
          cidade: item.projeto?.cidade || 'N/A'
        },
        medidas: {
          largura: item.medidas?.largura || 0,
          altura: item.medidas?.altura || 0,
          profundidade: item.medidas?.profundidade || null,
          area: item.medidas?.largura && item.medidas?.altura 
            ? (item.medidas.largura * item.medidas.altura / 10000).toFixed(2) + ' m²'
            : 'N/A'
        },
        medicao: {
          dataEm: item.medicao?.dataEm || null,
          observacoes: item.medicao?.observacoes || null
        },
        status: item.status
      }));

      const response = {
        success: true,
        data: {
          historico: historicoFormatado,
          paginacao: {
            pagina,
            limite,
            total,
            totalPaginas: Math.ceil(total / limite),
            temProxima: pagina < Math.ceil(total / limite),
            temAnterior: pagina > 1
          },
          resumo: {
            totalMedicoes: total,
            medidor: session.user?.name
          }
        }
      };

      return NextResponse.json(response);

    } catch (error: any) {
      console.error('❌ Erro ao buscar histórico:', error);
      return NextResponse.json({
        success: false,
        message: 'Erro ao buscar histórico',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Erro na API de histórico:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}