import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

// PUT /api/users/[id] - Atualizar usuário
export async function PUT(
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

    if ((session.user as any)?.role !== 'gestor') {
      return NextResponse.json({
        success: false,
        message: 'Acesso não autorizado'
      }, { status: 403 });
    }

    await connectDB();

    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        message: 'ID inválido'
      }, { status: 400 });
    }

    const body = await request.json();
    const { nome, email, role, telefone, empresa, ativo } = body;

    const usuario = await User.findByIdAndUpdate(
      id,
      {
        ...(nome && { nome }),
        ...(email && { email }),
        ...(role && { role }),
        ...(telefone && { telefone }),
        ...(empresa && { empresa }),
        ...(typeof ativo === 'boolean' && { ativo }),
        atualizadoEm: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!usuario) {
      return NextResponse.json({
        success: false,
        message: 'Usuário não encontrado'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário atualizado com sucesso',
      data: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        ativo: usuario.ativo
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Erro ao atualizar usuário',
      error: error.message
    }, { status: 500 });
  }
}
