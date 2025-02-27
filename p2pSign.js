// p2pSign.js
import { ethers } from "ethers";
import { readFileSync } from "fs";

export async function signAndBroadcast(
  serializedTx,
  gasLimit,
  maxFeePerGas,
  maxPriorityFeePerGas,
  value
) {
  // Load config
  const config = JSON.parse(readFileSync("./config.json", "utf-8"));
  const rpcURL = config.rpc;
  const provider = new ethers.JsonRpcProvider(rpcURL);

  // Create wallet from private key
  const wallet = new ethers.Wallet(config.privateKey, provider);

  // Parse the raw transaction (serializedTx). 
  // This depends if it’s RLP or a partial struct. 
  const tx = ethers.Transaction.from(serializedTx);

  // Build final transaction data
  const nonce = await provider.getTransactionCount(wallet.address);
  const chainId = (await provider.getNetwork()).chainId;

  const txData = {
    to: tx.to,
    data: tx.data,
    value,
    chainId,
    nonce,
    gasLimit,
    maxFeePerGas: ethers.parseUnits(maxFeePerGas.toString(), "wei"),
    maxPriorityFeePerGas: ethers.parseUnits(
      maxPriorityFeePerGas.toString(),
      "wei"
    ),
    type: 2
  };

  // sign the transaction
  const signedTx = await wallet.signTransaction(txData);
  // broadcast
  const txResponse = await provider.broadcastTransaction(signedTx);
  console.log("Transaction broadcasted:", txResponse.hash);
  return txResponse;
}
