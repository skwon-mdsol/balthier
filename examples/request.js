const axios = require('axios');
const Hijacker = require('../lib/index');

const config = {
  get: [
    {resourceName: 'myResourceName', route: '/example_resource', params: {foo: 'bar'}}
  ]
};

new Hijacker(axios, config);

axios.get('/example_resource', {foo: 'bar'}).then(res => {
  console.log(res);
});

