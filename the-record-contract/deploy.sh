#!/bin/bash
# Deploy The Record smart contract to Aptos testnet
# Run from the contract directory

PLATFORM_ADDRESS="0xa8c20d49b063e41aff19123fd2263d0b9945ec9708ce9d7ec72d68f485043cb8"

echo "Compiling contract..."
aptos move compile \
  --named-addresses the_record=$PLATFORM_ADDRESS,platform=$PLATFORM_ADDRESS

echo "Running tests..."
aptos move test \
  --named-addresses the_record=$PLATFORM_ADDRESS,platform=$PLATFORM_ADDRESS

echo "Publishing to testnet..."
aptos move publish \
  --named-addresses the_record=$PLATFORM_ADDRESS,platform=$PLATFORM_ADDRESS \
  --profile testnet \
  --assume-yes

echo "Initializing registry..."
aptos move run \
  --function-id "${PLATFORM_ADDRESS}::record_registry::initialize" \
  --profile testnet \
  --assume-yes

echo "Done! Contract deployed at: $PLATFORM_ADDRESS"
echo "Module: ${PLATFORM_ADDRESS}::record_registry"
