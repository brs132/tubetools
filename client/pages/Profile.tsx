import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAuthenticated, getUser } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api-client";
import { BalanceInfo, Transaction, Withdrawal } from "@shared/api";
import Layout from "@/components/Layout";
import {
  Wallet,
  TrendingUp,
  Calendar,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("paypal");
  const [withdrawing, setWithdrawing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }

    loadBalance();
    loadTransactions();

    // Refetch balance every 10 seconds to stay in sync with Feed
    const interval = setInterval(loadBalance, 10000);
    return () => clearInterval(interval);
  }, [navigate]);

  const loadBalance = async () => {
    if (isLoadingBalance) return;

    setIsLoadingBalance(true);
    try {
      const data = await apiGet<BalanceInfo>("/api/balance");
      setBalance(data);
      setError("");
    } catch (err) {
      console.error("Balance error:", err);
      setError(err instanceof Error ? err.message : "Failed to load balance");
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const loadTransactions = async () => {
    try {
      const data = await apiGet<Transaction[]>("/api/transactions");
      // Ensure amount is a number (DB might return it as string)
      const normalizedTransactions = data.map((tx) => ({
        ...tx,
        amount:
          typeof tx.amount === "string" ? parseFloat(tx.amount) : tx.amount,
      }));
      setTransactions(normalizedTransactions);
    } catch (err) {
      console.error("Transactions error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setWithdrawing(true);

    try {
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        setError("Please enter a valid amount");
        setWithdrawing(false);
        return;
      }

      await apiPost("/api/withdrawals", {
        amount,
        method: withdrawMethod,
      });

      setSuccessMessage(
        "Withdrawal request submitted! We'll review it and process it soon.",
      );
      setWithdrawAmount("");
      setShowWithdrawForm(false);

      setTimeout(() => {
        loadBalance();
        loadTransactions();
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process withdrawal",
      );
    } finally {
      setWithdrawing(false);
    }
  };

  if (!isAuthenticated()) {
    navigate("/");
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <div className="container px-4 py-6 md:py-8 flex items-center justify-center min-h-96">
          <p className="text-muted-foreground">Loading balance...</p>
        </div>
      </Layout>
    );
  }

  if (!balance) {
    return (
      <Layout>
        <div className="container px-4 py-6 md:py-8 flex items-center justify-center min-h-96">
          <p className="text-red-600">
            Failed to load balance. Please refresh.
          </p>
        </div>
      </Layout>
    );
  }

  const user = getUser();
  const votingDaysCount = balance.user.votingDaysCount || 0;
  const progressPercent = (votingDaysCount / 20) * 100;

  return (
    <Layout>
      <div className="container px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            {/* Balance Card */}
            <div className="card-base bg-green-600 p-6 text-white">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold opacity-90 mb-1">
                    YOUR BALANCE
                  </p>
                  <h2 className="text-5xl font-bold">
                    ${balance.user.balance.toFixed(2)}
                  </h2>
                </div>
                <Wallet className="h-8 w-8 opacity-80" />
              </div>
              <p className="text-sm opacity-80">Starting balance was $213.19</p>
            </div>

            {/* Withdrawal Eligibility */}
            <div className="card-base space-y-4">
              <h3 className="text-lg font-bold">Withdrawal Eligibility</h3>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Days voting:</span>
                  <span className="font-bold text-green-600">
                    {votingDaysCount} / 20 days
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-green-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  {balance.withdrawalEligible
                    ? "✓ You can withdraw now!"
                    : `You'll be able to withdraw in ${balance.daysUntilWithdrawal} day${
                        balance.daysUntilWithdrawal !== 1 ? "s" : ""
                      }`}
                </p>
              </div>

              {/* Withdraw Button or Form */}
              {!showWithdrawForm ? (
                <button
                  onClick={() => setShowWithdrawForm(true)}
                  disabled={
                    !balance.withdrawalEligible ||
                    balance.pendingWithdrawal !== null
                  }
                  className="w-full px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  <span>Request Withdrawal</span>
                </button>
              ) : (
                <form
                  onSubmit={handleWithdraw}
                  className="space-y-3 border-t border-border pt-4"
                >
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Amount (USD)
                    </label>
                    <div className="flex gap-2">
                      <span className="flex items-center px-3 bg-muted rounded-lg font-semibold">
                        $
                      </span>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        max={balance.user.balance}
                        className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Payout Method
                    </label>
                    <select
                      value={withdrawMethod}
                      onChange={(e) => setWithdrawMethod(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select a payment method...</option>
                      <optgroup label="Wallets & Payment Services">
                        <option value="paypal">PayPal</option>
                        <option value="stripe">Stripe</option>
                        <option value="skrill">Skrill</option>
                        <option value="neteller">Neteller</option>
                        <option value="wise">Wise (TransferWise)</option>
                      </optgroup>
                      <optgroup label="Bank & Wire Transfers">
                        <option value="bank-transfer">Bank Transfer</option>
                        <option value="ach">ACH Transfer (US)</option>
                        <option value="sepa">SEPA Transfer (EU)</option>
                        <option value="swift">SWIFT Wire</option>
                      </optgroup>
                      <optgroup label="Cryptocurrencies">
                        <option value="bitcoin">Bitcoin (BTC)</option>
                        <option value="ethereum">Ethereum (ETH)</option>
                        <option value="usdc">USD Coin (USDC)</option>
                        <option value="usdt">Tether (USDT)</option>
                        <option value="monero">Monero (XMR)</option>
                      </optgroup>
                      <optgroup label="Mobile Payments">
                        <option value="apple-pay">Apple Pay</option>
                        <option value="google-pay">Google Pay</option>
                        <option value="samsung-pay">Samsung Pay</option>
                      </optgroup>
                      <optgroup label="Regional Services">
                        <option value="alipay">Alipay (China)</option>
                        <option value="wechat">WeChat Pay (China)</option>
                        <option value="brl">PIX (Brazil)</option>
                        <option value="upi">UPI (India)</option>
                        <option value="truemoney">TrueMoney (Thailand)</option>
                      </optgroup>
                      <optgroup label="Other Methods">
                        <option value="amazon-gift">Amazon Gift Card</option>
                        <option value="prepaid-card">Prepaid Card</option>
                        <option value="check">Check by Mail</option>
                      </optgroup>
                    </select>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Withdrawals are processed after manual review.
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={withdrawing}
                      className="flex-1 px-6 py-3 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {withdrawing ? "Processing..." : "Submit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWithdrawForm(false)}
                      className="flex-1 px-6 py-3 rounded-lg border border-border bg-background text-foreground font-semibold hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {balance.pendingWithdrawal && (
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200 text-sm flex gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">
                      Withdrawal pending: $
                      {(typeof balance.pendingWithdrawal.amount === "string"
                        ? parseFloat(balance.pendingWithdrawal.amount)
                        : balance.pendingWithdrawal.amount
                      ).toFixed(2)}
                    </p>
                    <p className="text-xs opacity-80">
                      Your request is under review
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-900 dark:text-green-200 text-sm flex gap-2">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <p>{successMessage}</p>
                </div>
              )}
            </div>

            {/* Recent Transactions */}
            <div className="card-base space-y-4">
              <h3 className="text-lg font-bold">Recent Transactions</h3>

              {transactions.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-semibold">
                          {tx.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-bold ${
                            tx.type === "credit" ||
                            tx.type === "withdrawal_reversal"
                              ? "text-accent"
                              : "text-foreground"
                          }`}
                        >
                          {tx.type === "credit" ||
                          tx.type === "withdrawal_reversal"
                            ? "+"
                            : "-"}
                          ${tx.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {tx.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No transactions yet. Start watching videos!
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-1 space-y-4">
            {/* User Info */}
            <div className="card-base space-y-3">
              <h3 className="font-bold">User Info</h3>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  NAME
                </p>
                <p className="font-semibold">{user?.name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  EMAIL
                </p>
                <p className="font-semibold text-sm break-all">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  MEMBER SINCE
                </p>
                <p className="font-semibold text-sm">
                  {new Date(user?.createdAt || "").toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="card-base space-y-3">
              <h3 className="font-bold">Stats</h3>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                <TrendingUp className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    EARNINGS
                  </p>
                  <p className="font-bold">
                    ${(balance.user.balance - 213.19).toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                <span className="text-xl">🔥</span>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    VOTING STREAK
                  </p>
                  <p className="font-bold text-orange-600 dark:text-orange-400">
                    {balance.user.votingStreak || 0} days
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
