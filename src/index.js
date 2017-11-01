const MockAdapter = require('axios-mock-adapter');
const fs = require('fs');
const path = require('path');
const faker = require('faker');

// returns {contractName: contract, contractName: contract}
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
  // TODO: perhaps place this somewhere else.
  const contracts = getContracts(config.contractsDirectory);
  let error;

  if (!config.contractsDirectory) {
    error = {error: `You are missing a contracts directory for your config. Please assign
      the config.contractsDirectory a value of the path of your directory that holds all your contracts`};
    throw error;
  }

  // TODO: DRY this method by adding a callback?
  Object.keys(contracts).forEach(name => {
    const currentContract = contracts[name];
    if (currentContract.action === 'post') {
      if ((!currentContract.key || !currentContract.key.length)) {
        error = {error: `Your post contract called ${currentContract.name} does not have "key"
          parameter. Either add a "key" parameter or delete this contract`};
        throw error;
      }
    }
  });
};

// Accepts string argument structured like "[module].[type]" e.g "random.boolean"
const buildFakerPrimitive = (value) => {
  const splitArgs = value.split('.');
  return faker[splitArgs[0]][splitArgs[1]]();
};

const buildResponseArray = (contractSubset) => {
  const result = [];
  let i;
  let data;
  for (i = 0; i < contractSubset['counts']; i++) {
    data = (typeof contractSubset['data'] === 'object')
      ? walkAndBuildResponse(contractSubset['data'])
      : buildFakerPrimitive(contractSubset['data']);
    result.push(data);
  }
  return result;
};

const walkAndBuildResponse = (contractSubsetJson) => {
  const result = {};

  Object.keys(contractSubsetJson).forEach(key => {
    const curr = contractSubsetJson[key];
    if (curr['__data_type__'] === 'array') {
      result[key] = buildResponseArray(curr);
    } else if (typeof curr === 'object') {
      result[key] = walkAndBuildResponse(curr);
    } else {
      result[key] = buildFakerPrimitive(curr);
    }
  });

  return result;
};

const mapGetRequestsToGetContracts = (contracts, mockAdapter) => {
  Object.keys(contracts).forEach(name => {
    const currentContract = contracts[name];
    if (currentContract.action === 'get') {
      mockAdapter
        .onGet(currentContract.route, (currentContract.params || {}))
        .reply(200, walkAndBuildResponse(currentContract.json));
    }
  });
};

const mapPostRequestsToPostContracts = (contracts, mockAdapter) => {
  const validateParams = (contractParams, currParams) => {
    return Object.keys(currParams).reduce((acc, param) => {
      if (typeof contractParams[param] === 'undefined' || contractParams[param] === null) {
        return false;
      }
      return acc || false;
    }, true);
  };

  Object.keys(contracts).forEach(name => {
    const currentContract = contracts[name];
    if (currentContract.action === 'post') {
      mockAdapter
        .onPost(currentContract.route)
        .reply((config) => {
          const queryParams = (config.data) ? JSON.parse(config.data) : {};
          const response = walkAndBuildResponse(currentContract.json);

          // check to see if the user matches the query params based on the
          // contract
          if (validateParams(currentContract.params, queryParams)) {
            return [200, response];
          }
          return [422, {}];
        });
    }
  });
};

function Hijacker (axiosInstance, config) {
  checkErrors(config);

  const mockAdapter = new MockAdapter(axiosInstance);
  const contracts = getContracts(config.contractsDirectory);

  mapGetRequestsToGetContracts(contracts, mockAdapter);
  mapPostRequestsToPostContracts(contracts, mockAdapter);
}

module.exports = Hijacker;
