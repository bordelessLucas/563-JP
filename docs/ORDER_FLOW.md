# Order Flow

```text
Carrinho (totais estimados no client — só UI)
  → Destinatário (buyer ≠ recipient)
  → Endereço
  → Agenda
  → createDeliveryQuote (backend)
  → createCheckout (re-cota + pricing servidor + order awaiting_payment)
  → PaymentService.createPayment
  → Approved (mock só com ENABLE_MOCK_PAYMENT; futuro webhook gateway)
  → markOrderPreparing
  → markOrderReady (ready_for_pickup)
  → requestDelivery (Uber Direct / mock)  ← nunca em paid/preparing
  → Webhooks Uber
  → Delivered
```

## Regras

1. Uber só com `payment.status === approved` **e** `ready_for_pickup`
2. `exception` **não** libera create Uber
3. Retry: `deliveryCreationState === failed` (+ approved + ready)
4. Ambíguo (timeout): `uncertain` → reconciliar, sem retry cego
5. Totais: só backend; client `feeCents` ignorado no checkout
6. Status críticos: só callables / Admin SDK (Firestore update client = deny)

## Callables

Cliente: `createDeliveryQuote`, `createCheckout`, `simulateMockPayment` (dev), `getOrder`, `cancelOrder`  
Admin: `markOrderPreparing`, `markOrderReady`, `requestDelivery`, `retryDelivery`, `reconcileDelivery`

Auth: `request.auth` + role admin em Firestore `users/{uid}.role` (nunca confiar em flag do client).

## Lint

```bash
npm run lint
```

(ESLint via `expo lint` / `eslint-config-expo`.)
