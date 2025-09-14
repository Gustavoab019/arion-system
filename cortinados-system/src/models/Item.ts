import mongoose, { Schema, Document, Model } from 'mongoose';
import QRCode from 'qrcode';
import { Item as IItem, TipoItem, StatusItem, Medidas } from '@/types';

// Interface que combina o tipo Item com Document do Mongoose
export interface ItemDocument extends Document {
  codigo: string;
  projeto: mongoose.Types.ObjectId;
  tipo: TipoItem;
  ambiente: string;
  medidas?: {
    largura: number;
    altura: number;
    profundidade?: number;
    observacoes?: string;
  };
  status: StatusItem;
  qrCode: string;
  qrCodeUrl: string;
  
  medicao?: {
    medidoPor: mongoose.Types.ObjectId;
    dataEm: Date;
    observacoes?: string;
  };
  
  producao?: {
    iniciadoEm?: Date;
    finalizadoEm?: Date;
    produzidoPor?: mongoose.Types.ObjectId;
    observacoes?: string;
  };
  
  logistica?: {
    processadoEm?: Date;
    processadoPor?: mongoose.Types.ObjectId;
    observacoes?: string;
  };
  
  instalacao?: {
    instaladoEm?: Date;
    instaladoPor?: mongoose.Types.ObjectId;
    observacoes?: string;
  };
  
  criadoEm: Date;
  atualizadoEm: Date;
}

// Interface para métodos estáticos
export interface ItemModel extends Model<ItemDocument> {
  buscarPorCodigo(codigo: string): Promise<ItemDocument | null>;
  buscarPorProjeto(projetoId: string): Promise<ItemDocument[]>;
  buscarPorStatus(status: StatusItem): Promise<ItemDocument[]>;
  buscarPorTipo(tipo: TipoItem): Promise<ItemDocument[]>;
  gerarCodigoItem(projetoId: string, tipo: TipoItem): Promise<string>;
  buscarPendentesPorRegiao(cidade?: string): Promise<ItemDocument[]>;
  buscarPorCodigoParcial(codigoParcial: string): Promise<ItemDocument[]>;
  historicoMedidor(medidorId: string, limit?: number, skip?: number): Promise<ItemDocument[]>;
  estatisticasPorMedidor(medidorId: string, dataInicio?: Date, dataFim?: Date): Promise<any[]>;
}

// Sub-schema para medidas
const MedidasSchema = new Schema({
  largura: {
    type: Number,
    required: [true, 'Largura é obrigatória'],
    min: [0.1, 'Largura deve ser maior que 0']
  },
  altura: {
    type: Number,
    required: [true, 'Altura é obrigatória'],
    min: [0.1, 'Altura deve ser maior que 0']
  },
  profundidade: {
    type: Number,
    min: [0, 'Profundidade não pode ser negativa']
  },
  observacoes: {
    type: String,
    trim: true,
    maxlength: [500, 'Observações não podem ter mais de 500 caracteres']
  }
}, { _id: false });

// Sub-schema para histórico de medição
const MedicaoSchema = new Schema({
  medidoPor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dataEm: {
    type: Date,
    required: true,
    default: Date.now
  },
  observacoes: {
    type: String,
    trim: true,
    maxlength: [500, 'Observações não podem ter mais de 500 caracteres']
  }
}, { _id: false });

// Sub-schema para produção
const ProducaoSchema = new Schema({
  iniciadoEm: Date,
  finalizadoEm: Date,
  produzidoPor: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  observacoes: {
    type: String,
    trim: true,
    maxlength: [500, 'Observações não podem ter mais de 500 caracteres']
  }
}, { _id: false });

// Sub-schema para logística
const LogisticaSchema = new Schema({
  processadoEm: Date,
  processadoPor: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  observacoes: {
    type: String,
    trim: true,
    maxlength: [500, 'Observações não podem ter mais de 500 caracteres']
  }
}, { _id: false });

// Sub-schema para instalação
const InstalacaoSchema = new Schema({
  instaladoEm: Date,
  instaladoPor: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  observacoes: {
    type: String,
    trim: true,
    maxlength: [500, 'Observações não podem ter mais de 500 caracteres']
  }
}, { _id: false });

