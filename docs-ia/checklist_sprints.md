# Checklist de Sprints

Referência de ordem externa de implementação. Alinhado ao levantamento de requisitos em `escopo.md`. Marcações `[x]` refletem o estado atual do código (não apenas intenção).

## Sprint 0 - Decisões e Fundação

- [ ] Confirmar nome oficial, logo, identidade visual, paleta e tipografia.
- [ ] Confirmar escopo e plataforma do painel administrativo (mobile ou web).
- [ ] Confirmar gateway de pagamento e requisitos de PIX/cartão/webhook.
- [ ] Confirmar serviço/API de entregas e contrato de notificações.
- [ ] Definir regiões atendidas, frete definitivo, taxas, estoque e disponibilidade avançada com o cliente.
- [x] Confirmar modelo inicial mínimo das entidades usadas no MVP (users com role client/admin).
- [x] Manter Expo SDK 54 e preparar perfis EAS (Development / Preview / Production).
- [x] Isolar Firebase em services e definir rules iniciais das entidades principais.
- [x] Criar usuário administrador no Firebase (`admin@admin.com` / `borderless`, role `admin`).
- [x] Definir design system provisório (docs + tokens) até identidade oficial.
- [x] Publicar `settings/operation` (frete stub + períodos) e rules de `addresses`/`settings`.

## Sprint 1 - Estrutura Inicial e Acesso

- [x] Implementar autenticação de clientes (Firebase Auth + sessão persistente).
- [x] Implementar cadastro, login, logout e recuperação de senha.
- [x] Criar perfil básico do cliente no Firestore (`users` com role `client`).
- [ ] Completar modelo de usuário com telefone e `updatedAt` (expansível).
- [ ] Implementar configuração inicial da conta (dados obrigatórios vs opcionais, sem barreira desnecessária).
- [x] Criar navegação principal orientada à compra: Home, Catálogo, Carrinho, Pedidos, Perfil.
- [x] Separar claramente rotas/permissões de Cliente e Administrador na navegação.
- [x] Criar estrutura de categorias administráveis (sem lista hardcodada definitiva).
- [x] Criar espaço e modelo para banner promocional configurável (não conteúdo fixo no código).
- [x] Preparar Home com categorias, destaques e atalhos (placeholders aceitáveis até dados reais).

## Sprint 2 - Catálogo

- [x] Implementar listagem de flores, arranjos, presentes e complementares.
- [x] Implementar organização por categorias administráveis.
- [x] Exibir na listagem: imagem, nome, preço, categoria e disponibilidade.
- [x] Preparar arquitetura para filtros e ordenações futuros (sem obrigar implementação agora).
- [x] Implementar detalhes do produto orientados à conversão.
- [x] Implementar galeria de imagens (principal + adicionais).
- [x] Conectar o catálogo a dados reais (`products` / `categories`).
- [x] Suportar campos `featured`, `stockStatus` e `images[]`.
- [x] Evitar produtos fictícios permanentes.

## Sprint 3 - Carrinho e Personalização

- [x] Adicionar produtos ao carrinho.
- [x] Selecionar, alterar e remover quantidades (`quantidade >= 1`).
- [x] Tratar remoção da última unidade (confirmar ou remover item).
- [x] Editar itens do carrinho.
- [x] Incluir mensagem personalizada vinculada ao item/pedido sem perda entre etapas.
- [x] Exibir resumo preliminar (produtos, personalizações, subtotal).
- [x] Calcular valores preliminares (`subtotal`, `deliveryFee`, `total`) com validação futura no backend.
- [x] Preservar os dados necessários para continuidade do checkout.

## Sprint 4 - Endereço e Entrega

- [x] Cadastrar e reutilizar endereços.
- [x] Selecionar o endereço de destino.
- [x] Informar destinatário separado do comprador (`name`, `phone`, `notes`).
- [x] Escolher data de entrega.
- [x] Escolher período disponível configurável pela operação (não hardcodar na UI).
- [ ] Preparar validação de disponibilidade (só regras confirmadas pelo cliente).
- [x] Exibir resumo logístico (destinatário, endereço, data, período).
- [x] Garantir no pedido: comprador, destinatário, endereço, data e período.

## Sprint 5 - Pagamento e Confirmação

- [ ] Integrar gateway aprovado via backend (sem secrets no app).
- [ ] Implementar pagamento via PIX (cobrança, QR/código copia e cola quando suportado).
- [ ] Implementar pagamento via cartão com fluxo seguro (tokenização/checkout/SDK).
- [ ] Confirmar transação por fonte confiável (webhook idempotente).
- [x] Controlar `paymentStatus` separado de `orderStatus` e `deliveryStatus` (mock MVP-3).
- [ ] Validar valor final no backend antes da cobrança.
- [x] Registrar/atualizar pedido conforme fluxo financeiro definido (criação mock pós “aprovado”).
- [x] Exibir tela de sucesso somente após confirmação válida do pagamento (mock).
- [x] Exibir histórico básico de compras com detalhes.

## Sprint 6 - Entregas e Acompanhamento

- [ ] Criar provider desacoplado de entregas.
- [ ] Solicitar coleta automaticamente após condições aprovadas.
- [ ] Enviar ao parceiro: coleta, destino, destinatário, telefone, id do pedido e observações necessárias.
- [ ] Associar entregador quando suportado (`driverName`, `driverPhone`, `deliveryExternalId`).
- [x] Atualizar `deliveryStatus` de forma estruturada (avanço manual/mock no admin).
- [x] Exibir acompanhamento simplificado ao cliente (timeline; sem GPS).
- [ ] Implementar camada de notificações (pagamento, preparação, saída, entrega).
- [x] Validar o fluxo: pago → preparado → coleta → entregador → transporte → entregue (demo manual).

## Sprint 7 - Painel Administrativo

- [x] Criar acesso administrativo básico (login admin + dashboard mock no MVP).
- [ ] Implementar acesso administrativo autenticado e autorizado (validação completa no backend/banco).
- [x] Implementar cadastro e edição de produtos (criar + ativar/desativar no MVP-3; imagens/categoria básicas).
- [x] Implementar gestão de categorias (criar + ativar/desativar no MVP-3).
- [ ] Implementar gestão de banners configuráveis.
- [x] Implementar gestão de pedidos (listar + avançar status; filtros/pesquisa futuros).
- [ ] Implementar consulta de pagamentos (pedido, método, valor, status, data).
- [ ] Implementar acompanhamento administrativo das entregas.
- [ ] Implementar configurações básicas (períodos, loja, taxas, regiões, contato — só aprovadas).
- [x] Implementar dashboard resumido com dados reais (do dia, preparação, entrega, concluídos).

## Sprint 8 - Publicação

- [ ] Configurar nome, identificadores, ícones, splash e informações do aplicativo.
- [ ] Gerar e validar a versão Android (Play Store).
- [ ] Gerar e validar a versão iOS (App Store).
- [ ] Preparar os pacotes de distribuição EAS de produção.
- [ ] Preparar publicação na Google Play Store com conta oficial.
- [ ] Preparar publicação na Apple App Store / App Store Connect.
- [ ] Tratar ajustes solicitados pelas lojas dentro do escopo desenvolvido.
