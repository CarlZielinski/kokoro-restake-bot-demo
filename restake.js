// restake.js
import { ethers } from "ethers";
import { readFileSync } from "fs";
import { createRestakeRequest, createDepositTx } from "./p2pApi.js";
import { signAndBroadcast } from "./p2pSign.js";

// Check for multiple 32-ETH restakes in a row
async function restakeAll(provider, wallet) {
  // Refresh on-chain balance each loop to see if there's still 32 ETH
  while (true) {
    const balance = await provider.getBalance(wallet.address);
    const ethBal = parseFloat(ethers.formatEther(balance));

    if (ethBal < 32) {
      // not enough for another chunk
      break;
    }

    console.log(`\nDetected balance >= 32 ETH. Attempting a single restake...`);

    // 1) Create restaking request
    const restakeRes = await createRestakeRequest();
    console.log("Restake request result:", restakeRes);

    const depositData = restakeRes?.depositData?.[0];
    if (!depositData) {
      throw new Error("No deposit data found in restake request");
    }

    // 2) Build deposit transaction
    const depositTx = await createDepositTx(
      depositData.pubkey,
      depositData.signature,
      depositData.depositDataRoot,
      wallet.address // or config.stakerAddress if different
    );
    console.log("Created deposit TX from P2P:", depositTx);

    // 3) sign & broadcast
    const broadcastRes = await signAndBroadcast(
      depositTx.serializeTx,
      depositTx.gasLimit,
      depositTx.maxFeePerGas,
      depositTx.maxPriorityFeePerGas,
      depositTx.value
    );
    console.log(`Broadcasted deposit TX hash: ${broadcastRes.hash}`);

    // Optionally wait some seconds for the TX to confirm
    // or check provider.getTransactionReceipt(...) in a loop

    console.log("One restake (32 ETH) completed. Checking balance again...");
  }
}

async function main() {
  const config = JSON.parse(readFileSync("./config.json", "utf-8"));
  const provider = new ethers.JsonRpcProvider(config.rpc);
  const wallet = new ethers.Wallet(config.privateKey, provider);

  console.log("Naive multi-restake script started.");
  console.log("EOA address:", wallet.address);
  console.log("Polling for >= 32 ETH every 60 seconds...");

  while (true) {
    try {
      await restakeAll(provider, wallet);
    } catch (err) {
      console.error("Error in restake loop:", err.message);
    }

    // Wait 60s, then repeat checking
    await new Promise((resolve) => setTimeout(resolve, 60000));
  }
}

main().catch((err) => {
  console.error("Main script error:", err);
  process.exit(1);
});