// Schema principal do item
const ItemSchema = new Schema<ItemDocument>({
  codigo: {
    type: String,
    required: [true, 'Código é obrigatório'],
    unique: true,
    trim: true,
    uppercase: true,
    match: [/^[A-Z]{3}-\d{4}-\d{2}-(TRK|CRT)$/, 'Código deve ter formato ABC-1234-01-TRK']
  },
  
  projeto: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Projeto é obrigatório']
  },
  
  tipo: {
    type: String,
    required: [true, 'Tipo é obrigatório'],
    enum: {
      values: ['cortina', 'calha'],
      message: 'Tipo deve ser cortina ou calha'
    }
  },
  
  ambiente: {
    type: String,
    required: [true, 'Ambiente é obrigatório'],
    trim: true,
    maxlength: [100, 'Ambiente não pode ter mais de 100 caracteres']
  },
  
  medidas: MedidasSchema,
  
  status: {
    type: String,
    required: [true, 'Status é obrigatório'],
    enum: {
      values: ['pendente', 'medido', 'producao', 'produzido', 'logistica', 'instalado', 'cancelado'],
      message: 'Status inválido'
    },
    default: 'pendente'
  },
  
  qrCode: {
    type: String,
    required: [true, 'QR Code é obrigatório']
  },
  
  qrCodeUrl: {
    type: String,
    required: [true, 'URL do QR Code é obrigatória']
  },
  
  medicao: MedicaoSchema,
  producao: ProducaoSchema,
  logistica: LogisticaSchema,
  instalacao: InstalacaoSchema
  
}, {
  timestamps: { 
    createdAt: 'criadoEm', 
    updatedAt: 'atualizadoEm' 
  }
});

// Índices para melhor performance
ItemSchema.index({ projeto: 1 });
ItemSchema.index({ status: 1 });
ItemSchema.index({ tipo: 1 });
ItemSchema.index({ codigo: 1 });
ItemSchema.index({ 'medicao.medidoPor': 1 });

// Middleware para gerar QR Code antes de salvar
ItemSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('codigo')) {
    try {
      const baseUrl = process.env.QR_BASE_URL || 'http://localhost:3000/track';
      this.qrCodeUrl = `${baseUrl}/${this.codigo}`;
      
      this.qrCode = await QRCode.toString(this.qrCodeUrl, {
        type: 'svg',
        width: 200,
        margin: 2
      });
      
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      return next(new Error('Erro ao gerar QR Code'));
    }
  }
  
  next();
});

// Métodos estáticos existentes
ItemSchema.statics.buscarPorCodigo = function(codigo: string) {
  return this.findOne({ codigo: codigo.toUpperCase() })
    .populate('projeto', 'codigo nomeHotel cidade')
    .populate('medicao.medidoPor', 'nome role')
    .populate('producao.produzidoPor', 'nome role')
    .populate('logistica.processadoPor', 'nome role')
    .populate('instalacao.instaladoPor', 'nome role');
};

ItemSchema.statics.buscarPorProjeto = function(projetoId: string) {
  return this.find({ projeto: projetoId })
    .populate('projeto', 'codigo nomeHotel cidade')
    .populate('medicao.medidoPor', 'nome role')
    .populate('producao.produzidoPor', 'nome role')
    .populate('logistica.processadoPor', 'nome role')
    .populate('instalacao.instaladoPor', 'nome role')
    .sort({ criadoEm: 1 });
};

ItemSchema.statics.buscarPorStatus = function(status: StatusItem) {
  return this.find({ status })
    .populate('projeto', 'codigo nomeHotel cidade')
    .sort({ criadoEm: -1 });
};

ItemSchema.statics.buscarPorTipo = function(tipo: TipoItem) {
  return this.find({ tipo })
    .populate('projeto', 'codigo nomeHotel cidade')
    .sort({ criadoEm: -1 });
};

ItemSchema.statics.gerarCodigoItem = async function(projetoId: string, tipo: TipoItem): Promise<string> {
  const Project = mongoose.model('Project');
  const projeto = await Project.findById(projetoId);
  
  if (!projeto) {
    throw new Error('Projeto não encontrado');
  }
  
  const countItens = await this.countDocuments({ projeto: projetoId });
  const proximoNumero = countItens + 1;
  
  const sufixo = tipo === 'calha' ? 'TRK' : 'CRT';
  
  return `${projeto.codigo}-${proximoNumero.toString().padStart(2, '0')}-${sufixo}`;
};

