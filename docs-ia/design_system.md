# Design System — Floricultura Chuva de Ouro

## Status

Identidade oficial aplicada a partir da logo fornecida e referências do site
[chuvadeourofloricultura.com.br](https://www.chuvadeourofloricultura.com.br/).
Layout do site (Lovable) **não** é padrão de UI do app — só marca, tom e dados de contato.

## Marca

- Nome curto: **Chuva de Ouro**
- Nome completo: **Floricultura Chuva de Ouro**
- Tagline: *Entregamos sentimentos, não apenas flores.*
- Cidade: Anápolis-GO
- Logos (objetos separados, sem merge):
  - Dark: `assets/images/logo-chuva-de-ouro.png` (fundo preto)
  - Light: `assets/images/logo-chuva-de-ouro-light.png` (fundo branco; borda fina na imagem no light)
- Tokens de marca em `src/constants/brand.ts`
- Temas em `src/theme/light.ts` e `src/theme/dark.ts` — paletas **independentes**
- Runtime: `AppThemeProvider` + `useTheme()` — preferência **Sistema / Claro / Escuro** (Perfil → Aparência), persistida; padrão segue o SO (`userInterfaceStyle: automatic`)

## Princípios

- Mobile-first, comércio de flores e presentes.
- Alto contraste preto / branco / amarelo-dourado.
- Amarelo da logo como cor de ação e marca; preto para peso e elegância.
- Fotos de produto em destaque; UI clean, pouca sombra, bordas suaves.
- Serif nos títulos (Cormorant), sans no corpo (DM Sans).
- Nunca misturar tokens light/dark no mesmo objeto de estilo.

## Temas

### Light — branco + amarelo/dourado

| Token | Hex | Uso |
|-------|-----|-----|
| `canvas` / `surface` | `#F7F7F5` / `#FFFFFF` | Fundo / cards |
| `ink` | `#0A0A0A` | Texto |
| `primary` | `#F0C000` | Ação / marca |
| `logoBackdrop` / `logoBorder` | `#FFFFFF` / `#0A0A0A` | Marca |

### Dark — preto + amarelo/dourado

| Token | Hex | Uso |
|-------|-----|-----|
| `canvas` / `surface` | `#0A0A0A` / `#161616` | Fundo / cards |
| `ink` | `#F5F5F5` | Texto |
| `primary` | `#F0C000` | Ação / marca |
| `logoBackdrop` / `logoBorder` | `#000000` / `#F0C000` | Marca |

### Compartilhado de marca

| Token | Hex | Uso |
|-------|-----|-----|
| `primary` / `accent` | `#F0C000` / `#FFD200` | Ação e destaque |
| `whatsapp` | `#25D366` | Contato WhatsApp da loja |

`BrandMark`: `badge` (login/perfil) · `hero` (home, logo ampla)

## Tipografia

- Display / title: Cormorant Garamond
- Body / UI: DM Sans
- Escala: `display` 34 · `title` 26 · `subtitle` 17 · `body` 16 · `caption` 12

## Forma

- `radius.md` 12 · `lg` 16 · `xl` 24
- Toque mínimo 44
- Elevação leve só quando necessário; preferir borda

## Componentes

- `Button`: `primary` (amarelo), `dark` (preto + texto amarelo), `outline`, `secondary`, `whatsapp`
- `Input`, `Typography`, `Container`, `InlineNotice`, `ProductCard`, `CheckoutStepper`
