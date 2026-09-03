import { FirebaseError } from "firebase/app";
import { useState } from "react";

import {
    registerWithEmail,
    requestPasswordReset,
    signInWithEmail,
} from "@/src/services/auth.service";

type AuthActionResult = Promise<boolean>;

function getAuthMessage(error: unknown): string {
  if (!(error instanceof FirebaseError)) {
    return "Não foi possível concluir a operação. Tente novamente.";
  }

  const messages: Record<string, string> = {
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/invalid-credential": "E-mail ou senha inválidos.",
    "auth/invalid-email": "Informe um e-mail válido.",
    "auth/weak-password": "A senha precisa ter pelo menos 6 caracteres.",
    "auth/user-disabled": "Esta conta está temporariamente desativada.",
    "auth/user-not-found": "Não encontramos uma conta com este e-mail.",
  };

  return (
    messages[error.code] ??
    "Não foi possível concluir a operação. Tente novamente."
  );
}

export function useAuthActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const run = async (action: () => Promise<void>): AuthActionResult => {
    setLoading(true);
    setError(undefined);

    try {
      await action();
      return true;
    } catch (actionError: unknown) {
      setError(getAuthMessage(actionError));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const login = (
    email: string,
    password: string,
    action = async () => {
      await signInWithEmail(email, password);
    },
  ): AuthActionResult =>
    run(async () => {
      await action();
    });

  const register = (
    name: string,
    email: string,
    password: string,
    action = async () => {
      await registerWithEmail(name, email, password);
    },
  ): AuthActionResult =>
    run(async () => {
      await action();
    });

  const requestReset = (email: string): AuthActionResult =>
    run(async () => {
      await requestPasswordReset(email);
    });

  return { error, loading, login, register, requestReset };
}
