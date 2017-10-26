const axios = require('axios');
const Hijacker = require('../lib/index');
const path = require('path');

const config = {
  contractsDirectory: path.join(__dirname, '../contracts'),
  get: [
    {name: 'myResource', route: '/example_resource', params: {foo: 'bar'}}
  ]
};

Hijacker(axios, config);

axios.get('/example_resource', {foo: 'bar'}).then(res => {
  console.log(res);
});
