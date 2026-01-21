import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api";
import type {
  Deployment,
  TokenDetails,
  AllowlistAddress,
  Transaction,
} from "../types";

const chainNames: Record<number, string> = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia Testnet",
  31337: "Localhost",
};

const rpcUrls: Record<number, string> = {
  1: "https://eth.llamarpc.com",
  11155111: "https://rpc.sepolia.org",
  31337: "http://localhost:8545",
};

export function TokenDetailPage() {
  const { address } = useParams<{ address: string }>();
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [tokenDetails, setTokenDetails] = useState<TokenDetails | null>(null);
  const [balanceHolders, setBalanceHolders] = useState<
    Array<{ address: string; balance: string; isAllowlisted: boolean }>
  >([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showAddAllowlist, setShowAddAllowlist] = useState(false);
  const [newAllowlistAddress, setNewAllowlistAddress] = useState("");
  const [mintingAddress, setMintingAddress] = useState<string | null>(null);
  const [mintAmount, setMintAmount] = useState("");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (address) {
      loadTokenData(address);
    }
  }, [address]);

  useEffect(() => {
    if (showErrorModal) {
      const timer = setTimeout(() => {
        setShowErrorModal(false);
      }, 5000); // Auto-dismiss after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [showErrorModal]);

  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000); // Auto-dismiss after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  // Poll for transaction updates every 3 seconds if there are pending transactions
  useEffect(() => {
    const hasPendingTransactions = transactions.some(
      (tx) => tx.status === "pending",
    );

    if (hasPendingTransactions && address && deployment) {
      const interval = setInterval(async () => {
        try {
          const txns = await api.getTransactionsByDeployment(deployment.id);
          setTransactions(txns);

          // If all transactions are now confirmed/failed, update token details
          const stillPending = txns.some((tx) => tx.status === "pending");
          if (!stillPending) {
            const rpcUrl = rpcUrls[deployment.chainId];
            const details = await api.getTokenDetails(address, rpcUrl);
            setTokenDetails(details);
          }
        } catch (err) {
          console.error("Failed to poll transactions:", err);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [transactions, address, deployment]);

  async function loadTokenData(tokenAddress: string) {
    try {
      setLoading(true);
      setError(null);

      const deploymentData = await api.getDeploymentByAddress(tokenAddress);
      setDeployment(deploymentData);

      const rpcUrl = rpcUrls[deploymentData.chainId];

      const [details, holders, txns] = await Promise.all([
        api.getTokenDetails(tokenAddress, rpcUrl),
        api.getBalanceHolders(tokenAddress, rpcUrl),
        api.getTransactionsByDeployment(deploymentData.id),
      ]);

      setTokenDetails(details);
      setBalanceHolders(holders);
      setTransactions(txns);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load token data",
      );
    } finally {
      setLoading(false);
    }
  }

  async function refreshTransactionsAndTokenDetails() {
    if (!address || !deployment) return;

    try {
      const rpcUrl = rpcUrls[deployment.chainId];

      const [details, txns] = await Promise.all([
        api.getTokenDetails(address, rpcUrl),
        api.getTransactionsByDeployment(deployment.id),
      ]);

      setTokenDetails(details);
      setTransactions(txns);
    } catch (err) {
      console.error("Failed to refresh:", err);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading token details...</div>
      </div>
    );
  }

  if (error || !deployment || !tokenDetails) {
    return (
      <div className="container">
        <div className="error">Error: {error || "Token not found"}</div>
        <Link to="/" className="back-link">
          ← Back to Tokens
        </Link>
      </div>
    );
  }

  const formatBalance = (balance: string, decimals: number) => {
    const value = BigInt(balance);
    const divisor = BigInt(10 ** decimals);
    const integerPart = value / divisor;
    const remainder = value % divisor;
    const decimalPart = remainder.toString().padStart(decimals, "0");
    return `${integerPart}.${decimalPart}`;
  };

  async function handlePauseToggle() {
    if (!address || !deployment || !tokenDetails) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const rpcUrl = rpcUrls[deployment.chainId];
      if (tokenDetails.paused) {
        await api.unpauseToken(address, rpcUrl, "DEPLOYER");
        setActionSuccess("Token unpaused successfully!");
        setShowSuccessToast(true);
        // Optimistically update UI
        setTokenDetails({ ...tokenDetails, paused: false });
      } else {
        await api.pauseToken(address, rpcUrl, "DEPLOYER");
        setActionSuccess("Token paused successfully!");
        setShowSuccessToast(true);
        // Optimistically update UI
        setTokenDetails({ ...tokenDetails, paused: true });
      }
      // Trigger immediate transaction refresh (don't await)
      api
        .getTransactionsByDeployment(deployment.id)
        .then(setTransactions)
        .catch(console.error);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Operation failed");
      setShowErrorModal(true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddToAllowlist(addressToAdd?: string) {
    const targetAddress = addressToAdd || newAllowlistAddress;
    if (!address || !deployment || !targetAddress) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const rpcUrl = rpcUrls[deployment.chainId];
      await api.addToAllowlist(address, rpcUrl, "DEPLOYER", targetAddress);
      setActionSuccess("Address added to allowlist successfully!");
      setShowSuccessToast(true);
      setNewAllowlistAddress("");
      setShowAddAllowlist(false);

      // Optimistically update the balance holders list
      setBalanceHolders((holders) =>
        holders.map((h) =>
          h.address === targetAddress ? { ...h, isAllowlisted: true } : h,
        ),
      );

      // Trigger immediate transaction refresh (don't await)
      api
        .getTransactionsByDeployment(deployment.id)
        .then(setTransactions)
        .catch(console.error);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to add to allowlist",
      );
      setShowErrorModal(true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemoveFromAllowlist(addressToRemove: string) {
    if (!address || !deployment) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const rpcUrl = rpcUrls[deployment.chainId];
      await api.removeFromAllowlist(
        address,
        rpcUrl,
        "DEPLOYER",
        addressToRemove,
      );
      setActionSuccess("Address removed from allowlist successfully!");
      setShowSuccessToast(true);

      // Optimistically update the balance holders list
      setBalanceHolders((holders) =>
        holders.map((h) =>
          h.address === addressToRemove ? { ...h, isAllowlisted: false } : h,
        ),
      );

      // Trigger immediate transaction refresh (don't await)
      api
        .getTransactionsByDeployment(deployment.id)
        .then(setTransactions)
        .catch(console.error);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to remove from allowlist",
      );
      setShowErrorModal(true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMint(e: React.FormEvent, toAddress: string) {
    e.preventDefault();
    if (!address || !deployment || !mintAmount || !tokenDetails) return;

    setActionLoading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const rpcUrl = rpcUrls[deployment.chainId];
      // Convert amount to wei based on token decimals
      // Handle decimal amounts properly by splitting into integer and decimal parts
      const [integerPart, decimalPart = ""] = mintAmount.split(".");
      const paddedDecimal = decimalPart
        .padEnd(tokenDetails.decimals, "0")
        .slice(0, tokenDetails.decimals);
      const amountInWei = (
        BigInt(integerPart) * BigInt(10 ** tokenDetails.decimals) +
        BigInt(paddedDecimal || "0")
      ).toString();

      await api.mintTokens(address, rpcUrl, "DEPLOYER", toAddress, amountInWei);
      setActionSuccess(
        `Minted ${mintAmount} tokens to ${toAddress.slice(0, 6)}...${toAddress.slice(-4)} successfully!`,
      );
      setShowSuccessToast(true);
      setMintAmount("");
      setMintingAddress(null);

      // Optimistically update the balance
      setBalanceHolders((holders) =>
        holders.map((h) => {
          if (h.address === toAddress) {
            const newBalance = (
              BigInt(h.balance) + BigInt(amountInWei)
            ).toString();
            return { ...h, balance: newBalance };
          }
          return h;
        }),
      );

      // Trigger immediate transaction refresh (don't await)
      api
        .getTransactionsByDeployment(deployment.id)
        .then(setTransactions)
        .catch(console.error);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to mint tokens",
      );
      setShowErrorModal(true);
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="container">
      <Link to="/" className="back-link">
        ← Back to Tokens
      </Link>

      <header className="token-detail-header">
        <h1>{tokenDetails.name}</h1>
        <div className="token-badges">
          <span className="badge">{tokenDetails.symbol}</span>
          <span
            className={`badge ${tokenDetails.paused ? "paused" : "active"}`}
          >
            {tokenDetails.paused ? "Paused" : "Active"}
          </span>
          <button
            onClick={handlePauseToggle}
            disabled={actionLoading}
            className={tokenDetails.paused ? "btn-primary" : "btn-secondary"}
          >
            {actionLoading
              ? "Processing..."
              : tokenDetails.paused
                ? "Unpause Token"
                : "Pause Token"}
          </button>
        </div>
      </header>

      <div className="details-grid">
        <section className="detail-card">
          <h2>Contract Information</h2>
          <div className="detail-rows">
            <div className="detail-row">
              <span className="label">Address:</span>
              <span className="value address">{address}</span>
            </div>
            <div className="detail-row">
              <span className="label">Chain:</span>
              <span className="value">
                {chainNames[deployment.chainId] ||
                  `Chain ${deployment.chainId}`}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Deployer:</span>
              <span className="value address">
                {deployment.deployerAddress}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Owner:</span>
              <span className="value address">{tokenDetails.owner}</span>
            </div>
            <div className="detail-row">
              <span className="label">Deployment Tx:</span>
              <span className="value hash">{deployment.transactionHash}</span>
            </div>
          </div>
        </section>

        <section className="detail-card">
          <h2>Token Details</h2>
          <div className="detail-rows">
            <div className="detail-row">
              <span className="label">Name:</span>
              <span className="value">{tokenDetails.name}</span>
            </div>
            <div className="detail-row">
              <span className="label">Symbol:</span>
              <span className="value">{tokenDetails.symbol}</span>
            </div>
            <div className="detail-row">
              <span className="label">Decimals:</span>
              <span className="value">{tokenDetails.decimals}</span>
            </div>
            <div className="detail-row">
              <span className="label">Total Supply:</span>
              <span className="value">
                {formatBalance(tokenDetails.totalSupply, tokenDetails.decimals)}{" "}
                {tokenDetails.symbol}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Status:</span>
              <span
                className={`value ${tokenDetails.paused ? "error" : "success"}`}
              >
                {tokenDetails.paused ? "Paused" : "Active"}
              </span>
            </div>
          </div>
        </section>
      </div>

      <section className="detail-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ margin: 0 }}>
            Balance Holders ({balanceHolders.length})
          </h2>
          <button
            onClick={() => setShowAddAllowlist(!showAddAllowlist)}
            className="btn-primary"
            disabled={actionLoading}
          >
            {showAddAllowlist ? "Cancel" : "Add Address"}
          </button>
        </div>

        {showAddAllowlist && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAddToAllowlist();
            }}
            className="allowlist-form"
          >
            <div className="form-group">
              <input
                type="text"
                value={newAllowlistAddress}
                onChange={(e) => setNewAllowlistAddress(e.target.value)}
                placeholder="0x..."
                required
                disabled={actionLoading}
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={actionLoading || !newAllowlistAddress}
            >
              {actionLoading ? "Adding..." : "Add to Allowlist"}
            </button>
          </form>
        )}

        {balanceHolders.length === 0 ? (
          <p className="empty-message">No balance holders</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Balance</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {balanceHolders.map((holder) => (
                  <tr
                    key={holder.address}
                    className={
                      !holder.isAllowlisted ? "non-allowlisted-row" : ""
                    }
                  >
                    <td className="address">{holder.address}</td>
                    <td>
                      {formatBalance(holder.balance, tokenDetails.decimals)}{" "}
                      {tokenDetails.symbol}
                    </td>
                    <td>
                      <span
                        className={`status-badge ${holder.isAllowlisted ? "active" : "inactive"}`}
                      >
                        {holder.isAllowlisted
                          ? "Allowlisted"
                          : "Not Allowlisted"}
                      </span>
                    </td>
                    <td>
                      {!holder.isAllowlisted ? (
                        <button
                          onClick={() => handleAddToAllowlist(holder.address)}
                          className="btn-secondary"
                          disabled={actionLoading}
                          style={{
                            padding: "0.5rem 1rem",
                            fontSize: "0.9rem",
                          }}
                        >
                          Add to Allowlist
                        </button>
                      ) : mintingAddress === holder.address ? (
                        <form
                          onSubmit={(e) => handleMint(e, holder.address)}
                          style={{
                            display: "flex",
                            gap: "0.5rem",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="number"
                            value={mintAmount}
                            onChange={(e) => setMintAmount(e.target.value)}
                            placeholder="Amount"
                            step="any"
                            min="0"
                            required
                            disabled={actionLoading}
                            style={{ width: "100px", padding: "0.25rem" }}
                          />
                          <button
                            type="submit"
                            className="btn-primary"
                            disabled={actionLoading || !mintAmount}
                            style={{
                              padding: "0.25rem 0.75rem",
                              fontSize: "0.85rem",
                            }}
                          >
                            {actionLoading ? "Minting..." : "Mint"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setMintingAddress(null);
                              setMintAmount("");
                            }}
                            className="btn-secondary"
                            disabled={actionLoading}
                            style={{
                              padding: "0.25rem 0.75rem",
                              fontSize: "0.85rem",
                            }}
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => setMintingAddress(holder.address)}
                            className="btn-primary"
                            disabled={actionLoading}
                            style={{
                              padding: "0.5rem 1rem",
                              fontSize: "0.9rem",
                            }}
                          >
                            Mint
                          </button>
                          <button
                            onClick={() =>
                              handleRemoveFromAllowlist(holder.address)
                            }
                            className="btn-danger"
                            disabled={actionLoading}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="detail-card">
        <h2>Transaction History ({transactions.length})</h2>
        {transactions.length === 0 ? (
          <p className="empty-message">No transactions yet</p>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Function</th>
                  <th>From</th>
                  <th>Status</th>
                  <th>Gas Used</th>
                  <th>Date</th>
                  <th>Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {[...transactions]
                  .sort(
                    (a, b) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime(),
                  )
                  .map((tx) => (
                    <tr
                      key={tx.id}
                      onClick={() => setSelectedTransaction(tx)}
                      style={{ cursor: "pointer" }}
                      className="clickable-row"
                    >
                      <td>
                        <span className="function-name">{tx.functionName}</span>
                      </td>
                      <td className="address">
                        {tx.fromAddress.slice(0, 6)}...
                        {tx.fromAddress.slice(-4)}
                      </td>
                      <td>
                        <span className={`status-badge ${tx.status}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td>
                        {tx.gasUsed
                          ? parseInt(tx.gasUsed).toLocaleString()
                          : "N/A"}
                      </td>
                      <td>{new Date(tx.createdAt).toLocaleString()}</td>
                      <td className="hash">
                        {tx.transactionHash.slice(0, 10)}...
                        {tx.transactionHash.slice(-8)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedTransaction && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedTransaction(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transaction Details</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedTransaction(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-rows">
                <div className="detail-row">
                  <span className="label">Transaction ID:</span>
                  <span className="value">{selectedTransaction.id}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Transaction Hash:</span>
                  <span className="value hash">
                    {selectedTransaction.transactionHash}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Function Name:</span>
                  <span className="value function-name">
                    {selectedTransaction.functionName}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">From Address:</span>
                  <span className="value address">
                    {selectedTransaction.fromAddress}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span
                    className={`value status-badge ${selectedTransaction.status}`}
                  >
                    {selectedTransaction.status}
                  </span>
                </div>
                {selectedTransaction.gasUsed && (
                  <div className="detail-row">
                    <span className="label">Gas Used:</span>
                    <span className="value">
                      {parseInt(selectedTransaction.gasUsed).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Created At:</span>
                  <span className="value">
                    {new Date(selectedTransaction.createdAt).toLocaleString()}
                  </span>
                </div>
                {selectedTransaction.parameters && (
                  <div className="detail-row">
                    <span className="label">Parameters:</span>
                    <span className="value">
                      <pre
                        style={{
                          margin: 0,
                          padding: "0.5rem",
                          backgroundColor: "var(--bg-secondary)",
                          borderRadius: "4px",
                          overflow: "auto",
                          maxHeight: "200px",
                        }}
                      >
                        {JSON.stringify(
                          selectedTransaction.parameters,
                          null,
                          2,
                        )}
                      </pre>
                    </span>
                  </div>
                )}
                {selectedTransaction.errorMessage && (
                  <div className="detail-row">
                    <span className="label">Error Message:</span>
                    <span className="value error" style={{ color: "#ef4444" }}>
                      {selectedTransaction.errorMessage}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && actionError && (
        <div className="toast error-toast">
          <div className="toast-icon">⚠️</div>
          <div className="toast-content">
            <div className="toast-title">Error</div>
            <div className="toast-message">{actionError}</div>
          </div>
          <button
            className="toast-close"
            onClick={() => setShowErrorModal(false)}
          >
            ×
          </button>
        </div>
      )}

      {showSuccessToast && actionSuccess && (
        <div className="toast success-toast">
          <div className="toast-icon">✓</div>
          <div className="toast-content">
            <div className="toast-title">Success</div>
            <div className="toast-message">{actionSuccess}</div>
          </div>
          <button
            className="toast-close"
            onClick={() => setShowSuccessToast(false)}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
