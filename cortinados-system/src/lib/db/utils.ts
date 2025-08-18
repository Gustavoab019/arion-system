import connectToDatabase from '../mongodb';
import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// DATABASE UTILITIES - SISTEMA DE GESTÃO DE CORTINADOS
// =============================================================================

/**
 * Interface para respostas padronizadas da API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

/**
 * Cria uma resposta padronizada para a API
 * 
 * @param success - Se a operação foi bem-sucedida
 * @param data - Dados a serem retornados
 * @param message - Mensagem adicional
 * @param error - Mensagem de erro
 * @param status - Status HTTP (padrão: 200 para sucesso, 400 para erro)
 */
export function createApiResponse<T>(
  success: boolean,
  data?: T,
  message?: string,
  error?: string,
  status?: number
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success,
    timestamp: new Date().toISOString(),
  };

  if (success) {
    if (data !== undefined) response.data = data;
    if (message) response.message = message;
  } else {
    if (error) response.error = error;
  }

  return NextResponse.json(response, { 
    status: status || (success ? 200 : 400) 
  });
}

/**
 * Wrapper para API routes que garante conexão com o banco
 * e trata erros de forma padronizada
 * 
 * @param handler - Função handler da API route
 * @returns Handler com conexão garantida e tratamento de erros
 */
export function withDatabase<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Garante conexão com o banco
      await connectToDatabase();
      
      // Executa o handler
      return await handler(request, ...args);
      
    } catch (error) {
      console.error('❌ Erro na API route:', error);
      
      // Trata diferentes tipos de erro
      if (error instanceof Error) {
        // Erros de conexão com MongoDB
        if (error.message.includes('MONGODB_URI')) {
          return createApiResponse(
            false,
            null,
            undefined,
            'Erro de configuração do banco de dados',
            500
          );
        }
        
        // Erros de validação do Mongoose
        if (error.name === 'ValidationError') {
          return createApiResponse(
            false,
            null,
            undefined,
            `Erro de validação: ${error.message}`,
            400
          );
        }
        
        // Erros de duplicação (unique constraints)
        if (error.message.includes('duplicate key')) {
          return createApiResponse(
            false,
            null,
            undefined,
            'Dados duplicados - registro já existe',
            409
          );
        }
        
        // Erro genérico
        return createApiResponse(
          false,
          null,
          undefined,
          process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'Erro interno do servidor',
          500
        );
      }
      
      // Erro desconhecido
      return createApiResponse(
        false,
        null,
        undefined,
        'Erro interno do servidor',
        500
      );
    }
  };
}

/**
 * Valida se um ObjectId do MongoDB é válido
 * 
 * @param id - String do ObjectId
 * @returns boolean
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Extrai parâmetros de query de forma segura
 * 
 * @param request - NextRequest
 * @param param - Nome do parâmetro
 * @returns string | null
 */
export function getQueryParam(request: NextRequest, param: string): string | null {
  const url = new URL(request.url);
  return url.searchParams.get(param);
}

/**
 * Extrai múltiplos parâmetros de query
 * 
 * @param request - NextRequest
 * @param params - Array de nomes dos parâmetros
 * @returns Record<string, string | null>
 */
export function getQueryParams(
  request: NextRequest, 
  params: string[]
): Record<string, string | null> {
  const url = new URL(request.url);
  const result: Record<string, string | null> = {};
  
  params.forEach(param => {
    result[param] = url.searchParams.get(param);
  });
  
  return result;
}

/**
 * Parseia o body de uma requisição de forma segura
 * 
 * @param request - NextRequest
 * @returns Promise<any>
 */
export async function parseRequestBody(request: NextRequest): Promise<any> {
  try {
    const body = await request.json();
    return body;
  } catch (error) {
    throw new Error('Body da requisição inválido - JSON malformado');
  }
}

/**
 * Sanitiza dados de entrada removendo campos sensíveis
 * 
 * @param data - Objeto a ser sanitizado
 * @param excludeFields - Campos a serem removidos
 * @returns Objeto sanitizado
 */
export function sanitizeData<T extends Record<string, any>>(
  data: T,
  excludeFields: string[] = ['password', '__v', 'createdAt', 'updatedAt']
): Partial<T> {
  const sanitized = { ...data };
  
  excludeFields.forEach(field => {
    delete sanitized[field];
  });
  
  return sanitized;
}

/**
 * Formata erros de validação do Mongoose
 * 
 * @param error - Erro do Mongoose
 * @returns String formatada com os erros
 */
export function formatValidationErrors(error: any): string {
  if (error.name !== 'ValidationError') return error.message;
  
  const errors = Object.values(error.errors).map((err: any) => err.message);
  return errors.join(', ');
}

/**
 * Middleware para logs de requisições (desenvolvimento)
 * 
 * @param request - NextRequest
 * @param context - Contexto adicional
 */
export function logRequest(request: NextRequest, context?: string): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const method = request.method;
  const url = request.url;
  const timestamp = new Date().toISOString();
  
  console.log(`🌐 [${timestamp}] ${method} ${url}${context ? ` - ${context}` : ''}`);
}

/**
 * Valida campos obrigatórios em um objeto
 * 
 * @param data - Objeto a ser validado
 * @param requiredFields - Campos obrigatórios
 * @throws Error se algum campo estiver faltando
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => 
    data[field] === undefined || data[field] === null || data[field] === ''
  );
  
  if (missingFields.length > 0) {
    throw new Error(`Campos obrigatórios faltando: ${missingFields.join(', ')}`);
  }
}

/**
 * Paginação para consultas MongoDB
 * 
 * @param page - Número da página (começando em 1)
 * @param limit - Itens por página
 * @returns Objeto com skip e limit para o Mongoose
 */
export function getPaginationParams(page: number = 1, limit: number = 10) {
  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.min(100, Math.max(1, limit)); // Máximo 100 itens
  
  return {
    skip: (normalizedPage - 1) * normalizedLimit,
    limit: normalizedLimit,
    page: normalizedPage,
  };
}

/**
 * Formata resposta paginada
 * 
 * @param data - Dados da página atual
 * @param total - Total de itens
 * @param page - Página atual
 * @param limit - Itens por página
 */
export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}