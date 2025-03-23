const { Web3 } = require("web3"); // Correct import for v4.x

// Initialize Web3 with an HTTP provider
const web3 = new Web3("http://127.0.0.1:7545"); // Connect to local Ethereum node (e.g., Ganache)

async function tokenize(amount, address) {
  try {
    // Simulate token creation (replace with actual contract interaction later)
    const tokenId = web3.utils.sha3(`${address}${amount}${Date.now()}`);
    return tokenId;
  } catch (error) {
    throw new Error(`Tokenization failed: ${error.message}`);
  }
}

async function transferToken(tokenId, from, to) {
  try {
    // Simulate token transfer (replace with actual contract interaction later)
    console.log(`Transferring token ${tokenId} from ${from} to ${to}`);
    return true;
  } catch (error) {
    throw new Error(`Transfer failed: ${error.message}`);
  }
}

module.exports = { tokenize, transferToken };
