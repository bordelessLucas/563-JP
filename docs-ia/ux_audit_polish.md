# Auditoria UI/UX — polish adicional (pós-MVP-3)

**Data:** 2026-09-08  
**App:** 563-JP / Flora & Presentes (nome provisório)  
**Contexto:** MVP demonstrável concluído; **sem** decisões do cliente (gateway, catálogo oficial, frete definitivo, cancelamento/reembolso, API de entrega, push, lojas).  
**Objetivo deste documento:** registrar o que ainda pode melhorar na experiência para validação no Expo/APK, e servir de briefing para especialista em design/UX.

**Referências de produto:** `escopo.md`, `design_system.md`, `STATUS.md`, `validacao_mvp.md`, `mvp_sprints.md`.

---

## 1. Situação

O fluxo feliz já funciona (descoberta → carrinho → checkout 5 etapas → pagamento mock → pedidos → timeline → admin avança status). Já houve polish P0/P1 (gates de checkout, anti-duplicata, telefone, editar no resumo, etc.).

Ainda há atrito, inconsistências visuais e alguns comportamentos que **parecem bug** em demo — dá para continuar evoluindo **só com polish**, sem esperar o cliente.

---

## 2. Fluxos quebrados ou de risco (parecer “errado” na demo)

| ID | Problema | Onde | Impacto |
|----|----------|------|---------|
| B1 | Tema do sistema **dark** + UI do app **light** → header/navegação escuros, conteúdo claro | `app/_layout.tsx` vs `theme.ts` | Demo no Android com modo escuro parece quebrada |
| B2 | Erro no dashboard admin vira “tudo zero” (sem mensagem/retry) | `AdminDashboardScreen.tsx` | Parece loja sem pedidos |
| B3 | Card de produto **esgotado** não abre o detalhe | `ProductCard.tsx` (`disabled`) | Usuário não entende o porquê |
| B4 | Banner “Explorar agora” pode não fazer nada (`collection` / `campaign`) | `HomeScreen.tsx` | CTA morto |
| B5 | “Continuar para entrega” no carrinho sem loading/erro; risco de double-tap | `CartScreen.tsx` | Atrito / navegação duplicada |
| B6 | Erro ao alterar quantidade no carrinho é silencioso | `CartScreen.tsx` | Botão “não responde” |
| B7 | Pedido `cancelled` / fora da sequência: timeline vazia de sentido | `OrderTimeline` + `orderLabels.ts` | Status no badge ≠ timeline |
| B8 | Telas template Expo em inglês (`+not-found`, `modal`) | `app/+not-found.tsx`, `app/modal.tsx` | Quebra de marca se alguém cair nelas |
| B9 | Sucesso sem `orderId`: CTA “Acompanhar” desabilitado | `checkout/success.tsx` | Beira de fluxo morto |

**Já mitigado (não reabrir sem regressão):** gates de checkout incompleto; anti-duplicata pós-create; erros de save em destinatário/endereço/agenda; flush de mensagens no Continuar; gesto voltar bloqueado no sucesso.

---

## 3. Atrito de UX (fluxo funciona, mas confunde)

| ID | Atrito | Rota / arquivo | Nota |
|----|--------|----------------|------|
| U1 | Só texto “ETAPA N DE 5”, sem stepper visual | `/checkout/*` | Perde-se após “Editar” no resumo |
| U2 | Itens no resumo sem “Editar no carrinho” explícito | `/checkout/summary` | Só edita destinatário/endereço/agenda |
| U3 | Copy da agenda fala em “troca de ano” (parece bug) | `/checkout/schedule` | Reescrever regra em linguagem humana |
| U4 | Frete “estimada” sem explicação | Carrinho / resumo | OK sem frete real; gera desconfiança |
| U5 | Perfil quase vazio (“em breve”) | `/(tabs)/profile` | Contraste com checkout rico |
| U6 | Admin sai sem confirmação; cliente confirma | `/admin` vs Profile | Inconsistência |
| U7 | Admin não navega como cliente (precisa 2ª conta) | `AuthGate` | Correto por papel; atrito na demo |
| U8 | Lista de pedidos sem nome/thumbnail do item | `/(tabs)/orders` | Difícil reconhecer pedido |
| U9 | “Simular recusa” fácil de tocar na demo com cliente | `/checkout/payment` | Útil QA; arriscado em walkthrough |
| U10 | AuthGate: só spinner, sem texto | `AuthGate.tsx` | Inconsistente com `LoadingState` |
| U11 | Home sem empty de categorias | `HomeScreen` | Faixa vazia |
| U12 | “Cadastrar novo” endereço pouco visível | `/checkout/address` | Preferir botão secundário |
| U13 | Detalhe do produto: CTA sticky + spacer alto em tela pequena | `ProductDetailScreen` | Pode apertar conteúdo |

---

## 4. Design system e visual

Tokens: `src/components/theme.ts` ↔ `design_system.md` (toque mínimo **44**).

| ID | Achado |
|----|--------|
| D1 | Alvos &lt; 44: setas do calendário (36), CTA banner (40), “Voltar”/“Remover” texto |
| D2 | Cores hardcoded em `InlineNotice` / `StockBadge` fora dos tokens |
| D3 | Preço produto `fontSize: 28` fora da escala; tab label 11 / weight 600 |
| D4 | Legado Expo `constants/Colors.ts` (azul) em telas template |
| D5 | `SpaceMono` carregada e pouco/não usada na UI |
| D6 | Badge admin “ATIVO” em rosa (`softAccent`) — parece promo, não status operacional |
| D7 | Tab bar altura fixa 62 — risco em devices com home indicator |
| D8 | Botão voltar no produto com sombra; resto do app é borda (DS prefere borda) |

