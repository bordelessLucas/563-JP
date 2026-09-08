# Parecer especialista UI/UX — revisão da auditoria de polish

**Data:** 2026-09-08  
**Papel:** Product design + UX (mobile commerce — flores / presentes)  
**App:** 563-JP / Flora & Presentes (nome provisório)  
**Fonte auditada:** `docs-ia/ux_audit_polish.md`  
**Contexto cruzado:** `design_system.md`, princípios de experiência em `escopo.md`, tokens em `src/components/theme.ts`  
**Público deste documento:** engenharia + produto, antes da próxima demo com floricultura (stakeholder não-técnico)

---

## 0. Veredito em uma frase

A auditoria está **bem calibrada no diagnóstico** (bugs que “parecem erro” + copy técnica), mas a **priorização P0 mistura risco de demo com nice-to-have**, e falta um filtro explícito de **tempo de walkthrough** (os primeiros 8–12 minutos da apresentação).

**Critério usado neste parecer:** o que faz o cliente duvidar da solidez do produto em menos de 60 segundos de exposição na tela, sem inventar features que dependem de decisão do cliente.

---

## 1. Crítica da auditoria

### 1.1 O que está bem priorizado (manter)

| Item | Por quê |
|------|---------|
| **B1 Tema dark vs UI light** | Em Android com modo escuro, header/nav escuros + conteúdo claro lê como app quebrado — é o primeiro “não” visual da demo. |
| **B2 Admin dashboard silencia erro** | “Tudo zero” = loja vazia. Stakeholder operacional julga o painel; erro sem retry destrói confiança. |
| **B3 Card OOS não abre** | Violação clássica de e-commerce: o usuário precisa *entender* a indisponibilidade; bloquear o detalhe parece bug. |
| **B5 Continuar no carrinho sem loading** | Ação crítica do funnel; double-tap / “não aconteceu nada” mata o ritmo da demo. |
| **C1 / U9 Pagamento mock** | Honestidade é ponto forte; jargão (“Mock”, “fictício”) e botão “Simular recusa” fácil de tocar são riscos reais de walkthrough. |
| **U3 / C4 Notice da agenda** | “Troca de ano” soa bug de calendário; o cliente floricultura não precisa do modelo mental do componente. |

Alinhamento com princípios do escopo / DS: **feedback explícito**, **poucos passos**, **clareza**, **evitar navegação profunda** — a auditoria respeita isso.

### 1.2 Superpriorizado (descer ou adiar)

| Item | Por quê descer | Sugestão |
|------|----------------|----------|
| **U2 “Editar no carrinho” no resumo** | Em demo o path feliz não volta ao carrinho; o resumo já permite editar destinatário/endereço/agenda. | P2 / “se sobrar sprint”. |
| **U6 Logout admin sem confirmação** | Inconsistência real, mas raramente tocada no script de demo. | Sprint B ou depois; não P0. |
| **U5 Perfil “em breve”** | Contraste com checkout rico existe, mas perfil não é o palco da demo. | Não tocar agora (ver §5). |
| **U11 Empty de categorias** | Faixa vazia é feia só se o seed falhar; com seed saudável some. | Condicional: só se seed de demo puder ficar sem categorias. |
| **D3 Preço 28 / tab label 11** | Cosmético; não muda percepção de “funciona”. | P2. |
| **D5 SpaceMono morta** | Higiene de código, zero impacto de demo. | Fora do polish de UX. |
| **D7 Tab bar 62 + home indicator** | Risco real em device específico; não é o script principal. | Validar em 1 device com gesture bar; corrigir só se quebrar. |
| **A1–A6 a11y completa** | Importante para produto maduro; **não** é o que a floricultura avalia em demo presencial. | Live region em CEP/pagamento pode entrar depois; VoiceOver profundo fora. |
| **B7 Timeline cancelled** | Só aparece se o script forçar cancelado / status fora de sequência. | Se o script de demo **não** mostra cancelamento → Sprint B ou não tocar. |
| **B9 Sucesso sem orderId** | Edge case; gates + anti-duplicata já mitigam. | Guard leve (CTA alternativo) em Sprint B, não P0. |

### 1.3 Subpriorizado (subir)

