# Escopo e Contexto do Projeto

## Status

Levantamento de requisitos confirmado com o cliente. Este documento é a **fonte principal de contexto** para desenvolvimento (incluindo agentes de IA). Requisitos não descritos aqui devem ser classificados como pendência e aprovados antes da implementação.

**Estado de implementação (2026-09-04):** MVP demonstrável **0–3 concluído** (catálogo seed, carrinho, checkout 5 etapas, pagamento mock, `orders` no Firestore, histórico/timeline, admin com avanço de status e CRUD básico de catálogo). Detalhes do que está no ar: `STATUS.md` e `mvp_sprints.md`. O que segue abaixo continua sendo o **alvo de produto**; itens de gateway real, entrega parceira, push e publicação nas lojas permanecem pendentes.

## Objetivo Principal

Desenvolver um aplicativo mobile (Android e iOS) para compra de flores, arranjos, presentes e produtos complementares, cobrindo o fluxo completo até o acompanhamento da entrega, além de uma área administrativa para a operação.

Fluxo principal do cliente:

```text
ENTRAR / CADASTRAR
        ↓
ESCOLHER PRODUTO
        ↓
PERSONALIZAR PEDIDO
        ↓
ADICIONAR AO CARRINHO
        ↓
INFORMAR DESTINATÁRIO
        ↓
DEFINIR ENDEREÇO
        ↓
ESCOLHER DATA / HORÁRIO
        ↓
REALIZAR PAGAMENTO
        ↓
PEDIDO CONFIRMADO
        ↓
ENTREGA
        ↓
ACOMPANHAMENTO
```

Experiência simplificada esperada: encontrar → escolher → personalizar → entregar → pagar → acompanhar.

## Regra Principal para Implementação

Antes de qualquer implementação:

1. Ler o contexto atual do projeto.
2. Analisar a arquitetura existente.
3. Identificar stack, pastas, banco, autenticação, serviços, componentes, design system e funcionalidades já concluídas.
4. Não recriar funcionalidades existentes.
5. Não substituir tecnologias já utilizadas sem necessidade real.
6. Preservar os padrões arquiteturais existentes.
7. Evitar regras de negócio diretamente nos componentes de UI.
8. Manter serviços externos desacoplados da interface.
9. Não implementar funcionalidades fora deste contexto ou de requisitos posteriores aprovados.

Ao receber um novo pedido de implementação:

1. Identificar quais módulos serão afetados.
2. Verificar o que já existe.
3. Preservar funcionalidades anteriores.
4. Alterar somente o necessário.
5. Documentar mudanças relevantes.
6. Não avançar automaticamente para outros módulos.
7. Não definir ordem de desenvolvimento nem reorganizar prioridades sem solicitação.
8. Executar apenas o escopo solicitado no prompt atual.

A ordem de implementação é definida externamente pelo responsável pelo projeto (ver `checklist_sprints.md`).

## Plataforma e Base Técnica

- Plataforma confirmada: mobile Android e iOS (mobile-first).
- SDK Expo fixado na versão 54.
- Navegação: Expo Router.
- Linguagem: TypeScript estrito, sem `any`.
- Integrações: Firebase e demais serviços isolados em services/providers, fora da UI.
- Build: estrutura preparada para EAS Build, Development Builds e Prebuild.
- Arquitetura: `UI → Hooks/Controllers → Services → Backend/Database/APIs`.
- Componentes de UI sem lógica de negócio.
- Integrações externas (pagamento, entrega, notificações) com providers próprios.

## Perfis de Usuário

Separar claramente permissões e rotas dos dois perfis. Nunca confiar apenas em esconder rotas no frontend; validar no backend/banco.

### Cliente

- Cadastro, autenticação, logout e recuperação de senha;
- Persistência de sessão e configuração inicial da conta;
- Navegação pelo catálogo (flores, arranjos, presentes, complementares);
- Criação e personalização do pedido;
- Escolha de destinatário, endereço, data e período de entrega;
- Pagamento (PIX e cartão);
- Confirmação, acompanhamento e histórico de pedidos.

### Administrador

- Acesso autenticado e autorizado à área administrativa;
- Gestão de produtos, categorias e banners;
- Gestão de pedidos, pagamentos e entregas;
- Configurações operacionais;
- Dashboard resumido com dados reais da operação.

Não há outros perfis confirmados.

## Navegação Principal

Navegação simples e orientada à compra. Estrutura conceitual:

```text
HOME | CATÁLOGO | CARRINHO | PEDIDOS | PERFIL
```

Adaptar a estrutura final ao design definido. Não criar navegação excessivamente profunda.

### Home

