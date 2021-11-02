import Web3 from 'web3';
import AWSHttpProvider from './aws-http-provider.js';
import dotenv from 'dotenv';
import PromisePool from '@supercharge/promise-pool';
import fs from 'fs';

dotenv.config();
const endpoint = process.env.AMB_HTTP_ENDPOINT
const web3 = new Web3(new AWSHttpProvider(endpoint));

const ERC721ABI = JSON.parse(fs.readFileSync('./contract_abis/erc721.json', 'utf8'));

let blocksScanned = 0;
let transactionsScanned = 0;
let total;

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const PRINT_EVERY = 10;
let startTime = Date.now();

async function inferContractType(contractAddress) {
  console.log("CHECKING CONTRACT");
  const balance = await web3.eth.getBalance(contractAddress)
  console.log(balance);
}

async function main() {
  const result = await inferContractType('0x3b0F6bc22dCd93f7F1a0945F8e3270C4D7927a0e')
  console.log(result);
}
main()
