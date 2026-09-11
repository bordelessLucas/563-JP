# Guia para o próximo agente — deploy MOCK

Objetivo: colocar Cloud Functions no ar no projeto Firebase `jp-6a9d2` com **pagamento e entrega mock**, para o APK/app cliente já existente funcionar no checkout sem Uber nem gateway real.

Leia também: `docs/DEPLOYMENT.md`, `docs/ORDER_FLOW.md`, `.env.example`.

---

## Modo demo (validação com cliente)

**Estado atual desejado para APK de apresentação:** checkout 100% mock.

| Param | Valor demo |
|--------|------------|
| `APP_ENV` | `development` ou `staging` |
| `PAYMENT_PROVIDER` | `mock` |
| `DELIVERY_PROVIDER` | `mock` |
| `ENABLE_MOCK_PAYMENT` | `true` |

Defaults no código (`functions/src/config.ts`): `PAYMENT_PROVIDER` e `DELIVERY_PROVIDER` já são `mock`.

### Reverter para real (rápido)

1. Seguir checklist em **`docs/DEPLOY_REAL.md`** (gateway implementado + Uber + Blaze).
2. Atualizar só os **params das Cloud Functions** (não precisa rebuild do APK se `EXPO_PUBLIC_*` não mudou):
   - `APP_ENV=production` (ou `staging` primeiro)
   - `PAYMENT_PROVIDER=mercadopago|asaas`
   - `DELIVERY_PROVIDER=uber_direct`
   - `ENABLE_MOCK_PAYMENT=false`
3. Secrets Uber via Secret Manager + redeploy functions.
4. Para voltar ao mock em emergência (fora de production): restaurar a tabela “Modo demo” acima e redeploy.

---

## Contexto (não pule)

1. O app Expo já aponta para `jp-6a9d2` via `EXPO_PUBLIC_*`. **Não precisa rebuildar o APK** só para ligar o mock, se a config Firebase do APK for desse projeto.
2. O mock **não roda no app**. Roda nas **Cloud Functions** (`MockPaymentProvider` + `MockDeliveryProvider`).
3. Deploy de Functions Gen2 **exige Blaze** (pay-as-you-go). No **Spark**, `firebase deploy --only functions` falha.
4. Fail-closed: sem `APP_ENV` explícito de não-produção + `ENABLE_MOCK_PAYMENT=true`, `simulateMockPayment` e `PAYMENT_PROVIDER=mock` em produção são bloqueados (`functions/src/config.ts`).

---

## Checklist pré-deploy

- [ ] Projeto Firebase no **Blaze** (Console → Upgrade)
- [ ] Firebase CLI logado e projeto selecionado: `firebase use jp-6a9d2` (ou `.firebaserc` correto)
- [ ] Node 20+ em `functions/`
- [ ] Working tree alinhada com o código a deployar (`main` / branch acordada)

### Qualidade local (obrigatório antes do deploy)

```bash
npm run typecheck
npm run functions:test
npm run lint
```

---

## Params obrigatórios (MOCK)

Definir **antes ou durante** o deploy. Em Gen2/params, o CLI pergunta valores faltantes; preferível deixar explícito.

Valores alvo:

| Param | Valor mock |
|--------|------------|
| `APP_ENV` | `development` (ou `staging`) — **nunca** deixar vazio |
| `PAYMENT_PROVIDER` | `mock` |
| `DELIVERY_PROVIDER` | `mock` |
| `ENABLE_MOCK_PAYMENT` | `true` |
| `UBER_DIRECT_MODE` | `test` (irrelevante com delivery mock) |
| `UBER_DIRECT_CLIENT_ID` | vazio / placeholder ok |
| `UBER_DIRECT_CUSTOMER_ID` | vazio / placeholder ok |

**Secrets Uber:** com `DELIVERY_PROVIDER=mock` **não** são necessários para o fluxo mock. Se o deploy reclamar de secrets bound em funções que importam `UBER_RUNTIME_SECRETS`, setar secrets dummy **só se o build exigir** — o caminho feliz do mock não chama Uber.

Store (pickup) pode vir de params/`process.env` ou Firestore `settings/store`. Defaults existem em `config.ts` / `.env.example`; ajuste se a loja real já tiver endereço no Firestore.

Como setar params (exemplos):

```bash
# Interativo no primeiro deploy, ou via .env em functions/ (não versionar secrets)
# functions/.env é local/gitignored — útil para desenvolvimento; no cloud use params do Firebase.
```

Arquivo local de referência (já usado no repo, **não commitar**): `functions/.env` com:

```text
APP_ENV=development
PAYMENT_PROVIDER=mock
DELIVERY_PROVIDER=mock
ENABLE_MOCK_PAYMENT=true
```

No deploy cloud, confirme que os **params remotos** ficam com os mesmos valores (prompt do Firebase ou `firebase functions:config` / params UI conforme a versão do CLI).

---

## Deploy

Ordem sugerida:

```bash
npm --prefix functions run build
firebase deploy --only functions
firebase deploy --only firestore:rules
```

Ou:

```bash
firebase deploy --only functions,firestore:rules
```

Se falhar com erro de billing / Blaze → parar e pedir upgrade; não inventar workaround.

---

## Smoke test pós-deploy (MOCK)

Com app/APK autenticado no mesmo projeto:

1. Carrinho → destinatário → endereço → agenda  
2. `createDeliveryQuote` → taxa mock esperada (ex.: R$ 19,90 fixa do mock)  
3. `createCheckout` → order `awaiting_payment`  
4. `simulateMockPayment` → payment approved  
5. Admin: `markOrderPreparing` → `markOrderReady`  
6. Admin: `requestDelivery` → delivery mock (courier/tracking fake), **sem** Uber

Callables relevantes: ver `docs/ORDER_FLOW.md`.

Admin: usuário com `users/{uid}.role === admin` + claims sincronizadas (`syncAdminClaims` se necessário).

---

## O que NÃO fazer neste deploy

- Não setar `APP_ENV=production` com mock
- Não setar `ENABLE_MOCK_PAYMENT=true` em produção
- Não exigir credenciais Uber reais
- Não apontar `PAYMENT_PROVIDER` para `mercadopago` / `asaas` (ainda placeholder — quebra)
- Não alterar `EXPO_PUBLIC_*` no APK sem necessidade

---

## Critério de sucesso

- Functions listadas no Console Firebase (Gen2)
- Checkout + simulação de pagamento + `requestDelivery` mock funcionando no cliente/admin
- Firestore rules: client **não** cria/atualiza `orders` diretamente

---

## Depois do mock

Quando for produção/Uber/pagamento real → seguir **`docs/DEPLOY_REAL.md`**.
