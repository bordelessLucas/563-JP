export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly publicMessage: string;
  readonly details?: Record<string, unknown>;

  constructor(input: {
    code: string;
    message: string;
    publicMessage?: string;
    status?: number;
    details?: Record<string, unknown>;
  }) {
    super(input.message);
    this.name = "AppError";
    this.code = input.code;
    this.status = input.status ?? 400;
    this.publicMessage = input.publicMessage ?? input.message;
    this.details = input.details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toPublicError(error: unknown): {
  code: string;
  message: string;
  status: number;
} {
  if (isAppError(error)) {
    return {
      code: error.code,
      message: error.publicMessage,
      status: error.status,
    };
  }
  return {
    code: "internal",
    message: "Não foi possível concluir a operação.",
    status: 500,
  };
}
