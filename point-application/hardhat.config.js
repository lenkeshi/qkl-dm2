/**
* @type import('hardhat/config').HardhatUserConfig
*/

require('dotenv').config();
require("@nomiclabs/hardhat-ethers");

const { API_URL, REACT_APP_PRIVATE_KEY } = process.env;

module.exports = {
   solidity: "0.8.26",
   defaultNetwork: "point",
   networks: {
      hardhat: {},
      point: {
         url: API_URL,
         accounts: [`0x${REACT_APP_PRIVATE_KEY}`],
         gas: 2100000,
         gasPrice: 20000000000,
      }
   },
}