// Novos métodos estáticos para o medidor
ItemSchema.statics.buscarPendentesPorRegiao = function(cidade?: string) {
  const query: any = { status: 'pendente' };
  
  if (cidade) {
    return this.find(query)
      .populate({
        path: 'projeto',
        match: { cidade: new RegExp(cidade, 'i') },
        select: 'codigo nomeHotel cidade'
      })
      .sort({ criadoEm: 1 });
  }
  
  return this.find(query)
    .populate('projeto', 'codigo nomeHotel cidade')
    .sort({ criadoEm: 1 });
};

ItemSchema.statics.buscarPorCodigoParcial = function(codigoParcial: string) {
  return this.find({ 
    codigo: new RegExp(codigoParcial.toUpperCase(), 'i'),
    status: 'pendente'
  })
  .populate('projeto', 'codigo nomeHotel cidade')
  .limit(10)
  .sort({ codigo: 1 });
};

ItemSchema.statics.historicoMedidor = function(medidorId: string, limit = 20, skip = 0) {
  return this.find({
    'medicao.medidoPor': medidorId
  })
  .populate('projeto', 'codigo nomeHotel cidade')
  .select('codigo tipo ambiente medidas medicao status')
  .sort({ 'medicao.dataEm': -1 })
  .skip(skip)
  .limit(limit);
};

ItemSchema.statics.estatisticasPorMedidor = function(medidorId: string, dataInicio?: Date, dataFim?: Date) {
  const matchQuery: any = {
    'medicao.medidoPor': new mongoose.Types.ObjectId(medidorId)
  };
  
  if (dataInicio || dataFim) {
    matchQuery['medicao.dataEm'] = {};
    if (dataInicio) matchQuery['medicao.dataEm'].$gte = dataInicio;
    if (dataFim) matchQuery['medicao.dataEm'].$lte = dataFim;
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          tipo: '$tipo',
          data: { $dateToString: { format: '%Y-%m-%d', date: '$medicao.dataEm' } }
        },
        quantidade: { $sum: 1 },
        tempoMedio: { 
          $avg: { 
            $subtract: ['$medicao.dataEm', '$criadoEm'] 
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        totalMedicoes: { $sum: '$quantidade' },
        porTipo: {
          $push: {
            tipo: '$_id.tipo',
            quantidade: '$quantidade'
          }
        },
        porDia: {
          $push: {
            data: '$_id.data',
            quantidade: '$quantidade'
          }
        }
      }
    }
  ]);
};

// Verificar se o modelo já existe
const Item = (mongoose.models.Item as ItemModel) || 
             mongoose.model<ItemDocument, ItemModel>('Item', ItemSchema);

export default Item;