---

## 5. Copy (tom e clareza)

| ID | Texto atual | Problema | Direção |
|----|-------------|----------|---------|
| C1 | “Mock · não processa”, “fictício” | Jargão / técnico demais | “Exemplo ilustrativo — não gera cobrança” |
| C2 | Admin: “CRUD”, “Firestore”, “Unsplash”, “mock” | Linguagem de dev | Linguagem de operação da loja |
| C3 | “slug · ordem N” nas categorias | Técnico | Esconder slug ou mostrar só nome/ordem amigável |
| C4 | Agenda: “não há troca de ano” | Soa como limitação bug | “Escolha a partir de amanhã (até 60 dias)” |
| C5 | Catálogo: “Falha no catálogo” | Tom duro | “Não foi possível carregar” |
| C6 | `+not-found` em inglês | Fora do produto PT | PT-BR + CTA para Home |

Auth (`useAuthActions`) já tem mensagens boas — preservar.

---

## 6. Acessibilidade

| ID | Gap |
|----|-----|
| A1 | Falta `accessibilityRole` em vários cards/links de texto |
| A2 | Toggle de senha e ícones pequenos sem hit area 44 |
| A3 | Galeria: dots não são botões; pouco contexto VoiceOver |
| A4 | Sem `accessibilityLiveRegion` em CEP / pagamento / saves |
| A5 | Contraste de `muted` em caption pode ser limite |
| A6 | Web `lang="en"` em `+html.tsx` se usarem web |

---

## 7. Cliente vs Admin

| Dimensão | Cliente | Admin |
|----------|---------|-------|
| Acabamento | Mais cuidado (EmptyState, sticky CTA) | Mais “ferramenta interna” |
| Erros | Em geral visíveis | Dashboard silencia falha |
| Logout | Confirma | Não confirma |
| Catálogo | Navega bem | Só criar + ativar/desativar |
| Pedidos | Timeline | Avançar status + lista |
| Demo | Pagamento bem rotulado como simulado | Também rotulado (bom) |

Detalhe `/order/[id]` compartilhado com Voltar correto por papel — **manter**.

---

## 8. Backlog priorizado (só polish, sem decisão do cliente)

### P0 — antes da próxima demo com cliente

1. Forçar tema light na navegação (ou headers alinhados ao DS) — `app/_layout.tsx`  
2. Dashboard admin: erro + retry (não zerar em silêncio)  
3. Permitir abrir produto esgotado (CTA continua bloqueado no detalhe)  
4. Carrinho Continuar: loading + disable + erro  
5. Banner: fallback se destino inválido  
6. Reescrever notice da agenda (U3/C4)

### P1 — walkthrough mais fluido

7. Mini stepper visual no checkout (1–5)  
8. Touch targets ≥ 44 (calendário, Voltar, Remover, banner CTA)  
9. Copy admin sem jargão técnico  
10. Suavizar labels técnicos do pagamento (manter 1 aviso claro de simulado)  
11. Lista de pedidos: nome do 1º item ou “N itens”  
12. Confirmar logout no admin  
13. Empty de categorias na Home; erro de load em schedule se settings falhar  
14. `+not-found` em PT-BR; isolar/remover `modal` template  
15. Timeline: mensagem para cancelado / fora da sequência  
16. “Novo endereço” como `Button` secondary  
17. AuthGate com `LoadingState` + texto  

### P2 — cosmético / dívida

18. Tokens para fundos de notice; limpar Colors/SpaceMono mortos  
19. Badge ATIVO → verde success  
20. Densidade CTA no detalhe do produto  
21. Live regions a11y; `lang="pt-BR"`  
22. Perfil: não prometer telefone se o cadastro não coleta  

---

## 9. Fora de escopo (não misturar neste polish)

Gateway real, pagamento fora do app, catálogo/fotos oficiais, frete/regiões finais, cancelamento/reembolso, API de entrega/GPS, push, identidade oficial, admin web completo, publicação nas lojas, liberar admin para “comprar” nas tabs.

---

## 10. Pontos fortes a preservar

- Happy path claro e demonstrável  
- Tokens e componentes base (`Button`, `Input`, `EmptyState`, `InlineNotice`, `LoadingState`)  
- Honestidade do pagamento simulado  
- Gates de checkout e timeline com `ready_for_delivery`  
- Script admin → cliente atualiza status  

---

## 11. Briefing para especialista em design / UX

Pedido ao especialista:

1. Validar se a priorização P0/P1 faz sentido para **demo com floricultura** (stakeholder não-técnico).  
2. Propor soluções concretas de UI (não só problemas): stepper do checkout, hierarquia tipográfica, tratamento de dark mode, empty/error states, tom de voz PT-BR.  
3. Sugerir microcopy reescrita para C1–C6 e notices do checkout.  
4. Indicar o que **não** vale o esforço agora (P2 vs tempo).  
5. Entregar lista de mudanças implementáveis em 1–2 sprints curtas, alinhada ao design system provisório (sem inventar marca nova).  
6. Considerar princípios do `escopo.md`: poucos passos, clareza de valores, feedback explícito, status separados, evitar navegação profunda.

**Arquivo fonte desta auditoria:** `docs-ia/ux_audit_polish.md`
