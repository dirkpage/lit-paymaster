# Lit Paymaster

This project showcases how to use a Verifying Paymaster that has Lit PKP as the owner. We use Lit actions to fetch the exchange price and sign a user operation using lit action on optimism mainnet. The project can be extended to create a wallet that allows paying fees in any erc20 token that is on coingecko on any chain supported by the Lit Network. Or it can be integrated to any existing Smart Wallet Account. 

## Prerequisites
This project requries the following CLI packages:
- Nodejs (`node`)
- Yarn (`yarn`)

#### env variables
Please review the [`.env.example`](./.env.example) file which has a list of the environment variables available to create and sign the user operation. Create a `.env` file that holds the valid values for each variable.

## Installing
To install dependencies, run:
``` sh
yarn install
```

## Running
To create and sign the user operation, run:
``` sh
yarn send
```