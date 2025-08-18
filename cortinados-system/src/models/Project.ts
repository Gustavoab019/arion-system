import mongoose, { Schema, Document, Model } from 'mongoose';
import { Project as IProject, StatusProjeto } from '@/types';

// Interface que combina o tipo Project com Document do Mongoose
export interface ProjectDocument extends Document {
  codigo: string;
  nomeHotel: string;
  endereco: string;
  cidade: string;
  distrito: string; // Distrito português
  codigoPostal: string; // Código postal português
  contato: {
    nome: string;
    telefone: string;
    email: string;
  };
  status: StatusProjeto;
  dataInicio: Date;
  dataPrevista?: Date;
  dataConclusao?: Date;
  observacoes?: string;
  criadoPor: mongoose.Types.ObjectId;
  criadoEm: Date;
  atualizadoEm: Date;
}

// Interface para métodos estáticos
export interface ProjectModel extends Model<ProjectDocument> {
  buscarPorCodigo(codigo: string): Promise<ProjectDocument | null>;
  buscarPorStatus(status: StatusProjeto): Promise<ProjectDocument[]>;
  buscarAtivos(): Promise<ProjectDocument[]>;
  buscarPorCidade(cidade: string): Promise<ProjectDocument[]>;
  gerarProximoCodigo(): Promise<string>;
}

// Schema do projeto
const ProjectSchema = new Schema<ProjectDocument>({
  codigo: {
    type: String,
    required: [true, 'Código é obrigatório'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{3}-\d{4}$/, 'Código deve ter formato ABC-1234']
  },
  
  nomeHotel: {
    type: String,
    required: [true, 'Nome do hotel é obrigatório'],
    trim: true,
    maxlength: [200, 'Nome do hotel não pode ter mais de 200 caracteres']
  },
  
  endereco: {
    type: String,
    required: [true, 'Endereço é obrigatório'],
    trim: true,
    maxlength: [300, 'Endereço não pode ter mais de 300 caracteres']
  },
  
  cidade: {
    type: String,
    required: [true, 'Cidade é obrigatória'],
    trim: true,
    maxlength: [100, 'Cidade não pode ter mais de 100 caracteres']
  },
  
  distrito: {
    type: String,
    required: [true, 'Distrito é obrigatório'],
    trim: true,
    maxlength: [100, 'Distrito não pode ter mais de 100 caracteres']
  },
  
  codigoPostal: {
    type: String,
    required: [true, 'Código postal é obrigatório'],
    trim: true,
    match: [/^\d{4}-\d{3}$/, 'Código postal deve ter formato 0000-000']
  },
  
  contato: {
    nome: {
      type: String,
      required: [true, 'Nome do contato é obrigatório'],
      trim: true,
      maxlength: [100, 'Nome do contato não pode ter mais de 100 caracteres']
    },
    telefone: {
      type: String,
      required: [true, 'Telefone do contato é obrigatório'],
      trim: true,
      validate: {
        validator: function(v: string) {
          // Regex para telefone português (+351 ou 9 dígitos)
          return /^(\+351\s?)?[2-9]\d{8}$/.test(v.replace(/\s/g, ''));
        },
        message: 'Telefone inválido para Portugal'
      }
    },
    email: {
      type: String,
      required: [true, 'Email do contato é obrigatório'],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Email inválido'
      ]
    }
  },
  
  status: {
    type: String,
    required: [true, 'Status é obrigatório'],
    enum: {
      values: ['medicao', 'producao', 'logistica', 'instalacao', 'concluido', 'cancelado'],
      message: 'Status inválido'
    },
    default: 'medicao'
  },
  
  dataInicio: {
    type: Date,
    required: [true, 'Data de início é obrigatória'],
    default: Date.now
  },
  
  dataPrevista: {
    type: Date
  },
  
  dataConclusao: {
    type: Date
  },
  
  observacoes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Observações não podem ter mais de 1000 caracteres']
  },
  
  criadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Criado por é obrigatório']
  }
}, {
  timestamps: { 
    createdAt: 'criadoEm', 
    updatedAt: 'atualizadoEm' 
  }
});

// Índices para melhor performance (removendo duplicados)
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ cidade: 1 });
ProjectSchema.index({ distrito: 1 });
ProjectSchema.index({ dataInicio: -1 });

// Middleware para validação adicional
ProjectSchema.pre('save', function(next) {
  // Se o status for 'concluido', deve ter data de conclusão
  if (this.status === 'concluido' && !this.dataConclusao) {
    this.dataConclusao = new Date();
  }
  
  next();
});

