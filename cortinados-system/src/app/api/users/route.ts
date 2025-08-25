import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User, { UserUtils } from '@/models/User';
import { UserRole } from '@/types';

// GET /api/users - Listar usuários
export async function GET(request: NextRequest) {
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
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as UserRole;
    const ativo = searchParams.get('ativo');
    
    let usuarios;
    
    if (role) {
      usuarios = await User.buscarPorRole(role);
    } else if (ativo === 'true') {
      usuarios = await User.buscarAtivos();
    } else {
      usuarios = await User.find().sort({ criadoEm: -1 });
    }
    
    return NextResponse.json({
      success: true,
      data: usuarios,
      total: usuarios.length
    });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Erro ao buscar usuários',
      error: error.message
    }, { status: 500 });
  }
}

// POST /api/users - Criar usuário
export async function POST(request: NextRequest) {
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
    
    const body = await request.json();
    const { nome, email, senha, role, telefone, empresa } = body;
    
    // Validações básicas
    if (!nome || !email || !senha || !role) {
      return NextResponse.json({
        success: false,
        message: 'Nome, email, senha e role são obrigatórios'
      }, { status: 400 });
    }
    
    // Verificar se email já existe
    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return NextResponse.json({
        success: false,
        message: 'Email já está em uso'
      }, { status: 400 });
    }
    
    // Criar usuário
    const usuario = await UserUtils.criarUsuario({
      nome,
      email,
      senha,
      role,
      telefone,
      empresa
    });
    
    return NextResponse.json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        id: usuario._id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        ativo: usuario.ativo
      }
    }, { status: 201 });
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Erro ao criar usuário',
      error: error.message
    }, { status: 500 });
  }
}