import Web3 from 'web3';
import AWSHttpProvider from './aws-http-provider.js';
import dotenv from 'dotenv';
import PromisePool from '@supercharge/promise-pool';
import axios from 'axios';
import fs from 'fs';

dotenv.config();
const endpoint = process.env.AMB_HTTP_ENDPOINT
const web3 = new Web3(new AWSHttpProvider(endpoint));

const ERC721ABI = JSON.parse(fs.readFileSync('./contract_abis/erc721.json', 'utf8'));

let blocksScanned = 0;
let transactionsScanned = 0;
let total;

const KNOWN_ERC721_CONTRACT = "0x22dbeef23af0b77e9925c81d0a366c4cfbd05356";

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const PRINT_EVERY = 10;
let startTime = Date.now();

async function isIERC721(contractAddress) {
  try {
    const IERC721 = await new web3.eth.Contract(ERC721ABI, contractAddress);
    const result = await IERC721.methods.supportsInterface('0x80ac58cd').call();
    const symbol = await IERC721.methods.symbol().call();
    const name = await IERC721.methods.name().call();
    const balance = await web3.eth.getBalance(contractAddress);
    return {
      symbol,
      name,
      result: true,
      balance: balance,
    };
  } catch(e) {
    return {
      result: false
    };
  }
}

async function downloadBlock(blockNumber) {
  const blockData = await web3.eth.getBlock(blockNumber)
  for (let i = 0; i < blockData.transactions.length; i++) {
    const t = blockData.transactions[i];
    const transaction = await web3.eth.getTransactionReceipt(t);
    /*
    transaction.logs.forEach((l) => {
      if (l.topics && l.topics[0] === TRANSFER_TOPIC) {
      }
    })
    */
    if (!transaction.to) {
      const result = await isIERC721(transaction.contractAddress);
      if (result.result) {
        const body = {
          balance: result.balance,
          symbol: result.symbol,
          name: result.name,
          block_number: transaction.blockNumber,
          block_timestamp: blockData.timestamp,
          address: transaction.contractAddress,
          contract_type: 'ERC721',
        };
        console.log("Found contract creation: " + transaction.transactionHash)
        console.log(body);
        const response = await axios.post("https://backend.raremints.club/contracts/", body);
      }
    }
    transactionsScanned += 1;
  }
}

async function download() {
  const nodeInfo = await web3.eth.getNodeInfo();
  const lastBlock = await web3.eth.getBlockNumber();
  const blockNumbers = [];
  for (let blockNumber = lastBlock - 10000; blockNumber < lastBlock; blockNumber++) {
    blockNumbers.push(blockNumber);
  }
  total = blockNumbers.length;

  console.log(`Starting download for ${total} blocks...`)
  const { results, errors } = await PromisePool
  .withConcurrency(5)
  .for(blockNumbers)
  .handleError(async (error, user) => {
    console.error(error) // Uncaught errors will console.error
  })

  .process(async (blockNumber, index) => {
    await downloadBlock(blockNumber);
    blocksScanned += 1;
    if (blocksScanned % PRINT_EVERY === 0) {
      console.log(`Scanned ${index}/${total} blocks \t (${blocksScanned / ((Date.now() - startTime) / 1000)} blks / s)`);
      startTime = Date.now();
    }
  })
}

async function main() {
  const result = await isIERC721(KNOWN_ERC721_CONTRACT)
  console.log(result);
  while (true) {
    await download();
    console.log("Completed download");
  }
}
main();