// Métodos estáticos
ProjectSchema.statics.buscarPorCodigo = function(codigo: string) {
  return this.findOne({ codigo: codigo.toUpperCase() }).populate('criadoPor', 'nome email');
};

ProjectSchema.statics.buscarPorStatus = function(status: StatusProjeto) {
  return this.find({ status }).populate('criadoPor', 'nome email').sort({ criadoEm: -1 });
};

ProjectSchema.statics.buscarAtivos = function() {
  return this.find({ 
    status: { $nin: ['concluido', 'cancelado'] } 
  }).populate('criadoPor', 'nome email').sort({ criadoEm: -1 });
};

ProjectSchema.statics.buscarPorCidade = function(cidade: string) {
  return this.find({ 
    cidade: new RegExp(cidade, 'i') 
  }).populate('criadoPor', 'nome email').sort({ criadoEm: -1 });
};

ProjectSchema.statics.gerarProximoCodigo = async function(): Promise<string> {
  // Buscar o último projeto criado para gerar próximo código
  const ultimoProjeto = await this.findOne({}, {}, { sort: { 'criadoEm': -1 } });
  
  if (!ultimoProjeto) {
    return 'LIS-0001'; // Primeiro projeto (Lisboa)
  }
  
  // Extrair número do código (ex: LIS-0315 -> 315)
  const ultimoNumero = parseInt(ultimoProjeto.codigo.split('-')[1]);
  const proximoNumero = ultimoNumero + 1;
  
  // Gerar próximo código com padding de zeros
  return `LIS-${proximoNumero.toString().padStart(4, '0')}`;
};

// Verificar se o modelo já existe
const Project = (mongoose.models.Project as ProjectModel) || 
               mongoose.model<ProjectDocument, ProjectModel>('Project', ProjectSchema);

export default Project;

// Funções utilitárias
export const ProjectUtils = {
  // Criar projeto com código automático
  async criarProjeto(dadosProjeto: {
    nomeHotel: string;
    endereco: string;
    cidade: string;
    distrito: string;
    codigoPostal: string;
    contato: {
      nome: string;
      telefone: string;
      email: string;
    };
    dataPrevista?: Date;
    observacoes?: string;
    criadoPor: string;
  }) {
    const codigo = await Project.gerarProximoCodigo();
    
    const projeto = new Project({
      ...dadosProjeto,
      codigo,
      criadoPor: new mongoose.Types.ObjectId(dadosProjeto.criadoPor)
    });
    
    return await projeto.save();
  },

  // Atualizar status do projeto
  async atualizarStatus(projectId: string, novoStatus: StatusProjeto, observacoes?: string) {
    const updateData: any = { 
      status: novoStatus,
      atualizadoEm: new Date()
    };
    
    // Se finalizar, adicionar data de conclusão
    if (novoStatus === 'concluido') {
      updateData.dataConclusao = new Date();
    }
    
    if (observacoes) {
      updateData.observacoes = observacoes;
    }
    
    return await Project.findByIdAndUpdate(projectId, updateData, { new: true });
  },

  // Buscar projetos com filtros
  async buscarComFiltros(filtros: {
    status?: StatusProjeto;
    cidade?: string;
    distrito?: string;
    dataInicio?: { inicio: Date; fim: Date };
  }) {
    const query: any = {};
    
    if (filtros.status) {
      query.status = filtros.status;
    }
    
    if (filtros.cidade) {
      query.cidade = new RegExp(filtros.cidade, 'i');
    }
    
    if (filtros.distrito) {
      query.distrito = new RegExp(filtros.distrito, 'i');
    }
    
    if (filtros.dataInicio) {
      query.dataInicio = {
        $gte: filtros.dataInicio.inicio,
        $lte: filtros.dataInicio.fim
      };
    }
    
    return await Project.find(query)
      .populate('criadoPor', 'nome email')
      .sort({ criadoEm: -1 });
  },

  // Calcular estatísticas do projeto
  async obterEstatisticas() {
    const stats = await Project.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const estatisticas = {
      total: 0,
      medicao: 0,
      producao: 0,
      logistica: 0,
      instalacao: 0,
      concluido: 0,
      cancelado: 0
    };
    
    stats.forEach(stat => {
      if (stat._id in estatisticas) {
        estatisticas[stat._id as keyof typeof estatisticas] = stat.count;
        estatisticas.total += stat.count;
      }
    });
    
    return estatisticas;
  }
};