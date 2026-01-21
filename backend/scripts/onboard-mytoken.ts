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
  .then((res) => res.json())
  .then((data) => {
    console.log("✅ MyToken contract onboarded successfully!");
    console.log("\nContract ID:", data.data.id);
    console.log("\nYou can now deploy this contract using:");
    console.log(
      `curl -X POST ${apiUrl}/deployments -H "Content-Type: application/json" -d '{ "tokenContractId": "${data.data.id}", ... }'`,
    );
  })
  .catch((err) => {
    console.error("❌ Failed to onboard contract:", err.message);
  });
