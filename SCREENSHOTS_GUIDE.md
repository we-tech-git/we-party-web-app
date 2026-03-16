# 📸 Guia de Screenshots para Landing Page

## Visão Geral
Este guia explica quais screenshots você precisa capturar do We Party e onde colocá-los na landing page.

---

## 🎯 Screenshots Necessários

### 1. **Feed de Eventos** 
**Arquivo:** `public/screenshots/feed.png`  
**O que mostrar:**
- Vista principal do feed com vários eventos
- Cards de eventos com imagens, títulos, datas
- Interface de navegação e filtros
- Botões de interação (curtir, comentar, participar)

**Dicas:**
- Capture quando houver eventos variados visíveis
- Mostre a barra de navegação superior
- Inclua pelo menos 2-3 eventos completos

---

### 2. **Perfil Interativo**
**Arquivo:** `public/screenshots/profile.png`  
**O que mostrar:**
- Foto de perfil e informações do usuário
- Eventos que o usuário vai participar
- Amigos/seguidores
- Botões de editar perfil

**Dicas:**
- Use um perfil com boa quantidade de informações
- Mostre eventos confirmados
- Inclua estatísticas (se houver)

---

### 3. **Detalhes do Evento**
**Arquivo:** `public/screenshots/event-details.png`  
**O que mostrar:**
- Imagem principal do evento em destaque
- Informações completas (data, horário, local)
- Lista de participantes confirmados
- Seção de comentários
- Botão de confirmação de presença
- Mapa de localização (se disponível)

**Dicas:**
- Escolha um evento com boa imagem
- Mostre vários participantes confirmados
- Capture comentários se houver

---

### 4. **Chat e Interações**
**Arquivo:** `public/screenshots/chat.png`  
**O que mostrar:**
- Interface de mensagens/chat
- Conversas sobre eventos
- Notificações de interações
- Sistema de comentários inline

**Dicas:**
- Mostre conversas naturais e relevantes
- Inclua avatares dos usuários
- Capture a interface de envio de mensagem

---

### 5. **Criar Evento**
**Arquivo:** `public/screenshots/create-event.png`  
**O que mostrar:**
- Formulário de criação de evento
- Campos de upload de imagem
- Seleção de data/hora
- Campos de descrição e localização
- Seleção de categoria/tags

**Dicas:**
- Mostre o formulário parcialmente preenchido
- Destaque a simplicidade da interface
- Inclua preview se disponível

---

### 6. **Explorar Categorias**
**Arquivo:** `public/screenshots/categories.png`  
**O que mostrar:**
- Grid ou lista de categorias de eventos
- Filtros de pesquisa
- Tags e interesses
- Eventos filtrados por categoria

**Dicas:**
- Mostre diversas categorias (Festas, Shows, Esportes, etc.)
- Inclua ícones ou imagens das categorias
- Capture a interface de filtros ativos

---

## 📁 Estrutura de Pastas

Crie a pasta de screenshots:
```
public/
  screenshots/
    feed.png
    profile.png
    event-details.png
    chat.png
    create-event.png
    categories.png
```

---

## 🎨 Especificações Técnicas

### Dimensões Recomendadas:
- **Largura:** 1200px - 1600px
- **Altura:** 800px - 1200px (dependendo do conteúdo)
- **Formato:** PNG (melhor qualidade) ou JPG (menor tamanho)
- **Proporção:** 4:3 ou 16:9

### Qualidade:
- Resolução alta (não pixelado)
- Cores vibrantes e nítidas
- Sem informações pessoais sensíveis
- Interface limpa e organizada

---

## 🔧 Como Capturar Screenshots

### Método 1: Ferramentas do Navegador (Recomendado)
1. Abra a página que deseja capturar
2. Pressione **F12** (DevTools)
3. Pressione **Ctrl+Shift+P** (Mac: **Cmd+Shift+P**)
4. Digite "screenshot"
5. Escolha "Capture full size screenshot"

