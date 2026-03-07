

## Plano: Funil de Quiz + App de Treinos Feminino

### 🎨 Design
- Estilo **clean e moderno** com tons neutros (nude, bege, branco) e toques femininos sutis
- Tipografia elegante, espaçamento generoso, cantos arredondados
- Responsivo (mobile-first, já que o público provavelmente acessa pelo celular)

### 📱 Estrutura do Projeto

#### 1. Funil de Quiz (público, sem login)
- **Landing page** do quiz com CTA chamativo
- **Perguntas em etapas** (uma por tela, barra de progresso no topo)
- Sistema de **scoring** por resposta — cada opção soma pontos para um dos 2-3 perfis
- **Coleta de email** antes de mostrar o resultado
- **Página de resultado** personalizada conforme o perfil (ex: "Seu perfil é X")
- **Checkout com Stripe** integrado na página de resultado (trial de 7 dias grátis, vincula cartão)

#### 2. Dashboard Admin (protegido por login)
- Acesso exclusivo para você (admin)
- **Métricas**: visitas no funil, leads capturados, conversões no checkout
- **Lista de leads** com respostas individuais do quiz e perfil atribuído
- Filtros e busca por email/perfil

#### 3. App de Treinos (a definir detalhes depois)
- Área logada para as usuárias (login com email capturado no quiz)
- Resultado do quiz já vinculado ao perfil da usuária
- Acesso liberado após assinatura Stripe ativa (7 dias grátis)
- Estrutura inicial criada, detalhes adicionados quando você trouxer as informações

### 🔧 Backend (Supabase/Lovable Cloud)
- **Autenticação**: login por email para admin e usuárias
- **Banco de dados**: tabelas para leads, respostas do quiz, perfis, métricas de visita
- **Stripe**: integração para trial 7 dias + cobrança recorrente
- **Roles**: tabela separada de roles (admin vs usuária) com segurança adequada

### 🔄 Fluxo da Usuária
1. Acessa o quiz → responde as perguntas → informa email
2. Vê resultado personalizado → vincula cartão (7 dias grátis)
3. Recebe acesso ao app de treinos com perfil já configurado

### ⏳ Próximos passos
- Você envia a **transcrição com as perguntas do quiz**
- Definimos os **2-3 perfis de resultado** e a lógica de scoring
- Você traz os detalhes do **app de treinos**
- Implementamos tudo incrementalmente