// Funções utilitárias
export const ItemUtils = {
  // Criar item com código automático
  async criarItem(dadosItem: {
    projeto: string;
    tipo: TipoItem;
    ambiente: string;
  }) {
    const codigo = await Item.gerarCodigoItem(dadosItem.projeto, dadosItem.tipo);
    
    const item = new Item({
      ...dadosItem,
      codigo,
      projeto: new mongoose.Types.ObjectId(dadosItem.projeto)
    });
    
    return await item.save();
  },

  // Registrar medidas
  async registrarMedidas(itemId: string, medidas: Medidas, medidoPor: string, observacoes?: string) {
    const updateData = {
      status: 'medido',
      medidas,
      medicao: {
        medidoPor: new mongoose.Types.ObjectId(medidoPor),
        dataEm: new Date(),
        observacoes
      },
      atualizadoEm: new Date()
    };
    
    return await Item.findByIdAndUpdate(itemId, updateData, { new: true });
  },

  // Atualizar status com histórico
  async atualizarStatus(itemId: string, novoStatus: StatusItem, userId: string, observacoes?: string) {
    const updateData: any = {
      status: novoStatus,
      atualizadoEm: new Date()
    };
    
    const agora = new Date();
    const userObjectId = new mongoose.Types.ObjectId(userId);
    
    switch (novoStatus) {
      case 'producao':
        updateData.producao = {
          iniciadoEm: agora,
          produzidoPor: userObjectId,
          observacoes
        };
        break;
        
      case 'produzido':
        updateData['producao.finalizadoEm'] = agora;
        if (observacoes) updateData['producao.observacoes'] = observacoes;
        break;
        
      case 'logistica':
        updateData.logistica = {
          processadoEm: agora,
          processadoPor: userObjectId,
          observacoes
        };
        break;
        
      case 'instalado':
        updateData.instalacao = {
          instaladoEm: agora,
          instaladoPor: userObjectId,
          observacoes
        };
        break;
    }
    
    return await Item.findByIdAndUpdate(itemId, updateData, { new: true });
  },

  // Buscar itens com filtros
  async buscarComFiltros(filtros: {
    projeto?: string;
    status?: StatusItem;
    tipo?: TipoItem;
    ambiente?: string;
  }) {
    const query: any = {};
    
    if (filtros.projeto) {
      query.projeto = filtros.projeto;
    }
    
    if (filtros.status) {
      query.status = filtros.status;
    }
    
    if (filtros.tipo) {
      query.tipo = filtros.tipo;
    }
    
    if (filtros.ambiente) {
      query.ambiente = new RegExp(filtros.ambiente, 'i');
    }
    
    return await Item.find(query)
      .populate('projeto', 'codigo nomeHotel cidade')
      .sort({ criadoEm: -1 });
  },

  // Obter estatísticas
  async obterEstatisticas() {
    const stats = await Item.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const estatisticas = {
      total: 0,
      pendente: 0,
      medido: 0,
      producao: 0,
      produzido: 0,
      logistica: 0,
      instalado: 0,
      cancelado: 0
    };
    
    stats.forEach(stat => {
      if (stat._id in estatisticas) {
        estatisticas[stat._id as keyof typeof estatisticas] = stat.count;
        estatisticas.total += stat.count;
      }
    });
    
    return estatisticas;
  },

  // Gerar QR Code como imagem
  async gerarQRCodeImagem(codigo: string) {
    const item = await Item.buscarPorCodigo(codigo);
    if (!item) {
      throw new Error('Item não encontrado');
    }
    
    const qrCodePNG = await QRCode.toDataURL(item.qrCodeUrl, {
      width: 300,
      margin: 2
    });
    
    return qrCodePNG;
  },

  // Busca inteligente
  async buscarInteligente(termo: string, limite = 10) {
    // Busca por código exato primeiro
    let resultados = await Item.find({
      codigo: termo.toUpperCase(),
      status: 'pendente'
    })
    .populate('projeto', 'codigo nomeHotel cidade')
    .limit(limite);
    
    // Se não encontrou por código, busca por código parcial
    if (resultados.length === 0) {
      resultados = await Item.buscarPorCodigoParcial(termo);
    }
    
    // Se ainda não encontrou, busca por ambiente
    if (resultados.length === 0) {
      resultados = await Item.find({
        ambiente: new RegExp(termo, 'i'),
        status: 'pendente'
      })
      .populate('projeto', 'codigo nomeHotel cidade')
      .limit(limite);
    }
    
    return resultados;
  },

  // Dashboard stats para medidor
  async obterStatsMedidor(medidorId: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    const estaSemana = new Date(hoje);
    estaSemana.setDate(hoje.getDate() - hoje.getDay());
    
    const esteMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    
    const [statsHoje, statsEstaSemana, statsEsteMes, historicoRecente] = await Promise.all([
      // Hoje
      Item.countDocuments({
        'medicao.medidoPor': medidorId,
        'medicao.dataEm': { $gte: hoje }
      }),
      
      // Esta semana
      Item.countDocuments({
        'medicao.medidoPor': medidorId,
        'medicao.dataEm': { $gte: estaSemana }
      }),
      
      // Este mês
      Item.countDocuments({
        'medicao.medidoPor': medidorId,
        'medicao.dataEm': { $gte: esteMes }
      }),
      
      // Histórico recente
      Item.historicoMedidor(medidorId, 5, 0)
    ]);
    
    return {
      hoje: statsHoje,
      estaSemana: statsEstaSemana,
      esteMes: statsEsteMes,
      historicoRecente,
      meta: {
        diaria: 20,
        semanal: 100,
        mensal: 400
      }
    };
  }
};