// p2pApi.js
import axios from "axios";
import { readFileSync } from "fs";

const config = JSON.parse(readFileSync("./config.json", "utf-8"));

function getHeaders() {
  return {
    accept: "application/json",
    authorization: config.authToken,
    "content-type": "application/json"
  };
}

/**
 * Create a naive RESTAKING request for 1 validator (32 ETH).
 */
export async function createRestakeRequest() {
  const url = `${config.p2pApiUrl}eth/staking/direct/nodes-request/create`;
  const data = {
    id: Date.now().toString(), // or use uuid
    type: "RESTAKING",
    validatorsCount: 1,
    eigenPodOwnerAddress: config.stakerAddress,
    feeRecipientAddress: config.feeRecipientAddress,
    controllerAddress: config.controllerAddress,
    nodesOptions: { location: "any", relaysSet: null }
  };
  const resp = await axios.post(url, data, { headers: getHeaders() });
  return resp.data.result; // has depositData, etc.
}

/**
 * Retrieve status
 */
export async function getRequestStatus(uuid) {
  const url = `${config.p2pApiUrl}eth/staking/direct/nodes-request/status/${uuid}`;
  const resp = await axios.get(url, { headers: getHeaders() });
  return resp.data.result;
}

/**
 * Build a deposit transaction from the deposit data
 */
export async function createDepositTx(pubkey, signature, depositDataRoot, withdrawalAddr) {
  const url = `${config.p2pApiUrl}eth/staking/direct/tx/deposit`;
  const data = {
    depositData: [
      {
        pubkey,
        signature,
        depositDataRoot
      }
    ],
    withdrawalAddress: withdrawalAddr
  };
  const resp = await axios.post(url, data, { headers: getHeaders() });
  return resp.data.result; // e.g. { serializeTx, gasLimit, ... }
}

