import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User as IUser, UserRole } from '@/types';

// Interface que combina o tipo User com Document do Mongoose
export interface UserDocument extends Document {
  nome: string;
  email: string;
  senha: string;
  role: UserRole;
  ativo: boolean;
  telefone?: string;
  empresa?: string;
  criadoEm: Date;
  atualizadoEm: Date;
  compararSenha(senha: string): Promise<boolean>;
}

// Interface para métodos estáticos
export interface UserModel extends Model<UserDocument> {
  buscarPorEmail(email: string): Promise<UserDocument | null>;
  buscarPorRole(role: UserRole): Promise<UserDocument[]>;
  buscarAtivos(): Promise<UserDocument[]>;
}

// Schema do usuário
const UserSchema = new Schema<UserDocument>({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [100, 'Nome não pode ter mais de 100 caracteres']
  },
  
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Email inválido'
    ]
  },
  
  senha: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'Senha deve ter pelo menos 6 caracteres'],
    select: false // Por padrão, não retorna a senha nas consultas
  },
  
  role: {
    type: String,
    required: [true, 'Role é obrigatório'],
    enum: {
      values: ['medidor', 'fabrica_trk', 'fabrica_crt', 'logistica', 'instalador', 'gestor'],
      message: 'Role inválido'
    }
  },
  
  ativo: {
    type: Boolean,
    default: true
  },
  
  telefone: {
    type: String,
    trim: true,
    validate: {
      validator: function(v: string) {
        // Regex para telefone brasileiro (opcional)
        return !v || /^(\+55\s?)?(\(?\d{2}\)?[\s-]?)(\d{4,5}[\s-]?\d{4})$/.test(v);
      },
      message: 'Telefone inválido'
    }
  },
  
  empresa: {
    type: String,
    trim: true,
    maxlength: [100, 'Nome da empresa não pode ter mais de 100 caracteres']
  }
}, {
  timestamps: { 
    createdAt: 'criadoEm', 
    updatedAt: 'atualizadoEm' 
  }
});

// Índices para melhor performance (removendo duplicados)
UserSchema.index({ role: 1 });
UserSchema.index({ ativo: 1 });

// Middleware para hash da senha antes de salvar
UserSchema.pre('save', async function(next) {
  // Só faz hash se a senha foi modificada
  if (!this.isModified('senha')) return next();
  
  try {
    // Hash da senha com salt 12
    const salt = await bcrypt.genSalt(12);
    this.senha = await bcrypt.hash(this.senha, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Método para comparar senhas
UserSchema.methods.compararSenha = async function(senhaCandidata: string): Promise<boolean> {
  try {
    return await bcrypt.compare(senhaCandidata, this.senha);
  } catch (error) {
    return false;
  }
};

// Métodos estáticos úteis
UserSchema.statics.buscarPorEmail = function(email: string) {
  return this.findOne({ email }).select('+senha');
};

UserSchema.statics.buscarPorRole = function(role: UserRole) {
  return this.find({ role, ativo: true });
};

UserSchema.statics.buscarAtivos = function() {
  return this.find({ ativo: true });
};

// Middleware para atualizar o campo atualizadoEm
UserSchema.pre(['updateOne', 'findOneAndUpdate'], function() {
  this.set({ atualizadoEm: new Date() });
});

// Verificar se o modelo já existe (evita re-compilação em desenvolvimento)
const User = (mongoose.models.User as UserModel) || 
             mongoose.model<UserDocument, UserModel>('User', UserSchema);

export default User;

// Funções utilitárias para usar com o modelo
export const UserUtils = {
  // Criar usuário com validações
  async criarUsuario(dadosUsuario: {
    nome: string;
    email: string;
    senha: string;
    role: UserRole;
    telefone?: string;
    empresa?: string;
  }) {
    const usuario = new User(dadosUsuario);
    return await usuario.save();
  },

  // Autenticar usuário
  async autenticar(email: string, senha: string) {
    const usuario = await User.buscarPorEmail(email);
    if (!usuario || !usuario.ativo) {
      return null;
    }
    
    const senhaValida = await usuario.compararSenha(senha);
    if (!senhaValida) {
      return null;
    }
    
    return usuario;
  },

  // Atualizar senha
  async atualizarSenha(userId: string, novaSenha: string) {
    const usuario = await User.findById(userId);
    if (!usuario) {
      throw new Error('Usuário não encontrado');
    }
    
    usuario.senha = novaSenha;
    return await usuario.save();
  },

  // Desativar usuário (soft delete)
  async desativarUsuario(userId: string) {
    return await User.findByIdAndUpdate(
      userId, 
      { ativo: false, atualizadoEm: new Date() },
      { new: true }
    );
  },

  // Reativar usuário
  async reativarUsuario(userId: string) {
    return await User.findByIdAndUpdate(
      userId,
      { ativo: true, atualizadoEm: new Date() },
      { new: true }
    );
  },

  // Verificar permissões
  temPermissao(usuario: UserDocument, permissaoRequerida: UserRole | UserRole[]) {
    if (usuario.role === 'gestor') return true; // Gestor tem todas as permissões
    
    if (Array.isArray(permissaoRequerida)) {
      return permissaoRequerida.includes(usuario.role);
    }
    
    return usuario.role === permissaoRequerida;
  }
};