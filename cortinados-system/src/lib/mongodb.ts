import mongoose from 'mongoose';

// Cache da conexão para evitar múltiplas conexões em desenvolvimento
declare global {
  var mongoose: any;
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    'Por favor, defina a variável MONGODB_URI no arquivo .env.local'
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB conectado com sucesso');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ Erro ao conectar com MongoDB:', e);
    throw e;
  }

  return cached.conn;
}

// Função para desconectar (útil para testes)
export async function disconnectDB() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('🔌 MongoDB desconectado');
  }
}

// Função para verificar status da conexão
export function getConnectionStatus() {
  return {
    isConnected: mongoose.connection.readyState === 1,
    status: mongoose.connection.readyState,
    states: {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }
  };
}

export default connectDB;