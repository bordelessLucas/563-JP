# Deploy seguro — Uber Direct + pagamentos

**Não execute deploy até revisar secrets e `APP_ENV`.**

Esta página descreve a sequência; não contém valores reais.

## Pré-requisitos

1. Firebase CLI autenticado no projeto `jp-6a9d2`
2. Node 20 para `functions/`
3. Decisão de gateway (Mercado Pago × Asaas) — ainda placeholder

## 1. Secrets (Secret Manager)

```bash
firebase functions:secrets:set UBER_DIRECT_CLIENT_SECRET
firebase functions:secrets:set UBER_DIRECT_WEBHOOK_SIGNING_KEY
```

Nunca coloque secrets em `.env` versionado, `EXPO_PUBLIC_*`, Firestore ou o app.

## 2. Params / env não sensíveis

Exemplos (valores ilustrativos):

```text
APP_ENV=staging          # production | staging | development | test
PAYMENT_PROVIDER=mock    # em produção NÃO usar mock
DELIVERY_PROVIDER=mock   # ou uber_direct quando secrets ok
ENABLE_MOCK_PAYMENT=false
UBER_DIRECT_MODE=test
UBER_DIRECT_CLIENT_ID=...
UBER_DIRECT_CUSTOMER_ID=...
```

`ENABLE_MOCK_PAYMENT=true` é **proibido** em produção (`validateRuntimeConfig`).

`APP_ENV` omitido é tratado como produção para features perigosas (fail-closed).

## 3. Validar providers

- `PAYMENT_PROVIDER=mock` → só fora de produção + `ENABLE_MOCK_PAYMENT=true` para simular
- `PAYMENT_PROVIDER=mercadopago|asaas` → falha explícita até implementação
- `DELIVERY_PROVIDER=uber_direct` → exige client id/secret, customer id, webhook signing key

## 4. Qualidade local

```bash
npm run typecheck
npm run functions:test
```

Lint automatizado: **ainda não configurado** neste repositório.

## 5. Revisar rules

Confirme `firestore.rules`: `orders` sem create/update/delete pelo client SDK.

## 6. Deploy (quando aprovado)

```bash
npm --prefix functions run build
firebase deploy --only functions
firebase deploy --only firestore:rules
```

Ordem sugerida: functions → rules → smoke test.

## 7. Test Mode Uber

Manter `UBER_DIRECT_MODE=test` até checklist de produção.

Registrar URL HTTPS do `uberDirectWebhook` no dashboard Uber (Test Mode).

## 8. Produção Uber (depois)

1. Secrets de produção
2. `DELIVERY_PROVIDER=uber_direct`
3. `UBER_DIRECT_MODE=production` (somente quando autorizado)
4. `PAYMENT_PROVIDER` real (não mock)
5. `APP_ENV=production`
6. `ENABLE_MOCK_PAYMENT=false`

## Pendências externas

- Credenciais Uber produção
- Escolha Mercado Pago × Asaas + credenciais
- Provider de geocoding (coordenadas obrigatórias para Uber; sem inventar lat/lng)
