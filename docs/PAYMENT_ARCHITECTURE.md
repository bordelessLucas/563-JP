# Payment Architecture

## Princípio

```text
OrderService → PaymentService → PaymentProvider
```

`PAYMENT_PROVIDER=mock|mercadopago|asaas`

## Fail-closed (mock)

Simulação (`simulateMockPayment`) só se **todas** forem verdadeiras:

```text
PAYMENT_PROVIDER=mock
AND ENABLE_MOCK_PAYMENT=true
AND ambiente ≠ production
```

`APP_ENV` omitido / desconhecido → tratado como production para features perigosas.

Em production:

- `PAYMENT_PROVIDER=mock` → `INVALID_RUNTIME_CONFIGURATION` no boot
- `ENABLE_MOCK_PAYMENT=true` → `INVALID_RUNTIME_CONFIGURATION`

## Admin auth

Preferir custom claim `admin: true` (sincronizado por `syncAdminClaims` quando `users/{uid}.role` muda).  
Firestore `role` permanece fallback até o token ser renovado (`getIdToken(true)` / re-login).

## Placeholders

`MercadoPagoProvider` / `AsaasProvider` **não** são ativáveis.

`PAYMENT_PROVIDER=mercadopago|asaas` → `PAYMENT_PROVIDER_NOT_IMPLEMENTED` (501).

Quando implementar: provider real + secrets + webhook + trocar env. Uber Direct não muda.

## Contrato

Valores em **centavos**. Status: `pending|approved|failed|cancelled|refund_*`.

Totais finais só do backend (`PricingService` + quote). Carrinho no app é **estimativa de UI**.
