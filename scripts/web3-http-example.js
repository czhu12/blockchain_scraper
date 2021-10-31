import Web3 from 'web3';
import AWSHttpProvider from './aws-http-provider.js';
import dotenv from 'dotenv';
dotenv.config();
const endpoint = process.env.AMB_HTTP_ENDPOINT
const web3 = new Web3(new AWSHttpProvider(endpoint));

let transactionsScanned = 0;

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
async function downloadBlock(blockNumber) {
  console.log("Downloading block " + blockNumber);
  const blockData = await web3.eth.getBlock(blockNumber)
  console.log("Fetched block " + blockNumber);
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
      console.log("Found contract creation: " + transaction.transactionHash)
    }
    transactionsScanned += 1;

    if (transactionsScanned % 100 === 0) {
      console.log("Scanned " + transactionsScanned + " transactions");
    }
  }
}

async function download() {
  const nodeInfo = await web3.eth.getNodeInfo();
  const lastBlock = await web3.eth.getBlockNumber();
  console.log("Starting download...")
  for (let blockNumber = lastBlock - 100; blockNumber < lastBlock; blockNumber++) {
    await downloadBlock(blockNumber);
  }
}

download();
