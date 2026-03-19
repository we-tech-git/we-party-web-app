import axios from 'axios'
import router from '@/router'
import { AuthService } from '@/services/auth'
import { logger } from '@/utils/logger'

interface DynamicObject {
  [key: string]: any
}

export async function callApi (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  data?: string | DynamicObject,
  auth?: boolean,
  customHeaders?: DynamicObject,
): Promise<any> {
  let headers: any = {
    'Content-Type': 'application/json',
    ...customHeaders,
  }

  if (auth) {
    const token = localStorage.getItem('ACCESS_TOKEN')
    headers = {
      ...headers,
      Authorization: `Bearer ${token}`,
    }
  }

  url = `${import.meta.env.VITE__BASE_URL}${url}`

  logger.log(`🌐 [API] ${method} ${url}`, auth ? '🔒 auth' : '')

  try {
    const response = await axios({
      method,
      url,
      data,
      headers,
    })

    logger.log(`✅ [API] ${method} ${url} - Status: ${response.status}`)

    return response
  } catch (error: any) {
    logger.error(`❌ [API] ${method} ${url} - Erro:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    })

    if (
      error.response?.status === 401
      || error.response?.data?.erros?.[0] === 'Invalid JWT token'
      || error.response?.data?.erros?.[0]
      === 'Required request header \'auth\' for method parameter type String is not present'
    ) {
      AuthService.logout()
      router.push('/')
    }

    throw error
  }
}
