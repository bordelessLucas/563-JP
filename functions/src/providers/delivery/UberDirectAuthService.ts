import { getUberConfig } from "../../config";
import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";

type TokenCache = {
  accessToken: string;
  expiresAtMs: number;
};

export class UberDirectAuthService {
  private cache: TokenCache | null = null;
  private inflight: Promise<string> | null = null;

  invalidate() {
    this.cache = null;
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAtMs > now + 60_000) {
      return this.cache.accessToken;
    }
    if (this.inflight) {
      return this.inflight;
    }
    this.inflight = this.fetchToken().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async fetchToken(): Promise<string> {
    const config = getUberConfig();
    if (!config.clientId || !config.clientSecret) {
      throw new AppError({
        code: "uber_auth_not_configured",
        message: "Uber Direct credentials missing",
        publicMessage: "Entrega indisponível no momento.",
        status: 503,
      });
    }

    logger.info("uber.auth.token_request", { mode: config.mode });

    const body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "client_credentials",
      scope: "eats.deliveries",
    });

    const response = await fetch(config.authUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      logger.error("uber.auth.token_failed", { status: response.status });
      throw new AppError({
        code: "uber_auth_failed",
        message: `Uber auth failed with ${response.status}`,
        publicMessage: "Não foi possível autenticar o serviço de entrega.",
        status: 502,
      });
    }

    const json = (await response.json()) as {
      access_token?: string;
      expires_in?: number;
    };

    if (!json.access_token) {
      throw new AppError({
        code: "uber_auth_invalid_response",
        message: "Uber auth response missing access_token",
        publicMessage: "Não foi possível autenticar o serviço de entrega.",
        status: 502,
      });
    }

    const expiresInSec = Number(json.expires_in ?? 2592000);
    this.cache = {
      accessToken: json.access_token,
      expiresAtMs: Date.now() + expiresInSec * 1000,
    };

    logger.info("uber.auth.token_cached", {
      expiresInSec,
    });

    return json.access_token;
  }
}

export const uberDirectAuthService = new UberDirectAuthService();
