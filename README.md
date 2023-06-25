# Lit Paymaster

This project contains a script that generates and signs a user operation using a lit action on optimism mainnet.

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