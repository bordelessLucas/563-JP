# Uber Direct

## Visão geral

Integração **somente no backend** (`functions/`), via `DeliveryService` → `DeliveryProvider`.

- `DELIVERY_PROVIDER=mock|uber_direct` (default `mock`)
- Produção com `uber_direct` exige secrets no Secret Manager
- App Expo nunca recebe Client Secret, token ou signing key

## Secrets vs config

| Não sensível | Sensível (Secret Manager) |
|--------------|---------------------------|
| `DELIVERY_PROVIDER` | `UBER_DIRECT_CLIENT_SECRET` |
| `UBER_DIRECT_MODE` | `UBER_DIRECT_WEBHOOK_SIGNING_KEY` |
| `UBER_DIRECT_CLIENT_ID` | |
| `UBER_DIRECT_CUSTOMER_ID` | |

Ver `docs/DEPLOYMENT.md`.

## Autenticação

`UberDirectAuthService`: OAuth `client_credentials`, scope `eats.deliveries`, cache em memória. Nunca loga secret/token.

## Cotação / Create

- Quote e create passam por `DeliveryService`
- Coordenadas obrigatórias quando `uber_direct` (`MISSING_COORDINATES` / sem inventar)
- Geocoding externo: `GeocodingProvider` desacoplado; default `GEOCODING_NOT_CONFIGURED`

## Quando criar Uber

Somente `requestDelivery` (admin callable) quando:

1. `payment.status === approved`
2. `orderStatus === ready_for_pickup` (ou alias `ready_for_delivery`)
3. `deliveryCreationState` em `not_started` | `failed`

Lock: `not_started|failed → creating → created|failed|uncertain`.

Timeout / rede ambígua → `uncertain` (sem retry cego).

Reconcile:

1. Se há `externalDeliveryId` → GET delivery
2. Se não → busca por `external_id` / `idempotency_key` (= `orderId`)
3. Se achar → anexa ID e marca `created`
4. Se não achar → marca `failed` (retry seguro: create usa `idempotency_key`)

## Webhook

`uberDirectWebhook`:

- HMAC SHA-256 no raw body (`INVALID_WEBHOOK_SIGNATURE`)
- Claim atômico com status `processing|processed|failed`
- Lease para `processing` stale; `failed` pode reprocessar
- `503` se ainda em voo (Uber pode retentar)
- Sem payload sensível nos logs

## Test Mode

Manter `UBER_DIRECT_MODE=test` em desenvolvimento.