Ponto principal de descoberta, com estrutura para:

- banner promocional configurável;
- categorias;
- produtos em destaque;
- flores e presentes;
- atalhos de navegação.

Banner promocional não deve ser conteúdo fixo no código.

## Funcionalidades Core

1. Autenticação, sessão, recuperação de senha e configuração inicial da conta.
2. Navegação principal, home, categorias e banners configuráveis.
3. Catálogo com dados reais, listagem, detalhes e galeria de imagens.
4. Carrinho com quantidades, edição, remoção, personalização e valores.
5. Checkout com destinatário, endereço, data, período e resumo logístico.
6. Pagamentos via PIX e cartão, com backend, webhook e status confiáveis.
7. Pedido persistente, histórico, confirmação e acompanhamento da entrega.
8. Integração desacoplada com serviço de entregas e notificações de eventos.
9. Painel administrativo (produtos, categorias, pedidos, pagamentos, entregas, configs, dashboard).
10. Preparação e publicação Android e iOS nas lojas.

## Modelo de Dados (Entidades)

Organizar de forma semelhante a: `users`, `products`, `categories`, `banners`, `addresses`, `carts`, `orders`, `payments`, `deliveries`, `notifications`.

Adaptar aos padrões do Firebase/Firestore já utilizados. Evitar documentos excessivamente grandes ou duplicação desnecessária.

### Usuário (cliente)

```text
id, nome, email, telefone, role, createdAt, updatedAt
```

Arquitetura deve permitir expansão futura do cadastro sem reformulação completa.

### Category

```text
id, name, slug, image, active, order
```

Exemplos conceituais (não definitivos): Flores, Buquês, Arranjos, Presentes, Chocolates, Cestas, Complementos. Categorias são administráveis; não hardcodar lista definitiva.

### Banner

```text
id, titulo, imagem, destino, ativo, ordem, inicio, fim
```

Usos: campanhas, datas comemorativas, promoções, lançamentos, categorias. Clique pode ir para produto, categoria, coleção ou campanha.

### Product

```text
id, name, description, categoryId, price, images[], active, featured, stockStatus, createdAt, updatedAt
```

Evitar informações essenciais apenas como texto livre.

### Address

```text
id, userId, cep, street, number, complement, neighborhood, city, state, reference
```

Permitir reutilização de endereços cadastrados.

### Recipient

```text
name, phone, notes
```

Comprador e destinatário podem ser pessoas distintas. Destinatário e endereço pertencem ao contexto da entrega.

### Cart

```text
userId, items[], subtotal, deliveryFee, total
```

Item: `productId`, `productName`, `quantity`, `unitPrice`, `message`, `options`. Quantidade >= 1; remoção da última unidade deve confirmar ou remover o item.

### Order

```text
id, customerId, items[], recipient, deliveryAddress,
deliveryDate, deliveryPeriod,
subtotal, deliveryFee, total,
paymentMethod, paymentStatus, orderStatus, deliveryStatus,
createdAt, updatedAt
```

### Status (separados; nomenclatura centralizada; sem texto livre)

Pedido (exemplo conceitual):

```text
pending_payment | paid | preparing | ready_for_delivery | out_for_delivery | delivered | cancelled
```

Entrega (exemplo conceitual):

```text
delivery_requested | driver_assigned | picked_up | in_transit | delivered | failed | cancelled
```

Não misturar pagamento, produção e entrega em um único campo.

### Entrega / entregador (quando a API fornecer)

```text
driverName, driverPhone, deliveryExternalId
```

Campos opcionais conforme o provedor.

## Regras de Negócio Confirmadas

- Preservar dados necessários para continuidade do checkout entre etapas.
- Mensagem personalizada vinculada ao item ou ao pedido conforme regra definida; não perder ao navegar.
- Comprador e destinatário podem ser pessoas distintas.
- Entrega possui endereço, data e período selecionados; períodos configuráveis pela operação (não hardcodar na UI).
- Validar disponibilidade de data/período; preparar arquitetura para horário limite, dias, capacidade, regiões, feriados e bloqueios — implementar somente regras confirmadas.
- Cálculo: subtotal + adicionais + taxa de entrega = total. Nunca confiar em valores só do frontend; backend valida antes da cobrança.
- Pagamento via gateway no backend: App → Backend → Gateway → Webhook → Backend → Banco → App.
- Pedido não é marcado como pago apenas por ação do frontend; webhooks idempotentes.
- Não expor secrets do gateway no app; não armazenar dados completos de cartão; preferir tokenização/checkout/SDK do gateway.
- PIX: cobrança, QR/código copia e cola quando suportado, confirmação e atualização automática.
- Confirmação de sucesso somente após confirmação válida do pagamento quando o método exigir processamento.
- Fluxo logístico: pagamento confirmado → preparado → solicitação de coleta → entregador associado → em transporte → entregue.
- Provider de entrega desacoplado (`delivery.provider.ts` ou equivalente); UI sem dependência direta da API do fornecedor.
- Produtos e métricas reais; sem dados fictícios permanentes.
- Dashboard: pedidos recentes, do dia, em preparação, em entrega, concluídos — sem indicadores financeiros/estratégicos não solicitados.
- Não assumir frete, estoque, cancelamento, reembolso, cupons ou pedido mínimo sem confirmação.
- Não implementar sprints/módulos futuros antecipadamente.
- Classificar novas demandas: requisito confirmado, regra de negócio, sprint atual, funcionalidade futura, integração externa, pendência do cliente ou decisão técnica.

