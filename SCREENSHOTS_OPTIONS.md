# 🎨 Opções para Testar a Landing Page Sem Screenshots Reais

Enquanto você não tiver os screenshots reais, existem algumas opções para testar e visualizar a landing page.

## Opção 1: Usar Placeholders Visuais (Recomendado) ✅

**Status Atual:** A landing page já está configurada com placeholders visuais atraentes que mostram:
- Ícone representativo de cada funcionalidade
- Nome da seção
- Texto "Adicione seu screenshot aqui"
- Borda colorida correspondente à categoria

**Vantagem:** Você pode publicar e mostrar a landing page mesmo sem os screenshots finais!

---

## Opção 2: Usar Imagens Placeholder Online

Use serviços de placeholder para gerar imagens temporárias:

### Via Placeholder.com
Crie arquivos em `public/screenshots/` com URLs de placeholder:

```bash
# Windows PowerShell
$urls = @{
    'feed.png' = 'https://via.placeholder.com/1400x900/ff6b6b/ffffff?text=Feed+de+Eventos'
    'profile.png' = 'https://via.placeholder.com/1400x900/8b5cf6/ffffff?text=Perfil+Interativo'
    'event-details.png' = 'https://via.placeholder.com/1400x900/3b82f6/ffffff?text=Detalhes+do+Evento'
    'chat.png' = 'https://via.placeholder.com/1400x900/10b981/ffffff?text=Chat+e+Interacoes'
    'create-event.png' = 'https://via.placeholder.com/1400x900/f59e0b/ffffff?text=Criar+Evento'
    'categories.png' = 'https://via.placeholder.com/1400x900/ec4899/ffffff?text=Explorar+Categorias'
}

foreach ($file in $urls.Keys) {
    $path = "public\screenshots\$file"
    Invoke-WebRequest -Uri $urls[$file] -OutFile $path
}
```

---

## Opção 3: Criar Screenshots de Mockup

Use ferramentas de design para criar mockups:

### Figma (Gratuito)
1. Acesse [Figma](https://figma.com)
2. Crie frames com dimensões 1400x900
3. Use componentes do We Party
4. Exporte como PNG

### Canva (Gratuito)
1. Acesse [Canva](https://canva.com)
2. Crie design customizado 1400x900px
3. Use templates de interface mobile/web
4. Baixe como PNG

---

## Opção 4: Screenshotar Outras Páginas Similares

**⚠️ CUIDADO:** Use apenas para testes internos, NUNCA publique:
1. Encontre sites similares (redes sociais de eventos)
2. Capture screenshots das funcionalidades similares
3. Use apenas para desenvolvimento/testes
4. Substitua antes de lançar publicamente

---

## Opção 5: Gerar com IA (Midjourney, DALL-E)

Prompt exemplo:
```
"Modern mobile app interface for event discovery, clean UI design, 
iOS style, showing a feed of parties and events, vibrant colors, 
high quality screenshot, user interface, UX design"
```

---

## Como Implementar as Imagens

### 1. Salvar as Imagens
Coloque os arquivos em: `public/screenshots/`

### 2. Ativar no Código

Abra: `src/components/modules/Landingpage/LandingPageV2.vue`

Encontre (linha ~354):
```vue
<!-- Quando você tiver as imagens, descomente e substitua o placeholder -->
<!-- <img :src="screenshot.image" :alt="screenshot.title" class="screenshot-image" /> -->
```

Descomente para:
```vue
<!-- Quando você tiver as imagens, descomente e substitua o placeholder -->
<img :src="screenshot.image" :alt="screenshot.title" class="screenshot-image" />
```

### 3. (Opcional) Ocultar o Placeholder

Se quiser remover o placeholder e mostrar APENAS as imagens, comente o bloco do placeholder (linha ~350-356):
```vue
<!--
<div class="screenshot-placeholder" :style="{ borderColor: screenshot.color }">
  <v-icon :color="screenshot.color" :icon="screenshot.icon" size="48" />
  <p class="placeholder-text">{{ screenshot.title }}</p>
  <p class="placeholder-hint">Adicione seu screenshot aqui</p>
</div>
-->
```

---

## Script Auxiliar de Placeholder

Criar arquivo `scripts/generate-placeholders.js`:

```javascript
const fs = require('fs');
const https = require('https');
const path = require('path');

const screenshots = [
  { name: 'feed.png', color: 'ff6b6b', text: 'Feed de Eventos' },
  { name: 'profile.png', color: '8b5cf6', text: 'Perfil' },
  { name: 'event-details.png', color: '3b82f6', text: 'Detalhes' },
  { name: 'chat.png', color: '10b981', text: 'Chat' },
  { name: 'create-event.png', color: 'f59e0b', text: 'Criar' },
  { name: 'categories.png', color: 'ec4899', text: 'Categorias' },
];

const outputDir = path.join(__dirname, '..', 'public', 'screenshots');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

screenshots.forEach(({ name, color, text }) => {
  const url = `https://via.placeholder.com/1400x900/${color}/ffffff?text=${encodeURIComponent(text)}`;
  const outputPath = path.join(outputDir, name);
  
  const file = fs.createWriteStream(outputPath);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`✅ ${name} criado!`);
    });
  });
});

