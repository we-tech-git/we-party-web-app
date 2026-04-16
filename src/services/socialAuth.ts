/**
 * Serviço de Autenticação Social
 * Gerencia autenticação via Google, Facebook e outros provedores OAuth
 * Implementa o fluxo de Google OAuth com ID Token
 */

import { logger } from "@/utils/logger";
import { AuthService } from "./auth";
import axios from "axios";
import { STORAGE_KEYS } from "@/common/storage";

export interface SocialAuthProvider {
  google: string;
  facebook: string;
}

export interface SocialAuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: any;
  provider?: string;
}

export class SocialAuthService {
  private readonly providers: SocialAuthProvider = {
    google: import.meta.env.VITE__GOOGLE_CLIENT_ID || "",
    facebook: import.meta.env.VITE_FACEBOOK_APP_ID || "",
  };

  /**
   * 🔐 NOVO FLUXO: Google OAuth com ID Token (recomendado)
   * Retorna um callback que deve ser chamado quando o usuário clica no botão do Google
   * O callback recebe a resposta do Google Sign-In e processa o login
   */
  getGoogleSignInCallback() {
    return async (response: any) => {
      try {
        if (!response?.credential) {
          throw new Error("Nenhum token foi recebido do Google");
        }

        // Envia o idToken para o backend
        const backendResponse = await this.sendIdTokenToBackend(
          "google",
          response.credential,
        );

        if (backendResponse.success && backendResponse.token) {
          // Salva os dados de autenticação
          AuthService.saveAuthData({
            success: true,
            message: backendResponse.message,
            token: backendResponse.token,
            user: backendResponse.user,
          });

          // Salva dados específicos
          localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, backendResponse.token);
          localStorage.setItem(
            STORAGE_KEYS.USER_ID,
            backendResponse.user?.id || "",
          );

          return {
            success: true,
            message:
              backendResponse.message ||
              "Login com Google realizado com sucesso",
            token: backendResponse.token,
            backendResponse,
            provider: "google",
          };
        } else {
          throw new Error("Backend não retornou token JWT");
        }
      } catch (error: any) {
        logger.error("[GOOGLE AUTH] ❌ Erro no login:", error);
        throw {
          success: false,
          message: error.message || "Erro ao fazer login com Google",
        };
      }
    };
  }

  /**
   * Autentica com Google (método legado - usar getGoogleSignInCallback para novo fluxo)
   */
  /**
   * Autentica com Google (método legado - usar novo fluxo via SocialAuthButtons)
   * NOTA: Com o novo fluxo OAuth, este método não deve ser mais usado.
   * SocialAuthButtons.vue gerencia o fluxo via requestCode().
   * Este método é mantido apenas para compatibilidade/fallback.
   */
  async loginWithGoogle(): Promise<SocialAuthResponse> {
    try {
      logger.log(
        "🔐 loginWithGoogle (LEGADO) - Este método não deveria ser chamado com novo fluxo OAuth",
      );

      // Verifica se o Client ID está configurado
      if (!this.providers.google) {
        throw new Error(
          "Google Client ID não configurado. Adicione VITE__GOOGLE_CLIENT_ID no arquivo .env",
        );
      }

      // Não reinicializa o SDK - deve já estar pronto
      if (!window.google?.accounts?.id) {
        await this.initGoogleSDK();
      }

      // Apenas abre o prompt de login (sem reinicializar)
      return new Promise((resolve, reject) => {
        // Se SDK foi inicializado em outro lugar, não reinicializa aqui
        // Apenas abre o prompt
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            logger.log("⚠️ Prompt do Google não exibido");
            reject(new Error("Google prompt não foi exibido"));
          }
        });
      });
    } catch (error: any) {
      logger.error("❌ Erro na autenticação com Google:", error);
      return {
        success: false,
        message: error.message || "Erro ao fazer login com Google",
      };
    }
  }

  /**
   * Autentica com Facebook
   */
  async loginWithFacebook(): Promise<SocialAuthResponse> {
    try {
      logger.log("🔐 Iniciando autenticação com Facebook...");

      // Verifica se o App ID está configurado
      if (!this.providers.facebook) {
        throw new Error(
          "Facebook App ID não configurado. Adicione VITE_FACEBOOK_APP_ID no arquivo .env",
        );
      }

      await this.initFacebookSDK();

      return new Promise((resolve, reject) => {
        window.FB.login(
          async (response: any) => {
            if (response.authResponse) {
              try {
                logger.log("✅ Token do Facebook recebido");

                // Obtém informações do usuário
                window.FB.api(
                  "/me",
                  { fields: "id,name,email,picture" },
                  async (userInfo: any) => {
                    logger.log("👤 Informações do usuário:", userInfo);

                    // Aqui você enviaria o token para seu backend
                    const result = await this.sendTokenToBackend(
                      "facebook",
                      response.authResponse.accessToken,
                      userInfo,
                    );

                    if (result.success && result.token) {
                      // Salva os dados de autenticação
                      AuthService.saveAuthData({
                        success: true,
                        message: "Login com Facebook realizado com sucesso",
                        token: result.token,
                        user: result.user,
                      });

                      resolve({
                        success: true,
                        message: "Login com Facebook realizado com sucesso",
                        token: result.token,
                        user: result.user,
                        provider: "facebook",
                      });
                    } else {
                      reject(new Error("Falha na autenticação com Facebook"));
                    }
                  },
                );
              } catch (error) {
                logger.error("❌ Erro ao processar token do Facebook:", error);
                reject(error);
              }
            } else {
              reject(new Error("Usuário cancelou o login com Facebook"));
            }
          },
          { scope: "public_profile,email" },
        );
      });
    } catch (error: any) {
      logger.error("❌ Erro na autenticação com Facebook:", error);
      return {
        success: false,
        message: error.message || "Erro ao fazer login com Facebook",
      };
    }
  }

  /**
   * Verifica se os provedores sociais estão configurados
   */
  isProviderConfigured(provider: "google" | "facebook"): boolean {
    return !!this.providers[provider];
  }

  /**
   * Retorna os provedores configurados
   */
  getConfiguredProviders(): string[] {
    return Object.keys(this.providers).filter((key) =>
      this.isProviderConfigured(key as "google" | "facebook"),
    );
  }

  /**
   * Envia o token de autenticação social para o backend
   * IMPORTANTE: Você precisa implementar este endpoint no seu backend
   */
  /**
   * 🔐 NOVO: Envia o ID Token do Google para o backend para validação e criação de JWT
   * Padrão esperado pelo backend: POST /users/google-auth { idToken }
   * Resposta: { success: true, data: { token, user, isNewUser }, message }
   */
  private async sendIdTokenToBackend(
    provider: "google",
    idToken: string,
  ): Promise<{
    success: boolean;
    token: string;
    user: any;
    message: string;
  }> {
    try {
      const apiBaseUrl =
        import.meta.env.VITE__BASE_URL || "http://localhost:8000";
      const endpoint = `${apiBaseUrl}/users/google-auth`;

      logger.log("[GOOGLE AUTH] POST", endpoint);
      logger.log("[GOOGLE AUTH] Enviando ID Token para validação do backend");

      const response = await axios.post(
        endpoint,
        { idToken },
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      // Esperado: { success: true, data: { token, user, isNewUser }, message }
      if (response.data?.success && response.data?.data) {
        logger.log("[GOOGLE AUTH] ✅ Backend validou token com sucesso");
        return {
          success: true,
          token: response.data.data.token,
          user: response.data.data.user,
          message: response.data.message || "Autenticado com sucesso",
        };
      }

      throw new Error(response.data?.message || "Backend retornou erro");
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Erro ao conectar com o backend";

      logger.error("[GOOGLE AUTH] ❌ Erro na validação do token:", {
        status: error.response?.status,
        message,
        data: error.response?.data,
      });

      throw new Error(message);
    }
  }

  /**
   * 🔐 LEGADO: Envia token para o backend (mantém compatibilidade com Facebook)
   */
  private async sendTokenToBackend(
    provider: "google" | "facebook",
    token: string,
    userInfo?: any,
  ): Promise<SocialAuthResponse> {
    try {
      // Se for Google, usa novo fluxo de ID Token
      if (provider === "google") {
        const result = await this.sendIdTokenToBackend(provider, token);
        return {
          success: result.success,
          message: result.message,
          token: result.token,
          user: result.user,
        };
      }

      // Para Facebook e outros, usa fluxo antigo
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const endpoint = `${baseUrl}/auth/social/${provider}`;

      logger.log(`📤 Enviando token para o backend: ${endpoint}`);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          userInfo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      logger.log("✅ Resposta do backend:", data);

      return {
        success: true,
        message: data.message || "Autenticação realizada com sucesso",
        token: data.token || data.data?.token,
        user: data.user || data.data,
      };
    } catch (error: any) {
      logger.error("❌ Erro ao enviar token para o backend:", error);

      // MODO DE DESENVOLVIMENTO: Simula resposta do backend
      if (import.meta.env.DEV) {
        logger.warn("⚠️ MODO DEV: Simulando autenticação social bem-sucedida");
        return {
          success: true,
          message: `Login com ${provider} realizado (SIMULADO)`,
          token: `mock_token_${provider}_${Date.now()}`,
          user: {
            id: Math.random().toString(36).slice(2, 11),
            name: userInfo?.name || "Usuário Social",
            email: userInfo?.email || `user@${provider}.com`,
            provider,
          },
        };
      }

      throw error;
    }
  }

  /**
   * Envia o código de autorização para o backend (alternativa ao token)
   */
  private async sendCodeToBackend(
    provider: "google" | "facebook",
    code: string,
  ): Promise<SocialAuthResponse> {
    try {
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const endpoint = `${baseUrl}/auth/social/${provider}/callback`;

      logger.log(
        `📤 Enviando código de autorização para o backend: ${endpoint}`,
      );

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
      }

      const data = await response.json();
      logger.log("✅ Resposta do backend:", data);

      return {
        success: true,
        message: data.message || "Autenticação realizada com sucesso",
        token: data.token || data.data?.token,
        user: data.user || data.data,
      };
    } catch (error: any) {
      logger.error("❌ Erro ao enviar código para o backend:", error);
      throw error;
    }
  }

  /**
   * Inicializa o SDK do Google para autenticação
   */
  private async initGoogleSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verifica se o SDK já está carregado
      if (window.google?.accounts) {
        resolve();
        return;
      }

      // Carrega o SDK do Google
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", () => resolve());
      script.addEventListener("error", () =>
        reject(new Error("Falha ao carregar SDK do Google")),
      );
      document.head.append(script);
    });
  }

  /**
   * Inicializa o SDK do Facebook para autenticação
   */
  private async initFacebookSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Verifica se o SDK já está carregado
      if (window.FB) {
        resolve();
        return;
      }

      // Carrega o SDK do Facebook
      window.fbAsyncInit = () => {
        window.FB.init({
          appId: this.providers.facebook,
          cookie: true,
          xfbml: true,
          version: "v18.0",
        });
        resolve();
      };

      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/pt_BR/sdk.js";
      script.async = true;
      script.defer = true;
      script.addEventListener("load", () => {
        if (!window.FB) {
          reject(new Error("Falha ao carregar SDK do Facebook"));
        }
      });
      script.addEventListener("error", () =>
        reject(new Error("Falha ao carregar SDK do Facebook")),
      );
      document.head.append(script);
    });
  }
}

// Extensão de tipos para o window
declare global {
  interface Window {
    google?: any;
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

export const socialAuthService = new SocialAuthService();
