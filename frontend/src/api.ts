import type {
  Deployment,
  DeploymentWithDetails,
  Transaction,
  TokenDetails,
  TokenContract,
} from "./types";

const API_BASE_URL = "http://localhost:3000";

export const api = {
  // Token Contracts
  async getTokenContracts(): Promise<TokenContract[]> {
    const response = await fetch(`${API_BASE_URL}/contracts`);
    const data = await response.json();
    return data.data;
  },

  async getTokenContract(id: string): Promise<TokenContract> {
    const response = await fetch(`${API_BASE_URL}/contracts/${id}`);
    const data = await response.json();
    return data.data;
  },

  // Deployments
  async deployToken(params: {
    tokenContractId: string;
    name: string;
    symbol: string;
    decimals: number;
    initialSupply: string;
    chainId: number;
    rpcUrl: string;
  }): Promise<Deployment> {
    try {
      const response = await fetch(`${API_BASE_URL}/deployments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      console.log("Backend response:", data);

      if (!response.ok || !data.success) {
        const errorMessage =
          data.message ||
          data.error ||
          JSON.stringify(data) ||
          "Deployment failed";
        console.error("Backend error:", errorMessage);
        throw new Error(errorMessage);
      }
      return data.data;
    } catch (err) {
      console.error("API call error:", err);
      throw err;
    }
  },

  async getDeployments(): Promise<Deployment[]> {
    const response = await fetch(`${API_BASE_URL}/deployments`);
    const data = await response.json();
    return data.data;
  },

  async getDeploymentsWithDetails(): Promise<DeploymentWithDetails[]> {
    const response = await fetch(`${API_BASE_URL}/deployments/with-details`);
    const data = await response.json();
    return data.data;
  },

  async getDeployment(id: string): Promise<Deployment> {
    const response = await fetch(`${API_BASE_URL}/deployments/${id}`);
    const data = await response.json();
    return data.data;
  },

  async getDeploymentByAddress(address: string): Promise<Deployment> {
    const response = await fetch(
      `${API_BASE_URL}/deployments/by-address/${address}`,
    );
    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `Failed to fetch deployment: ${response.status} - ${text}`,
      );
    }
    const data = await response.json();
    return data.data;
  },

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    const response = await fetch(`${API_BASE_URL}/transactions`);
    const data = await response.json();
    return data.data;
  },

  async getTransactionsByDeployment(
    deploymentId: string,
  ): Promise<Transaction[]> {
    const response = await fetch(
      `${API_BASE_URL}/transactions/by-deployment/${deploymentId}`,
    );
    const data = await response.json();
    return data.data;
  },

  // Token read operations
  async getTokenName(address: string, rpcUrl: string): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}/tokens/${address}/name?rpcUrl=${encodeURIComponent(
        rpcUrl,
      )}`,
    );
    const data = await response.json();
    return data.data.result;
  },

  async getTokenSymbol(address: string, rpcUrl: string): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}/tokens/${address}/symbol?rpcUrl=${encodeURIComponent(
        rpcUrl,
      )}`,
    );
    const data = await response.json();
    return data.data.result;
  },

  async getTokenDecimals(address: string, rpcUrl: string): Promise<number> {
    const response = await fetch(
      `${API_BASE_URL}/tokens/${address}/decimals?rpcUrl=${encodeURIComponent(
        rpcUrl,
      )}`,
    );
    const data = await response.json();
    return data.data.result;
  },

  async getTotalSupply(address: string, rpcUrl: string): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}/tokens/${address}/total-supply?rpcUrl=${encodeURIComponent(
        rpcUrl,
      )}`,
    );
    const data = await response.json();
    return data.data.result;
  },

  async getOwner(address: string, rpcUrl: string): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}/tokens/${address}/owner?rpcUrl=${encodeURIComponent(
        rpcUrl,
      )}`,
    );
    const data = await response.json();
    return data.data.result;
  },

  async isPaused(address: string, rpcUrl: string): Promise<boolean> {
    const response = await fetch(
      `${API_BASE_URL}/tokens/${address}/paused?rpcUrl=${encodeURIComponent(
        rpcUrl,
      )}`,
    );
    const data = await response.json();
    return data.data.result;
  },

  async getBalanceOf(
    address: string,
    account: string,
    rpcUrl: string,
  ): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}/tokens/${address}/balance-of/${account}?rpcUrl=${encodeURIComponent(
        rpcUrl,
      )}`,
    );
    const data = await response.json();
    return data.data.result;
  },

  async getAllowlistLength(address: string, rpcUrl: string): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}/tokens/${address}/allowlist-length?rpcUrl=${encodeURIComponent(
        rpcUrl,
      )}`,
    );
    const data = await response.json();
    return data.data.result;
  },

  async getBalanceHolders(
    address: string,
    rpcUrl: string,
  ): Promise<
    Array<{ address: string; balance: string; isAllowlisted: boolean }>
  > {
    const response = await fetch(
      `${API_BASE_URL}/tokens/${address}/balance-holders?rpcUrl=${encodeURIComponent(
        rpcUrl,
      )}`,
    );
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to get balance holders");
    }
    return data.data;
  },

  async getAllowlistAddress(
    address: string,
    index: string,
    rpcUrl: string,
  ): Promise<string> {
    const response = await fetch(
      `${API_BASE_URL}/tokens/${address}/allowlist-address/${index}?rpcUrl=${encodeURIComponent(
        rpcUrl,
      )}`,
    );
    const data = await response.json();
    return data.data.result;
  },

  async isAllowlisted(
    address: string,
    account: string,
    rpcUrl: string,
  ): Promise<boolean> {
    const response = await fetch(
      `${API_BASE_URL}/tokens/${address}/is-allowlisted/${account}?rpcUrl=${encodeURIComponent(
        rpcUrl,
      )}`,
    );
    const data = await response.json();
    return data.data.result;
  },

  // Composite function to get all token details
  async getTokenDetails(
    address: string,
    rpcUrl: string,
  ): Promise<TokenDetails> {
    const [name, symbol, decimals, totalSupply, owner, paused] =
      await Promise.all([
        this.getTokenName(address, rpcUrl),
        this.getTokenSymbol(address, rpcUrl),
        this.getTokenDecimals(address, rpcUrl),
        this.getTotalSupply(address, rpcUrl),
        this.getOwner(address, rpcUrl),
        this.isPaused(address, rpcUrl),
      ]);

    return {
      name,
      symbol,
      decimals,
      totalSupply,
      owner,
      paused,
    };
  },

  // Get all allowlisted addresses with their balances
  async getAllowlistedAddresses(
    address: string,
    rpcUrl: string,
  ): Promise<Array<{ address: string; balance: string }>> {
    const length = await this.getAllowlistLength(address, rpcUrl);
    const count = parseInt(length);

    if (count === 0) {
      return [];
    }

    const addresses = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        this.getAllowlistAddress(address, i.toString(), rpcUrl),
      ),
    );

    const balances = await Promise.all(
      addresses.map((addr) => this.getBalanceOf(address, addr, rpcUrl)),
    );

    return addresses.map((addr, i) => ({
      address: addr,
      balance: balances[i],
    }));
  },

  // Token write operations
  async pauseToken(
    address: string,
    rpcUrl: string,
    account: string,
  ): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/tokens/${address}/pause`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rpcUrl, account }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to pause token");
    }
    return data.data;
  },

  async unpauseToken(
    address: string,
    rpcUrl: string,
    account: string,
  ): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/tokens/${address}/unpause`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rpcUrl, account }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to unpause token");
    }
    return data.data;
  },

  async addToAllowlist(
    address: string,
    rpcUrl: string,
    signer: string,
    account: string,
  ): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/tokens/${address}/add-to-allowlist`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rpcUrl, signer, account }),
      },
    );
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to add to allowlist");
    }
    return data.data;
  },

  async removeFromAllowlist(
    address: string,
    rpcUrl: string,
    signer: string,
    account: string,
  ): Promise<any> {
    const response = await fetch(
      `${API_BASE_URL}/tokens/${address}/remove-from-allowlist`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rpcUrl, signer, account }),
      },
    );
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to remove from allowlist");
    }
    return data.data;
  },

  async mintTokens(
    address: string,
    rpcUrl: string,
    account: string,
    to: string,
    amount: string,
  ): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/tokens/${address}/mint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rpcUrl, account, to, amount }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to mint tokens");
    }
    return data.data;
  },
};
