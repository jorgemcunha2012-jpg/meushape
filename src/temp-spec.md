# 🔧 PROMPT DE IMPLEMENTAÇÃO — Her Fit Journey Start (Quiz Funnel Overhaul)

## CONTEXTO

Este é um funil de quiz de fitness feminino brasileiro. O tráfego vem do TikTok Ads (mulheres 20-35, classe B/C). O funil já existe no Lovable e precisa ser **reestruturado** com as mudanças abaixo. NÃO crie do zero — edite o funil existente.

O fluxo completo é: **Landing → Quiz (14 perguntas + nome) → Loading → Resultado/Diagnóstico → Checkout (PIX + Cartão) → Confirmação**

---

## 📌 MUDANÇA 1 — PÁGINA INICIAL (Landing)

### Substitua a landing atual por:

**Badge topo:** `Quiz gratuito • 2 min`

**Headline:**
```
Mulheres com seu biotipo transformam o corpo em 12 semanas com o treino certo.
```

**Subheadline:**
```
Descubra o seu em 2 minutos.
```

**CTA (botão principal):**
```
Descobrir meu treino →
```

**Rodapé (social proof):**
```
Mais de 5.000 mulheres já fizeram o teste
```

**Badge de tempo:**
```
⏱ Apenas 2 min
```

### Remova:
- A headline antiga ("Descubra por que você NÃO tá tendo resultado no treino")
- A subheadline antiga
- O rodapé "82% das mulheres treinam errado sem saber"
- O CTA "Fazer o teste grátis"

---

## 📌 MUDANÇA 2 — QUIZ (Reestruturação Completa)

### Reduza o quiz de 26 perguntas para 14 perguntas + campo de nome.

### Mantenha a barra de progresso atualizada para o novo total (14 perguntas + nome = 15 etapas).

### Aqui está o quiz completo na ordem exata:

---

#### PERGUNTA 1 (single-select)
**Qual é seu objetivo principal?**
- Quero emagrecer
- Quero botar shape / definir o corpo
- Quero emagrecer E botar shape
- Quero começar a treinar (não sei por onde)

---

#### 🔶 TELA INTERMEDIÁRIA (após P1)
**Mais de 5.000 mulheres já descobriram o treino certo pro seu corpo**

Suas respostas vão criar um plano feito só pra você.

**CTA:** Continuar →

---

#### PERGUNTA 2 (single-select)
**Como é seu corpo hoje?**
*(Sem julgamentos — é só pra personalizar seu plano 💛)*
- Magra
- Normal
- Um pouco acima do peso
- Bem acima do peso

---

#### PERGUNTA 3 (single-select)
**Como você quer ficar?**
- Sequinha
- Definida / tonificada
- Forte / com músculo visível

---

#### PERGUNTA 4 (single-select)
**Você já treina ou já treinou?**
- Nunca treinei
- Já treinei, mas parei
- Treino atualmente

---

#### PERGUNTA 5 (multi-select)
**O que já te fez desistir de treinar antes?**
*(Selecione todas que se aplicam)*
- Não sabia o que fazer
- Perdi a motivação
- Não via resultado
- Não tinha tempo
- Nunca comecei de verdade

**CTA:** Continuar →

---

#### 🔶 TELA INTERMEDIÁRIA (após P5)
**O problema nunca foi falta de vontade**

A maioria desiste por um motivo simples: não tinha o plano certo. Com alguém te mostrando cada passo, você não precisa de motivação — só de abrir o app.

**CTA:** Continuar →

---

#### PERGUNTA 6 (single-select)
**Onde você quer treinar?**
- Na academia
- Em casa
- Tanto faz

---

#### PERGUNTA 7 (single-select)
**Quantos dias por semana você consegue treinar?**
- 1 a 2 dias
- 3 dias
- 4 dias
- 5 ou mais dias

---

#### PERGUNTA 8 (single-select)
**Quanto tempo você tem pra treinar por dia?**
- Até 20 minutos
- 30 minutos
- 45 minutos
- 1 hora ou mais

---

#### PERGUNTA 9 (multi-select)
**Quais partes do corpo você mais quer trabalhar?**
*(Selecione todas que se aplicam)*
- Barriga / abdome
- Pernas e glúteos (bumbum)
- Braços
- Costas
- Corpo todo igual

**CTA:** Continuar →

---

#### PERGUNTA 10 (multi-select)
**Você sente dor ou desconforto em algum lugar?**
*(Selecione todas que se aplicam)*
- Não tenho nenhuma dor
- Costas / coluna
- Joelhos
- Ombros

**CTA:** Continuar →

---

#### PERGUNTA 11 (seletor numérico)
**Qual é sua altura?**
*(Seus dados são usados só pra criar seu plano. Não compartilhamos com ninguém.)*
Seletor: valor em cm — padrão: **160 cm**