console.log('🎨 Gerando placeholders...');
```

Execute:
```bash
node scripts/generate-placeholders.js
```

---

## Checklist de Implementação

### Fase 1: Desenvolvimento (Agora)
- [x] Landing page com placeholders visuais criada
- [x] Seção de screenshots implementada
- [x] Responsividade configurada
- [ ] Testar em diferentes dispositivos
- [ ] Ajustar cores e espaçamentos se necessário

### Fase 2: Screenshots Temporários (Opcional)
- [ ] Decidir entre placeholder ou imagens temporárias
- [ ] Gerar/baixar imagens placeholder
- [ ] Descomentar tag `<img>` no código
- [ ] Testar carregamento das imagens

### Fase 3: Screenshots Reais (Antes do Lançamento)
- [ ] Capturar screenshots reais seguindo SCREENSHOTS_GUIDE.md
- [ ] Otimizar imagens para web
- [ ] Substituir arquivos em `public/screenshots/`
- [ ] (Opcional) Ocultar placeholders
- [ ] Testar performance de carregamento
- [ ] Validar em produção

---

## Visualizar a Landing Page

### Modo Desenvolvimento
```bash
npm run dev
```

Acesse: `http://localhost:5173/public/Landingv2` ou `http://localhost:5173/landing`

### Modo Produção (Build)
```bash
npm run build
npm run preview
```

---

## Dicas Profissionais

✅ **Recomendado:**
- Manter os placeholders visuais atuais até ter screenshots reais
- São profissionais e mostram a estrutura claramente
- Não parecem "quebrados" ou incompletos

❌ **Evitar:**
- Imagens genéricas que não representam o We Party
- Screenshots de concorrentes (problemas legais)
- Links externos quebrados
- Imagens muito pesadas (>500KB cada)

---

## Melhorias Futuras (Opcional)

Quando tiver os screenshots reais, considere:

1. **Lightbox/Modal:** Clique no screenshot para ampliar
2. **Carousel:** Navegação entre screenshots
3. **Vídeo Demo:** Substitua alguns screenshots por vídeo curto
4. **Screenshots Interativos:** Hotspots clicáveis mostrando features
5. **Versão Mobile:** Screenshots específicos da versão mobile

---

## Resultado Atual

A landing page já está **100% funcional** com:
- ✅ Nova seção "Veja o We Party em Ação"
- ✅ 6 cards interativos com placeholders
- ✅ Animações e transições suaves
- ✅ Design responsivo (mobile, tablet, desktop)
- ✅ Call-to-action destacado
- ✅ Cores e branding consistentes
- ✅ Performance otimizada

**Você pode publicar agora mesmo e adicionar screenshots reais depois!**

---

Precisa de ajuda? Consulte:
- `SCREENSHOTS_GUIDE.md` - Guia completo de captura
- `README.md` - Documentação geral do projeto
