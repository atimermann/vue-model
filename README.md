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
```

## API

* **create(data):** Cria uma nova instância do modelo a partir de um objeto plano com os dados e retorna uma referência
  reativa da instância criada.
* **createCollection(collectionData):** cria uma coleção de instâncias do modelo a partir de um array de objetos plano
  com os dados e retorna uma referência reativa da coleção criada.

### Métodos recomendádos:

* **fetch(id):** puxa os dados do backend para criar uma instância do modelo com o id correspondente. Este método deve
  ser
  implementado de acordo com a API do backend utilizado na aplicação.
* **fetchCollection():** puxa os dados do backend para criar uma coleção de instâncias do modelo. Este método deve ser
  implementado de acordo com a API do backend utilizado na aplicação.
* **save():** persiste as mudanças feitas em uma instância do modelo no backend. Este método deve ser implementado de
  acordo
  com a API do backend utilizado na aplicação.
* **delete():** remove uma instância do modelo no backend. Este método deve ser implementado de acordo com a API do
  backend
  utilizado na aplicação.

## Recomendações

* Centralize todos as operações relacionado a dados no model, permitindo que seja utilizado em diferentes componentes
* Getters e Setters para propriedades dinamicas como um valor monetário formatado, ou um calculo especial como somatório
* Utilize os métodos fetch, fetchCollection, save, delete ou crie outros para requisições backend
    * No nuxt pode utilizar $useFetch ou #fetch
