# Plano MVP-3 — Fechamento demonstrável

## Status de implementação

**Concluído e documentado em 2026-09-04** (ver também `STATUS.md`).

**Implementado (MVP-3):** pagamento mock → `orders` no Firestore → sucesso → histórico → timeline → admin avança status + CRUD produtos/categorias. Rules e index `customerId + createdAt` deployados em `jp-6a9d2`.

**UX validada (pass de fechamento):** etapas 1–5 consistentes; pagamento com empty/awaiting/falha; sucesso com resumo; pedidos com retry e feedback de toque; detalhe com refresh suave e navegação admin/cliente; alvos de toque ≥44; chips admin/catálogo; timeline com status atual mais legível.

## Objetivo

Fechar o ciclo **resumo → pagamento mock → pedido → sucesso → histórico → acompanhamento**, com dados no Firestore prontos para o painel admin consumir (usuário ↔ pedido). Sem gateway real e sem catálogo oficial do cliente.

## Fluxo alvo

```text
Resumo do checkout
        ↓
Escolher método (PIX | Cartão) — mock
        ↓
Estados: aguardando → aprovado | falha
        ↓
Criar Order no Firestore (+ limpar carrinho)
        ↓
Tela de sucesso (número + resumo + acompanhar)
        ↓
Pedidos (lista) → Detalhe + Timeline
        ↓
Admin avança status manualmente (demo)
```

## Modelo `orders/{orderId}`

```text
id
orderNumber              // ex.: JP-20260904-A1B2
customerId               // uid do comprador (vínculo admin/cliente)
customerName
customerEmail

items[]                  // snapshot do carrinho
recipient { name, phone, notes }
deliveryAddress { ... }
deliveryDate
deliveryPeriodId
deliveryPeriodLabel

subtotal
deliveryFee
total

paymentMethod            // pix | card
paymentStatus            // pending_payment | paid | failed
orderStatus              // pending_payment | paid | preparing | ready_for_delivery | out_for_delivery | delivered | cancelled
deliveryStatus           // not_started | delivery_requested | driver_assigned | picked_up | in_transit | delivered | failed | cancelled

createdAt
updatedAt
statusHistory[]          // { status, at, by }
```

### Status (separados)

| Campo | Valores MVP-3 |
|-------|----------------|
| `paymentStatus` | `pending_payment`, `paid`, `failed` |
| `orderStatus` | `pending_payment` → `paid` → `preparing` → `ready_for_delivery` → `out_for_delivery` → `delivered` (+ `cancelled`) |
| `deliveryStatus` | `not_started` → `delivery_requested` → … → `delivered` |

## Services (cliente + admin)

### Pedidos — `order.service.ts`

- `createOrderFromCart(user, cart, paymentMethod)` — após mock aprovado
- `listOrdersByCustomer(customerId)` — histórico cliente
- `listAllOrders()` — admin
- `getOrderById(orderId)`
- `updateOrderStatuses(orderId, patch)` — admin (order/delivery/payment)

### Catálogo (preparação admin) — já parcial + CRUD

- `category.service`: create / update / listAll (admin)
- `product.service`: create / update / listAll (admin)
- `banner.service`: create / update / listAll (admin)

Escrita só com `role == admin` (rules).

## Rules (ajustes)

- Cliente: **create** order com `customerId == auth.uid`; **read** só as próprias.
- Cliente: **não** atualiza status após criação (evita fraude no mock).
- Admin: **read/update** todos os pedidos; **write** catálogo.
- Indexes: `orders` por `customerId + createdAt desc`; admin lista por `createdAt desc`.

## Telas

| Rota | Função |
|------|--------|
| `/checkout/payment` | Escolha PIX/Cartão + estados mock |
| `/checkout/success` | Sucesso com orderId |
| `/(tabs)/orders` | Lista histórico |
| `/order/[id]` | Detalhe + timeline |
| `/admin` | Dashboard com contadores reais (agregação simples) |
| `/admin/orders` | Lista + avançar status |
| `/admin/products` | Lista + criar/editar básico (seed editável) |
| `/admin/categories` | Lista + criar/editar básico |

## Validação de fluxos

1. Cliente finaliza resumo → pagamento mock → aprovado → pedido no Firestore → carrinho vazio.
2. Sucesso mostra número e link para detalhe.
3. Aba Pedidos lista o pedido; timeline reflete status.
4. Admin vê o pedido e avança: paid → preparing → out_for_delivery → delivered.
5. Cliente vê timeline atualizada.
6. Falha no mock não cria pedido.
7. Admin cria/edita categoria/produto (visível no catálogo se `active`).

## Polimento

- Loading/erro/empty em pagamento, pedidos e admin.
- Confirmação ao avançar status.
- Copy clara de “pagamento simulado”.
- Gaps e CTA sticky onde fizer sentido.
- Badge/contadores admin a partir de pedidos reais.

## Fora do MVP-3

Gateway real, webhook, API de entrega, push, validação financeira server-side forte, publicação nas lojas, identidade oficial.
