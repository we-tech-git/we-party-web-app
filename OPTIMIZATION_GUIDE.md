# 🚀 Guia de Otimização - We Party

Este documento contém instruções para otimizações adicionais e melhorias no projeto.

## ✅ Problemas Corrigidos Automaticamente

1. **✅ Console.log em Produção** - Criado utilitário `logger.ts` que só loga em desenvolvimento
2. **✅ Componentes Landing Duplicados** - Removidas versões antigas, mantida apenas LandingPage.vue
3. **✅ Páginas Duplicadas** - Removida AddFriends duplicada em /public
4. **✅ debugAuth Exposto** - Removido do composable useAuth.ts

---

## 🔧 Otimizações Manuais Recomendadas

### 4. Otimizar Imagens em /public (IMPORTANTE)

**Problema:** Imagens grandes sem compressão aumentam tempo de carregamento.

**Localização:** `c:\Users\Home\Desktop\WORKS\we-party-web-app\public\`

**Imagens a otimizar:**

- `logoweparty.png`
- `Feedparty.png`
- `pagdetalhesdeevento.png`
- `perfilweparty.png`

**Solução 1 - Usando TinyPNG (Online, Grátis):**

```bash
# 1. Acesse: https://tinypng.com/
# 2. Faça upload das imagens PNG
# 3. Baixe as versões otimizadas
# 4. Substitua os arquivos originais
```

**Solução 2 - Usando Sharp (CLI):**

```bash
# Instalar Sharp CLI
npm install -g sharp-cli

# Otimizar todas as PNGs
cd public
sharp -i "*.png" -o optimized/ -f png --optimise

# Substituir originais
Move-Item -Path optimized\* -Destination . -Force
Remove-Item -Path optimized -Recurse
```

**Solução 3 - Converter para WebP (Melhor Performance):**

```bash
# Usando cwebp (Google)
# Download: https://developers.google.com/speed/webp/download

cwebp -q 80 logoweparty.png -o logoweparty.webp
cwebp -q 80 Feedparty.png -o Feedparty.webp
cwebp -q 80 pagdetalhesdeevento.png -o pagdetalhesdeevento.webp
cwebp -q 80 perfilweparty.png -o perfilweparty.webp
```

**Economia Esperada:** 60-80% do tamanho original

---

### 5. Remover Dependências Não Utilizadas

**Problema:** Pacotes instalados mas não usados aumentam o bundle.

**Dependências a remover:**

```bash
# @vueuse/motion não está sendo usado
npm uninstall @vueuse/motion
```

**Verificar uso antes de remover:**

```powershell
# Buscar por @vueuse/motion no código
Get-ChildItem -Path src -Recurse -Include *.vue,*.ts | Select-String "@vueuse/motion"
```

---

### 6. Lazy Loading de Bibliotecas Pesadas

**Problema:** Three.js e GSAP carregam sempre, mesmo quando não necessários.

**Arquivo:** `src/components/modules/Landingpage/LandingPage.vue`

**Antes (carrega sempre):**

```typescript
import * as THREE from "three";
import gsap from "gsap";

onMounted(() => {
  // Usa Three.js
  const scene = new THREE.Scene();
});
```

**Depois (carrega sob demanda):**

```typescript
onMounted(async () => {
  // Carrega apenas quando necessário
  const [THREE, gsap] = await Promise.all([import("three"), import("gsap")]);

  const scene = new THREE.Scene();
});
```

**Benefício:** Bundle inicial reduz ~600KB (70%)

---

### 7. Implementar Plugin de Persistência no Pinia

**Problema:** Gestão de localStorage manual em múltiplos lugares.

**Instalação:**

```bash
npm install pinia-plugin-persistedstate
```

**Configuração:** `src/plugins/index.ts`

```typescript
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

