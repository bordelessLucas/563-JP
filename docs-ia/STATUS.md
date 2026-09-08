# Status do projeto — contexto aplicado

Atualizado em **2026-09-08**. Fonte operacional para agentes e time: ler junto com `escopo.md`, `mvp_sprints.md` e `checklist_sprints.md`.

## Situação atual

O **MVP demonstrável (MVP-0 → MVP-3)** está **implementado**. Em **2026-09-08** foram concluídas a fase **validação/polish** e as **Sprints A/B** do parecer UX (`ux_audit_specialist_review.md`): tema light-only, feedback de erro/loading no admin e checkout, copy de demo sem jargão, stepper visual, lista de pedidos legível e polish de walkthrough (touch 44, not-found, timeline cancelado, frete ilustrativo).

Foco mantido: ~65% UI/UX, ~35% backend mínimo. Gateway real, API de entrega, push e identidade oficial da floricultura **fora** deste corte.

## Fase validação/polish (2026-09-08)

- Checklist estruturado: `validacao_mvp.md`
- P0: anti-duplicata de pedido, gate de checkout incompleto, erros de save no checkout
- P1: mensagens do carrinho, editar no resumo, telefone, endereços, copy mock, timeline `ready_for_delivery`, AuthGate/forgot-password
- Critério: demo mais estável para validação com cliente no APK, ainda sem gateway/catálogo oficial

## Sprints A/B — polish UX (2026-09-08)

Aprovadas e implementadas a partir de `ux_audit_specialist_review.md`:

### Sprint A
- UI/navegação **light-only** (`userInterfaceStyle` + ThemeProvider)
- Admin dashboard: erro + retry, logout com confirmação, badge “Disponível”
- Card OOS abre detalhe; banner com fallback ao catálogo
- Carrinho: loading/erro em quantidade e Continuar; frete ilustrativo
- Checkout: `CheckoutStepper` nas 5 etapas; copy humana em agenda/pagamento; CTA “Confirmar pedido”
- Pedidos: thumb + nome do 1º item · N itens
- AuthGate com `LoadingState` (“Preparando sua conta…”); copy admin sem CRUD/Firestore/slug

### Sprint B
- Touch ≥ 44 (calendário, Remover, CTA de banner)
- `+not-found` PT-BR + DS; `modal` template redireciona para home
- Home sem categorias: mensagem; agenda com erro de settings + retry
- “Novo endereço” como Button secondary
- Timeline para cancelado / aguardando confirmação
- Frete ilustrativo no resumo
## Admin catálogo e promoções (2026-09-08)

- Produtos: criar/editar preço, quantidade em estoque, descrição, imagem (URL), destaque e ativo. Quantidade 0 → indisponível.
- Categorias: criar/editar nome, ordem, imagem e ativo.
- Promoções (`/admin/promotions`): campanhas com destino (categoria/produto/catálogo); flag **Modal prioritário**.
- Cliente: se houver promoção ativa em modal, ela abre **primeiro** na home; sem promoção, a vitrine segue igual (hero não-modal + categorias + destaques).
- **Seed demo atualizado no Firestore** (`jp-6a9d2`): estoque/preço nos 8 produtos + `orquidea-rosa` (qty 0); banners `promo-semana` (modal ativo), `banner-primavera` (hero), `promo-rascunho` (inativo). Ref: `scripts/demo-seed-catalog.ts`.



### MVP-3 — fechamento do ciclo de compra

1. Pagamento mock (`/checkout/payment`): PIX/cartão, estados aguardando / aprovado / falha, QR e copia-e-cola fictícios (`expo-clipboard`).
2. Criação de `orders` no Firestore ao “confirmar pagamento” aprovado: itens, destinatário, endereço, data/período, valores, `paymentStatus` / `orderStatus` / `deliveryStatus`, `statusHistory`, vínculo `customerId`.
3. Tela de sucesso com número + resumo + atalhos.
4. Histórico em Pedidos + detalhe `/order/[id]` com timeline visual (sem GPS).
5. Admin: dashboard com contadores reais; `/admin/orders` avança status manualmente; CRUD básico produtos/categorias.
6. Services de catálogo preparados para o painel (`create`/`update`/`listAll` em category, product, banner).
7. Rules: cliente cria/lê só os próprios pedidos; só admin atualiza status e escreve catálogo.
8. Index: `orders` por `customerId` + `createdAt` desc.

