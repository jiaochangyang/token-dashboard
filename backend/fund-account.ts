// Quick script to fund the deployer account
import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { localhost } from "viem/chains";

// Anvil's first default account (has 10000 ETH)
const anvilAccount = privateKeyToAccount(
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
);

const deployerAddress = "0x473Ea9082AdB2c865784e295e41F720a41C56Ae3";

const client = createWalletClient({
  account: anvilAccount,
  chain: localhost,
  transport: http("http://127.0.0.1:8545"),
});

async function fundAccount() {
  try {
    const hash = await client.sendTransaction({
      to: deployerAddress,
      value: parseEther("100"), // Send 100 ETH
    });
    console.log(`✅ Sent 100 ETH to ${deployerAddress}`);
    console.log(`Transaction hash: ${hash}`);
  } catch (err) {
    console.error("Failed to fund account:", err);
  }
}

fundAccount();
