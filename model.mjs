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
    const collection = ref(this._createCollection(collectionData))

    ////////////////////////////
    // Métodos auxiliares:
    // TODO: Verificar se vai ocorrer efeito colateral, caso positivo remover funcionalidade
    ////////////////////////////
    Object.defineProperty(collection, 'findById', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: function (id) {
        return this.value.find(item => item.id === id)
      }
    })

    return collection
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
    throw Error('Static method _fetch() not implemented yet')
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
    throw Error('Static method _fetchCollection() not implemented yet')
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
   * Atribui um valor a instancia do modelo realizando validações necessárias, sem realizar outra instancia
   *
   * @param attrName
   * @param value
   */
  setValue(attrName, value) {

    this._validate(attrName, value)

    if (isPlainObject(value)) {
      this._createSubModelProperty(attrName, value)
    } else {
      this._createSimpleProperty(attrName, value)
    }

  }

  /**
   * Atribui objeto à instancia, altera apenas objetos definidos, ignora undefined ou o que não foi definido
   * Não remove atributos, não use undefined
   *
   * @param data
   */
  setValues(data) {

    if (!data) {
      throw new Error("The argument 'data' was not provided or is null or undefined.")
    }

    if (!isPlainObject(data)) {
      throw new TypeError(`The 'data' argument must be a plain object. Received: ${JSON.stringify(data)}`)
    }

    if (Array.isArray(data)) {
      throw new Error('Array is not allowed. To create collections use createCollection.')
    }

    for (const [attrName, value] of Object.entries(data)) {
      if (value === undefined) continue
      this.setValue(attrName, value)
    }

  }

  /**
   * Implementar aqui código para persistidar registro no backend
   * Ex: no nuxt utilizar $fetch('POST' ou 'PUT')
   * PUT se exixtir Id
   *
   * @returns {Promise<void>}
   */
  async save() {
    throw Error('Method save() not implemented yet')
  }

  /**
   * Implementar aqui código para demover registro do backend
   * Ex: no nuxt utilizar $fetch
   *
   * @returns {Promise<void>}
   */
  async delete() {
    throw Error('Method delete() not implemented yet')
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

    const instance = new this()
    instance.setValues(data)
    instance._makeGettersAndSettersEnumerable()
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
   * Habilitada o modo enumerable para todos os Getters e Setters definido na instancia
   *  - Exibir atributos do getter e Setter no template
   *
   * @private
   */
  _makeGettersAndSettersEnumerable() {
    for (const [propName, propDesc] of Object.entries(Object.getOwnPropertyDescriptors(Object.getPrototypeOf(this)))) {
      if (!propDesc.enumerable && (propDesc.get || propDesc.set)) {
        Object.defineProperty(this, propName, {
          enumerable: true,
          configurable: false,
          set: propDesc.set,
          get: propDesc.get
        })
      }
    }
  }

  /**
   * Cria um atributo Simples na instancia
   *
   * @param attrName
   * @param value
   * @private
   */
  _createSimpleProperty(attrName, value) {
    Object.defineProperty(this, attrName, {
      enumerable: true,
      configurable: false,
      writable: true,
      value: cloneDeep(value)
    })
  }

  /**
   * Cria um atributo Simples na instancia
   *
   * @param attrName
   * @param value
   * @private
   */
  _createSubModelProperty(attrName, value) {

    const Class = this.constructor
    const SubClass = Class.__schema[attrName]

    if (!SubClass) throw new Error(`Model "${attrName}" not exists.`)

    if (Array.isArray(value)) {
      Object.defineProperty(this, attrName, {
        enumerable: true,
        configurable: false,
        writable: true,
        value: SubClass._createCollection(value)
      })
    } else {
      Object.defineProperty(this, attrName, {
        enumerable: true,
        configurable: false,
        writable: true,
        value: value === null ? null : SubClass._create(value)
      })
    }
  }


  /**
   * Valida dado
   *
   * @param attrName
   * @param value
   * @private
   */
  _validate(attrName, value) {

    const Class = this.constructor

    if (!Class.__schema) return

    if (value === null) return

    let validatorType = Class.__schema[attrName]
    let options = []

    if (Array.isArray(validatorType)) {
      [validatorType, ...options] = validatorType
    }


    if (validatorType === undefined) {
      throw new TypeError(`In model '${Class.name}', property '${attrName}' does not exist.`)
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
      if (!(value instanceof Date)) {
        throw new TypeError(`In model '${Class.name}', property '${attrName}'  must be Date object`)
      }
      return
    }

    ///////////////////////////////////////////////////
    // Boolean / Number / String
    ///////////////////////////////////////////////////
    if (['boolean', 'number', 'string'].includes(validatorType)) {
      // eslint-disable-next-line valid-typeof
      if (typeof value !== validatorType) {
        throw new TypeError(`In model '${Class.name}', property '${attrName}'  must be '${validatorType}'`)
      }
      return
    }

    ///////////////////////////////////////////////////
    // Validator
    ///////////////////////////////////////////////////

    if (!validator[validatorType]) {
      throw new TypeError(`In model '${Class.name}', property '${attrName}', validator '${validatorType}' does not exist.`)
    }

    if (!validator[validatorType](value, ...options)) {
      throw new TypeError(`In model '${Class.name}', property '${attrName}' is invalid '${validatorType}'. ${options ? 'Rules:' + JSON.stringify(options) : ''}'`)
    }

  }
}