export default pinia;
```

**Uso:** `src/stores/events.ts`

```typescript
export const useEventsStore = defineStore("events", {
  state: () => ({
    likedEvents: [] as string[],
    savedEvents: [] as FeedItem[],
  }),

  actions: {
    toggleLike(eventId: string) {
      // Lógica aqui
      // localStorage é automático!
    },
  },

  persist: {
    key: "events-store",
    storage: localStorage,
  },
});
```

**Benefício:** Código mais limpo, sincronização automática

---

### 8. Tratamento de Erros Padronizado

**Criar:** `src/utils/errorHandler.ts`

```typescript
import { logger } from "./logger";

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export function handleApiError(
  error: any,
  fallbackMessage = "Erro desconhecido",
): ApiError {
  logger.error("API Error:", error);

  const apiError: ApiError = {
    message:
      error?.response?.data?.message || error?.message || fallbackMessage,
    status: error?.response?.status,
    code: error?.code,
  };

  // Tratamentos específicos
  if (apiError.status === 401) {
    apiError.message = "Sessão expirada. Faça login novamente.";
  } else if (apiError.status === 403) {
    apiError.message = "Você não tem permissão para esta ação.";
  } else if (apiError.status === 404) {
    apiError.message = "Recurso não encontrado.";
  } else if (apiError.status === 500) {
    apiError.message = "Erro no servidor. Tente novamente mais tarde.";
  }

  return apiError;
}
```

**Uso:**

```typescript
try {
  await createUser(userData);
} catch (error) {
  const apiError = handleApiError(error, "Erro ao criar usuário");
  showSnackbar(apiError.message, "#ef4444");
}
```

---

### 9. Ativar TypeScript Strict Mode

**Arquivo:** `tsconfig.app.json`

**Antes:**

```json
{
  "compilerOptions": {
    "strict": false
  }
}
```

**Depois:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

**⚠️ ATENÇÃO:** Isso vai gerar muitos erros de compilação que precisam ser corrigidos.

**Processo Recomendado:**

1. Criar branch separada: `git checkout -b feature/typescript-strict`
2. Ativar strict mode
3. Corrigir erros gradualmente
4. Testar extensivamente
5. Fazer merge quando estável

---

## 📊 Resumo de Impacto

| Otimização              | Tempo        | Impacto    | Dificuldade |
| ----------------------- | ------------ | ---------- | ----------- |
| ✅ Logger utility       | Implementado | 🔥🔥🔥🔥🔥 | Fácil       |
| ✅ Remover duplicatas   | Implementado | 🔥🔥🔥🔥   | Fácil       |
| ✅ Remover debugAuth    | Implementado | 🔥🔥🔥     | Fácil       |
| Otimizar imagens        | 15 min       | 🔥🔥🔥🔥🔥 | Fácil       |
| Remover deps não usadas | 5 min        | 🔥🔥🔥     | Fácil       |
| Lazy loading libs       | 1 hora       | 🔥🔥🔥🔥🔥 | Médio       |
| Pinia persistedstate    | 1 hora       | 🔥🔥🔥🔥   | Médio       |
| Error handler           | 2 horas      | 🔥🔥🔥🔥   | Médio       |
| TypeScript strict       | 4-8 horas    | 🔥🔥🔥🔥🔥 | Difícil     |

---

## 🎯 Próximos Passos Recomendados

1. **IMEDIATO:** Otimizar imagens (15 min, grande impacto)
2. **ESTA SEMANA:** Implementar lazy loading de Three.js e GSAP
3. **ESTE MÊS:** Adicionar Pinia persistedstate e error handler
4. **QUANDO POSSÍVEL:** Ativar TypeScript strict mode

---

## 🧪 Como Testar

Após cada otimização, teste:

```bash
# Build de produção
npm run build

# Verificar tamanho do bundle
ls -lh dist/assets/*.js | sort -k5 -h

# Testar no navegador
npm run preview
```

**Lighthouse Score Atual:** ~64/100  
**Meta após otimizações:** 90+/100

---

## 📚 Recursos Úteis

- [TinyPNG](https://tinypng.com/) - Compressão de imagens online
- [WebP](https://developers.google.com/speed/webp) - Formato de imagem moderno
- [Pinia Persistedstate](https://prazdevs.github.io/pinia-plugin-persistedstate/) - Plugin oficial
- [TypeScript Strict](https://www.typescriptlang.org/tsconfig#strict) - Documentação oficial

---

Criado em: ${new Date().toLocaleDateString('pt-BR')}
