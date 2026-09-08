# Checklist de validação — MVP demonstrável

Atualizado em **2026-09-08**. Fase pós-MVP-3: validar e polir fluxos **sem** decisões externas (gateway, catálogo oficial, frete definitivo, reembolso).

Use este documento no APK ou Expo. Marque **Resultado** e, se falhar, **Severidade** (P0 bloqueia demo / P1 atrito / P2 cosmético).

## Contas de teste

| Perfil | Credencial |
|--------|------------|
| Admin | `admin@admin.com` / `borderless` |
| Cliente | cadastrar novo ou conta de teste existente |

---

## 1. Autenticação

| # | Rota | Caso | Resultado | Sev. | Nota |
|---|------|------|-----------|------|------|
| 1.1 | `/login` | Login válido cliente | | | |
| 1.2 | `/login` | Senha inválida (mensagem clara) | | | |
| 1.3 | `/login` | Link cadastro / esqueci senha | | | |
| 1.4 | `/register` | Cadastro ok → home cliente | | | |
| 1.5 | `/register` | E-mail duplicado | | | |
| 1.6 | `/forgot-password` | E-mail vazio bloqueado | | | |
| 1.7 | `/forgot-password` | Envio ok + voltar ao login | | | |
| 1.8 | `/login` | Admin → painel `/admin` | | | |

## 2. Catálogo → carrinho

| # | Rota | Caso | Resultado | Sev. | Nota |
|---|------|------|-----------|------|------|
| 2.1 | `/(tabs)` / catalog | Lista carrega / pull refresh | | | |
| 2.2 | `/product/[id]` | Galeria, preço, estoque | | | |
| 2.3 | `/product/[id]` | Indisponível não adiciona | | | |
| 2.4 | `/(tabs)/cart` | Quantidade +/− e remover | | | |
| 2.5 | `/(tabs)/cart` | Mensagem sobrevive ao “Continuar” | | | |
| 2.6 | `/(tabs)/cart` | Carrinho vazio → CTA catálogo | | | |

## 3. Checkout (5 etapas)

| # | Rota | Caso | Resultado | Sev. | Nota |
|---|------|------|-----------|------|------|
| 3.1 | `/checkout/recipient` | Nome/telefone inválidos bloqueiam | | | |
| 3.2 | `/checkout/recipient` | Erro de rede/save visível | | | |
| 3.3 | `/checkout/address` | ViaCEP preenche rua/bairro/cidade | | | |
| 3.4 | `/checkout/address` | Endereço salvo selecionável | | | |
| 3.5 | `/checkout/address` | Erro CEP/save visível | | | |
| 3.6 | `/checkout/schedule` | Sem data passada; período obrigatório | | | |
| 3.7 | `/checkout/summary` | Totais batem com carrinho | | | |
| 3.8 | `/checkout/summary` | Links Editar abrem etapas certas | | | |
| 3.9 | `/checkout/summary` | Incompleto bloqueia pagamento | | | |
| 3.10 | Guard | Sem destinatário/endereço/agenda → não confirma em payment | | | |
| 3.11 | Guard | Carrinho vazio nas etapas 1–4 → cart | | | |

## 4. Pagamento mock e sucesso

| # | Rota | Caso | Resultado | Sev. | Nota |
|---|------|------|-----------|------|------|
| 4.1 | `/checkout/payment` | Copy deixa claro que é simulado | | | |
| 4.2 | `/checkout/payment` | PIX copia código | | | |
| 4.3 | `/checkout/payment` | Confirmar → sucesso + número | | | |
| 4.4 | `/checkout/payment` | Carrinho limpo após sucesso | | | |
| 4.5 | `/checkout/payment` | Simular falha → **não** cria pedido | | | |
| 4.6 | `/checkout/payment` | Retry após create ok não duplica pedido | | | |
| 4.7 | `/checkout/success` | Acompanhar → `/order/[id]` | | | |
| 4.8 | `/checkout/success` | Voltar gestual não volta ao payment | | | |

## 5. Pedidos e timeline

| # | Rota | Caso | Resultado | Sev. | Nota |
|---|------|------|-----------|------|------|
| 5.1 | `/(tabs)/orders` | Lista após compra | | | |
| 5.2 | `/(tabs)/orders` | Empty + retry em erro | | | |
| 5.3 | `/order/[id]` | Resumo + itens + total | | | |
| 5.4 | `/order/[id]` | Timeline reflete status atual | | | |
| 5.5 | `/order/[id]` | Pull/Atualizar após admin avançar | | | |
| 5.6 | Timeline | `ready_for_delivery` não fica preso em “Preparando” | | | |

## 6. Admin

| # | Rota | Caso | Resultado | Sev. | Nota |
|---|------|------|-----------|------|------|
| 6.1 | `/admin` | Contadores carregam | | | |
| 6.2 | `/admin/orders` | Lista pedido do cliente | | | |
| 6.3 | `/admin/orders` | Confirmar avanço de status | | | |
| 6.4 | `/admin/orders` | Cliente vê timeline atualizada | | | |
| 6.5 | `/admin/products` | Criar produto ativo → aparece no catálogo | | | |
| 6.6 | `/admin/categories` | Criar categoria ativa → filtro no catálogo | | | |
| 6.7 | Guard | Cliente não acessa `/admin` | | | |

## Critério de pronto desta fase

- [ ] P0 zerado (duplicata de pedido, gate incompleto, erros silenciosos de save)
- [ ] Roteiro feliz cliente sem travar
- [ ] Falha de pagamento não cria pedido
- [ ] Admin avança e timeline do cliente acompanha
- [ ] Copy de pagamento deixa claro o caráter simulado

## Correções aplicadas nesta fase (código)

Atualizado em **2026-09-08** — implementação das sprints de validação/polish:

### P0
- [x] Pedido duplicado: após `createOrder` bem-sucedido, navega para sucesso mesmo se limpar carrinho falhar
- [x] Gate de checkout incompleto no layout + payment + validação em `createOrderFromCart`
- [x] Erros de save visíveis em destinatário, endereço e agenda

### P1
- [x] Mensagens do carrinho persistidas no CTA “Continuar”
- [x] Links “Editar” no resumo
- [x] Telefone com máscara e validação DDD
- [x] Reuso de endereço salvo equivalente (evita duplicata)
- [x] Copy de pagamento simulado; recusa demo em botão secundário
- [x] Timeline com etapa “Pronto para entrega”
- [x] AuthGate com loading; forgot-password com validação e CTA para login

### Sprints A/B (parecer UX — 2026-09-08)
- [x] Light-only + admin erro/retry + OOS abre + carrinho loading + banner fallback
- [x] Stepper checkout + copy agenda/pagamento + lista pedidos com itens
- [x] Touch 44, not-found PT-BR, modal isolado, endereço Button, timeline cancelado, frete ilustrativo

### Reteste sugerido (manual no APK/Expo)
Marcar na tabela acima após smoke: 1.4, 2.5, 3.1, 3.8, 3.10, 4.3–4.6, 5.5–5.6, 6.3–6.4.
Checklist de aceite da demo: ver `ux_audit_specialist_review.md` §6.
