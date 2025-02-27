# Kokoro Restake Bot

This is a naive Node.js script that checks an EOA balance on Sepolia (or any EVM chain) every minute. If the EOA has at least 32 ETH, it automatically triggers a restaking process with P2P (https://p2p.org/) to create a validator using 32 ETH.

> NOTE: Testing P2P is currently only available on Holesky. However, due to the recent failed Pectra upgrade, the corresponding Kokoro contracts are hosted on Sepolia. Just assume P2P is also deployed on Sepolia for the time being. 

> **Warning**: This approach is **not production-secure**. For real usage, store private keys in a vault or use a multi-sig or MPC. This is strictly for demonstration and hackathon usage.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Running the Script](#running-the-script)
- [How It Works](#how-it-works)
- [Customization](#customization)

---

## Prerequisites

- **Node.js** (v16 or higher recommended, v18+ preferred)
- **npm** or **yarn**
- Basic familiarity with how ephemeral private keys, Infura/Alchemy, and the P2P API work.

---

## Project Structure

kokoro-restake-bot/ 
├─ package.json 
├─ config.json 
├─ restake.js // main script that polls for 32 ETH and triggers restake 
├─ p2pApi.js // minimal P2P REST API calls 
├─ p2pSign.js // sign & broadcast helper (using ethers.js) 
└─ node_modules/


1. **config.json**: Stores your ephemeral private key, Infura/Alchemy RPC URL, P2P auth, addresses, etc.  
2. **restake.js**: Main script that runs in a loop, checking your EOA balance every minute.  
3. **p2pApi.js**: Minimal helpers for calling P2P’s REST APIs (create restake request, build deposit TX, etc.).  
4. **p2pSign.js**: A small function that signs the deposit transaction and broadcasts it on-chain via `ethers`.

---

## Installation

1. **Clone or Copy** this repo:
   ```
   bash
   git clone https://github.com/yourUser/kokoro-restake-bot.git
   cd kokoro-restake-bot
   ```
2. Install Dependencies:

    ```
    npm install
    ``` 
    
    This installs ethers and axios plus any transitive dependencies.
3. Configuration
    Update config.json with your actual values:
    ```
    {
    "rpc": "https://sepolia.infura.io/v3/<YOUR_API_KEY>",
    "privateKey": "0x12345...replaceWithYours",
    "p2pApiUrl": "https://<p2pTestEnvOrMainEnv>.com/",
    "authToken": "Bearer <yourP2PAuthToken>",
    "stakerAddress": "0xYourEOAforRestake",
    "feeRecipientAddress": "0xYourEOAforRestake",
    "controllerAddress": "0xYourEOAforRestake"
    }
    ```
    Fields:

    rpc: RPC endpoint for the chain (e.g., Sepolia). You can use your Infura or Alchemy key.
    privateKey: The ephemeral EOA that receives ETH from your Vault. In production, store this in an environment variable or HSM.
    p2pApiUrl: P2P’s REST API base URL. Use a test environment or main environment
    authToken: Your P2P API token for authorized requests.
    stakerAddress, feeRecipientAddress, controllerAddress: Typically the same ephemeral EOA. 


## Running the Script

Simply run:

```node restake.js```
 

You’ll see logs like:

```
Naive multi-restake script started.
EOA address: 0x123...
Polling for >= 32 ETH every 60 seconds...
EOA balance: 0.0 ETH
Flow:
```

Every 60 seconds, the script checks the EOA’s current ETH balance.
If the balance is >= 32:
Calls createRestakeRequest() to spin up a new validator deposit.
Builds a deposit transaction with createDepositTx().
Signs & broadcasts the TX to the chain.
Re-checks if the EOA still has >= 32 ETH. If yes, it repeats.
Once the EOA has < 32 ETH, the script goes back to waiting.
Stop the script with Ctrl + C.

## How It Works
Vault to EOA: Your on-chain Vault contract calls _restake() with 32 ETH chunks, sending them to your ephemeral EOA.

restake.js: Sees the EOA’s new balance (≥ 32).

P2P: The script calls P2P’s REST API to create a restaking request for exactly 1 validator (32 ETH).

Deposit TX: It obtains a deposit transaction data (serializeTx, gasLimit, etc.) from the P2P API.

Signing: Uses your ephemeral EOA’s private key to sign the transaction with ethers.js.

Broadcast: Submits the signed transaction to the network. The node processes it, creating a new staked validator.

Multiple 32: If your EOA had more than 32 ETH (say, 96 ETH), the script will deposit 32, re-check the balance, deposit 32 again, etc., until < 32 remains.

## Customization
Polling Interval: By default, it’s 60 seconds. Change the setTimeout(resolve, 60000) line to a different interval.

Partial restakes: The script is coded to restake exactly 32 ETH at a time for single validators. If you want multiple validators in a single request or partial amounts, adjust the calls to the P2P endpoints accordingly.

Advanced Flow: Some flows require calling createEigenPod(), delegateToOperator(), or checking validator status, etc. Add them in p2pApi.js or in the main script.

Security: For production, do not store your private key in plain text. Instead, use environment variables or hardware wallets. Also consider a more advanced solution that doesn’t rely on a single EOA.
