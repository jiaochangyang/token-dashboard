import { db } from "./db";
import { tokenContracts } from "./db/schema";
import { readFileSync } from "fs";
import { join } from "path";

async function seed() {
  try {
    console.log("Seeding database with MyToken contract...");

    // Read the ABI and bytecode from the compiled contract
    const abiPath = join(
      __dirname,
      "../../smartcontract/out/MyToken.sol/MyToken.abi.json"
    );
    const bytecodePath = join(
      __dirname,
      "../../smartcontract/out/MyToken.sol/MyToken.bin"
    );

    const abi = JSON.parse(readFileSync(abiPath, "utf-8"));
    const bytecode = "0x" + readFileSync(bytecodePath, "utf-8").trim();

    // Check if MyToken already exists
    const existing = await db
      .select()
      .from(tokenContracts)
      .where(
        db.sql`${tokenContracts.name} = 'MyToken' AND ${tokenContracts.symbol} = 'MTK'`
      );

    if (existing.length > 0) {
      console.log("MyToken contract already exists in the database");
      return;
    }

    // Insert the token contract
    const [tokenContract] = await db
      .insert(tokenContracts)
      .values({
        name: "MyToken",
        symbol: "MTK",
        decimals: 18,
        abi: abi,
        bytecode: bytecode,
      })
      .returning();

    console.log("Successfully seeded MyToken contract:", tokenContract.id);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
