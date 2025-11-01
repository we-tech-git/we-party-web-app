import axios from 'axios'
import router from '@/router'

interface DynamicObject {
  [key: string]: any
}

export async function callApi (
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  data?: string | DynamicObject,
  auth?: boolean,
  customHeaders?: DynamicObject,
): Promise<any> {
  let token: string | null
  let headers: any

  headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  }

  if (auth) {
    token = localStorage.getItem('ACCESS_TOKEN')
    headers = {
      ...customHeaders,
      Authorization: `Bearer ${token}`,
    }
  }

  url = `${import.meta.env.VITE__BASE_URL}${url}`

  try {
    const response = await axios({
      method,
      url,
      data,
      headers,
    })
    return response
  } catch (error: any) {
    if (
      error.response.status === 401
      || error.response.data.erros[0] === 'Invalid JWT token'
      || error.response.data.erros[0]
      === 'Required request header \'auth\' for method parameter type String is not present'
    ) {
      localStorage.removeItem('ACCESS_TOKEN')
      router.push('/')
      return error
    } else {
      return error
    }
  }
}