### Polimento UI/UX (pass final do dia)

- Checkout em **5 etapas** (destinatário → endereço → agenda → resumo → pagamento).
- Empty/loading/erro no pagamento, pedidos e detalhe; retry na lista de pedidos.
- Sucesso sem gesto de voltar para tela de pagamento vazia; resumo carregado do pedido.
- Detalhe com refresh suave; navegação Voltar correta para admin vs cliente.
- Alvos de toque ≥ 44 (carrinho, catálogo, chips); timeline com status atual mais legível.
- Copy menos “técnica” nas telas de cliente/admin.

### Plano e docs

- Plano detalhado: `mvp3_plan.md`.
- Marcações sincronizadas em `mvp_sprints.md` e `checklist_sprints.md` (Sprints 5–7 com itens mock/MVP marcados).

## Como demonstrar

**Cliente**

1. Login/cadastro → Home/Catálogo → adicionar ao carrinho.
2. Checkout completo → pagamento → **Confirmar pedido**.
3. Sucesso → acompanhar em Pedidos → timeline.

**Admin** (`admin@admin.com` / `borderless`)

1. Dashboard → Pedidos → avançar status.
2. Cliente atualiza a timeline (pull to refresh / botão Atualizar).
3. Produtos/Categorias: criar e ativar/desativar.

**Falha mock:** botão “Testar falha de pagamento” **não** cria pedido.

## Stack e projeto

| Item | Valor |
|------|--------|
| App | Expo SDK 57 + Expo Router + TypeScript |
| Backend | Firebase Auth + Firestore (`jp-6a9d2`) |
| Admin login | `admin@admin.com` / `borderless` |
| Design | Provisório (`design_system.md` + `src/components/theme.ts`) |

## Rotas principais

| Rota | Perfil | Função |
|------|--------|--------|
| `/(tabs)/*` | Cliente | Home, catálogo, carrinho, pedidos, perfil |
| `/product/[id]` | Cliente | Detalhe + add ao carrinho |
| `/checkout/*` | Cliente | Destinatário → … → pagamento → sucesso |
| `/order/[id]` | Cliente (e admin leitura) | Detalhe + timeline |
| `/admin` | Admin | Dashboard |
| `/admin/orders` | Admin | Listar + avançar status |
| `/admin/products` | Admin | Criar/editar produtos (preço, estoque, destaque) |
| `/admin/categories` | Admin | Criar/editar categorias |
| `/admin/promotions` | Admin | Promoções / modal prioritário da vitrine |

## Coleções Firestore (MVP)

`users`, `categories`, `products`, `banners`, `carts`, `addresses`, `settings/operation`, `orders`.

## Próximo (quando retomar — não feito hoje)

- Gateway de pagamento real + webhook.
- API/parceiro de entrega.
- Push / notificações.
- Identidade oficial da floricultura + catálogo real.
- Admin web ou evolução do painel (filtros, banners UI, configs).
- Publicação nas lojas (EAS / contas oficiais).

## Arquivos de referência rápida

| Doc | Uso |
|-----|-----|
| `escopo.md` | Requisitos de produto (fonte principal) |
| `mvp_sprints.md` | Recorte MVP 0–3 e status |
| `mvp3_plan.md` | Detalhe técnico do fechamento |
| `validacao_mvp.md` | Checklist para validar/polir o MVP sem decisões externas |
| `ux_audit_polish.md` | Auditoria UI/UX detalhada (fluxos, visual, copy, a11y) |
| `ux_audit_specialist_review.md` | Parecer de design/UX + Sprints A/B de polish |
| `checklist_sprints.md` | Backlog sprints 0–8 |
| `design_system.md` | Tokens provisórios |
| Este arquivo | Contexto do que já está no ar hoje |