| Item | Por quê subir |
|------|---------------|
| **U1 Stepper visual** | Em floricultura o checkout de 5 etapas **é o coração da narrativa**. Depois de “Editar” no resumo, “ETAPA N DE 5” sozinho perde orientação. **Promover para Sprint A (P0 de percepção)**. |
| **U8 Lista de pedidos sem item** | O fechamento da demo é “veja seu pedido”. Número + valor sem nome do item dificulta reconhecimento. **Subir para Sprint A.** |
| **U10 AuthGate só spinner** | Transição de papel / login na demo; spinner mudo parece freeze. Barato de corrigir com `LoadingState`. **Sprint A.** |
| **C2 / C3 Jargão admin** | O admin **é** demonstrado (avançar status + catálogo). “CRUD”, “Firestore”, “Unsplash”, “slug” quebram o tom. **Sprint A copy.** |
| **B6 Erro silencioso na quantidade do carrinho** | Mesmo padrão de B5; incluir junto de B5. |
| **B4 Banner CTA morto** | Um toque no hero e nada acontece = demo desajeitada. Manter P0 com fallback visível. |

### 1.4 Lacunas da auditoria

1. **Script de demo como filtro de priorização** — só Sprint A o que o script toca ou pode aparecer por acidente (dark mode, OOS, banner, erro de rede).
2. **Modo apresentação do pagamento** — rebaixar “Simular recusa” (outline, rodapé, ou “Opções de demonstração”).
3. **Frete “estimada”** — uma frase fixa ilustrativa, sem frete real.
4. **Hierarquia tipográfica do checkout** — stepper + title + notice + form; não empilhar “ETAPA N” + stepper.
5. **Erro/empty padronizado no admin** (não só dashboard).
6. **Densidade sticky CTA no PDP** — QA em handset curto.
7. **Guia de tom de voz** curto para engenharia.

### 1.5 Re-priorização

```text
P0 DEMO (Sprint A):  parecer quebrado OU desorienta checkout/fecho da demo
P1 FLUIDEZ (Sprint B):  reduz atrito no walkthrough sem mudar narrativa
P2 / NÃO AGORA:  a11y profunda, higiene de tokens mortos, perfil, tipografia fina
```

---

## 2. Microcopy reescrita (PT-BR)

**Tom:** acolhedor e direto · frases curtas · **um** aviso de “não cobra” no pagamento · zero jargão de stack no admin.

### 2.1 Pagamento (`/checkout/payment`)

| Local | Usar |
|-------|------|
| Caption | `Etapa 5 de 5` |
| Título | `Pagamento` |
| Notice título | `Nenhuma cobrança nesta versão` |
| Notice descrição | `PIX e cartão são só para você ver o fluxo. Ao confirmar, o pedido é registrado para acompanhamento.` |
| Total | `Total do pedido` |
| Loading | `Confirmando pedido…` |
| PIX card | `PIX (exemplo)` / `Código de exemplo — não gera pagamento` |
| CTA principal | `Confirmar pedido` |
| Recusa | `Testar falha de pagamento` (outline, secundário) |
| Após falha | `Não foi possível confirmar` · `Nada foi cobrado. Você pode tentar de novo.` |

### 2.2 Agenda

| Local | Usar |
|-------|------|
| Notice | `Escolha a partir de amanhã, nos próximos 60 dias. Datas passadas não ficam disponíveis.` |
| Erro settings | `Não foi possível carregar as datas` + `Tentar novamente` |

### 2.3 Admin

| Local | Usar |
|-------|------|
| Produtos | `Cadastre produtos da loja. A foto pode ser um link temporário até a identidade oficial.` |
| Categorias | Título: `Categorias da loja` · lista: `Ordem de exibição: N` (sem slug) |
| Badge | `Disponível` (não “ATIVO” rosa) |
| Empty pedidos | `Nenhum pedido por aqui` · `Quando um cliente finalizar a compra, ele aparece nesta lista.` |
| Erro dashboard | `Não foi possível carregar o painel` + `Tentar novamente` |
| Logout | `Sair da conta de gestão?` |

### 2.4 Catálogo / carrinho / not-found

