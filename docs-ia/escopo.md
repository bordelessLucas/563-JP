# Escopo do Projeto

## Status

Escopo inicial confirmado pelo cliente. Este documento é a referência de produto para o desenvolvimento do aplicativo de floricultura e presentes. Requisitos não descritos aqui devem ser classificados como pendência e aprovados antes da implementação.

## Objetivo Principal

Criar um aplicativo mobile para Android e iOS que permita comprar e receber flores e presentes, desde o cadastro até o acompanhamento da entrega. O fluxo principal é:

Cadastro/Login -> Catálogo -> Produto -> Carrinho -> Personalização -> Endereço -> Data de entrega -> Pagamento -> Pedido -> Entrega -> Acompanhamento.

Também será necessária uma área administrativa para a operação básica de produtos, pedidos, pagamentos, entregas e configurações.

## Plataforma e Base Técnica

- Plataforma confirmada: mobile Android e iOS.
- SDK Expo fixado na versão 54 por compatibilidade com o Expo Go do dispositivo do cliente.
- Navegação: Expo Router.
- Linguagem: TypeScript estrito, sem `any`.
- Integrações: Firebase isolado em services, fora dos arquivos de UI.
- Build: estrutura preparada para EAS Build, Development Builds e Prebuild.
- Arquitetura: apresentação, domínio e dados separados; componentes de UI sem lógica de negócio.

## Perfis de Usuário

### Cliente

Pode:

- Cadastrar-se, entrar e recuperar a senha;
- Configurar a conta;
- Navegar por categorias, flores e presentes;
- Visualizar detalhes e imagens dos produtos;
- Adicionar, editar, alterar quantidade e remover itens do carrinho;
- Personalizar o pedido com uma mensagem;
- Cadastrar e selecionar endereços;
- Informar o destinatário;
- Escolher data e período de entrega disponíveis;
- Realizar pagamento via PIX ou cartão;
- Consultar histórico, confirmação e status dos pedidos;
- Acompanhar a entrega.

### Administrador

Pode:

- Acessar a área administrativa;
- Cadastrar e editar flores, presentes e categorias;
- Gerenciar pedidos;
- Consultar pagamentos;
- Acompanhar entregas;
- Alterar configurações básicas da operação;
- Consultar um dashboard resumido com dados reais.

Não há outros perfis confirmados.

## Funcionalidades Core

1. Autenticação, recuperação de senha e configuração inicial da conta.
2. Navegação principal, home, categorias e banner promocional inicial.
3. Catálogo de flores e presentes com dados reais, detalhes e galeria de imagens.
4. Carrinho com quantidades, edição, remoção, personalização e resumo preliminar de valores.
5. Checkout com comprador, destinatário, endereço, data e período de entrega.
6. Pagamentos via PIX e cartão, com confirmação e status básico.
7. Registro do pedido, histórico de compras e acompanhamento da entrega.
8. Integração com serviço de entregas, incluindo atualização de status e notificações.
9. Painel administrativo para produtos, pedidos, pagamentos, entregas e dashboard.
10. Preparação e publicação Android e iOS nas respectivas lojas.

## Entidades Principais

Usuários, Produtos, Categorias, Carrinho, Endereços, Destinatários, Pedidos, Pagamentos e Entregas.

O Pedido deve relacionar cliente, produtos, quantidades, personalização, valores, destinatário, endereço, data, período, pagamento, entrega e status.

## Regras de Negócio Confirmadas

- O pedido deve preservar os dados necessários para continuar o checkout.
- O comprador e o destinatário podem ser pessoas distintas.
- A entrega possui endereço, data e período selecionados.
- O fluxo logístico esperado é: pagamento confirmado -> pedido preparado -> solicitação de coleta -> entregador associado -> em transporte -> entregue.
- Produtos reais devem substituir dados fictícios quando a estrutura de dados estiver disponível.
- Dashboard e métricas devem usar dados reais; não manter métricas fictícias permanentes.
- Não assumir regras de frete, disponibilidade, estoque, cancelamento ou reembolso sem confirmação.
- Não implementar Sprints futuras antecipadamente.
- Novas demandas devem ser classificadas como requisito confirmado, regra de negócio, Sprint atual, funcionalidade futura, integração externa, pendência do cliente ou decisão técnica.

## Pontos de Atenção Técnicos

Não há conflito impeditivo entre o escopo e Expo SDK 54 + React Native + Firebase. Há, contudo, decisões que bloqueiam implementações específicas:

- O Firebase JS SDK atual está preparado, mas Auth, Firestore, Storage e notificações ainda precisam ser definidos por módulo; Analytics web não deve ser tratado como dependência nativa automática.
- O gateway de pagamento não foi escolhido. PIX e cartão exigirão um provedor e um fluxo seguro de confirmação no backend.
- O serviço/API de entregas não foi escolhido. A solicitação de coleta, associação ao entregador e notificações dependem desse contrato externo.
- Regras de frete, regiões, estoque, datas e períodos disponíveis ainda não existem.
- A área administrativa pode ser mobile ou web; essa decisão altera a arquitetura de apresentação e publicação.
- Publicação requer nome oficial, identificadores, logo, dados das lojas e credenciais de distribuição.

## Decisões Pendentes

Nome oficial, identidade visual, logo, paleta, tipografia, gateway de pagamento, serviço de entregas, frete, taxas, regiões atendidas, disponibilidade de datas e horários, quantidade de imagens, estoque, cancelamento, reembolso, cupons, pedido mínimo, regras específicas de produtos, tecnologia e plataforma do painel administrativo.
