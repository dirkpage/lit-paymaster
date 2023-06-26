import { config as dotenvConfig } from "dotenv";

import { ethers } from "ethers";
import { OpToJSON } from "userop/dist/utils";

import { LitNodeClient } from "@lit-protocol/lit-node-client";

dotenvConfig();

export const STACKUP_API_KEY = process.env.STACKUP_API_KEY;

export const ENTRY_POINT_ADDRESS = "0x5ff137d4b0fdcd49dca30c7cf57e578a026d2789";
export const SIMPLE_ACCOUNT_FACTORY_ADDRESS = "0x9406Cc6185a346906296840746125a0E44976454";
export const PAYMASTER_ADDRESS = "0x2A3BE34702B9d4dC3CC38a3Eb4A79cBcA4F665DB"; // optimism 0x22E993D9108DbDe9F32553C3fD0A404aCD2B7150
export const TOKEN_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // optimism 0x7F5c764cBc14f9669B88837ca1490cCa17c31607
export const FLAT_FEE_AMOUNT = ethers.utils.parseEther("0.42");
export const signingWallet = new ethers.Wallet(process.env.PRIVATE_KEY_SIGNER);

export const config = {
    rpcUrl: `https://api.stackup.sh/v1/node/${STACKUP_API_KEY}`, // TODO change this to our bundler endpoint
    entryPoint: ENTRY_POINT_ADDRESS,
    simpleAccountFactory: SIMPLE_ACCOUNT_FACTORY_ADDRESS,
    paymaster: {
      eco: {
        rpcUrl: `https://api.stackup.sh/v1/paymaster/${STACKUP_API_KEY}`,
        context: { type: "erc20token", token: TOKEN_ADDRESS },
      },
    },
  };

export const stackupProvider = new ethers.providers.JsonRpcProvider(config.rpcUrl);




// LIT action
const publicKey = "0x0417be6edbb99eb833a048666e36a8311c349dc75b38fcd9f88ea8aed240b86acf8ea540853b2f7bb8a04e4855c7848af4bf2aa1a31f5cfe42255d17888de75356";
const authSig = {
    address: "0x459301b609be3384f96619ea0d6799b3f3f4850b",
    derivedVia: "web3.eth.personal.sign",
    sig: "0xac0de7f314cafaee7e7868adbbc73a60fcd57eafab2255d317fdfc60bfa1595a1200ca13dd7300000bfaa7fc80499ac7abe267140369a6eeb8f4737ec992d97f1b",
    signedMessage:
        "localhost:3000 wants you to sign in with your Ethereum account:\n0x459301B609Be3384F96619eA0D6799b3f3F4850b\n\n\nURI: http://localhost:3000/about\nVersion: 1\nChain ID: 80001\nNonce: 7po4PGc70DqTdBdJn\nIssued At: 2023-06-25T00:03:50.374Z\nExpiration Time: 2023-07-02T00:03:50.173Z",
};

export const executeLitAction =
    async (ctx) => {
        const litNodeClient = new LitNodeClient({
            alertWhenUnauthorized: false,
            litNetwork: "serrano",
            debug: true,
        });

        await litNodeClient.connect();

        const validAfter = Math.floor(Date.now() / 1000);
        const validUntil = Math.floor(Date.now() / 1000) + 60 * 10;

        const {response, signatures} = await litNodeClient.executeJs({
            ipfsId: "Qmd9ayeHb8FipvFDSAzZ9pYZgcaZ8p6QSeaZbL1Be9sxmH",
            authSig,
            jsParams: {
                sigName: "sig1",
                validAfter,
                validUntil,
                paymasterAddress: PAYMASTER_ADDRESS.toLowerCase(),
                tokenAddress: TOKEN_ADDRESS.toLowerCase(),
                userOp: JSON.stringify(OpToJSON(ctx.op)),
                publicKey,
            },
        });

        const {signature} = signatures.sig1;
        const {data} = response;

        ctx.op.paymasterAndData = PAYMASTER_ADDRESS.toLowerCase() + data.slice(2) + signature.slice(2);
    };

  // The code below is the LIT Action corresponding to ipfsId `Qmd9ayeHb8FipvFDSAzZ9pYZgcaZ8p6QSeaZbL1Be9sxmH`
  // const chain = "polygon-pos";
  // const PAYMASTER_ABI = [
  //   {
  //     inputs: [
  //       {
  //         components: [
  //           { internalType: "address", name: "sender", type: "address" },
  //           { internalType: "uint256", name: "nonce", type: "uint256" },
  //           { internalType: "bytes", name: "initCode", type: "bytes" },
  //           { internalType: "bytes", name: "callData", type: "bytes" },
  //           { internalType: "uint256", name: "callGasLimit", type: "uint256" },
  //           { internalType: "uint256", name: "verificationGasLimit", type: "uint256" },
  //           { internalType: "uint256", name: "preVerificationGas", type: "uint256" },
  //           { internalType: "uint256", name: "maxFeePerGas", type: "uint256" },
  //           { internalType: "uint256", name: "maxPriorityFeePerGas", type: "uint256" },
  //           { internalType: "bytes", name: "paymasterAndData", type: "bytes" },
  //           { internalType: "bytes", name: "signature", type: "bytes" },
  //         ],
  //         internalType: "struct UserOperation",
  //         name: "userOp",
  //         type: "tuple",
  //       },
  //       { internalType: "uint48", name: "validUntil", type: "uint48" },
  //       { internalType: "uint48", name: "validAfter", type: "uint48" },
  //       { internalType: "address", name: "erc20Token", type: "address" },
  //       { internalType: "uint256", name: "tokenFee", type: "uint256" },
  //     ],
  //     name: "getHash",
  //     outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
  //     stateMutability: "view",
  //     type: "function",
  //   },
  // ];
  // const go = async () => {
  //   const url =
  //     "https://api.coingecko.com/api/v3/simple/token_price/" +
  //     chain +
  //     "?contract_addresses=" +
  //     tokenAddress +
  //     "&vs_currencies=eth";
  //   try {
  //     const opts = {
  //       method: "GET",
  //       headers: { mode: "no-cors" },
  //     };
  //     const result = await fetch(url, opts).then(response => response.json());
  //     const data = ethers.utils.defaultAbiCoder.encode(
  //       ["uint48", "uint48", "address", "uint256"],
  //       [validUntil, validAfter, tokenAddress, ethers.utils.parseEther(result[tokenAddress].eth.toString())],
  //     );
  //     const provider = new ethers.providers.JsonRpcProvider(
  //       "https://polygon-rpc.com",
  //       137,
  //     );
  //     const paymaster = new ethers.Contract(paymasterAddress, PAYMASTER_ABI, provider);
  //     const hash = await paymaster.getHash(
  //       JSON.parse(userOp),
  //       validUntil,
  //       validAfter,
  //       tokenAddress,
  //       ethers.utils.parseEther(result[tokenAddress].eth.toString()),
  //     );
  //     const sigShare = await LitActions.ethPersonalSignMessageEcdsa({ message: hash, publicKey, sigName });
  //     LitActions.setResponse({
  //       response: JSON.stringify({
  //         hash: hash,
  //         data: data,
  //       }),
  //     });
  //   } catch (e) {
  //     console.log(e);
  //   }
  // };
  // go();

  
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
