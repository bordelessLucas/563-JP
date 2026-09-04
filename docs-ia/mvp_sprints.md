# Plano MVP (validado)

## Objetivo

Entregar um fluxo de compra **demonstrável** com foco ~65% UI/UX e ~35% backend mínimo. Integrações reais (gateway, entrega, admin completo) ficam para o pós-MVP.

## Decisões validadas

1. **Design:** tema provisório documentado em `design_system.md` até a floricultura enviar logo/identidade oficial.
2. **Pagamento:** apenas mocks (telas e estados); nada verdadeiro ainda.
3. **Entrega:** timeline visual + status manuais/mock; sem API externa no MVP.
4. **Admin:** usuário criado no Firebase com role `admin`. Login: `admin@admin.com` / `borderless`.  
   *(Firebase exige e-mail com domínio válido; `admin@admin` foi normalizado para `admin@admin.com`.)*
5. **Dashboard:** contadores a partir de `orders` reais + módulos Pedidos/Produtos/Categorias ativos; banners/configs ainda “em breve”.
6. **Execução:** MVP-0 → MVP-3 concluídos com validação e polimento UI/UX de fechamento em 2026-09-04. Ver `STATUS.md`.

## Escopo por etapa

### MVP-0 — Fundação visual + admin mock *(aprovado)*

- [x] Design system provisório (docs + tokens no código).
- [x] Usuário admin no Firebase Auth + doc `users` com `role: admin`.
- [x] Rota de dashboard admin (evoluiu no MVP-3 para dados reais).
- [x] Redirecionamento pós-login: cliente → home; admin → dashboard.

### MVP-1 — Descoberta *(aprovado + polimento UI/UX)*

- [x] Tabs cliente: Home, Catálogo, Carrinho, Pedidos, Perfil.
- [x] Home com banner/categorias/destaques a partir do Firestore.
- [x] Listagem + detalhe + galeria.
- [x] Dados seed no Firestore (5 categorias, 8 produtos, 1 banner).
- [x] Polimento UI/UX de descoberta.

### MVP-2 — Intenção de compra *(aprovado + polimento)*

- [x] Carrinho persistido no Firestore (`carts/{userId}`).
- [x] Adicionar/alterar/remover itens e mensagem personalizada por item.
- [x] Badge de quantidade na tab Carrinho.
- [x] Checkout: destinatário → endereço (ViaCEP) → data/período (calendário) → resumo.
- [x] Endereços reutilizáveis (`addresses`) e draft de checkout no carrinho.
- [x] Frete e períodos via `settings/operation` (stub configurável).
- [x] Resumo logístico e de valores (subtotal + entrega + total).

### MVP-3 — Fechamento demonstrável *(aprovado + UX de fechamento 2026-09-04)*

- [x] Telas de pagamento mock (PIX/cartão) com estados aguardando/aprovado/falha.
- [x] Criação de pedido no Firestore (`paymentStatus`, `orderStatus`, `deliveryStatus`).
- [x] Tela de sucesso + histórico em Pedidos + detalhe com timeline.
- [x] Admin: listar pedidos, avançar status; CRUD básico de produtos/categorias.
- [x] Rules + index `customerId + createdAt` para vínculo cliente ↔ pedido.
- [x] Checkout em 5 etapas; pass UI/UX (empty/loading/erro, toque ≥44, navegação admin/cliente).

## Dados no Firebase (projeto `jp-6a9d2`)

| Coleção | Status |
|---------|--------|
| `users` | Admin seed + clientes via cadastro |
| `categories` | 5 docs seed + CRUD admin |
| `products` | 8 docs seed + CRUD admin |
| `banners` | 1 doc seed (service CRUD pronto; UI admin ainda “em breve”) |
| `settings/operation` | frete `19.9` + períodos Manhã/Tarde/Noite |
| `carts` | criado sob demanda; limpo após pedido |
| `addresses` | criado no checkout |
| `orders` | criado no pagamento mock; admin atualiza status |

## Fora do MVP

Gateway real, webhook, API de entrega, push, admin CRUD completo (banners/configs/filtros), regras complexas de frete/estoque, publicação nas lojas, identidade oficial.

## Relação com os outros docs

| Doc | Papel |
|-----|--------|
| `STATUS.md` | Contexto do que está aplicado **hoje** |
| `mvp3_plan.md` | Detalhe técnico do MVP-3 |
| `checklist_sprints.md` | Backlog completo Sprints 0–8 |
| `escopo.md` | Requisitos de produto |
