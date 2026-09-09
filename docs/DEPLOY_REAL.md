# Guia para o próximo agente — deploy REAL (produção)

Objetivo: operar checkout com **pagamento real** e/ou **Uber Direct**, sem mock. Use só depois do mock estável (`docs/DEPLOY_MOCK.md`) e com credenciais aprovadas pelo cliente.

Leia também: `docs/DEPLOYMENT.md`, `docs/UBER_DIRECT.md`, `docs/PAYMENT_ARCHITECTURE.md`, `docs/ORDER_FLOW.md`.

---

## Aviso

- `PAYMENT_PROVIDER=mercadopago` e `asaas` estão como **placeholders** no código: deploy “real” de pagamento só é válido **depois** da implementação do provider escolhido.
- `DELIVERY_PROVIDER=uber_direct` exige secrets + customer/client IDs + webhook HTTPS.
- Produção é **fail-closed**: `PAYMENT_PROVIDER=mock` e `ENABLE_MOCK_PAYMENT=true` são **proibidos** com `APP_ENV=production` (`validateRuntimeConfig`).

---

## Pré-requisitos externos (bloquear se faltar)

- [ ] Firebase projeto `jp-6a9d2` no **Blaze**
- [ ] Decisão: Mercado Pago **ou** Asaas + implementação no backend
- [ ] Credenciais Uber Direct (Test Mode primeiro; Production só com autorização)
- [ ] URL pública HTTPS do webhook `uberDirectWebhook` registrada no dashboard Uber
- [ ] Endereço/pickup da loja com lat/lng reais (sem inventar coordenadas)
- [ ] Provider de geocoding real (se ainda houver stub) — Uber exige coordenadas válidas
- [ ] `APP_ENV=production` apenas quando pagamento + entrega não-mock estiverem prontos

---

## Matriz de configuração

### A) Staging / pré-prod (recomendado antes de production)

| Param | Valor |
|--------|--------|
| `APP_ENV` | `staging` |
| `PAYMENT_PROVIDER` | provider real implementado **ou** ainda mock só se `ENABLE_MOCK_PAYMENT=true` e fora de production |
| `DELIVERY_PROVIDER` | `uber_direct` |
| `ENABLE_MOCK_PAYMENT` | `false` se pagamento real; `true` só se ainda mock em staging |
| `UBER_DIRECT_MODE` | `test` |
| `UBER_DIRECT_CLIENT_ID` | valor Test Mode |
| `UBER_DIRECT_CUSTOMER_ID` | valor Test Mode |

### B) Production

| Param | Valor |
|--------|--------|
| `APP_ENV` | `production` |
| `PAYMENT_PROVIDER` | `mercadopago` **ou** `asaas` (implementado) — **nunca** `mock` |
| `DELIVERY_PROVIDER` | `uber_direct` |
| `ENABLE_MOCK_PAYMENT` | `false` |
| `UBER_DIRECT_MODE` | `production` **somente** quando autorizado |
| `UBER_DIRECT_CLIENT_ID` / `CUSTOMER_ID` | credenciais de produção |

---

## Secrets (Secret Manager) — obrigatórios com Uber

```bash
firebase functions:secrets:set UBER_DIRECT_CLIENT_SECRET
firebase functions:secrets:set UBER_DIRECT_WEBHOOK_SIGNING_KEY
```

Nunca colocar em:

- `.env` versionado
- `EXPO_PUBLIC_*`
- Firestore
- APK / client

Futuro (quando o gateway estiver implementado): secrets do MP/Asaas via Secret Manager, mesmo padrão.

---

## Qualidade local

```bash
npm run typecheck
npm run functions:test
npm run lint
```

Confirmar `firestore.rules`: `orders` sem create/update/delete pelo client SDK.

---

## Deploy

```bash
npm --prefix functions run build
firebase deploy --only functions
firebase deploy --only firestore:rules
```

Após deploy Uber:

1. Copiar URL HTTPS do `uberDirectWebhook` no Console
2. Registrar no Uber Direct (Test Mode → depois Production)
3. Validar assinatura / claim-lease de webhook (já no código)

---

## Smoke test REAL (mínimo)

### Pagamento

1. Checkout cria order `awaiting_payment`
2. Fluxo do gateway (PIX/cartão conforme implementação) aprova via webhook/callback
3. `simulateMockPayment` **deve falhar** em production
4. Totais só do backend (centavos)

### Entrega

1. Payment `approved` + admin `ready_for_pickup`
2. `requestDelivery` cria delivery Uber (não mock)
3. Webhooks atualizam status; retry só em `failed` (não em `uncertain`)
4. Idempotency: `idempotency_key=orderId`; reconciliar se `uncertain`

### Segurança

- Admin callables exigem role/claims admin
- Client não escreve campos críticos de order/payment/delivery

---

## Rollback / emergência

Se produção quebrar e precisar estabilizar UX **sem** Uber/gateway:

1. **Não** ligar mock em `APP_ENV=production` (config rejeita)
2. Opções: reverter Functions para revisão anterior **ou** baixar `APP_ENV` para `staging` + mock **apenas** com aprovação explícita do time (comunicar ao cliente que não é produção)
3. Documentar o incidente

---

## Ordem sugerida de go-live

1. Deploy mock (`DEPLOY_MOCK.md`) — validar fluxo E2E no APK  
2. Staging + Uber Test Mode + pagamento real em sandbox  
3. Production params + secrets prod + `UBER_DIRECT_MODE=production`  
4. Monitorar logs Functions + Firestore orders/deliveries  

---

## Critério de sucesso produção

- Nenhum caminho de mock ativo (`ENABLE_MOCK_PAYMENT=false`, payment ≠ mock)
- Uber criando deliveries reais (ou Test Mode consciente em staging)
- Webhooks recebidos e processados
- `validateRuntimeConfig` passa no boot das Functions
- App/APK com `EXPO_PUBLIC_*` do projeto correto (rebuild só se a config Firebase mudar)
