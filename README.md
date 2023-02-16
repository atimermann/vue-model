# Vue Model

O Vue Model é uma camada de dados orientada a objetos simples para o Vue 3. Ele é constituído por um conjunto de classes
que representam a estrutura de dados.

## Conceito chave

O Vue Model converte dados provenientes do backend (como GraphQL ou REST) para uma estrutura de
instância de classes. Ele suporta não apenas dados planos (flat), mas também dados aninhados (nested), convertendo esses
objetos aninhados em novas instâncias, conforme definido no schema do modelo.

## Características

* Integração com o Vue3 (retorna instancias reativas prontas para serem usadas no template)
* Suporta validação de dados através do modulo Validator (https://www.npmjs.com/package/validator)
* Permite criação de coleções

## Estrutura de diretório

Você pode organizar suas classes da forma que melhor lhe convier. Por exemplo:

```
model ->
  inventory.model.mjs
  product.model.mjs
  product-category.model.mjs
```

## Definindo modelo

Exemplo Básco:

```javascript

import Model from '@agtm/vue-model'

export default class UserModel extends Model {
  static __schema = {
    name: 'string',
    lastName: 'string',
    age: 'number',
    email: ['contains', 'Andre', {ignoreCase: false}],
    brother: UserModel
  }

  get FullName() {
    return `My fullname is ${this.name} ${this.lastName}`
  }
}


```

Em __schema, definimos o tipo de cada propriedade do modelo, que pode ser:

* Simples: 'string', 'number', 'boolean' ou 'date', onde a propriedade será testada com typeOf
* Complexo: apenas para string, será utilizada a biblioteca Validator. Veja exemplo de validação de e-mail
* ModelClass: quando representa outro modelo, os dados serão instanciados automaticamente com a classe definida,
* podendo ser array ou objeto simples

## Exemplo de uso

```javascript

const user = await UserModel.create({
  email: 'andre@gmail.com',
  name: 'André',
  idade: 39,
  brother: [{name: 'André', idade: 39}, {name: 'André', idade: 39}]
})

// Alterando propriedade (nunca atribua valores direatamente, pois validações não serão executada e podem ocorrer erros)
user.setValue('lastName', 'Silva')

```

## Recomendações

* Centralize todos as operações relacionado a dados no model, permitindo que seja utilizado em diferentes componentes.
* Getters e Setters para propriedades dinamicas como um valor monetário formatado, ou um calculo especial como um somatório.
* Utilize os métodos fetch, fetchCollection, save, delete ou crie outros para requisições backend.
  * No nuxt pode utilizar $useFetch ou #fetch.

# API

* **create(data):** Cria uma nova instância do modelo a partir de um objeto plano com os dados e retorna uma referência
  reativa da instância criada.
* **createCollection(collectionData):** cria uma coleção de instâncias do modelo a partir de um array de objetos plano
  com os dados e retorna uma referência reativa da coleção criada.
* * **setValues(data):** Altera valores de uma instancia já existente, atributos undefined será ignorado, atributos definidos anteriormente e não definido aqui serão mantidos na instancia
* * **setValue(atributo, valor):** Altera unico atributo da instancia

### Fetch e Refresh

O model fornece dois métodos que permite requisitar dados e retornar método refresh
baseado no $useFresh (https://nuxt.com/docs/api/composables/use-fetch)

* **fetch(id):** Realiza requisição de um registro, instancia um Model com esse registro, e retorna um objeto, com model
  e uma função para atualização reativa

* **fetchCollection():** Realiza requisição de uma coleção registro (array), instancia cada Model com esses registros, e
  retorna um objeto, com coleção de model e uma função para atualização reativa

Para funcionar, você precisa implementar os métodos:

* **_fetch(id)** e **_fetchCollection()** e deve retornar os dados já reativo (com ref())

Exemplo:

```javascript

export default class InventoryModel extends Model {

  // Atenção ao prefixo do método com underline
  static async _fetchCollection() {
    const {data} = await useFetch('http://localhost:3001/api/v1/inventory')
    return this.createCollection(data.value)
  }
}
```

* Esse método será chamado internamente pelo fetchCollection() e vai retornar data e uma função refresh
* Também funciona para _fetch e fetch
* Você pode criar outros métodos com mesma funcionalidade da mesma maneira que fetch e fetchColection foi implementado

Exemplo:

```javascript
export default class InventoryModel extends Model {

  static async _fetchOtherThing() {
    const {data} = await useFetch('http://localhost:3001/api/v1/inventory')
    return await this.createCollection(data.value)
  }

  static async fetchOtherThing() {
    return await this.fetchAndRefresh('_fetchCollection')
  }
}
```

* Por enquanto apenas o refresh tá implementado, verificar no futuro: pending, execute e error

### Métodos recomendádos:

* **save():** persiste as mudanças feitas em uma instância do modelo no backend. Este método deve ser implementado de
  acordo
  com a API do backend utilizado na aplicação.
* **delete():** remove uma instância do modelo no backend. Este método deve ser implementado de acordo com a API do
  backend
  utilizado na aplicação.



# Métodos Auxiliares em coleções

Ao executar o código:

```javascript
  const myInstance = Model.createCollecion(data)
```

É retornado uma variavel reativa do vue3, internamente createCollection já executa **ref(myCollection)**, integrando
perfeitamente com o vue3.

Além disso. o vue-model injeta na variavel reativa, alguns métodos auxiliares para ser usado no seu código, por exemplo:

```javascript
  const myInstance = Model.createCollecion(data)

// Para buscar um item na coleção, em vez de fazer:
const myItem = myInstance.value.find(item => item.id === myId)

// Podemos utiliar a função interna auxiliar findById:
const myItem = myInstance.findById(myId)

```

**IMPORTANTE:** Você sempre deve inicializar a varíavel com createCollection ou create. Se iniciar a variavel com ref()
estes métodos não estarão disponíveis.

Abaixo a lista de métodos auxilires disponivel:

## findById(id)

Busca uma instância na coleção à partir do id passado:


