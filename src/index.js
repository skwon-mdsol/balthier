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
    the config.contractsDirectory a value of the path of your directory that holds all your contracts
  `;

  if (!config.contractsDirectory) {
    throw errorMessage;
  }
};

// Accepts string argument structured like "[module].[type]" e.g "random.boolean"
const buildFakerPrimitive = (value) => {
  const splitArgs = value.split('.');
  return faker[splitArgs[0]][splitArgs[1]]();
}

const buildResponseArray = (contractSubset) => {
  const result = [];
  for (i = 0; i < contractSubset['amount']; i++) {
    if (typeof contractSubset['data'] === 'object') {
      result.push(walkAndBuildResponse(contractSubset['data']));
    } else {
      result.push(buildFakerPrimitive(contractSubset['data']));
    }
  }
  return result
}

const walkAndBuildResponse = (contractSubset) => {
  const result = {};
  let arr;
  let i;

  Object.keys(contractSubset).forEach(key => {
    const curr = contractSubset[key];
    if (curr['__data_type__'] === 'array') {
      result[key] = buildResponseArray(curr);
    } else if (typeof curr === 'object') {
      result[key] = walkAndBuildResponse(curr)
    } else {
      result[key] = buildFakerPrimitive(curr);
    }
  });

  return result;
}

function Hijacker (axiosInstance, config) {
  checkErrors(config);

  const mockAdapter = new MockAdapter(axiosInstance);
  const contracts = getContracts(config.contractsDirectory);

  Object.keys(contracts).forEach(name => {
    const currentContract = contracts[name];
    mockAdapter
      .onGet(currentContract.route, (currentContract.params || {}))
      .reply(200, walkAndBuildResponse(currentContract.json));
  });
}

module.exports = Hijacker;
