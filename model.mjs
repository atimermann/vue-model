/**
 * **Created on 13/02/2023**
 *
 * Gestão de modelos no FrontEnd
 *
 * src/model.mjs
 *
 * TODO: Implementar suporte Date
 *
 * @author André Timermann <andre@timermann.com.br>
 *
 *
 */

import {ref} from 'vue'
import {cloneDeep, isPlainObject} from 'lodash'
import validator from 'validator'

export default class Model {
  /**
   * Validação do model
   *
   * Utiliza biblitoeca validator, para validação de string
   * 'any' aceita qualquer tipo
   *
   * @type string
   * @private
   */
  static __schema = undefined

  /**
   * Cria uma nova instância do modelo
   *
   * @param data {Object} Objeto plano com os dados
   * @returns {*}
   */
  static create(data) {
    return ref(this._create(data))
  }

  /**
   * Cria coleção de instância do modelo
   * @param collectionData
   * @returns {Ref<UnwrapRef<*[]>>}
   */
  static createCollection(collectionData) {
    return ref(this._createCollection(collectionData))
  }

  /**
   * Retorna dados reativo e função para atualização reativa
   * Baseado no $useFetch (https://nuxt.com/docs/api/composables/use-fetch)
   *
   * Suporta apenas refresh no momento
   *
   * @param fetchMethodName {string}  Nome do método que vai retornar relizar o fetch e retornar os dados
   * @param args            {string}  Lista de parâmetros do método
   * @returns {Promise<{data: *, refresh(): Promise<void>}>}
   */
  static async fetchAndRefresh(fetchMethodName, ...args) {
    const Class = this
    const data = await Class[fetchMethodName](...args)

    return {
      data,
      async refresh() {
        const newData = await Class[fetchMethodName](...args)
        data.value = newData.value
      }
    }
  }

  /**
   * Implementar aqui código que usa puxa dados do backend
   *
   * Ex: no nuxt utilizar $useFetch
   *
   * @param id
   * @returns {Promise<void>}
   */
  static async _fetch(id) {
    throw Error('Not implemented yet')
  }

  /**
   * Retorna Collection e função para atualização reativa da coleção
   *
   * @returns {Promise<{data: void, refresh(): Promise<void>}>}
   */
  static async fetch(id) {
    return await this.fetchAndRefresh('_fetchCollection', id)
  }

  /**
   * Implementar aqui código para puxar coleção do backend
   *
   * Ex: no nuxt utilizar $useFetch
   *
   * @returns {Promise<void>}
   */
  static async _fetchCollection() {
    throw Error('Not implemented yet')
  }


  /**
   * Retorna Collection e função para atualização reativa da coleção
   *
   * @returns {Promise<{data: void, refresh(): Promise<void>}>}
   */
  static async fetchCollection() {
    return await this.fetchAndRefresh('_fetchCollection')
  }

  /**
   * Implementar aqui código para persistidar registro no backend
   * Ex: no nuxt utilizar $fetch('POST' ou 'PUT')
   * PUT se exixtir Id
   *
   * @returns {Promise<void>}
   */
  async save() {
    throw Error('Not implemented yet')
  }

  /**
   * Implementar aqui código para demover registro do backend
   * Ex: no nuxt utilizar $fetch
   *
   * @returns {Promise<void>}
   */
  async delete() {
    throw Error('Not implemented yet')
  }

  /// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // Métodos Privados
  /// //////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /**
   * Cria objeto sem reatividade
   * @param data
   * @returns {Model}
   * @private
   */
  static _create(data) {
    if (!data) {
      throw new Error("The argument 'data' was not provided or is null or undefined.")
    }

    if (!isPlainObject(data)) {
      throw new TypeError(`The 'data' argument must be a plain object. Received: ${JSON.stringify(data)}`)
    }

    if (Array.isArray(data)) {
      throw new Error('Array is not allowed. To create collections use createCollection.')
    }

    const instance = new this()

    for (const [attrName, value] of Object.entries(data)) {
      if (attrName === '__schema') continue

      this._validate(instance, attrName, value)

      if (typeof value === 'object' && value !== null) {
        this._createSubModelProperty(instance, attrName, value)
      } else {
        this._createSimpleProperty(instance, attrName, value)
      }
    }

    this._hideSchemaProperty(instance)
    this._makeGettersAndSettersEnumerable(instance)

    return instance
  }

