import { EventEmitter } from 'events';

// A classe de erro personalizada para fornecer mais contexto sobre falhas de segurança do Firestore.
export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `Firestore Permission Denied: The following request was denied by Firestore Security Rules:
{
  "operation": "${context.operation}",
  "path": "${context.path}",
  "resource": ${JSON.stringify(context.requestResourceData, null, 2)}
}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
  }
}

export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  requestResourceData?: any;
};

// EventEmitter para transmitir erros de forma centralizada na aplicação.
export const errorEmitter = new EventEmitter();
