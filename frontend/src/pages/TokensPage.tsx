import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { DeploymentWithDetails } from "../types";
import { DeployTokenForm } from "../components/DeployTokenForm";

const chainNames: Record<number, string> = {
  1: "Ethereum Mainnet",
  11155111: "Sepolia Testnet",
  31337: "Localhost",
};

export function TokensPage() {
  const [deployments, setDeployments] = useState<DeploymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeployForm, setShowDeployForm] = useState(false);

  useEffect(() => {
    loadDeployments();
  }, []);

  async function loadDeployments() {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDeploymentsWithDetails();
      console.log("Loaded deployments with details:", data);
      setDeployments(data);
    } catch (err) {
      console.error("Failed to load deployments:", err);
      setError(err instanceof Error ? err.message : "Failed to load tokens");
    } finally {
      setLoading(false);
    }
  }

  function handleDeploySuccess() {
    setShowDeployForm(false);
    loadDeployments();
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading tokens...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">Error: {error}</div>
        <button onClick={loadDeployments}>Retry</button>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="page-header">
        <h1>Token Dashboard</h1>
        <p className="subtitle">View and manage your deployed ERC20 tokens</p>
      </header>

      <div className="tokens-grid">
        <button
          className="deploy-token-card"
          onClick={() => setShowDeployForm(true)}
        >
          <div className="deploy-icon">+</div>
          <h3 className="deploy-title">Deploy New Token</h3>
          <p className="deploy-subtitle">Create a new ERC20 token</p>
        </button>

        {deployments.map((deployment) => {
          console.log(
            "Rendering deployment:",
            deployment.id,
            deployment.tokenDetails,
          );
          return (
            <Link
              key={deployment.id}
              to={`/token/${deployment.contractAddress}`}
              className="token-card"
            >
              <div className="token-card-header">
                <h3 className="token-name">
                  {deployment.tokenDetails?.name || "Loading..."}
                </h3>
                <span
                  className={`status-badge ${deployment.tokenDetails?.paused ? "paused" : "active"}`}
                >
                  {deployment.tokenDetails?.paused ? "Paused" : "Active"}
                </span>
              </div>

              <div className="token-card-body">
                <div className="token-info-row">
                  <span className="label">Symbol:</span>
                  <span className="value">
                    {deployment.tokenDetails?.symbol || "..."}
                  </span>
                </div>

                <div className="token-info-row">
                  <span className="label">Chain:</span>
                  <span className="value">
                    {chainNames[deployment.chainId] ||
                      `Chain ${deployment.chainId}`}
                  </span>
                </div>

                <div className="token-info-row">
                  <span className="label">Total Supply:</span>
                  <span className="value">
                    {deployment.tokenDetails?.totalSupply &&
                    deployment.tokenDetails?.decimals !== undefined
                      ? (() => {
                          const supply = BigInt(
                            deployment.tokenDetails.totalSupply,
                          );
                          const decimals = deployment.tokenDetails.decimals;
                          const divisor = BigInt(10 ** decimals);
                          const integerPart = supply / divisor;
                          const remainder = supply % divisor;

                          if (remainder === 0n) {
                            return integerPart.toLocaleString();
                          }

                          const decimalPart = remainder
                            .toString()
                            .padStart(decimals, "0");
                          // Remove trailing zeros
                          const trimmedDecimal = decimalPart.replace(/0+$/, "");
                          return trimmedDecimal
                            ? `${integerPart.toLocaleString()}.${trimmedDecimal}`
                            : integerPart.toLocaleString();
                        })()
                      : "..."}
                  </span>
                </div>

                <div className="token-info-row">
                  <span className="label">Address:</span>
                  <span className="value address">
                    {deployment.contractAddress.slice(0, 6)}...
                    {deployment.contractAddress.slice(-4)}
                  </span>
                </div>
              </div>

              <div className="token-card-footer">
                <span className="view-details">View Details →</span>
              </div>
            </Link>
          );
        })}
      </div>

      {showDeployForm && (
        <DeployTokenForm
          onSuccess={handleDeploySuccess}
          onCancel={() => setShowDeployForm(false)}
        />
      )}
    </div>
  );
}