**CTA:** Continuar →

---

#### PERGUNTA 12 (seletor numérico)
**Qual é seu peso atual?**
Seletor: valor em kg — padrão: **65 kg**

**CTA:** Continuar →

---

#### PERGUNTA 13 (seletor numérico)
**Qual peso você gostaria de alcançar?**
Seletor: valor em kg — padrão: **60 kg**

**CTA:** Continuar →

---

#### PERGUNTA 14 (single-select)
**Você acredita que consegue chegar lá?**
- Com certeza! Tô motivada 💪
- Tenho dúvida, mas quero tentar
- Não sei... mas quero acreditar

---

#### PERGUNTA 15 (campo de texto)
**💛 Qual seu primeiro nome?**
*(Pra gente personalizar seu diagnóstico 😊)*
Campo de texto — placeholder: "Ex: Maria"

**CTA:** Continuar →

---

### PERGUNTAS QUE DEVEM SER REMOVIDAS DO QUIZ:
- "Quando foi a última vez que você se sentiu bem com seu corpo?" (antiga P5)
- "Quando você chega na academia, você sabe o que fazer?" (antiga P6)
- "Você já deixou de usar algum aparelho na academia por não saber como funciona?" (antiga P7)
- "Se alguém te pedisse pra explicar seu treino atual, você conseguiria?" (antiga P8)
- "Em que horário você costuma treinar?" (antiga P12)
- "O que te motiva a querer treinar?" (antiga P15)
- "Como é seu dia a dia?" (antiga P17)
- "Como tá sua energia durante o dia?" (antiga P18)
- "Quantas horas você dorme por noite?" (antiga P19)
- "Quanta água você bebe por dia?" (antiga P20)
- "Qual é sua idade?" (antiga P24)
- "Tem algum evento importante que você quer ficar em forma?" (antiga P25)

### TELA INTERMEDIÁRIA QUE DEVE SER REMOVIDA:
- A tela intermediária após a antiga P8 ("Imagina ter uma personal trainer no celular...")

---

## 📌 MUDANÇA 3 — TELA DE LOADING

### Mantenha a estrutura atual, mas faça estas alterações:

**Troque:**
```
🔥 12.000+ mulheres transformadas
```

**Por:**
```
🔥 5.000+ mulheres já fizeram o teste
```

Mantenha os depoimentos em carrossel (Amanda R. e Beatriz L.) e o CTA "Ver Meu Diagnóstico Completo".

---

## 📌 MUDANÇA 4 — REMOVER ANÁLISE CORPORAL POR IA

### Remova completamente a tela de "Análise Corporal por IA" (upload de foto) do funil.

O fluxo deve ir direto de Loading → Página de Resultado, sem a etapa de upload de foto.

---

## 📌 MUDANÇA 5 — PÁGINA DE RESULTADO (Diagnóstico)

### Mantenha a estrutura de 4 abas (Score, Gráfico, Insights, Provas), mas faça estas alterações:

**Na aba Score:**
- Mantenha as barras de pontuação e o score
- Troque o rodapé de:
```
⭐⭐⭐⭐⭐ 4.8 | 5.200+ mulheres ativas | 87% viram resultados em 30 dias
```
- Por:
```
⭐⭐⭐⭐⭐ 4.8/5 | 5.000+ mulheres já fizeram o teste
```

**Na aba Provas:**
- Mantenha os 4 depoimentos como estão

**Pop-up de urgência — substitua a copy por:**

Título:
```
[Nome], seu plano tá pronto
```

Corpo:
```
Seu gargalo em [ponto mais fraco] tende a piorar sem ação. Com o plano personalizado, os primeiros resultados aparecem nas primeiras 4 semanas.
```

CTA:
```
Escolher meu plano →
```

Rodapé:
```
Garantia de 30 dias • Cancele quando quiser
```

---

### FORMULÁRIO DE CONVERSÃO — SUBSTITUIR

**Remova** o formulário atual de cadastro (nome + email + senha) da página de resultado.

**Substitua por um bloco de CTA simples:**

```
Seu plano personalizado tá pronto.

[Escolher meu plano →]

Garantia 30 dias • Acesso imediato • Cancele quando quiser
```

O botão "Escolher meu plano" leva para a página de Checkout (nova página, descrita abaixo).

---

## 📌 MUDANÇA 6 — NOVA PÁGINA DE CHECKOUT

### Crie uma nova página de checkout com a seguinte estrutura:

**URL:** `/checkout`

---

### Cabeçalho:
```
Escolha seu plano, [Nome]
```

Subtítulo:
```
Acesso imediato ao seu plano personalizado.
```

---

### Planos de preço (3 cards lado a lado no desktop, empilhados no mobile):