### Método 2: Extensões de Navegador
- **Chrome/Edge:** Awesome Screenshot, Nimbus Screenshot
- **Firefox:** Firefox Screenshots (nativo)

### Método 3: Ferramentas Especializadas
- **Windows:** Snipping Tool, Snip & Sketch, ShareX
- **Mac:** Command+Shift+4 (área selecionada)
- **Linux:** Shutter, Flameshot

---

## 🎭 Dados de Demonstração

Para melhores screenshots, use dados realistas:
- ✅ Nomes de eventos interessantes e criativos
- ✅ Imagens atrativas e de alta qualidade
- ✅ Datas próximas e relevantes
- ✅ Localizações reais
- ✅ Número razoável de participantes (50-200)
- ✅ Comentários construtivos e naturais

Evite:
- ❌ Lorem ipsum ou texto placeholder
- ❌ Imagens quebradas ou de baixa qualidade
- ❌ Dados obviamente falsos
- ❌ Interface com erros visíveis
- ❌ Informações pessoais reais de usuários

---

## 📝 Depois de Capturar

1. **Salve os arquivos** na pasta `public/screenshots/`

2. **Atualize o componente** (se necessário):
   - Abra: `src/components/modules/Landingpage/LandingPageV2.vue`
   - As imagens já estão configuradas no código

3. **Descomente as tags de imagem**:
   ```vue
   <!-- Remova o comentário desta linha -->
   <img :src="screenshot.image" :alt="screenshot.title" class="screenshot-image" />
   ```

4. **Remova ou oculte o placeholder** (opcional):
   ```vue
   <!-- Comente ou remova o bloco .screenshot-placeholder -->
   ```

---

## 🚀 Otimização (Opcional)

Para melhor performance, otimize as imagens:

```bash
# Usando TinyPNG (online) ou ferramentas CLI:
npm install -g imagemin-cli
imagemin public/screenshots/*.png --out-dir=public/screenshots/optimized
```

Ou use ferramentas online:
- [TinyPNG](https://tinypng.com/)
- [Squoosh](https://squoosh.app/)
- [ImageOptim](https://imageoptim.com/)

---

## ✅ Checklist Final

Antes de publicar, verifique:
- [ ] Todos os 6 screenshots foram capturados
- [ ] As imagens estão em alta resolução
- [ ] Não há dados sensíveis ou pessoais visíveis
- [ ] As imagens foram salvas na pasta correta
- [ ] O código foi atualizado para mostrar as imagens
- [ ] A landing page foi testada em desktop e mobile
- [ ] As imagens carregam rapidamente

---

## 🎨 Melhorias Adicionais Implementadas

### Nova Seção "Veja o We Party em Ação"
✨ Seção completamente nova entre "Features" e "Como Funciona"
- Grid responsivo de 6 cards com screenshots
- Tags coloridas para cada categoria
- Animações suaves e interativas
- Efeito de brilho (shine) ao passar o mouse
- Placeholder visual para cada screenshot
- CTA (Call-to-Action) personalizado ao final da seção
- Decorações animadas de fundo
- Totalmente responsivo (mobile-first)

### Design Aprimorado
- Gradientes modernos e vibrantes
- Sombras e elevações sofisticadas
- Transições suaves e naturais
- Ícones Material Design
- Tipografia hierárquica e legível

---

## 💡 Dicas Profissionais

1. **Consistência Visual:** Use o mesmo dispositivo/resolução para todos os screenshots
2. **Timing:** Capture os screenshots quando a interface estiver completamente carregada
3. **Contexto:** Mostre funcionalidades sendo usadas, não apenas telas vazias
4. **Variedade:** Inclua diferentes tipos de eventos e categorias
5. **Zoom:** Use zoom de 100% no navegador (evite 150% ou 75%)

---

## 📞 Precisa de Ajuda?

Se tiver dúvidas sobre:
- Qual parte específica capturar
- Como otimizar as imagens
- Como atualizar o código

Consulte a documentação do projeto ou entre em contato com a equipe de desenvolvimento.

---

**Última atualização:** Março 2026
