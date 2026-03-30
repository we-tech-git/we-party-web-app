/**
 * useValidation Composable
 * Sistema centralizado de validacao de formularios
 * Evita duplicacao de codigo e padroniza validacoes
 */

import type { Ref } from 'vue'
import { computed, ref } from 'vue'

export interface ValidationRule {
  validator: (value: any) => boolean
  message: string
}

export interface FieldValidation {
  value: Ref<any>
  rules: ValidationRule[]
  error: Ref<string>
  touched: Ref<boolean>
}

/**
 * Regras de validacao pre-definidas
 */
export const validationRules = {
  required: (message = 'Campo obrigatorio'): ValidationRule => ({
    validator: (value: any) => {
      if (typeof value === 'string') {
        return value.trim().length > 0
      }
      if (Array.isArray(value)) {
        return value.length > 0
      }
      return value !== null && value !== undefined
    },
    message,
  }),

  email: (message = 'E-mail invalido'): ValidationRule => ({
    validator: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return !value || emailRegex.test(value)
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validator: (value: string) => !value || value.length >= min,
    message: message || `Minimo de ${min} caracteres`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validator: (value: string) => !value || value.length <= max,
    message: message || `Maximo de ${max} caracteres`,
  }),

  password: (message = 'Senha invalida'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) {
        return false
      }
      // Pelo menos 10 caracteres, 1 maiuscula, 1 minuscula, 1 numero, 1 especial
      const hasMinLength = value.length >= 10
      const hasUpperCase = /[A-Z]/.test(value)
      const hasLowerCase = /[a-z]/.test(value)
      const hasNumber = /[0-9]/.test(value)
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value)
      return hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecial
    },
    message,
  }),

  passwordMatch: (passwordRef: Ref<string>, message = 'As senhas nao coincidem'): ValidationRule => ({
    validator: (value: string) => value === passwordRef.value,
    message,
  }),

  phone: (message = 'Telefone invalido'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) {
        return true
      }
      // Remove tudo que nao e numero
      const cleaned = value.replace(/\D/g, '')
      // Aceita 10 ou 11 digitos (com ou sem DDD)
      return cleaned.length >= 10 && cleaned.length <= 11
    },
    message,
  }),

  cpf: (message = 'CPF invalido'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) {
        return true
      }
      const cleaned = value.replace(/\D/g, '')
      if (cleaned.length !== 11) {
        return false
      }

      // Valida CPF
      let sum = 0
      let remainder: number

      if (cleaned === '00000000000') {
        return false
      }

      for (let i = 1; i <= 9; i++) {
        sum += Number.parseInt(cleaned.slice(i - 1, i)) * (11 - i)
      }
      remainder = (sum * 10) % 11
      if (remainder === 10 || remainder === 11) {
        remainder = 0
      }
      if (remainder !== Number.parseInt(cleaned.slice(9, 10))) {
        return false
      }

      sum = 0
      for (let i = 1; i <= 10; i++) {
        sum += Number.parseInt(cleaned.slice(i - 1, i)) * (12 - i)
      }
      remainder = (sum * 10) % 11
      if (remainder === 10 || remainder === 11) {
        remainder = 0
      }
      if (remainder !== Number.parseInt(cleaned.slice(10, 11))) {
        return false
      }

      return true
    },
    message,
  }),

  url: (message = 'URL invalida'): ValidationRule => ({
    validator: (value: string) => {
      if (!value) {
        return true
      }
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
    message,
  }),

  numeric: (message = 'Apenas numeros sao permitidos'): ValidationRule => ({
    validator: (value: string) => !value || /^\d+$/.test(value),
    message,
  }),

  alpha: (message = 'Apenas letras sao permitidas'): ValidationRule => ({
    validator: (value: string) => !value || /^[a-zA-ZÀ-ÿ\s]+$/.test(value),
    message,
  }),

  alphanumeric: (message = 'Apenas letras e numeros sao permitidos'): ValidationRule => ({
    validator: (value: string) => !value || /^[a-zA-Z0-9À-ÿ\s]+$/.test(value),
    message,
  }),

  custom: (validator: (value: any) => boolean, message: string): ValidationRule => ({
    validator,
    message,
  }),
}

/**
 * Composable principal para validacao
 */
export function useValidation () {
  const fields = ref<Record<string, FieldValidation>>({})

  /**
   * Registra um campo para validacao
   */
  function registerField (
    name: string,
    valueRef: Ref<any>,
    rules: ValidationRule[],
  ): FieldValidation {
    const field: FieldValidation = {
      value: valueRef,
      rules,
      error: ref(''),
      touched: ref(false),
    }

    fields.value[name] = field
    return field
  }

  /**
   * Valida um campo especifico
   */
  function validateField (name: string): boolean {
    const field = fields.value[name]
    if (!field) {
      return true
    }

    field.touched.value = true

    for (const rule of field.rules) {
      if (!rule.validator(field.value.value)) {
        field.error.value = rule.message
        return false
      }
    }

    field.error.value = ''
    return true
  }

  /**
   * Valida todos os campos
   */
  function validateAll (): boolean {
    let isValid = true

    for (const name in fields.value) {
      const fieldValid = validateField(name)
      if (!fieldValid) {
        isValid = false
      }
    }

    return isValid
  }

  /**
   * Reseta um campo especifico
   */
  function resetField (name: string) {
    const field = fields.value[name]
    if (field) {
      field.error.value = ''
      field.touched.value = false
    }
  }

  /**
   * Reseta todos os campos
   */
  function resetAll () {
    for (const name in fields.value) {
      const field = fields.value[name]
      if (field) {
        field.error.value = ''
        field.touched.value = false
      }
    }
  }

  /**
   * Remove um campo do registro
   */
  function unregisterField (name: string) {
    delete fields.value[name]
  }

  /**
   * Verifica se o formulario e valido (sem validar)
   */
  const isFormValid = computed(() => {
    for (const name in fields.value) {
      const field = fields.value[name]
      if (field) {
        for (const rule of field.rules) {
          if (!rule.validator(field.value.value)) {
            return false
          }
        }
      }
    }
    return true
  })

  /**
   * Verifica se ha erros
   */
  const hasErrors = computed(() => {
    for (const name in fields.value) {
      const field = fields.value[name]
      if (field && field.error.value) {
        return true
      }
    }
    return false
  })

  /**
   * Lista de erros atuais
   */
  const errors = computed(() => {
    const errorList: Record<string, string> = {}
    for (const name in fields.value) {
      const field = fields.value[name]
      if (field && field.error.value) {
        errorList[name] = field.error.value
      }
    }
    return errorList
  })

  return {
    // Estado
    isFormValid,
    hasErrors,
    errors,

    // Metodos
    registerField,
    validateField,
    validateAll,
    resetField,
    resetAll,
    unregisterField,
  }
}
