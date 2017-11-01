# Balthier (Codename Hijacker)

Named after a pirate of the skies, Balthier (Hijacker) is api service
mocker and a json response builder. Its purpose is provide fake
repsonses that are compliant with user created contracts.

This is meant to speed up the development of UI's in case a developer
has an idea of how a certain api response will be structured and
wants to develop request/response related UI interactions, but the
backend has not completely implemented the route with the api response.

The best scenario for this would be a session of rapid prototyping or a
sales demo.

## TL;DR

An axios proxy service that mocks get and post requests based on user JSON contracts. It uses faker to generate fake data

## Installation

`yarn add balthier`
`npm install balthier`

## Example

Create a GET request Contracts json file and store it in some folder, lets say `fixtures`, and add the required params:

|required_params|description|
|---------------|----|
|name|name of resource|
|action|"post" / "get"|
|route|path of route|
|params|an object of your params with strict values. This can also be blank|
|json|Object of key mapping to string representations of faker methods: https://github.com/marak/Faker.js/#api-methods|


```js
// myExample.json
{
  "name": "myResource", //required
  "version": "1.0.0",
  "action": "get", //required
  "route": "/example_resource", //required
  "params": { //required
    "foo": "bar"
  },
  "json": { //required
    "study_uuid": "random.uuid", //calls a faker resource
    "active": "random.boolean",
    "settings": {
      "foo": "random.boolean",
      "bar": "random.boolean",
      "lotsOfFoos": {"__data_type__": "array", "data": {"foo": "name.firstName"}, "counts": 3}
      // arrays must be written in the strict format
    }
  }
}
```

Then call the Hijacker method from balthier with a config object that has a reference to the directory, `fixtures`, that holds all your json contracts

```js
const axios = require('axios');
const Hijacker = require('balthier');
const path = require('path');

const config = {
  contractsDirectory: path.join(__dirname, '../contracts') //required
};

if (NODE_ENV === 'development') {
  Hijacker(axios, config);
}

axios.get('/example_resource', {foo: 'bar'}).then(res => {
  console.log(res);
  /* will return the following:
  {
    study_uuid: "aeafcf80-1c9f-4c7d-9007-ca2f3d989e73",
    active: true,
    settings: {
      foo: true,
      bar: false,
      lotsOfFoos: [{foo: 'sean'}, {foo: 'john'}, ...]
    }
  }
  */
});

```
