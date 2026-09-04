# Design System

## Status

**Provisório para MVP**, aprovado para desenvolvimento até a floricultura disponibilizar logo e identidade oficial. Valores abaixo podem ser atualizados sem mudar a estrutura de tokens.

Aplicado no código (`src/components/theme.ts`) e usado nas telas do MVP-0–3 (incluindo pass de UI/UX de 2026-09-04). Não tratar este tema como identidade final da marca.

## Princípios

- Mobile-first, comércio de flores e presentes.
- Clareza de valores, fotos em destaque e poucos passos no checkout.
- Feedback visual explícito (loading, erro, sucesso, vazio).
- Status de pedido e entrega visíveis e separados.
- Evitar navegação profunda.

## Marca provisória

- Nome de trabalho no app: **Flora & Presentes** (substituir pelo nome oficial quando disponível).
- Logo: ícone floral genérico até o cliente enviar o arquivo oficial.
- Tom: botânico, fresco, acolhedor — sem parecer “template genérico de floricultura”.

## Paleta de Cores (provisória)

| Token | Hex | Uso |
|-------|-----|-----|
| `ink` | `#1C2B26` | Texto principal |
| `muted` | `#5F6F68` | Texto secundário |
| `canvas` | `#F5F7F6` | Fundo de tela |
| `surface` | `#FFFFFF` | Superfícies / cards de interação |
| `primary` | `#1F4D3A` | Ações principais, marca |
| `primaryPressed` | `#16382B` | Estado pressionado |
| `secondary` | `#E3EDE8` | Fundos suaves / chips |
| `border` | `#D0DCD5` | Bordas e divisores |
| `accent` | `#C45B7A` | Destaque floral / promoção |
| `softAccent` | `#F7E8EE` | Fundo de destaque leve |
| `success` | `#2F7D57` | Sucesso / confirmação |
| `warning` | `#C48A2A` | Atenção |
| `error` | `#B33A45` | Erro |
| `white` | `#FFFFFF` | Texto sobre primary |

## Tipografia (provisória)

- iOS: `Avenir Next`
- Android / default: `sans-serif`
- Pesos: regular (400) e bold (700)

| Token | Tamanho | Uso |
|-------|---------|-----|
| `display` | 32 | Títulos de entrada / hero de seção |
| `title` | 25 | Títulos de tela |
| `subtitle` | 18 | Apoio / seções |
| `body` | 16 | Corpo e formulários |
| `caption` | 13 | Labels auxiliares, metadados |

## Espaçamento

| Token | Valor |
|-------|-------|
| `xs` | 8 |
| `sm` | 12 |
| `md` | 16 |
| `lg` | 24 |
| `xl` | 32 |
| `xxl` | 48 |

## Forma

| Token | Valor | Uso |
|-------|-------|-----|
| `radius.sm` | 8 | Inputs pequenos / tags |
| `radius.md` | 14 | Botões / inputs |
| `radius.lg` | 18 | Blocos / banners |
| `radius.xl` | 24 | Modais / sheets |
| Toque mínimo | 44 | Botões e ícones clicáveis |

Elevação: preferir borda + superfície clara; sombra leve só quando necessário para hierarquia.

## Componentes-base confirmados no código

- `Button` (`primary` | `secondary` | `outline`)
- `Input`
- `Typography`
- `Container`

Novos componentes do MVP devem reutilizar esses tokens (`colors`, `spacing`, `type`, `radius`, `fontFamily`).

## Direção de UI do MVP

Fluxo visual:

```text
ENCONTRAR → ESCOLHER → PERSONALIZAR → ENTREGAR → PAGAR → ACOMPANHAR
```

Navegação conceitual do cliente:

```text
HOME | CATÁLOGO | CARRINHO | PEDIDOS | PERFIL
```

Admin (MVP): uma tela de dashboard mockada com tópicos futuros visíveis; implementação real posterior.

## Feedback e estados

Padrões aplicados no MVP-1:

- loading com mensagem contextual;
- erros com ação de retry;
- estados vazios com próximo passo claro (ex.: ir ao catálogo);
- pull-to-refresh em Home e Catálogo;
- prevenção de submit em formulários incompletos;
- confirmação ao sair da conta;
- CTA de produto com barra inferior fixa e total estimado;
- aviso honesto quando o carrinho ainda não está disponível (sem fluxo falso).

## Pendências da marca oficial

Substituir quando o cliente enviar:

- nome oficial;
- logo;
- ajustes de paleta/tipografia se divergirem deste provisório;
- splash / ícones de loja.
