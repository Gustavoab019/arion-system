// Arquivo: /src/lib/types/mongoose.ts - CRIAR
import { Types } from 'mongoose';

// Tipos auxiliares para converter DocumentArrays e ObjectIds
export type PopulatedDocument<T> = T extends Types.ObjectId ? any : T;

export type SafeMongooseDocument<T> = {
  [K in keyof T]: T[K] extends Types.ObjectId 
    ? string | PopulatedDocument<T[K]>
    : T[K] extends Types.Array<infer U>
    ? Array<SafeMongooseDocument<U>>
    : T[K] extends Date
    ? Date | string
    : T[K]
} & {
  _id: string;
};

// Função helper para converter ObjectId para string
export function toObjectId(id: string | Types.ObjectId): Types.ObjectId {
  return typeof id === 'string' ? new Types.ObjectId(id) : id;
}

// Função helper para converter para string
export function toString(id: string | Types.ObjectId): string {
  return typeof id === 'string' ? id : id.toString();
}

// Função para extrair dados populados de forma segura
export function extractPopulatedData<T>(doc: any, fallback: T): T {
  if (!doc) return fallback;
  
  // Se é um documento Mongoose populado
  if (doc._doc) {
    return doc._doc as T;
  }
  
  // Se é um objeto simples
  return doc as T;
}