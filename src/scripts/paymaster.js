import { config as dotenvConfig } from "dotenv";

import { ethers } from "ethers";
import { OpToJSON } from "userop/dist/utils";

import * as LitNodeClient from "@lit-protocol/lit-node-client";

dotenvConfig();

export const STACKUP_API_KEY = "db6d5e9f61f03560c7d10299f772d8f71396fe840034c111a7f5f3752bc5db9d";

export const ENTRY_POINT_ADDRESS = "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789";
export const SIMPLE_ACCOUNT_FACTORY_ADDRESS = "0x9406Cc6185a346906296840746125a0E44976454";
export const PAYMASTER_ADDRESS = "0xe459a01E604497C879E77e5203b3fFFc335BdeA0";
export const ECO_TOKEN_ADDRESS = "0x54bBECeA38ff36D32323f8A754683C1F5433A89f";
export const FLAT_FEE_AMOUNT = ethers.utils.parseEther("0.42");
export const signingWallet = new ethers.Wallet(process.env.PRIVATE_KEY_SIGNER);

export const config = {
    rpcUrl: `https://api.stackup.sh/v1/node/${STACKUP_API_KEY}`, // TODO change this to our bundler endpoint
    entryPoint: ENTRY_POINT_ADDRESS,
    simpleAccountFactory: SIMPLE_ACCOUNT_FACTORY_ADDRESS,
    paymaster: {
      eco: {
        rpcUrl: `https://api.stackup.sh/v1/paymaster/${STACKUP_API_KEY}`,
        context: { type: "erc20token", token: ECO_TOKEN_ADDRESS },
      },
    },
  };

export const stackupProvider = new ethers.providers.JsonRpcProvider(config.rpcUrl);

export const verifyingPaymaster = async ctx => {
    ctx.op.verificationGasLimit = ethers.BigNumber.from(ctx.op.verificationGasLimit).mul(3);
  
    const userOp = ctx.op;
  
    const paymaster = new ethers.Contract(PAYMASTER_ADDRESS, PAYMASTER_ABI, stackupProvider);
  
    const validAfter = Math.floor(Date.now() / 1000);
    const validUntil = Math.floor(Date.now() / 1000) + 60 * 60 * 24;
  
    await stackupProvider.getNetwork();
  
    const data = ethers.utils.defaultAbiCoder.encode(
      ["uint48", "uint48", "address", "uint256"],
      [validUntil, validAfter, ECO_TOKEN_ADDRESS, FLAT_FEE_AMOUNT],
    );
    userOp.paymasterAndDataHash = PAYMASTER_ADDRESS + data.slice(2) + "0".repeat(128);
  
    const hash = await paymaster.getHash(OpToJSON(userOp), validUntil, validAfter, ECO_TOKEN_ADDRESS, FLAT_FEE_AMOUNT);
  
    const signature = await signingWallet.signMessage(ethers.utils.arrayify(hash));
    userOp.paymasterAndData = PAYMASTER_ADDRESS + data.slice(2) + signature.slice(2);
  };
  
export const PAYMASTER_ABI = [
    {
      inputs: [
        {
          components: [
            {
              internalType: "address",
              name: "sender",
              type: "address",
            },
            {
              internalType: "uint256",
              name: "nonce",
              type: "uint256",
            },
            {
              internalType: "bytes",
              name: "initCode",
              type: "bytes",
            },
            {
              internalType: "bytes",
              name: "callData",
              type: "bytes",
            },
            {
              internalType: "uint256",
              name: "callGasLimit",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "verificationGasLimit",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "preVerificationGas",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "maxFeePerGas",
              type: "uint256",
            },
            {
              internalType: "uint256",
              name: "maxPriorityFeePerGas",
              type: "uint256",
            },
            {
              internalType: "bytes",
              name: "paymasterAndData",
              type: "bytes",
            },
            {
              internalType: "bytes",
              name: "signature",
              type: "bytes",
            },
          ],
          internalType: "struct UserOperation",
          name: "userOp",
          type: "tuple",
        },
        {
          internalType: "uint48",
          name: "validUntil",
          type: "uint48",
        },
        {
          internalType: "uint48",
          name: "validAfter",
          type: "uint48",
        },
        {
          internalType: "address",
          name: "erc20Token",
          type: "address",
        },
        {
          internalType: "uint256",
          name: "tokenFee",
          type: "uint256",
        },
      ],
      name: "getHash",
      outputs: [
        {
          internalType: "bytes32",
          name: "",
          type: "bytes32",
        },
      ],
      stateMutability: "view",
      type: "function",
    },
  ];


export const ERC20_ABI = [
    {
        "constant": true,
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_spender",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_from",
                "type": "address"
            },
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "name": "",
                "type": "uint8"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "name": "balance",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "name": "",
                "type": "string"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "name": "_to",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "name": "_owner",
                "type": "address"
            },
            {
                "name": "_spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    }
]
