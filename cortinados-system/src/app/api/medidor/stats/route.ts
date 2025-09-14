// Arquivo: /src/app/api/medidor/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import { ItemUtils } from '@/models/Item';

// GET /api/medidor/stats - Estatísticas do medidor logado
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

    const userId = (session.user as any).id;
    
    try {
      // Obter stats específicas do medidor
      const stats = await ItemUtils.obterStatsMedidor(userId);
      
      // Calcular percentuais das metas
      const percentualDiario = Math.round((stats.hoje / stats.meta.diaria) * 100);
      const percentualSemanal = Math.round((stats.estaSemana / stats.meta.semanal) * 100);
      const percentualMensal = Math.round((stats.esteMes / stats.meta.mensal) * 100);

      const response = {
        success: true,
        data: {
          medidor: {
            nome: session.user?.name,
            id: userId
          },
          medicoes: {
            hoje: stats.hoje,
            estaSemana: stats.estaSemana,
            esteMes: stats.esteMes
          },
          metas: {
            diaria: stats.meta.diaria,
            semanal: stats.meta.semanal,
            mensal: stats.meta.mensal
          },
          percentuais: {
            diario: Math.min(percentualDiario, 100),
            semanal: Math.min(percentualSemanal, 100),
            mensal: Math.min(percentualMensal, 100)
          },
          historicoRecente: stats.historicoRecente,
          ultimaAtualizacao: new Date().toISOString()
        }
      };

      return NextResponse.json(response);

    } catch (error: any) {
      console.error('❌ Erro ao buscar stats:', error);
      return NextResponse.json({
        success: false,
        message: 'Erro ao calcular estatísticas',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Erro na API de stats:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}