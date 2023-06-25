
import { Client, Presets, UserOperationMiddlewareFn } from "userop";
import { Signer, ethers } from "ethers";
import { SimpleAccount } from "userop/dist/preset/builder";
import { EOASignature, getGasPrice } from "userop/dist/preset/middleware";

import * as LitJsSdk from "@lit-protocol/lit-node-client";

import { estimateUserOperationGas } from "userop/dist/preset/middleware/gasLimit";

import { ECO_TOKEN_ADDRESS, ENTRY_POINT_ADDRESS, SIMPLE_ACCOUNT_FACTORY_ADDRESS, verifyingPaymaster, ERC20_ABI, PAYMASTER_ADDRESS, stackupProvider, config } from "./paymaster";

const PRIVATE_KEY_1 = "c67e24893e406cb63d9b3291db2f6151587e3dbf0b62c121d776425e071e6254";
const PRIVATE_KEY_2 = "e851bd0b03288a8135a67c0d69ce191860728f4a5d239df72bcaeaf0c761fe32";

const AMOUNT = ethers.utils.parseEther("10");

/**
 * construct a wallet and send a simple transaction
 */


const provider = stackupProvider;

const testAccounts = [new ethers.Wallet(PRIVATE_KEY_1, provider), new ethers.Wallet(PRIVATE_KEY_2, provider)];

export const getSimpleAccount = (
    signer: ethers.Signer,
    provider: ethers.providers.JsonRpcProvider,
    paymaster?: UserOperationMiddlewareFn,
  ) => {
    return Presets.Builder.SimpleAccount.init(
      signer,
      provider.connection.url,
      ENTRY_POINT_ADDRESS,
      SIMPLE_ACCOUNT_FACTORY_ADDRESS,
      paymaster,
    );
  };

const initSimpleAccount = async (signer: Signer) => {
    // get simple wallet address
    const account = await getSimpleAccount(signer, provider);

    const address = account.getSender();

    // PAUSE: log simple wallet address and send erc20 to it.
    console.log("SimpleAccount address: " + address);
}


const gaslessTransfer = async (signer: Signer, recipient: Signer) => {
  try {

    const account = await getSimpleAccount(signer, provider);

    // init client
    const client = await Client.init(config.rpcUrl, config.entryPoint);
    
    const result = await transfer(client, account, await recipient.getAddress(), AMOUNT);
    console.log("Result: ", result);
   
  } catch (err) {
    console.log(err);
  }
};

// initSimpleAccount(testAccounts[0]);
// initSimpleAccount(testAccounts[1]);

// transfer to
gaslessTransfer(testAccounts[0], testAccounts[1]);

// transfer back
// gaslessTransfer(testAccounts[1], testAccounts[0]);

/* HELPER FUNCTIONS */

const buildOps = async (simpleAccount: SimpleAccount, to: string, amount: ethers.BigNumber) => {
  if (!simpleAccount) return;

  const erc20 = new ethers.Contract(ECO_TOKEN_ADDRESS, ERC20_ABI, provider);
  const data = erc20.interface.encodeFunctionData("transfer", [to, amount]);

  console.log("Approving");
  /*
  const hasBeenDeployed = await hasWalletBeenDeployed(provider, simpleAccount.getSender());
  if (hasBeenDeployed) {
    simpleAccount.executeBatch([erc20.address], [data]);
  } else {
    */
    // Execute transaction and approve Paymaster to spend tokens to pay gas fees in ECO tokens
    simpleAccount.executeBatch(
      [erc20.address, erc20.address],
      [
        data,
        erc20.interface.encodeFunctionData("approve", [PAYMASTER_ADDRESS, ethers.constants.MaxUint256]),
      ],
    );
  //}
};

const transfer = async (
  client: Client,
  simpleAccount: SimpleAccount,
  to: string,
  amount: ethers.BigNumber
): Promise<string> => {
  if (!client || !simpleAccount) return "";

  await buildOps(simpleAccount, ethers.utils.getAddress(to), amount);

  simpleAccount
    .resetMiddleware()
    .useMiddleware((simpleAccount as any).resolveAccount)
    .useMiddleware(getGasPrice(stackupProvider))
    .useMiddleware(verifyingPaymaster)

  console.log("Approved", await client.buildUserOperation(simpleAccount));

  simpleAccount
    .useMiddleware(estimateUserOperationGas(stackupProvider))
    .useMiddleware(verifyingPaymaster)
    .useMiddleware(EOASignature((simpleAccount as any).signer));

  const res = await client.sendUserOperation(simpleAccount);
  console.log("Waiting for transaction...");
  const ev = await res.wait();
  console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
  return ev!.transactionHash;
};
  
  const litActionCode = `
const go = async () => { 
  let toSign;

  const url = "https://api.coingecko.com/api/v3/simple/price?ids=" + symbol + "&vs_currencies=eth";

  try {
    const opts = {
      method: 'GET',
      headers: {
        mode: "no-cors",
      },
    };
    const result = await fetch(url, opts).then(response => response.json());

    const validAfter = Math.floor(Date.now() / 1000);
    const validUntil = Math.floor(Date.now() / 1000) + 60 * 10;

    const data = ethers.utils.defaultAbiCoder.encode(
      ["uint48", "uint48", "address", "uint256"],
      [validUntil, validAfter, tokenAddress, result],
    );

    const hash = await paymaster.getHash(
      OpToJSON(ctx.op) as UserOperationStruct,
      validUntil,
      validAfter,
      tokenAddress,
      result,
    );

    toSign = { response: result };

    const sigShare = await LitActions.signEcdsa({ toSign, publicKey , sigName });

    LitActions.setResponse({ response: {
      hash: hash,
      data: data,
     }});

     
  } catch (e) {
    console.log(e);
  }

};

go();
`;

export const runLitAction = async (userOps: any, paymaster: any) => {
  const authSig = await LitJsSdk.checkAndSignAuthMessage({ chain: "mumbai" });

  const litNodeClient = new LitJsSdk.LitNodeClient({
    alertWhenUnauthorized: false,
    litNetwork: "serrano",
    debug: true,
  });

  await litNodeClient.connect();
  const { response } = await litNodeClient.executeJs({
    code: litActionCode,
    authSig,
    // all jsParams can be used anywhere in your litActionCode
    jsParams: {
      publicKey:
        "0x0417be6edbb99eb833a048666e36a8311c349dc75b38fcd9f88ea8aed240b86acf8ea540853b2f7bb8a04e4855c7848af4bf2aa1a31f5cfe42255d17888de75356",
      sigName: "sig1",
      token: "vix",
      tokenAddress: "test-address",
      paymasterAddress: "verifying-paymaster-address",
      symbol: "ape",
      userOps: userOps,
      paymaster: paymaster,
    },
  });
  console.log(response);

  // return reponse hash
  return response;
};

export async function hasWalletBeenDeployed(
    provider: ethers.providers.JsonRpcProvider,
    address: string,
  ): Promise<boolean> {
    try {
      const code = await provider.getCode(address);
      return code !== "0x";
    } catch (e) {
      console.error("Error determining if SWA is already deployed", e);
    }
    return false;
  }
  