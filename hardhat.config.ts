import 'dotenv/config';
import {HardhatUserConfig} from 'hardhat/types';
import 'hardhat-deploy';
import '@nomiclabs/hardhat-ethers';
import 'hardhat-gas-reporter';
import '@typechain/hardhat';
import 'solidity-coverage';
import {node_url, accounts} from './utils/network';
//added to run migrated js test
import '@openzeppelin/hardhat-upgrades';
import '@nomiclabs/hardhat-web3';
import '@nomiclabs/hardhat-ganache';

// While waiting for hardhat PR: https://github.com/nomiclabs/hardhat/pull/1542
if (process.env.HARDHAT_FORK) {
  process.env['HARDHAT_DEPLOY_FORK'] = process.env.HARDHAT_FORK;
}

import {
  MAINNET_PRIVATE_KEYS,
  TESTNET_PRIVATE_KEYS,
  ALCHEMY_PROJECT_ID,
} from './.secrets.json';

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.7.6",
        settings: {
          // See the solidity docs for advice about optimization and evmVersion
          optimizer: {
            enabled: true,
            runs: 100,
          },
        },
      },
      {
        version: "0.8.4",
        settings: {
          // See the solidity docs for advice about optimization and evmVersion
          optimizer: {
            enabled: true,
            runs: 100,
          },
        },
      },
    ],

  },
  namedAccounts: {
    deployer: 0,
  },
  networks: {
    /*     localhost: {
      url: "127.0.0.1",     // Localhost
      port: 8545,            // Ganache CLI port
    }, */
    hardhat: {
      // process.env.HARDHAT_FORK will specify the network that the fork is made from.
      // this line ensure the use of the corresponding accounts
      accounts: accounts(process.env.HARDHAT_FORK),
      forking: process.env.HARDHAT_FORK
        ? {
            // TODO once PR merged : network: process.env.HARDHAT_FORK,
            url: node_url(process.env.HARDHAT_FORK),
            blockNumber: process.env.HARDHAT_FORK_NUMBER
              ? parseInt(process.env.HARDHAT_FORK_NUMBER)
              : undefined,
          }
        : undefined,
    },
    localhost: {
      //accounts: accounts(),
      saveDeployments: true,
      tags: ['local'],
      //gasPrice: 0,
    },
    testnet: {
      url: 'https://eth-rinkeby.alchemyapi.io/v2/' + ALCHEMY_PROJECT_ID,
      accounts: TESTNET_PRIVATE_KEYS,
      saveDeployments: true,
      tags: ['testnet'],
    },
    testnet_nodeploy: {
      url: 'https://eth-rinkeby.alchemyapi.io/v2/' + ALCHEMY_PROJECT_ID,
      accounts: TESTNET_PRIVATE_KEYS,
      saveDeployments: true,
      tags: ['testnet_nodeploy'],
    },
    mainnet: {
      url: 'https://eth-mainnet.alchemyapi.io/v2/' + ALCHEMY_PROJECT_ID,
      accounts: MAINNET_PRIVATE_KEYS,
      saveDeployments: true,
      tags: ['mainnet'],
    },
  },
  paths: {
    sources: 'src',
    tests: './test',
  },
  gasReporter: {
    currency: 'USD',
    gasPrice: 100,
    enabled: process.env.REPORT_GAS ? true : false,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    maxMethodDiff: 10,
  },
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },
  mocha: {
    timeout: 0,
  },
};

export default config;