  /**
   * Cria coleção sem reatividade
   * @param collectionData
   * @returns {*}
   * @private
   */
  static _createCollection(collectionData) {
    if (!Array.isArray(collectionData)) {
      throw new Error('Collection data must be an array')
    }

    return collectionData.map(data => this._create(data))
  }

  /**
   * Cria um atributo Simples na instancia
   *
   * @param instance
   * @param attrName
   * @param value
   * @private
   */
  static _createSimpleProperty(instance, attrName, value) {
    Object.defineProperty(instance, attrName, {
      enumerable: true,
      configurable: false,
      writable: true,
      value: cloneDeep(value)
    })
  }

  /**
   * Cria um atributo Simples na instancia
   *
   * @param instance
   * @param attrName
   * @param value
   * @private
   */
  static _createSubModelProperty(instance, attrName, value) {
    const SubClass = this.__schema[attrName]

    if (Array.isArray(value)) {
      Object.defineProperty(instance, attrName, {
        enumerable: true,
        configurable: false,
        writable: true,
        value: SubClass._createCollection(value)
      })
    } else {
      Object.defineProperty(instance, attrName, {
        enumerable: true,
        configurable: false,
        writable: true,
        value: SubClass._create(value)
      })
    }
  }

  /**
   * Desabilita enumarable para atributo especial __schema
   *
   * @param instance
   * @private
   */
  static _hideSchemaProperty(instance) {
    Object.defineProperty(instance, '__schema', {
      enumerable: false,
      configurable: false
    })
  }

  /**
   * Habilitada o modo enumerable para todos os Getters e Setters definido pelo usuário
   *  - Exibir atributos do getter e Setter no template
   *
   *  TODO: Experimental, verificar se tem algum efeito colateral, caso positivo, desativar essa funcionalidade
   *
   * @param instance
   * @private
   */
  static _makeGettersAndSettersEnumerable(instance) {
    for (const [propName, propDesc] of Object.entries(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(instance)))) {
      if (!propDesc.enumerable && (propDesc.get || propDesc.set)) {
        Object.defineProperty(instance, propName, {
          enumerable: true,
          configurable: false,
          set: propDesc.set,
          get: propDesc.get
        })
      }
    }
  }

  /**
   * Valida Instancia
   *
   * @param instance
   * @param attrName
   * @param value
   * @private
   */
  static _validate(instance, attrName, value) {
    if (!this.__schema) {
      return
    }

    let validatorType = this.__schema[attrName]
    let options = []

    if (Array.isArray(validatorType)) {
      [validatorType, ...options] = validatorType
    }


    if (validatorType === undefined) {
      throw new TypeError(`In model '${this.name}', property '${attrName}' does not exist.`)
    }

    ///////////////////////////////////////////////////
    // Aceita qualquer coisa
    ///////////////////////////////////////////////////
    if (validatorType === 'any') return

    ///////////////////////////////////////////////////
    // Validação irá ocorrer ao instanciar classe filho
    ///////////////////////////////////////////////////
    if (typeof validatorType === 'function') return

    ///////////////////////////////////////////////////
    // Valida Data
    ///////////////////////////////////////////////////
    if (validatorType === 'date') {
      if (!value instanceof Date) {
        throw new TypeError(`In model '${this.name}', property '${attrName}'  must be Date Object`)
      }
      return
    }

    ///////////////////////////////////////////////////
    // Boolean / Number / String
    ///////////////////////////////////////////////////
    if (['boolean', 'number', 'string'].includes(validatorType)) {
      // eslint-disable-next-line valid-typeof
      if (typeof value !== validatorType) {
        throw new TypeError(`In model '${this.name}', property '${attrName}'  must be '${validatorType}'`)
      }
      return
    }

    if (!validator[validatorType]) {
      throw new TypeError(`In model '${this.name}', property '${attrName}', validator '${validatorType}' does not exist.`)
    }

    if (!validator[validatorType](value, ...options)) {
      throw new TypeError(`In model '${this.name}', property '${attrName}' is invalid '${validatorType}'. ${options ? 'Rules:' + JSON.stringify(options) : ''}'`)
    }

  }
}
