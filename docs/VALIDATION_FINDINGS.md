# Validação — achados (ciclo cliente / admin / entregas)

Data: 2026-09-10 · Projeto Firebase `jp-6a9d2`

## Bloqueio E2E

- **Cloud Functions:** nenhuma função no projeto. Deploy exige **Blaze** (`artifactregistry` / Gen2).
- Sem Functions: checkout (`createDeliveryQuote`, `createCheckout`, `simulateMockPayment`) e admin entrega **não** fecham ponta a ponta no device.
- **Firestore rules** desta rodada **foram deployadas** (anti-spoof de quote no cart).

Próximo passo externo: upgrade Blaze + seguir `docs/DEPLOY_MOCK.md`.

## Correções feitas neste ciclo

| Item | Arquivo |
|------|---------|
| Sucesso mentiroso após falha de pagamento removido | `app/checkout/payment.tsx` |
| “Testar falha” chama `simulateMockPayment(failed)` de verdade | idem |
| Total do servidor exibido após `createCheckout` | idem |
| Retry de cotação no resumo | `app/checkout/summary.tsx` |
| Success não assume “pago” se status pendente/falhou | `app/checkout/success.tsx` |
| Frete do carrinho: copy de estimativa vs cobrança | `src/screens/CartScreen.tsx` |
| Admin: CTA entrega só com pago + ready; retry só em `failed`; label genérica | `app/admin/orders.tsx` |
| Order detail: status de entrega + link de rastreio | `app/order/[id].tsx` |
| Rules: create sem quote; update não inventa quote | `firestore.rules` (deployed) |

## Anti-burla (código + rules)

| Vetor | Status |
|-------|--------|
| Client create/update `orders` / `payments` / `deliveries` | Deny (rules) |
| Reprice no checkout / preços de produto no server | OK (Functions; E2E pendente Blaze) |
| Inventar `deliveryQuote` no cart | Fechado nas rules (create + update) |
| Self-promote admin | Deny no update de `role` |
| `requestDelivery` cedo / sem pago | Bloqueado no backend + CTAs admin |
| Mock pay em production | Fail-closed em `config.ts` |

## Residual (não bloqueante desta rodada)

1. **`cancelOrder`**: callable permite owner cancelar pós-pago (com refund path). Sem UI cliente hoje; definir política de negócio antes de expor botão.
2. **E2E callables** aguardam Blaze + deploy mock.
3. **PIX/cartão** na UI continuam mock visuais até gateway real.
4. **Gate `/admin`**: só UX; segurança real = rules + `requireAdmin`.
5. **deliveryFee no cart doc** ainda é campo de display client-writable; cobrança real só no backend.

## Smoke recomendado pós-Blaze

1. Cliente: carrinho → quote → checkout → approve → order detail “pago”.
2. Cliente: “Testar falha” → permanece failed; success não diz pago.
3. Admin: paid → preparing → ready → solicitar entrega (sem botão antes).
4. Tentar `requestDelivery` em `paid` → erro backend.
