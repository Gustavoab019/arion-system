// Arquivo: /src/app/api/projects/com-pendentes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';

// GET /api/projects/com-pendentes - Projetos que têm itens pendentes
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
    const cidade = searchParams.get('cidade'); // Filtro opcional por cidade

    try {
      // Buscar projetos com itens pendentes
      let projetosComPendentes = await Project.buscarComItensPendentes();

      // Filtrar por cidade se especificado
      if (cidade) {
        projetosComPendentes = projetosComPendentes.filter((projeto: any) => 
          projeto.cidade.toLowerCase().includes(cidade.toLowerCase())
        );
      }

      // Ordenar por quantidade de pendentes (mais urgentes primeiro)
      projetosComPendentes.sort((a: any, b: any) => b.totalItensPendentes - a.totalItensPendentes);

      const response = {
        success: true,
        data: projetosComPendentes.map((projeto: any) => ({
          _id: projeto._id.toString(),
          codigo: projeto.codigo,
          nomeHotel: projeto.nomeHotel,
          cidade: projeto.cidade,
          distrito: projeto.distrito,
          endereco: projeto.endereco,
          status: projeto.status,
          totalItensPendentes: projeto.totalItensPendentes,
          contato: projeto.contato,
          dataInicio: projeto.dataInicio,
          dataPrevista: projeto.dataPrevista,
          criadoPor: projeto.criadoPor
        })),
        total: projetosComPendentes.length,
        filtros: {
          cidade: cidade || 'todas'
        }
      };

      console.log(`📊 Projetos com pendentes: ${projetosComPendentes.length} encontrados`);

      return NextResponse.json(response);

    } catch (error: any) {
      console.error('❌ Erro ao buscar projetos com pendentes:', error);
      return NextResponse.json({
        success: false,
        message: 'Erro ao buscar projetos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Erro na API de projetos com pendentes:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}