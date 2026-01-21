import { Elysia, t } from "elysia";
import { db } from "../db";
import { deployments, tokenContracts, transactions } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
  type Chain,
  BaseError,
  ContractFunctionRevertedError,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet, sepolia } from "viem/chains";

// Define Anvil localhost chain with correct chain ID
const anvil: Chain = {
  id: 31337,
  name: "Anvil",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
    public: { http: ["http://127.0.0.1:8545"] },
  },
};

const chainMap: Record<number, Chain> = {
  1: mainnet,
  11155111: sepolia,
  31337: anvil,
};

type AccountName = "DEPLOYER" | "A1" | "A2" | "A3";

function getPrivateKeyForAccount(accountName: AccountName): string | null {
  switch (accountName) {
    case "DEPLOYER":
      return process.env.DEPLOYER_PRIVATE_KEY || null;
    case "A1":
      return process.env.A1 || null;
    case "A2":
      return process.env.A2 || null;
    case "A3":
      return process.env.A3 || null;
    default:
      return null;
  }
}

export const interactionsRoute = new Elysia({ prefix: "/tokens/:address" })
  .post(
    "/transfer",
    async ({ params, body, error }) => {
      return await executeWrite(
        params.address,
        body.rpcUrl,
        body.account,
        "transfer",
        [body.to, BigInt(body.value)],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      body: t.Object({
        rpcUrl: t.String(),
        account: t.Union([
          t.Literal("DEPLOYER"),
          t.Literal("A1"),
          t.Literal("A2"),
          t.Literal("A3"),
        ]),
        to: t.String(),
        value: t.String(),
      }),
    },
  )
  .post(
    "/approve",
    async ({ params, body, error }) => {
      return await executeWrite(
        params.address,
        body.rpcUrl,
        body.account,
        "approve",
        [body.spender, BigInt(body.value)],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      body: t.Object({
        rpcUrl: t.String(),
        account: t.Union([
          t.Literal("DEPLOYER"),
          t.Literal("A1"),
          t.Literal("A2"),
          t.Literal("A3"),
        ]),
        spender: t.String(),
        value: t.String(),
      }),
    },
  )
  .post(
    "/transfer-from",
    async ({ params, body, error }) => {
      return await executeWrite(
        params.address,
        body.rpcUrl,
        body.account,
        "transferFrom",
        [body.from, body.to, BigInt(body.value)],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      body: t.Object({
        rpcUrl: t.String(),
        account: t.Union([
          t.Literal("DEPLOYER"),
          t.Literal("A1"),
          t.Literal("A2"),
          t.Literal("A3"),
        ]),
        from: t.String(),
        to: t.String(),
        value: t.String(),
      }),
    },
  )
  .post(
    "/mint",
    async ({ params, body, error }) => {
      return await executeWrite(
        params.address,
        body.rpcUrl,
        body.account,
        "mint",
        [body.to, BigInt(body.amount)],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      body: t.Object({
        rpcUrl: t.String(),
        account: t.Union([
          t.Literal("DEPLOYER"),
          t.Literal("A1"),
          t.Literal("A2"),
          t.Literal("A3"),
        ]),
        to: t.String(),
        amount: t.String(),
      }),
    },
  )
  .post(
    "/burn",
    async ({ params, body, error }) => {
      return await executeWrite(
        params.address,
        body.rpcUrl,
        body.account,
        "burn",
        [BigInt(body.amount)],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      body: t.Object({
        rpcUrl: t.String(),
        account: t.Union([
          t.Literal("DEPLOYER"),
          t.Literal("A1"),
          t.Literal("A2"),
          t.Literal("A3"),
        ]),
        amount: t.String(),
      }),
    },
  )
  .post(
    "/add-to-allowlist",
    async ({ params, body, error }) => {
      return await executeWrite(
        params.address,
        body.rpcUrl,
        body.signer,
        "addToAllowlist",
        [body.account],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      body: t.Object({
        rpcUrl: t.String(),
        signer: t.Union([
          t.Literal("DEPLOYER"),
          t.Literal("A1"),
          t.Literal("A2"),
          t.Literal("A3"),
        ]),
        account: t.String(),
      }),
    },
  )
  .post(
    "/remove-from-allowlist",
    async ({ params, body, error }) => {
      return await executeWrite(
        params.address,
        body.rpcUrl,
        body.signer,
        "removeFromAllowlist",
        [body.account],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      body: t.Object({
        rpcUrl: t.String(),
        signer: t.Union([
          t.Literal("DEPLOYER"),
          t.Literal("A1"),
          t.Literal("A2"),
          t.Literal("A3"),
        ]),
        account: t.String(),
      }),
    },
  )
  .post(
    "/pause",
    async ({ params, body, error }) => {
      return await executeWrite(
        params.address,
        body.rpcUrl,
        body.account,
        "pause",
        [],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      body: t.Object({
        rpcUrl: t.String(),
        account: t.Union([
          t.Literal("DEPLOYER"),
          t.Literal("A1"),
          t.Literal("A2"),
          t.Literal("A3"),
        ]),
      }),
    },
  )
  .post(
    "/unpause",
    async ({ params, body, error }) => {
      return await executeWrite(
        params.address,
        body.rpcUrl,
        body.account,
        "unpause",
        [],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      body: t.Object({
        rpcUrl: t.String(),
        account: t.Union([
          t.Literal("DEPLOYER"),
          t.Literal("A1"),
          t.Literal("A2"),
          t.Literal("A3"),
        ]),
      }),
    },
  )
  .get(
    "/balance-of/:account",
    async ({ params, query, error }) => {
      return await executeRead(
        params.address,
        query.rpcUrl as string,
        "balanceOf",
        [params.account],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
        account: t.String(),
      }),
      query: t.Object({
        rpcUrl: t.String(),
      }),
    },
  )
  .get(
    "/allowance/:owner/:spender",
    async ({ params, query, error }) => {
      return await executeRead(
        params.address,
        query.rpcUrl as string,
        "allowance",
        [params.owner, params.spender],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
        owner: t.String(),
        spender: t.String(),
      }),
      query: t.Object({
        rpcUrl: t.String(),
      }),
    },
  )
  .get(
    "/is-allowlisted/:account",
    async ({ params, query, error }) => {
      return await executeRead(
        params.address,
        query.rpcUrl as string,
        "isAllowlisted",
        [params.account],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
        account: t.String(),
      }),
      query: t.Object({
        rpcUrl: t.String(),
      }),
    },
  )
  .get(
    "/allowlist-length",
    async ({ params, query, error }) => {
      return await executeRead(
        params.address,
        query.rpcUrl as string,
        "getAllowlistLength",
        [],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      query: t.Object({
        rpcUrl: t.String(),
      }),
    },
  )
  .get(
    "/allowlist-address/:index",
    async ({ params, query, error }) => {
      return await executeRead(
        params.address,
        query.rpcUrl as string,
        "getAllowlistAddress",
        [BigInt(params.index)],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
        index: t.String(),
      }),
      query: t.Object({
        rpcUrl: t.String(),
      }),
    },
  )
  .get(
    "/total-supply",
    async ({ params, query, error }) => {
      return await executeRead(
        params.address,
        query.rpcUrl as string,
        "totalSupply",
        [],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      query: t.Object({
        rpcUrl: t.String(),
      }),
    },
  )
  .get(
    "/name",
    async ({ params, query, error }) => {
      return await executeRead(
        params.address,
        query.rpcUrl as string,
        "name",
        [],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      query: t.Object({
        rpcUrl: t.String(),
      }),
    },
  )
  .get(
    "/symbol",
    async ({ params, query, error }) => {
      return await executeRead(
        params.address,
        query.rpcUrl as string,
        "symbol",
        [],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      query: t.Object({
        rpcUrl: t.String(),
      }),
    },
  )
  .get(
    "/decimals",
    async ({ params, query, error }) => {
      return await executeRead(
        params.address,
        query.rpcUrl as string,
        "decimals",
        [],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      query: t.Object({
        rpcUrl: t.String(),
      }),
    },
  )
  .get(
    "/paused",
    async ({ params, query, error }) => {
      return await executeRead(
        params.address,
        query.rpcUrl as string,
        "paused",
        [],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      query: t.Object({
        rpcUrl: t.String(),
      }),
    },
  )
  .get(
    "/owner",
    async ({ params, query, error }) => {
      return await executeRead(
        params.address,
        query.rpcUrl as string,
        "owner",
        [],
        error,
      );
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      query: t.Object({
        rpcUrl: t.String(),
      }),
    },
  )
  .get(
    "/balance-holders",
    async ({ params, query, error }) => {
      try {
        const contractAddress = params.address;
        const rpcUrl = query.rpcUrl as string;

        const [deployment] = await db
          .select()
          .from(deployments)
          .where(eq(deployments.contractAddress, contractAddress));

        if (!deployment) {
          return error(404, {
            success: false,
            message: "Deployment not found",
          });
        }

        const [tokenContract] = await db
          .select()
          .from(tokenContracts)
          .where(eq(tokenContracts.id, deployment.tokenContractId));

        if (!tokenContract) {
          return error(404, {
            success: false,
            message: "Token contract not found",
          });
        }

        const chain = chainMap[deployment.chainId];
        if (!chain) {
          return error(400, {
            success: false,
            message: "Unsupported chain ID",
          });
        }

        const publicClient = createPublicClient({
          chain,
          transport: http(rpcUrl),
        });

        // Get Transfer events to find all addresses that have ever received tokens
        const logs = await publicClient.getLogs({
          address: contractAddress as Hex,
          event: {
            type: "event",
            name: "Transfer",
            inputs: [
              { type: "address", indexed: true, name: "from" },
              { type: "address", indexed: true, name: "to" },
              { type: "uint256", indexed: false, name: "value" },
            ],
          },
          fromBlock: BigInt(0),
          toBlock: "latest",
        });

        // Collect unique addresses (excluding zero address for mints)
        const uniqueAddresses = new Set<string>();
        logs.forEach((log: any) => {
          if (
            log.args.from &&
            log.args.from !== "0x0000000000000000000000000000000000000000"
          ) {
            uniqueAddresses.add(log.args.from);
          }
          if (
            log.args.to &&
            log.args.to !== "0x0000000000000000000000000000000000000000"
          ) {
            uniqueAddresses.add(log.args.to);
          }
        });

        // Check balance and allowlist status for each address
        const balanceHolders = await Promise.all(
          Array.from(uniqueAddresses).map(async (address) => {
            const [balance, isAllowlisted] = await Promise.all([
              publicClient.readContract({
                address: contractAddress as Hex,
                abi: tokenContract.abi as any,
                functionName: "balanceOf",
                args: [address],
              }),
              publicClient.readContract({
                address: contractAddress as Hex,
                abi: tokenContract.abi as any,
                functionName: "isAllowlisted",
                args: [address],
              }),
            ]);

            return {
              address,
              balance: (balance as bigint).toString(),
              isAllowlisted: isAllowlisted as boolean,
            };
          }),
        );

        // Filter out addresses with zero balance
        const holdersWithBalance = balanceHolders.filter(
          (holder) => BigInt(holder.balance) > 0n,
        );

        return {
          success: true,
          data: holdersWithBalance,
        };
      } catch (err: any) {
        return error(500, {
          success: false,
          message: err.message || "Failed to get balance holders",
        });
      }
    },
    {
      params: t.Object({
        address: t.String(),
      }),
      query: t.Object({
        rpcUrl: t.String(),
      }),
    },
  );

// Background function to monitor transaction confirmation
async function monitorTransaction(
  hash: Hex,
  transactionId: string,
  publicClient: any,
) {
  try {
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Update transaction status in database
    await db
      .update(transactions)
      .set({
        status: receipt.status === "success" ? "confirmed" : "failed",
        gasUsed: receipt.gasUsed.toString(),
      })
      .where(eq(transactions.id, transactionId));

    console.log(`Transaction ${hash} ${receipt.status}`);
  } catch (err) {
    console.error(`Failed to get receipt for ${hash}:`, err);
    // Mark as failed if we can't get receipt
    await db
      .update(transactions)
      .set({
        status: "failed",
        errorMessage: "Failed to get transaction receipt",
      })
      .where(eq(transactions.id, transactionId));
  }
}

async function executeWrite(
  contractAddress: string,
  rpcUrl: string,
  accountName: AccountName,
  functionName: string,
  args: any[],
  error: any,
) {
  try {
    const [deployment] = await db
      .select()
      .from(deployments)
      .where(eq(deployments.contractAddress, contractAddress));

    if (!deployment) {
      return error(404, {
        success: false,
        message: "Deployment not found",
      });
    }

    const [tokenContract] = await db
      .select()
      .from(tokenContracts)
      .where(eq(tokenContracts.id, deployment.tokenContractId));

    if (!tokenContract) {
      return error(404, {
        success: false,
        message: "Token contract not found",
      });
    }

    const chain = chainMap[deployment.chainId];
    if (!chain) {
      return error(400, {
        success: false,
        message: "Unsupported chain ID",
      });
    }

    const privateKey = getPrivateKeyForAccount(accountName);
    if (!privateKey) {
      return error(500, {
        success: false,
        message: `Private key for account ${accountName} not configured in environment`,
      });
    }

    const account = privateKeyToAccount(privateKey as Hex);

    const walletClient = createWalletClient({
      account,
      chain,
      transport: http(rpcUrl),
    });

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    // Simulate the transaction first to detect reverts
    try {
      await publicClient.simulateContract({
        address: deployment.contractAddress as Hex,
        abi: tokenContract.abi as any,
        functionName,
        args,
        account,
      });
    } catch (simulationErr: any) {
      // Transaction would revert - parse and interpret the error using viem's error walking
      let errorMessage = "Transaction would revert";

      // Use viem's error walking to find ContractFunctionRevertedError
      if (simulationErr instanceof BaseError) {
        const revertError = simulationErr.walk(
          (err) => err instanceof ContractFunctionRevertedError,
        );

        if (revertError instanceof ContractFunctionRevertedError) {
          // For custom errors, get the error name
          const errorName = revertError.data?.errorName ?? "";
          // For require/revert with reason string
          const reason = revertError.reason;

          if (reason) {
            // This handles require("reason string") and revert("reason string")
            errorMessage = reason;
          } else if (errorName) {
            // This handles custom errors like error NotAllowlisted(address)
            errorMessage = `Contract error: ${errorName}`;
            if (revertError.data?.args && revertError.data.args.length > 0) {
              errorMessage += ` (${revertError.data.args.join(", ")})`;
            }
          } else if (revertError.shortMessage) {
            errorMessage = revertError.shortMessage;
          }
        }
      }

      // Fallback to other error properties if error walking didn't work
      if (errorMessage === "Transaction would revert") {
        if (simulationErr.shortMessage) {
          errorMessage = simulationErr.shortMessage;
        } else if (simulationErr.message) {
          errorMessage = simulationErr.message;
        }
      }

      // Record the error without submitting the transaction
      const serializableArgs = args.map((arg) =>
        typeof arg === "bigint" ? arg.toString() : arg,
      );

      await db.insert(transactions).values({
        deploymentId: deployment.id,
        transactionHash:
          "0x0000000000000000000000000000000000000000000000000000000000000000",
        functionName,
        parameters: serializableArgs,
        fromAddress: account.address,
        status: "failed",
        errorMessage: errorMessage,
      });

      throw new Error(errorMessage);
    }

    const hash = await walletClient.writeContract({
      address: deployment.contractAddress as Hex,
      abi: tokenContract.abi as any,
      functionName,
      args,
      gas: 1000000n,
    });

    // Convert BigInt values to strings in parameters for JSON serialization
    const serializableArgs = args.map((arg) =>
      typeof arg === "bigint" ? arg.toString() : arg,
    );

    // Record transaction as pending immediately
    const [transaction] = await db
      .insert(transactions)
      .values({
        deploymentId: deployment.id,
        transactionHash: hash,
        functionName,
        parameters: serializableArgs,
        fromAddress: account.address,
        status: "pending",
        gasUsed: null,
      })
      .returning();

    // Monitor transaction in background (don't await)
    monitorTransaction(hash, transaction.id, publicClient).catch((err) =>
      console.error("Failed to monitor transaction:", err),
    );

    // Return immediately without waiting for confirmation
    return {
      success: true,
      data: {
        transaction,
        transactionHash: hash,
      },
    };
  } catch (err: any) {
    console.error("Transaction error:", err);

    // Try to get deployment info to record failed transaction
    try {
      const [deployment] = await db
        .select()
        .from(deployments)
        .where(eq(deployments.contractAddress, contractAddress));

      if (deployment) {
        const privateKey = getPrivateKeyForAccount(accountName);
        if (privateKey) {
          const account = privateKeyToAccount(privateKey as Hex);

          // Convert BigInt values to strings in parameters for JSON serialization
          const serializableArgs = args.map((arg) =>
            typeof arg === "bigint" ? arg.toString() : arg,
          );

          // Record the failed transaction in the database
          await db.insert(transactions).values({
            deploymentId: deployment.id,
            transactionHash:
              "0x0000000000000000000000000000000000000000000000000000000000000000",
            functionName,
            parameters: serializableArgs,
            fromAddress: account.address,
            status: "failed",
            errorMessage: err.message || err.toString(),
          });
        }
      }
    } catch (dbErr) {
      console.error("Failed to record error in database:", dbErr);
    }

    return {
      success: false,
      message: err.message || "Transaction failed",
      error: err.toString(),
    };
  }
}

async function executeRead(
  contractAddress: string,
  rpcUrl: string,
  functionName: string,
  args: any[],
  error: any,
) {
  try {
    const [deployment] = await db
      .select()
      .from(deployments)
      .where(eq(deployments.contractAddress, contractAddress));

    if (!deployment) {
      return error(404, {
        success: false,
        message: "Deployment not found",
      });
    }

    const [tokenContract] = await db
      .select()
      .from(tokenContracts)
      .where(eq(tokenContracts.id, deployment.tokenContractId));

    if (!tokenContract) {
      return error(404, {
        success: false,
        message: "Token contract not found",
      });
    }

    const chain = chainMap[deployment.chainId];
    if (!chain) {
      return error(400, {
        success: false,
        message: "Unsupported chain ID",
      });
    }

    const publicClient = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });

    const result = await publicClient.readContract({
      address: deployment.contractAddress as Hex,
      abi: tokenContract.abi as any,
      functionName,
      args,
    });

    return {
      success: true,
      data: {
        result: typeof result === "bigint" ? result.toString() : result,
      },
    };
  } catch (err: any) {
    return error(500, {
      success: false,
      message: err.message || "Read failed",
    });
  }
}
