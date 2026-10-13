export class ApiError extends Error {
  constructor(public key: string, public status = 400, public fields: Record<string, string[]> = {}) { super(key); }
}
export function errorKey(error: unknown) { return error instanceof ApiError ? error.key : 'error.generic'; }