**Card 1 — Mensal**
- Badge: `⭐ Mais Popular`
- Preço grande: `R$ 19,90/mês`
- Preço por dia: `R$ 0,66/dia`
- Bullets:
  - ✅ Acesso imediato
  - ✅ Treinos personalizados
  - ✅ Progressão automática
  - ✅ Suporte via chat
  - ✅ Garantia 30 dias
- CTA: `Começar agora →`
- Destaque visual: borda colorida, card levemente maior ou elevado para destacar como opção principal

**Card 2 — Trimestral**
- Badge: `Economize R$ 10`
- Preço grande: `R$ 49,90/3 meses`
- Preço por dia: `R$ 0,55/dia`
- Mesmos bullets do mensal
- CTA: `Começar agora →`

**Card 3 — Anual**
- Badge: `Melhor preço`
- Preço grande: `R$ 99,90/ano`
- Preço por dia: `R$ 0,27/dia`
- Mesmos bullets do mensal
- CTA: `Começar agora →`

---

### Após selecionar o plano, mostrar seção de pagamento:

**Título:**
```
Como você quer pagar?
```

**Duas opções (tabs ou botões):**

**Opção 1 — PIX**
- Ícone do PIX
- Texto: "Pagamento instantâneo via PIX"
- Ao selecionar: mostra QR Code ou código PIX para copiar
- Texto de suporte: "Acesso liberado assim que o pagamento for confirmado"

**Opção 2 — Cartão de Crédito**
- Ícone de cartão
- Campos: Número do cartão, Validade, CVV, Nome no cartão
- CTA: `Pagar R$ [valor] →`

---

### Formulário de cadastro (abaixo ou ao lado do pagamento):
- Campo: Seu primeiro nome (pré-preenchido com o nome do quiz)
- Campo: Seu melhor email
- Campo: Crie uma senha (mínimo 6 caracteres)

---

### Trust signals abaixo do checkout:
```
🔒 Pagamento 100% seguro
💰 Garantia de 30 dias ou seu dinheiro de volta
📱 Acesso imediato após o pagamento
❌ Sem renovação automática • Cancele quando quiser
```

---

### Social proof no rodapé do checkout:
```
⭐⭐⭐⭐⭐ 4.8/5 — Mais de 5.000 mulheres já fizeram o teste
```

---

## 📌 MUDANÇA 7 — PÁGINA DE CONFIRMAÇÃO (Pós-Pagamento)

### Crie uma página de confirmação:

**URL:** `/sucesso`

**Título:**
```
Parabéns, [Nome]! Seu acesso foi ativado 🎉
```

**Subtítulo:**
```
Seu plano personalizado tá pronto. Seu primeiro treino está esperando.
```

**CTA:**
```
Ir para meu dashboard →
```

**Texto de suporte:**
```
Dúvidas? Nosso suporte via chat está aqui pra você.
```

---

## 📐 DIRETRIZES DE DESIGN

- **Mobile-first**: 90%+ do tráfego vem do TikTok mobile. Toda tela deve ser otimizada para mobile primeiro.
- **Estética**: Manter o design atual do app (cores, fontes, estilo). Não mudar a identidade visual.
- **Performance**: Páginas devem carregar em menos de 3 segundos. Minimizar imagens pesadas.
- **CTAs**: Botões grandes, com contraste alto, sempre visíveis sem scroll no mobile.
- **Transições**: Transições suaves entre perguntas do quiz (slide ou fade). Manter a sensação de progresso.
- **Barra de progresso**: Atualizar para refletir 15 etapas no total (14 perguntas + nome).

---

## 📋 CHECKLIST DE VALIDAÇÃO

Depois de implementar, verifique:

- [ ] Landing mostra a nova headline (variação C)
- [ ] Quiz tem exatamente 14 perguntas + campo de nome
- [ ] Perguntas removidas não aparecem mais
- [ ] P4 tem 3 opções (não 5)
- [ ] P10 tem 4 opções (não 5, sem "Cotovelos/punhos")
- [ ] P13 (peso meta) tem default 60kg (não 65kg)
- [ ] Tela intermediária após antiga P8 foi removida
- [ ] Telas intermediárias após P1 e P5 têm copy atualizada
- [ ] Análise corporal por IA foi removida do fluxo
- [ ] Loading mostra "5.000+" (não "12.000+")
- [ ] Página de resultado não tem mais formulário de cadastro
- [ ] Página de resultado tem CTA "Escolher meu plano" que leva ao checkout
- [ ] Pop-up de urgência tem copy atualizada (sem estatísticas)
- [ ] Checkout tem 3 planos (mensal, trimestral, anual — sem semanal)
- [ ] Checkout tem opções PIX e Cartão
- [ ] Checkout tem campos de cadastro (nome pré-preenchido, email, senha)
- [ ] Página de confirmação existe e funciona
- [ ] Barra de progresso reflete 15 etapas
- [ ] Tudo responsivo e otimizado para mobile