| Local | Usar |
|-------|------|
| Catálogo erro | `Não foi possível carregar os produtos` |
| Qty erro | `Não foi possível atualizar a quantidade.` |
| Frete | `Entrega com valor ilustrativo nesta versão.` |
| AuthGate | `Preparando sua conta…` |
| OOS CTA | `Indisponível no momento` |
| Banner inválido | Ir ao catálogo · opcional: `Promoção indisponível. Veja o catálogo.` |
| Pedidos linha | `Buquê X` ou `3 itens` |
| Not-found | `Não encontramos essa tela` · CTA `Ir para o início` (PT-BR + DS) |

Preservar mensagens de `useAuthActions`.

---

## 3. Padrões de UI (DS atual)

### 3.1 Checkout stepper

Faixa compacta de 5 dots + label só do passo atual. Concluído/`primary`, atual com anel, futuro/`border`. Preferir componente `CheckoutStepper`. Sprint A: só indicador (não navegável). Substituir caption “ETAPA N DE 5” solto para não duplicar.

### 3.2 Dark mode

MVP **light-only**: forçar tema claro na navegação + `userInterfaceStyle: "light"` na config Expo de demo. Status bar dark content. Não implementar dual theme.

### 3.3 Card OOS

`Pressable` ativo; detalhe abre; CTA comprar disabled. Badge de estoque visível; não desabilitar o card inteiro.

### 3.4 Admin empty/error

Loading / Erro+retry / Vazio legítimo — nunca KPIs zerados em erro. Badge operacional com `secondary`/`success`, não rosa promo.

### 3.5 Lista de pedidos

Thumb 56 + número + nome do 1º item · N itens + data/entrega + total + badge. Fallback sem imagem: placeholder `secondary`.

---

## 4. Sprint A / Sprint B

### Sprint A — Demo não parece quebrada

1. Forçar UI/navegação light (B1)  
2. Admin dashboard erro + retry (B2)  
3. Card OOS abre detalhe (B3)  
4. Carrinho Continuar + qty com loading/erro (B5, B6)  
5. Banner fallback catálogo (B4)  
6. Copy agenda + pagamento + rebaixar recusa (U3, C1, U9)  
7. Stepper compacto checkout (U1)  
8. Lista pedidos com nome/itens (+ thumb se houver) (U8)  

Extras baratos se couber: AuthGate `LoadingState`; copy admin sem CRUD/Firestore/slug.

### Sprint B — Walkthrough mais fluido

1. Touch targets ≥ 44  
2. Not-found PT-BR + isolar modal template  
3. Empty/erro Home categorias e schedule settings (se aplicável)  
4. “Novo endereço” como Button secondary  
5. Badge admin “Disponível”  
6. Timeline cancelado/fora de sequência  
7. Confirmar logout admin  
8. Linha de frete ilustrativa  

---

## 5. Não tocar agora

Gateway real, frete definitivo, cancelamento/reembolso, API entrega/GPS, push, identidade oficial, admin web, lojas, liberar admin nas tabs cliente, dual theme dark, perfil rico, a11y profunda, limpeza SpaceMono isolada, tipografia fina, refator checkout para 3 passos, mudar modelo de dados “só por UX”.

**Preservar:** aviso único de não cobrança; gates + anti-duplicata; tokens/componentes base; Voltar correto em `/order/[id]`; script admin→timeline.

---

## 6. Checklist de aceite da demo

1. Android dark system: headers/tabs claros.  
2. Banner sempre leva a lugar útil.  
3. OOS abre e explica.  
4. Continuar no carrinho com feedback.  
5. Stepper no checkout; agenda com copy humana.  
6. Pagamento: um aviso de não cobrança; recusa não óbvia.  
7. Pedidos: reconhece o que comprou.  
8. Admin: erro não “zera”; textos de loja.  
9. Sem inglês de template Expo no caminho (e no not-found).

---

## 7. Referências

- `docs-ia/ux_audit_polish.md` — auditoria técnica  
- Este arquivo — parecer e plano de implementação  
- `docs-ia/design_system.md`, `src/components/theme.ts`, `docs-ia/escopo.md`

**Próximo passo (mediante aprovação):** implementar Sprint A (A1→A8); validar §6 no Expo/APK; depois Sprint B.
