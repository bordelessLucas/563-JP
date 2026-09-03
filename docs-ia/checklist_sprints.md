# Checklist de Sprints

## Sprint 0 - Decisões e Fundação

- [ ] Confirmar nome oficial, logo, identidade visual, paleta e tipografia.
- [ ] Confirmar escopo e plataforma do painel administrativo.
- [ ] Confirmar gateway de pagamento e requisitos de PIX/cartão.
- [ ] Confirmar serviço/API de entregas e contrato de notificações.
- [ ] Definir regiões atendidas, frete, taxas, estoque e disponibilidade de datas/períodos.
- [ ] Validar modelo inicial das entidades no Firebase.
- [ ] Manter Expo SDK 54 e validar Development Build, Prebuild e perfis EAS.

## Sprint 1 - Estrutura Inicial e Acesso

- [ ] Implementar autenticação de clientes.
- [ ] Implementar cadastro, login e recuperação de senha.
- [ ] Implementar configuração inicial da conta.
- [ ] Criar navegação principal extensível.
- [ ] Criar estrutura de categorias.
- [ ] Criar espaço para o banner promocional inicial.

## Sprint 2 - Catálogo

- [ ] Implementar listagem de flores.
- [ ] Implementar listagem de presentes complementares.
- [ ] Implementar organização por categorias.
- [ ] Implementar detalhes do produto.
- [ ] Implementar galeria de imagens.
- [ ] Conectar o catálogo a dados reais do sistema.
- [ ] Evitar produtos fictícios permanentes.

## Sprint 3 - Carrinho e Personalização

- [ ] Adicionar produtos ao carrinho.
- [ ] Selecionar, alterar e remover quantidades.
- [ ] Editar itens do carrinho.
- [ ] Incluir mensagem personalizada.
- [ ] Exibir resumo do pedido.
- [ ] Calcular valores preliminares.
- [ ] Preservar os dados necessários para continuidade do checkout.

## Sprint 4 - Endereço e Entrega

- [ ] Cadastrar endereços.
- [ ] Selecionar o endereço de destino.
- [ ] Informar os dados do destinatário.
- [ ] Escolher data de entrega.
- [ ] Escolher período/horário disponível conforme regra aprovada.
- [ ] Exibir resumo logístico.
- [ ] Garantir no pedido comprador, destinatário, endereço, data e período.

## Sprint 5 - Pagamento e Confirmação

- [ ] Integrar o gateway aprovado.
- [ ] Implementar pagamento via PIX.
- [ ] Implementar pagamento via cartão.
- [ ] Confirmar transação com o provedor.
- [ ] Controlar o status básico do pagamento.
- [ ] Registrar o pedido somente após o fluxo financeiro definido.
- [ ] Exibir histórico básico de compras.

## Sprint 6 - Entregas e Acompanhamento

- [ ] Solicitar coleta automaticamente após as condições aprovadas.
- [ ] Enviar os dados necessários ao serviço de entregas.
- [ ] Associar o pedido ao entregador quando suportado pelo provedor.
- [ ] Atualizar o status da entrega.
- [ ] Exibir acompanhamento simplificado ao cliente.
- [ ] Implementar notificações relacionadas à movimentação.
- [ ] Validar o fluxo pagamento confirmado -> preparado -> coleta -> entregador -> transporte -> entregue.

## Sprint 7 - Painel Administrativo

- [ ] Implementar acesso administrativo.
- [ ] Implementar cadastro e edição de flores.
- [ ] Implementar cadastro e edição de presentes.
- [ ] Implementar gestão de categorias.
- [ ] Implementar gestão de pedidos.
- [ ] Implementar consulta de pagamentos.
- [ ] Implementar acompanhamento das entregas.
- [ ] Implementar configurações básicas da operação.
- [ ] Implementar dashboard resumido com dados reais.

## Sprint 8 - Publicação

- [ ] Configurar nome, identificadores, ícones e informações do aplicativo.
- [ ] Gerar e validar a versão Android.
- [ ] Gerar e validar a versão iOS.
- [ ] Preparar os pacotes de distribuição EAS.
- [ ] Preparar publicação na Google Play Store.
- [ ] Preparar publicação na Apple App Store.
- [ ] Tratar ajustes solicitados pelas lojas dentro do escopo desenvolvido.
