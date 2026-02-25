import { readFileSync } from "fs";
import { join } from "path";

const contractPath = join(
  __dirname,
  "../../smartcontract/out/MyToken.sol/MyToken.json",
);

const contractJson = JSON.parse(readFileSync(contractPath, "utf-8"));

const payload = {
  name: "MyToken",
  symbol: "MTK",
  decimals: 18,
  abi: contractJson.abi,
  bytecode: contractJson.bytecode.object,
};

const apiUrl = process.env.API_URL || "http://localhost:3000";

fetch(`${apiUrl}/contracts`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(payload),
})
  .then(async (res) => {
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}: ${text}`);
    }
    return JSON.parse(text);
  })
  .then(async (data) => {
    console.log("✅ MyToken contract onboarded successfully!");
    console.log("\nContract ID:", data.data.id);

    console.log("\nDeploying MyToken to Anvil...");
    const deployPayload = {
      tokenContractId: data.data.id,
      name: payload.name,
      symbol: payload.symbol,
      decimals: payload.decimals,
      initialSupply: "1000000000000000000000",
      chainId: 31337,
      rpcUrl: "http://localhost:8545",
    };

    const deployRes = await fetch(`${apiUrl}/deployments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(deployPayload),
    });

    const deployText = await deployRes.text();
    if (!deployRes.ok) {
      throw new Error(`Deployment failed with ${deployRes.status}: ${deployText}`);
    }

    const deployData = JSON.parse(deployText);
    if (!deployData.success) {
      throw new Error(`Deployment failed: ${deployData.message}\n${deployData.error ?? ""}`);
    }
    console.log("✅ MyToken deployed successfully!");
    console.log("\nDeployment ID:", deployData.data.id);
    console.log("Contract Address:", deployData.data.contractAddress);
    console.log("Transaction Hash:", deployData.data.transactionHash);
  })
  .catch((err) => {
    console.error("❌ Failed to onboard contract:", err.message);
    process.exit(1);
  });
