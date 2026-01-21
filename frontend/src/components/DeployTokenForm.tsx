import { useState, useEffect } from "react";
import { api } from "../api";
import type { TokenContract } from "../types";

interface DeployTokenFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeployTokenForm({ onSuccess, onCancel }: DeployTokenFormProps) {
  const [tokenContracts, setTokenContracts] = useState<TokenContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    tokenContractId: "",
    name: "",
    symbol: "",
    decimals: 18,
    initialSupply: "",
    chainId: 31337,
    rpcUrl: "http://127.0.0.1:8545",
  });

  useEffect(() => {
    loadTokenContracts();
  }, []);

  async function loadTokenContracts() {
    try {
      setLoading(true);
      const contracts = await api.getTokenContracts();
      setTokenContracts(contracts);
      if (contracts.length > 0) {
        setFormData((prev) => ({ ...prev, tokenContractId: contracts[0].id }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contracts");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      console.log("Submitting deployment with data:", formData);
      await api.deployToken(formData);
      onSuccess();
    } catch (err) {
      console.error("Deployment error:", err);
      setError(err instanceof Error ? err.message : "Deployment failed");
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "decimals" || name === "chainId" ? parseInt(value) : value,
    }));
  }

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal">
          <div className="loading">Loading contracts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Deploy New Token</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {tokenContracts.length > 0 ? (
            <div className="form-group">
              <label htmlFor="tokenContractId">Token Contract Template</label>
              <select
                id="tokenContractId"
                name="tokenContractId"
                value={formData.tokenContractId}
                onChange={handleChange}
              >
                {tokenContracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.name}{" "}
                    {contract.symbol
                      ? `(${contract.symbol})`
                      : contract.version
                        ? `(v${contract.version})`
                        : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="form-group">
              <div className="error-message">
                No token contract templates available. You'll need to create one
                first or the deployment will fail.
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Token Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., My Token"
            />
          </div>

          <div className="form-group">
            <label htmlFor="symbol">Token Symbol</label>
            <input
              type="text"
              id="symbol"
              name="symbol"
              value={formData.symbol}
              onChange={handleChange}
              placeholder="e.g., MTK"
            />
          </div>

          <div className="form-group">
            <label htmlFor="decimals">Decimals</label>
            <input
              type="number"
              id="decimals"
              name="decimals"
              value={formData.decimals}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="initialSupply">Initial Supply</label>
            <input
              type="text"
              id="initialSupply"
              name="initialSupply"
              value={formData.initialSupply}
              onChange={handleChange}
              placeholder="1000000000000000000"
            />
            <small className="form-hint">
              Enter the total supply (e.g., 1000000000000000000 for 1 token with
              18 decimals)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="chainId">Chain</label>
            <select
              id="chainId"
              name="chainId"
              value={formData.chainId}
              onChange={handleChange}
            >
              <option value={1}>Ethereum Mainnet</option>
              <option value={11155111}>Sepolia Testnet</option>
              <option value={31337}>Localhost</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="rpcUrl">RPC URL</label>
            <input
              type="text"
              id="rpcUrl"
              name="rpcUrl"
              value={formData.rpcUrl}
              onChange={handleChange}
              placeholder="http://127.0.0.1:8545"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Deploying..." : "Deploy Token"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
