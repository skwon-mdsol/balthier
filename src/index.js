// const sinon = require('sinon');
const MockAdapter = require('axios-mock-adapter');
const fs = require('fs');
const path = require('path');
const faker = require('faker');

const getContracts = (dirpath) => {
  const jsonFiles = fs.readdirSync(dirpath);
  return jsonFiles.reduce((result, fileName) => {
    let contract;
    // read json file
    if (/\.json/i.test(fileName)) {
      contract = JSON.parse(fs.readFileSync(path.join(dirpath, fileName), {encoding: 'utf8'}));
      result[contract.name] = contract;
    }

    return result;
  }, {});
};

const checkErrors = (config) => {
  const errorMessage = `
    You are missing a contracts directory for your config. Please assign
    the config.contractsDirectorya value of the path of your directory that holds all your contracts
  `;

  if (!config.contractsDirectory) {
    throw errorMessage;
  }
};

const buildFakeResponse = (contract) => {
  return Object.keys(contract).reduce((acc, key) => {
    const splitArgs = contract[key].split('.');
    acc[key] = faker[splitArgs[0]][splitArgs[1]]();
    return acc;
  }, {});
};

function Hijacker (axiosInstance, config) {
  checkErrors(config);

  const mockAdapter = new MockAdapter(axiosInstance);
  const contracts = getContracts(config.contractsDirectory);
  Object.keys(contracts).forEach(name => {
    const currentContract = contracts[name];
    mockAdapter
      .onGet(currentContract.route, (currentContract.params || {}))
      .reply(200, buildFakeResponse(currentContract.json));
  });
}

module.exports = Hijacker;