## Catálogo e Conversão

Listagem deve exibir rapidamente: imagem, nome, preço, categoria, disponibilidade. Preparar arquitetura para filtros/ordenações futuros sem obrigá-los agora.

Detalhe do produto: nome, galeria, descrição, preço, informações relevantes, quantidade e adicionar ao carrinho. O usuário deve entender o que é, quanto custa, o que será entregue e como adicionar.

Galeria: imagem principal, imagens adicionais, navegação; preparada para upload/gestão pelo admin.

## Pagamento, Pedido e Histórico

Resumo antes do pagamento: produtos, quantidades, personalizações, mensagem, destinatário, endereço, data, período, subtotal, entrega, total.

Tela de sucesso após confirmação: número do pedido, resumo, data/período, endereço e acesso ao acompanhamento.

Histórico do cliente: número, data, valor, status, itens, entrega e detalhes.

## Notificações

Estrutura reutilizável para eventos como: pagamento confirmado, em preparação, saiu para entrega, entregue. Tecnologia definitiva alinhada à arquitetura do projeto. Acompanhamento simplificado; não prometer GPS em tempo real se a API não oferecer.

## Área Administrativa

- Produtos: cadastrar, editar, ativar/desativar, preço, descrição, imagens, categoria; validar antes de salvar.
- Categorias: criar, editar, ativar/desativar, ordenar; evitar inconsistência em produtos existentes.
- Pedidos: listar, pesquisar, filtrar, detalhes, acompanhar pagamento/produção/entrega, atualizar estados permitidos.
- Pagamentos: pedido, método, valor, status, data — sem dados sensíveis desnecessários.
- Entregas: pedido, destinatário, data, período, status, entregador quando disponível.
- Configurações: períodos, dados da loja, banners, categorias, taxas, regiões, contato — só o aprovado no escopo; evitar valores operacionais no código.

## Segurança, Erros e Feedback

- Usuário acessa apenas seus pedidos e endereços; admin exige permissão real.
- Valores e pagamentos validados no backend; webhooks validados; secrets fora do frontend; dados pessoais protegidos.
- Tratamento de erro em fluxos críticos (login, catálogo, indisponibilidade, pedido, pagamento, entrega, histórico) com mensagens compreensíveis.
- Loading e feedback em operações assíncronas; evitar múltiplos cliques em ações críticas.

## Publicação

Preparar nome, ícone, splash, bundle/package, versão, build number, permissões e privacy descriptions. Builds Android (Play Store) e iOS (App Store) via conta oficial. Tratar rejeições das lojas relacionadas ao app desenvolvido, sem alterações arbitrárias.

## Pontos de Atenção Técnicos

Não há conflito impeditivo com Expo SDK 54 + React Native + Firebase. Decisões que ainda bloqueiam partes específicas:

- Gateway de pagamento não escolhido (PIX/cartão, webhook, backend).
- Serviço/API de entregas não escolhido.
- Regras de frete, regiões, estoque, datas/períodos e disponibilidade ainda pendentes de confirmação operacional.
- Plataforma do painel administrativo (mobile ou web) ainda não definida.
- Publicação requer nome oficial, identificadores, logo e credenciais das lojas.
- Auth, Firestore, Storage e notificações devem ser definidos por módulo; Analytics web não é dependência nativa automática.

## Decisões Pendentes

Nome oficial, identidade visual, logo, paleta, tipografia, gateway de pagamento, serviço de entregas, frete, taxas, regiões atendidas, disponibilidade de datas/horários, regras de estoque, cancelamento, reembolso, cupons, pedido mínimo, regras específicas de produtos, quantidade/política de imagens, tecnologia e plataforma do painel administrativo, provedor definitivo de notificações push.
