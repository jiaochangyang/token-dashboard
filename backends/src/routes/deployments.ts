import { Elysia, t } from "elysia";
import { db } from "../db";
import { deployments, tokenContracts } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  createPublicClient,
  createWalletClient,
  http,
  type Hex,
  type Chain,
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

function getRpcUrl(chainId: number): string {
  const rpcUrls: Record<number, string> = {
    1: "https://eth.llamarpc.com",
    11155111: "https://rpc.sepolia.org",
    31337: "http://127.0.0.1:8545",
  };
  return rpcUrls[chainId] || "http://127.0.0.1:8545";
}

export const deploymentsRoute = new Elysia({ prefix: "/deployments" })
  .post(
    "/",
    async ({ body, error }) => {
      const [tokenContract] = await db
        .select()
        .from(tokenContracts)
        .where(eq(tokenContracts.id, body.tokenContractId));

      if (!tokenContract) {
        return error(404, {
          success: false,
          message: "Token contract not found",
        });
      }

      const chain = chainMap[body.chainId];
      if (!chain) {
        return error(400, {
          success: false,
          message: "Unsupported chain ID",
        });
      }

      // Validate initialSupply is a valid number string
      try {
        BigInt(body.initialSupply);
      } catch {
        return error(400, {
          success: false,
          message: "initialSupply must be a valid numeric string",
        });
      }

      try {
        const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
        if (!privateKey) {
          return error(500, {
            success: false,
            message: "DEPLOYER_PRIVATE_KEY not configured in environment",
          });
        }

        // Validate private key format
        if (!privateKey.startsWith("0x")) {
          return error(500, {
            success: false,
            message: "DEPLOYER_PRIVATE_KEY must start with 0x",
          });
        }

        if (privateKey.length !== 66) {
          return error(500, {
            success: false,
            message: `DEPLOYER_PRIVATE_KEY must be 66 characters (0x + 64 hex chars), got ${privateKey.length}`,
          });
        }

        const account = privateKeyToAccount(privateKey as Hex);

        const walletClient = createWalletClient({
          account,
          chain,
          transport: http(body.rpcUrl),
        });

        const publicClient = createPublicClient({
          chain,
          transport: http(body.rpcUrl),
        });

        const hash = await walletClient.deployContract({
          abi: tokenContract.abi as any,
          bytecode: tokenContract.bytecode as Hex,
          args: [
            body.name,
            body.symbol,
            body.decimals,
            BigInt(body.initialSupply),
          ],
          gas: 5000000n,
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        if (!receipt.contractAddress) {
          return error(500, {
            success: false,
            message: "Contract deployment failed",
          });
        }

        const [deployment] = await db
          .insert(deployments)
          .values({
            tokenContractId: body.tokenContractId,
            contractAddress: receipt.contractAddress,
            chainId: body.chainId,
            deployerAddress: account.address,
            transactionHash: hash,
            initialSupply: body.initialSupply,
            gasUsed: receipt.gasUsed.toString(),
            status: "confirmed",
          })
          .returning();

        return {
          success: true,
          data: deployment,
        };
      } catch (err: any) {
        console.error("Deployment error:", err);
        return {
          success: false,
          message: err.message || "Deployment failed",
          error: err.toString(),
        };
      }
    },
    {
      body: t.Object({
        tokenContractId: t.String(),
        name: t.String(),
        symbol: t.String(),
        decimals: t.Number({ minimum: 0, maximum: 255 }),
        initialSupply: t.String(),
        chainId: t.Number(),
        rpcUrl: t.String(),
      }),
    },
  )
  .get("/", async () => {
    const allDeployments = await db.select().from(deployments);
    return {
      success: true,
      data: allDeployments,
    };
  })
  .get("/with-details", async () => {
    const allDeployments = await db.select().from(deployments);

    // Enrich each deployment with token details from blockchain
    const deploymentsWithDetails = await Promise.all(
      allDeployments.map(async (deployment) => {
        try {
          const chain = chainMap[deployment.chainId];
          if (!chain) {
            return deployment;
          }

          const rpcUrl = getRpcUrl(deployment.chainId);
          const publicClient = createPublicClient({
            chain,
            transport: http(rpcUrl),
          });

          // Get token contract details
          const [tokenContract] = await db
            .select()
            .from(tokenContracts)
            .where(eq(tokenContracts.id, deployment.tokenContractId));

          if (!tokenContract) {
            return deployment;
          }

          // Read token details from blockchain
          const [name, symbol, decimals, totalSupply, paused] =
            await Promise.all([
              publicClient.readContract({
                address: deployment.contractAddress as Hex,
                abi: tokenContract.abi as any,
                functionName: "name",
              }),
              publicClient.readContract({
                address: deployment.contractAddress as Hex,
                abi: tokenContract.abi as any,
                functionName: "symbol",
              }),
              publicClient.readContract({
                address: deployment.contractAddress as Hex,
                abi: tokenContract.abi as any,
                functionName: "decimals",
              }),
              publicClient.readContract({
                address: deployment.contractAddress as Hex,
                abi: tokenContract.abi as any,
                functionName: "totalSupply",
              }),
              publicClient.readContract({
                address: deployment.contractAddress as Hex,
                abi: tokenContract.abi as any,
                functionName: "paused",
              }),
            ]);

          return {
            ...deployment,
            tokenDetails: {
              name,
              symbol,
              decimals: Number(decimals),
              totalSupply: totalSupply.toString(),
              paused,
            },
          };
        } catch (err) {
          console.error(
            `Failed to fetch token details for ${deployment.contractAddress}:`,
            err,
          );
          return deployment;
        }
      }),
    );

    return {
      success: true,
      data: deploymentsWithDetails,
    };
  })
  .get(
    "/:id",
    async ({ params: { id }, error }) => {
      const [deployment] = await db
        .select()
        .from(deployments)
        .where(eq(deployments.id, id));

      if (!deployment) {
        return error(404, {
          success: false,
          message: "Deployment not found",
        });
      }

      return {
        success: true,
        data: deployment,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .get(
    "/by-address/:address",
    async ({ params: { address }, error }) => {
      const [deployment] = await db
        .select()
        .from(deployments)
        .where(eq(deployments.contractAddress, address));

      if (!deployment) {
        return error(404, {
          success: false,
          message: "Deployment not found",
        });
      }

      return {
        success: true,
        data: deployment,
      };
    },
    {
      params: t.Object({
        address: t.String(),
      }),
    },
  );
