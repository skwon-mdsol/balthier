const sinon = require('sinon');
const MockAdapter = require('axios-mock-adapter');

class Hijacker {
  constructor(axiosInstance, config) {
    this.axiosInstance = axiosInstance;
    this.verbs = ['get', 'post', 'head', 'delete', 'patch', 'put'];
    this.config = config;
    this.mockAdapter = new MockAdapter(this.axiosInstance);

    this.stubMethods();
  }

  stubMethods() {
    this.verbs.forEach(verb => {
      if (config[verb] && config[verb].length) {
        config[verb].forEach(resource => {
          this.mockAdapter.onGet(resource.route, (resource.params || {})).reply(200, {
            foo: 'bar'
          });
        });
      }
    });
  }
}

module.exports = Hijacker
