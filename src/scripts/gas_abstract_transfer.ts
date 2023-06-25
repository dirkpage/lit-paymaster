
import { config as dotenvConfig } from "dotenv";

import { Client, Presets, UserOperationMiddlewareFn } from "userop";
import { Signer, ethers } from "ethers";
import { SimpleAccount } from "userop/dist/preset/builder";
import { EOASignature, getGasPrice, estimateUserOperationGas } from "userop/dist/preset/middleware";

import { TOKEN_ADDRESS, ENTRY_POINT_ADDRESS, SIMPLE_ACCOUNT_FACTORY_ADDRESS, ERC20_ABI, PAYMASTER_ADDRESS, stackupProvider, config, executeLitAction } from "./paymaster";

dotenvConfig();

const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_1!;
const PRIVATE_KEY_2 = process.env.PRIVATE_KEY_2!;

const AMOUNT = ethers.utils.parseEther("5");

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
    const recipientAccount = await getSimpleAccount(recipient, provider);

    // init client
    const client = await Client.init(config.rpcUrl, config.entryPoint);
    
    await transfer(client, account, recipientAccount.getSender(), AMOUNT);
   
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

  const erc20 = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, stackupProvider);
  const data = erc20.interface.encodeFunctionData("transfer", [to, amount]);

  const hasBeenDeployed = await hasWalletBeenDeployed(provider, simpleAccount.getSender());
  if (hasBeenDeployed) {
    simpleAccount.executeBatch([erc20.address], [data]);
  } else {
    // Execute transaction and approve Paymaster to spend tokens to pay gas fees in ECO tokens
    simpleAccount.executeBatch(
      [erc20.address, erc20.address],
      [
        erc20.interface.encodeFunctionData("approve", [PAYMASTER_ADDRESS, ethers.constants.MaxUint256]),
        data
      ],
    );
  }
};

const transfer = async (
  client: Client,
  simpleAccount: SimpleAccount,
  to: string,
  amount: ethers.BigNumber
) => {
  if (!client || !simpleAccount) return "";

  await buildOps(simpleAccount, ethers.utils.getAddress(to), amount);

  simpleAccount
    .resetMiddleware()
    .useMiddleware((simpleAccount as any).resolveAccount)
    .useMiddleware(getGasPrice(stackupProvider))
    .useMiddleware(executeLitAction)

  const userOp = await client.buildUserOperation(simpleAccount)
  console.log(userOp);


/*
  simpleAccount
    .useMiddleware(estimateUserOperationGas(stackupProvider))
    .useMiddleware(executeLitAction)
    .useMiddleware(EOASignature((simpleAccount as any).signer));

    const res = await client.sendUserOperation(simpleAccount);
    console.log("Waiting for transaction...");
    const ev = await res.wait();
    console.log(`Transaction hash: ${ev?.transactionHash ?? null}`);
    */
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
