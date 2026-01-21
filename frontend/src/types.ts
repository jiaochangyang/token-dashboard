export interface TokenContract {
  id: string;
  name: string;
  version?: string;
  symbol: string;
  decimals: number;
  bytecode: string;
  abi: unknown[];
  createdAt: string;
  updatedAt: string;
}

export interface Deployment {
  id: string;
  tokenContractId: string;
  contractAddress: string;
  chainId: number;
  deployerAddress: string;
  transactionHash: string;
  initialSupply: string;
  gasUsed?: string;
  status: string;
  createdAt: string;
  deployedAt: string;
}

export interface Transaction {
  id: string;
  deploymentId: string;
  transactionHash: string;
  functionName: string;
  parameters: unknown[];
  fromAddress: string;
  status: string;
  gasUsed: string;
  errorMessage?: string;
  createdAt: string;
}

export interface TokenDetails {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  owner: string;
  paused: boolean;
}

export interface AllowlistAddress {
  address: string;
  balance: string;
}

export interface DeploymentWithDetails extends Deployment {
  tokenDetails?: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    paused: boolean;
  };
}
