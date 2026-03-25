"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  Users,
  Play,
  Square,
  Pause,
  PlayCircle,
  Radio,
  Loader2,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Newspaper,
  Calendar,
  CheckSquare,
  X,
  Plus,
  Minus,
  Zap,
  Award,
  Wallet,
  Edit2,
  Save,
  Trash2,
  Eye,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { PageWrapper } from "@/components/ui/PageWrapper";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type NotificationType = "info" | "success" | "warning" | "error";
type TabType = "overview" | "rounds" | "users" | "ipo" | "dividends" | "news";

interface PlayerData {
  id: string;
  name: string;
  email: string;
  bankBalance: number;
  totalPortfolioValue: number;
  wealth: number;
  stocks: { symbol: string; volume: number }[];
}

interface EligibleUser {
  userId: string;
  userName: string;
  email: string;
  holdingSectors: string[];
  portfolioValue: number;
}

interface IPOAllocation {
  playerId: string;
  symbol: string;
  quantity: number;
  price?: number;
}

interface IPOStock {
  symbol: string;
  name: string;
  sector: string;
  ipoPrice: number | null;
  ipoRound: number | null;
  price: number;
}

interface AllocatedIPO {
  id: string;
  playerId: string;
  symbol: string;
  quantity: number;
  price: number;
  round: number;
  claimed: boolean;
  player?: {
    user: {
      u1Name: string;
      email: string;
    };
  };
}

interface RoundConfig {
  roundNo: number;
  duration: number;
  description?: string;
  rules?: {
    tradingMode?: string;
    hasDividends?: boolean;
    hasIPO?: boolean;
    [key: string]: unknown;
  };
  scheduledStartTime?: string;
}

interface EditableRoundConfig {
  roundNo: number;
  name: string;
  duration: number;
  scheduledStartTime: string;
  rules: {
    tradingMode?: string;
    hasDividends?: boolean;
    hasIPO?: boolean;
  };
}

const ROUND_FEATURES: Record<number, { label: string; icon: string }> = {
  1: { label: "Buy Only", icon: "BUY" },
  2: { label: "Full Trading", icon: "FULL" },
  3: { label: "Dividends", icon: "DIV" },
  4: { label: "Full Trading", icon: "FULL" },
  5: { label: "IPO Launch", icon: "IPO" },
  6: { label: "Full Trading", icon: "FULL" },
  7: { label: "Full Trading", icon: "FULL" },
  8: { label: "Full Trading", icon: "FULL" },
  9: { label: "Full Trading", icon: "FULL" },
  10: { label: "Final Round", icon: "FINAL" },
};

export default function AdminDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [notifyType, setNotifyType] = useState<NotificationType>("info");
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [actionError, setActionError] = useState("");
  const [roundConfigs, setRoundConfigs] = useState<RoundConfig[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [isRoundActive, setIsRoundActive] = useState(false);
  const [gameStage, setGameStage] = useState<string>("INVALID");
  const [ipoAllocations, setIpoAllocations] = useState<
    Record<string, IPOAllocation>
  >({});
  const [selectedIPOStock, setSelectedIPOStock] = useState("");
  const [ipoStocks, setIpoStocks] = useState<IPOStock[]>([]);
  const [allocatedIPOs, setAllocatedIPOs] = useState<AllocatedIPO[]>([]);
  const [editingRound, setEditingRound] = useState<EditableRoundConfig | null>(
    null,
  );
  const [dividendSymbol, setDividendSymbol] = useState("SCRT");
  const [dividendAmount, setDividendAmount] = useState(5);
  const [balanceEditPlayer, setBalanceEditPlayer] = useState<PlayerData | null>(
    null,
  );
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [balanceOperation, setBalanceOperation] = useState<
    "SET" | "ADD" | "SUBTRACT"
  >("SET");
  const [showTestUsers, setShowTestUsers] = useState(false);

  useEffect(() => {
    if (user && !user.email.includes("admin")) {
      router.push("/home");
    }
  }, [user, router]);

  const fetchPlayers = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/leaderboard?includeTestUsers=${showTestUsers}`, {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      if (!res.ok) {
        console.error("Failed to load players");
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.status === "Success") {
        setPlayers(data.data);
      } else {
        console.error(data.message || "Failed to load players");
      }
    } catch (err) {
      console.error("Network error connecting to admin gateway", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, showTestUsers]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);


  const fetchRoundConfigs = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/rounds/config`, {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === "Success") {
        setRoundConfigs(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user?.id]);

  const fetchGameState = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/game/info/game-info`, {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      if (!res.ok) {
        console.error(
          "Failed to fetch game state:",
          res.status,
          res.statusText,
        );
        return;
      }
      const data = await res.json();
      if (data.status === "Success") {
        setCurrentRound(data.data.roundNo || 0);
        setIsRoundActive(data.data.isRoundActive || false);
        setGameStage(data.data.stage || "INVALID");
      }
    } catch (err) {
      console.error("Backend unreachable:", err);
    }
  }, [user?.id]);

  const fetchIPOEligibility = useCallback(async (excludeSector?: string) => {
    if (!user?.id) return;
    try {
      const url = excludeSector
        ? `${BACKEND_URL}/admin/ipo/eligibility?excludeSector=${excludeSector}`
        : `${BACKEND_URL}/admin/ipo/eligibility`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      const data = await res.json();
      if (res.ok && data.status === "Success") {
        setEligibleUsers(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user?.id]);

  const fetchIPOStocks = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/ipo/stocks`, {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      const data = await res.json();
      if (res.ok && data.status === "Success") {
        setIpoStocks(data.data);
        if (data.data.length > 0 && !selectedIPOStock) {
          setSelectedIPOStock(data.data[0].symbol);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [user?.id, selectedIPOStock]);

  const fetchAllocatedIPOs = useCallback(async (round?: number) => {
    if (!user?.id) return;
    try {
      const url = round
        ? `${BACKEND_URL}/admin/ipo/allocations?round=${round}`
        : `${BACKEND_URL}/admin/ipo/allocations`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${user.id}` },
      });
      const data = await res.json();
      if (res.ok && data.status === "Success") {
        setAllocatedIPOs(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPlayers();
    fetchRoundConfigs();
    fetchGameState();
    fetchIPOEligibility();
    fetchIPOStocks();
    fetchAllocatedIPOs();
    const interval = setInterval(() => {
      fetchPlayers();
      fetchGameState();
      fetchRoundConfigs();
    }, 5000);
    return () => clearInterval(interval);
  }, [
    fetchPlayers,
    fetchRoundConfigs,
    fetchGameState,
    fetchIPOEligibility,
    fetchIPOStocks,
    fetchAllocatedIPOs,
  ]);

  const executeAction = async (action: string, body?: unknown) => {
    if (!user?.id) return;
    setActionLoading(action);
    setActionError("");
    try {
      const res = await fetch(`${BACKEND_URL}/admin/${action}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.id}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (data.status === "Success") {
        if (action === "reset-game") {
          alert("Game Reset Successfully");
        }
        fetchPlayers();
        fetchGameState();
      } else {
        throw new Error(data.message || "Action failed");
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoading(null);
    }
  };

  const sendAnnouncement = async () => {
    if (!user?.id || !announcement.trim()) return;
    setNotifyLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/notify`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.id}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: announcement.trim(),
          type: notifyType,
        }),
      });
      const data = await res.json();
      if (data.status === "Success") {
        setAnnouncement("");
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to send announcement",
      );
    } finally {
      setNotifyLoading(false);
    }
  };

  const handleStartRound = async (roundNo: number) => {
    if (!user?.id) return;
    setActionLoading(`start-round-${roundNo}`);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/start-round`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.id}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roundNo }),
      });
      const data = await res.json();
      if (data.status === "Success") {
        setCurrentRound(roundNo);
        setIsRoundActive(true);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to start round",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleEndRound = async () => {
    if (!user?.id) return;
    if (!confirm("End the current round now?")) return;
    setActionLoading("end-round");
    try {
      const res = await fetch(`${BACKEND_URL}/admin/rounds/end-now`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user.id}` },
      });
      const data = await res.json();
      if (data.status === "Success") {
        setIsRoundActive(false);
        fetchRoundConfigs();
        fetchGameState();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to end round",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclareDividend = async () => {
    if (!user?.id) return;
    setActionLoading("declare-dividend");
    try {
      const res = await fetch(`${BACKEND_URL}/admin/dividends/declare`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.id}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          symbol: dividendSymbol,
          amount: dividendAmount,
          round: currentRound || 1,
        }),
      });
      const data = await res.json();
      if (data.status === "Success") {
        alert(
          `Dividend declared: ${dividendSymbol} - Rs.${dividendAmount} per share`,
        );
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to declare dividend",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateBalance = async () => {
    if (!user?.id || !balanceEditPlayer) return;
    setActionLoading("update-balance");
    try {
      const res = await fetch(`${BACKEND_URL}/admin/users/balance`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.id}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId: balanceEditPlayer.id,
          amount: balanceAmount,
          operation: balanceOperation,
        }),
      });
      const data = await res.json();
      if (data.status === "Success") {
        alert(
          `Balance updated for ${balanceEditPlayer.name}: Rs.${data.data.bankBalance.toFixed(2)}`,
        );
        setBalanceEditPlayer(null);
        fetchPlayers();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update balance",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const toggleIPOAllocation = (userId: string, symbol: string) => {
    setIpoAllocations((prev) => {
      const key = `${userId}-${symbol}`;
      const newAllocations = { ...prev };
      if (newAllocations[key]) {
        delete newAllocations[key];
      } else {
        newAllocations[key] = { playerId: userId, symbol, quantity: 100 };
      }
      return newAllocations;
    });
  };

  const updateIPOQuantity = (
    userId: string,
    symbol: string,
    quantity: number,
  ) => {
    const key = `${userId}-${symbol}`;
    if (ipoAllocations[key]) {
      setIpoAllocations((prev) => ({
        ...prev,
        [key]: { ...prev[key], quantity: Math.max(1, quantity) },
      }));
    }
  };

  const handleAllocateIPO = async () => {
    if (!user?.id) return;
    const allocations = Object.values(ipoAllocations).map((a) => ({
      playerId: a.playerId,
      symbol: a.symbol,
      quantity: a.quantity,
      round: 5,
    }));

    if (allocations.length === 0) {
      alert("No IPO allocations to submit");
      return;
    }

    setActionLoading("allocate-ipo");
    try {
      const res = await fetch(`${BACKEND_URL}/admin/ipo/allocate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.id}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ allocations }),
      });
      const data = await res.json();
      if (data.status === "Success") {
        alert(`${data.data.allocated} IPO allocations created`);
        setIpoAllocations({});
        fetchAllocatedIPOs();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to allocate IPO",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveAllocation = async (
    playerId: string,
    symbol: string,
    round: number,
  ) => {
    if (!user?.id) return;
    if (!confirm("Remove this IPO allocation?")) return;

    try {
      const res = await fetch(`${BACKEND_URL}/admin/ipo/allocation`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.id}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerId, symbol, round }),
      });
      const data = await res.json();
      if (data.status === "Success") {
        fetchAllocatedIPOs();
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to remove allocation",
      );
    }
  };

  const handleRunScenario = async () => {
    if (!user?.id) return;
    setActionLoading("run-scenario");
    try {
      const res = await fetch(`${BACKEND_URL}/admin/scenario`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.id}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roundNo: currentRound }),
      });
      const data = await res.json();
      if (data.status === "Success") {
        alert(data.message || `Scenario triggered for Round ${currentRound}`);
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to run scenario",
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (user && !user.email.includes("admin")) return null;

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: ShieldAlert },
    { id: "rounds" as TabType, label: "Rounds", icon: Calendar },
    { id: "users" as TabType, label: "Users", icon: Users },
    { id: "ipo" as TabType, label: "IPO", icon: TrendingUp },
    { id: "dividends" as TabType, label: "Dividends", icon: DollarSign },
    { id: "news" as TabType, label: "News", icon: Newspaper },
  ];

  return (
    <PageWrapper>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldAlert className="text-[var(--accent-red)]" size={24} />
              Admin Command Center
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              Manage rounds, users, IPOs, and game settings.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl flex items-center gap-3">
              <Users size={16} className="text-[var(--text-dim)]" />
              <div className="text-sm font-medium">
                {players.length} Players
              </div>
            </div>
            <div className="px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--border-color)] rounded-xl flex items-center gap-3">
              <Radio
                size={16}
                className={
                  isRoundActive
                    ? "text-[var(--accent-green)]"
                    : "text-[var(--text-dim)]"
                }
              />
              <div className="text-sm font-medium">
                {isRoundActive
                  ? gameStage === "CLOSE"
                    ? `Round ${currentRound} Over`
                    : `Round ${currentRound} Active`
                  : "Round Inactive"}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-[var(--border-color)] pb-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[var(--bg-elevated)] text-[var(--accent-blue)] border-b-2 border-[var(--accent-blue)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap size={18} className="text-[var(--accent-gold)]" />
                Quick Actions
              </h2>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => executeAction("start-game")}
                  disabled={actionLoading !== null}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-green)] text-white rounded-xl hover:bg-green-600 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {actionLoading === "start-game" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Play size={16} />
                  )}
                  Start Game
                </button>
                <button
                  onClick={handleEndRound}
                  disabled={actionLoading !== null || !isRoundActive}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-red)] text-white rounded-xl hover:bg-red-600 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {actionLoading === "end-round" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Square size={16} />
                  )}
                  End Round
                </button>
                <button
                  onClick={handleRunScenario}
                  disabled={actionLoading !== null || !isRoundActive}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-purple)] text-white rounded-xl hover:bg-purple-600 transition-colors font-medium text-sm disabled:opacity-50"
                  title="Manually trigger price changes for this round"
                >
                  {actionLoading === "run-scenario" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Zap size={16} />
                  )}
                  Run Scenario
                </button>
                <button
                  onClick={() =>
                    isRoundActive
                      ? executeAction("game/pause")
                      : executeAction("game/resume")
                  }
                  disabled={actionLoading !== null}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-gold)] text-white rounded-xl hover:bg-yellow-600 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {isRoundActive ? (
                    <Pause size={16} />
                  ) : (
                    <PlayCircle size={16} />
                  )}
                  {isRoundActive ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={() =>
                    executeAction("reset-game", { pass: "reset_game_bro" })
                  }
                  disabled={actionLoading !== null}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-elevated)] border border-[var(--accent-red)] text-[var(--accent-red)] rounded-xl hover:bg-red-500/10 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {actionLoading === "reset-game" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <AlertTriangle size={16} />
                  )}
                  Reset Game
                </button>
              </div>
            </div>

            {/* Announcement */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Radio size={18} className="text-[var(--accent-red)]" />
                Global Announcement
              </h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="Enter notification message..."
                  className="flex-1 px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
                />
                <select
                  value={notifyType}
                  onChange={(e) =>
                    setNotifyType(e.target.value as NotificationType)
                  }
                  className="px-3 py-2 bg-[var(--bg-base)] border border-[var(--border-color)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
                >
                  <option value="info">Info</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
                <button
                  onClick={sendAnnouncement}
                  disabled={notifyLoading || !announcement.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-purple)] text-white rounded-xl hover:bg-purple-600 transition-colors font-medium text-sm disabled:opacity-50"
                >
                  {notifyLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Play size={16} />
                  )}
                  Send
                </button>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 rounded-xl text-[var(--accent-red)] text-sm">
                {actionError}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "rounds" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-[var(--accent-blue)]" />
                Round Timeline
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Click the edit button to configure round name, duration, and
                scheduled start time.
              </p>

              <div className="space-y-3">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((roundNo) => {
                  const config = roundConfigs.find(
                    (c) => c.roundNo === roundNo,
                  );
                  const isCompleted = roundNo < currentRound;
                  const isCurrent = roundNo === currentRound;
                  const feature = ROUND_FEATURES[roundNo];

                  return (
                    <div
                      key={roundNo}
                      className={`flex items-center gap-4 p-4 rounded-xl border ${
                        isCurrent
                          ? "bg-[var(--accent-blue)]/10 border-[var(--accent-blue)]"
                          : isCompleted
                            ? "bg-[var(--bg-elevated)]/50 border-[var(--border-color)] opacity-60"
                            : "bg-[var(--bg-elevated)] border-[var(--border-color)]"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          isCurrent
                            ? "bg-[var(--accent-blue)] text-white"
                            : isCompleted
                              ? "bg-[var(--accent-green)] text-white"
                              : "bg-[var(--bg-base)] text-[var(--text-dim)]"
                        }`}
                      >
                        {isCompleted ? <CheckSquare size={18} /> : roundNo}
                      </div>

                      <div className="flex-1">
                        <div className="font-medium">
                          {config?.description || `Round ${roundNo}`}
                        </div>
                        <div className="text-xs text-[var(--text-dim)]">
                          {feature?.label} | Duration: {config?.duration || 2}{" "}
                          min
                          {config?.scheduledStartTime &&
                            ` | Scheduled: ${new Date(config.scheduledStartTime).toLocaleString()}`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent && isRoundActive && (
                          <button
                            onClick={handleEndRound}
                            disabled={actionLoading !== null}
                            className="text-xs px-2 py-1 bg-[var(--accent-red)] text-white rounded-full hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
                          >
                            {actionLoading === "end-round" ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Square size={12} />
                            )}
                            END
                          </button>
                        )}
                        {isCurrent && !isRoundActive && (
                          <span className="text-xs px-2 py-1 bg-[var(--accent-blue)] text-white rounded-full">
                            CURRENT
                          </span>
                        )}
                        {!isCurrent && (
                          <button
                            onClick={() => {
                              const editable: EditableRoundConfig = {
                                roundNo,
                                name: config?.description || `Round ${roundNo}`,
                                duration: config?.duration || 2,
                                scheduledStartTime:
                                  config?.scheduledStartTime || "",
                                rules: config?.rules || {},
                              };
                              setEditingRound(editable);
                            }}
                            className="p-2 hover:bg-[var(--bg-base)] rounded-lg transition-colors"
                            title="Edit round"
                          >
                            <Edit2
                              size={16}
                              className="text-[var(--text-dim)]"
                            />
                          </button>
                        )}
                        {!isCurrent && !isCompleted && (
                          <button
                            onClick={() => handleStartRound(roundNo)}
                            disabled={actionLoading !== null}
                            className="px-3 py-1.5 bg-[var(--accent-green)] text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50"
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Round Edit Modal */}
            {editingRound && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-md"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar size={20} />
                      Edit Round {editingRound.roundNo}
                    </h3>
                    <button
                      onClick={() => setEditingRound(null)}
                      className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                        Round Name
                      </label>
                      <input
                        type="text"
                        value={editingRound.name}
                        onChange={(e) =>
                          setEditingRound({
                            ...editingRound,
                            name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-[var(--bg-base)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
                        placeholder={`Round ${editingRound.roundNo}`}
                      />
                    </div>

                    <div>
                      <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={editingRound.duration}
                        onChange={(e) =>
                          setEditingRound({
                            ...editingRound,
                            duration: Math.max(
                              1,
                              parseInt(e.target.value) || 1,
                            ),
                          })
                        }
                        className="w-full px-4 py-2 bg-[var(--bg-base)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] font-mono"
                        min="1"
                        max="60"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                        Scheduled Start (optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={
                          editingRound.scheduledStartTime
                            ? editingRound.scheduledStartTime.slice(0, 16)
                            : ""
                        }
                        onChange={(e) =>
                          setEditingRound({
                            ...editingRound,
                            scheduledStartTime: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : "",
                          })
                        }
                        className="w-full px-4 py-2 bg-[var(--bg-base)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
                      />
                      <p className="text-xs text-[var(--text-dim)] mt-1">
                        Leave empty for manual start only
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setEditingRound(null)}
                        className="flex-1 py-2 border border-[var(--border-color)] rounded-xl font-medium hover:bg-[var(--bg-elevated)] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          if (!user?.id) return;
                          try {
                            const res = await fetch(
                              `${BACKEND_URL}/admin/rounds/config`,
                              {
                                method: "POST",
                                headers: {
                                  Authorization: `Bearer ${user.id}`,
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  roundNo: editingRound.roundNo,
                                  duration: editingRound.duration,
                                  message: editingRound.name,
                                  scheduledStartTime:
                                    editingRound.scheduledStartTime ||
                                    undefined,
                                }),
                              },
                            );
                            const data = await res.json();
                            if (data.status === "Success") {
                              setEditingRound(null);
                              fetchRoundConfigs();
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="flex-1 py-2 bg-[var(--accent-green)] text-white rounded-xl font-medium hover:bg-green-600 flex items-center justify-center gap-2"
                      >
                        <Save size={16} />
                        Save Changes
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "users" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users size={18} className="text-[var(--accent-blue)]" />
                  Player Management
                </h2>
                <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer select-none">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${showTestUsers ? 'bg-[var(--accent-blue)] border-[var(--accent-blue)] text-white' : 'border-[var(--border-color)] bg-[var(--bg-base)]'}`}>
                    {showTestUsers && <CheckSquare size={10} />}
                  </div>
                  <input
                    type="checkbox"
                    checked={showTestUsers}
                    onChange={(e) => setShowTestUsers(e.target.checked)}
                    className="hidden"
                  />
                  Show Test Users
                </label>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] bg-[var(--bg-elevated)]/50 text-xs font-medium text-[var(--text-dim)] uppercase">
                      <th className="py-3 px-4">Player</th>
                      <th className="py-3 px-4">Holdings</th>
                      <th className="py-3 px-4 text-right">Bank Balance</th>
                      <th className="py-3 px-4 text-right">Valuation</th>
                      <th className="py-3 px-4 text-right">Total Wealth</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-[var(--text-dim)]"
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : players.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-[var(--text-dim)]"
                        >
                          No players found
                        </td>
                      </tr>
                    ) : (
                      players.map((p) => (
                        <tr
                          key={p.id}
                          className="border-b border-[var(--border-color)]/50 hover:bg-[var(--bg-elevated)]/30"
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium">{p.name}</div>
                            <div className="text-xs text-[var(--text-dim)]">
                              {p.email}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {p.stocks && p.stocks.length > 0 ? (
                                p.stocks.map((s) => (
                                  s.volume > 0 && (
                                    <span key={s.symbol} className="text-[10px] px-1.5 py-0.5 bg-[var(--bg-elevated)] rounded border border-[var(--border-color)] text-[var(--text-dim)] font-mono whitespace-nowrap">
                                      {s.symbol}:{s.volume}
                                    </span>
                                  )
                                ))
                              ) : (
                                <span className="text-xs text-[var(--text-dim)]">-</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-sm">
                            {formatCurrency(p.bankBalance)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-sm text-[var(--text-secondary)]">
                            {formatCurrency(p.totalPortfolioValue)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[var(--accent-green)]">
                            {formatCurrency(
                              p.wealth || (p.bankBalance + p.totalPortfolioValue),
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                setBalanceEditPlayer(p);
                                setBalanceAmount(p.bankBalance);
                                setBalanceOperation("SET");
                              }}
                              className="px-3 py-1 text-xs bg-[var(--accent-blue)] text-white rounded-lg hover:bg-blue-600"
                            >
                              Edit Balance
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Balance Edit Modal */}
            {balanceEditPlayer && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-6 w-full max-w-md"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Wallet size={20} />
                      Edit Balance - {balanceEditPlayer.name}
                    </h3>
                    <button
                      onClick={() => setBalanceEditPlayer(null)}
                      className="p-2 hover:bg-[var(--bg-elevated)] rounded-lg"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-[var(--bg-elevated)] rounded-xl">
                      <div className="text-xs text-[var(--text-dim)] mb-1">
                        Current Balance
                      </div>
                      <div className="text-xl font-mono font-bold">
                        {formatCurrency(balanceEditPlayer.bankBalance)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {(["SET", "ADD", "SUBTRACT"] as const).map((op) => (
                        <button
                          key={op}
                          onClick={() => setBalanceOperation(op)}
                          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            balanceOperation === op
                              ? "bg-[var(--accent-blue)] text-white"
                              : "bg-[var(--bg-elevated)] hover:bg-[var(--bg-base)]"
                          }`}
                        >
                          {op === "SET"
                            ? "Set"
                            : op === "ADD"
                              ? "Add"
                              : "Subtract"}
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={balanceAmount}
                        onChange={(e) =>
                          setBalanceAmount(Number(e.target.value))
                        }
                        className="w-full px-4 py-2 bg-[var(--bg-base)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] font-mono"
                      />
                    </div>

                    <button
                      onClick={handleUpdateBalance}
                      disabled={actionLoading === "update-balance"}
                      className="w-full py-3 bg-[var(--accent-green)] text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {actionLoading === "update-balance" ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <CheckSquare size={18} />
                      )}
                      Update Balance
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "ipo" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* IPO Stock Selection */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-[var(--accent-green)]" />
                IPO Allocation
              </h2>

              {ipoStocks.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-dim)]">
                  No IPO stocks configured. Add stocks with IPO enabled in the
                  database.
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                      Available IPO Stocks
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {ipoStocks.map((stock) => {
                        const excludeSector =
                          stock.symbol === "OILI" ? "Energy" : "Technology";
                        return (
                          <button
                            key={stock.symbol}
                            onClick={() => {
                              setSelectedIPOStock(stock.symbol);
                              fetchIPOEligibility(excludeSector);
                            }}
                            className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                              selectedIPOStock === stock.symbol
                                ? "bg-[var(--accent-blue)] text-white"
                                : "bg-[var(--bg-elevated)] hover:bg-[var(--bg-base)]"
                            }`}
                          >
                            <div className="font-bold">{stock.symbol}</div>
                            <div className="text-xs opacity-80">
                              {stock.name}
                            </div>
                            <div className="text-xs mt-1">
                              Rs.
                              {stock.ipoPrice?.toFixed(2) ||
                                stock.price.toFixed(2)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                      Eligible Users ({eligibleUsers.length})
                    </h3>
                    {eligibleUsers.length === 0 ? (
                      <div className="text-center py-4 text-[var(--text-dim)] text-sm">
                        No eligible users found for this IPO stock.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {eligibleUsers.map((user) => (
                          <div
                            key={user.userId}
                            className="flex items-center gap-3 p-3 bg-[var(--bg-elevated)] rounded-xl"
                          >
                            <button
                              onClick={() =>
                                toggleIPOAllocation(
                                  user.userId,
                                  selectedIPOStock,
                                )
                              }
                              className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${
                                ipoAllocations[
                                  `${user.userId}-${selectedIPOStock}`
                                ]
                                  ? "bg-[var(--accent-green)] border-[var(--accent-green)] text-white"
                                  : "border-[var(--border-color)] hover:border-[var(--accent-green)]"
                              }`}
                            >
                              {ipoAllocations[
                                `${user.userId}-${selectedIPOStock}`
                              ] ? (
                                <CheckSquare size={14} />
                              ) : (
                                <Square size={14} />
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="font-medium">{user.userName}</div>
                              <div className="text-xs text-[var(--text-dim)]">
                                Net Worth: {formatCurrency(user.portfolioValue)}{" "}
                                | Sectors:{" "}
                                {user.holdingSectors.join(", ") || "None"}
                              </div>
                            </div>
                            {ipoAllocations[
                              `${user.userId}-${selectedIPOStock}`
                            ] && (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={
                                    ipoAllocations[
                                      `${user.userId}-${selectedIPOStock}`
                                    ]?.quantity || 100
                                  }
                                  onChange={(e) =>
                                    updateIPOQuantity(
                                      user.userId,
                                      selectedIPOStock,
                                      Number(e.target.value),
                                    )
                                  }
                                  className="w-20 px-2 py-1 bg-[var(--bg-base)] border border-[var(--border-color)] rounded text-sm font-mono text-center"
                                />
                                <span className="text-xs text-[var(--text-dim)]">
                                  shares
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleAllocateIPO}
                    disabled={
                      actionLoading === "allocate-ipo" ||
                      Object.keys(ipoAllocations).length === 0
                    }
                    className="w-full py-3 bg-[var(--accent-green)] text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === "allocate-ipo" ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Award size={18} />
                    )}
                    Allocate IPO ({Object.keys(ipoAllocations).length}{" "}
                    allocations)
                  </button>
                </>
              )}
            </div>

            {/* Current Allocations */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5">
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                <Eye size={16} />
                Current IPO Allocations ({allocatedIPOs.length})
              </h3>
              {allocatedIPOs.length === 0 ? (
                <div className="text-center py-4 text-[var(--text-dim)] text-sm">
                  No IPO allocations yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] text-[var(--text-dim)]">
                        <th className="py-2 px-3 text-left">Player</th>
                        <th className="py-2 px-3 text-left">Stock</th>
                        <th className="py-2 px-3 text-right">Qty</th>
                        <th className="py-2 px-3 text-right">Price</th>
                        <th className="py-2 px-3 text-center">Status</th>
                        <th className="py-2 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allocatedIPOs.map((ipo) => (
                        <tr
                          key={ipo.id}
                          className="border-b border-[var(--border-color)]/50"
                        >
                          <td className="py-2 px-3">
                            {ipo.player?.user?.u1Name || "Unknown"}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold">
                            {ipo.symbol}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {ipo.quantity}
                          </td>
                          <td className="py-2 px-3 text-right font-mono">
                            {formatCurrency(ipo.price)}
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                ipo.claimed
                                  ? "bg-[var(--accent-green)]/20 text-[var(--accent-green)]"
                                  : "bg-[var(--accent-gold)]/20 text-[var(--accent-gold)]"
                              }`}
                            >
                              {ipo.claimed ? "Claimed" : "Pending"}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            {!ipo.claimed && (
                              <button
                                onClick={() =>
                                  handleRemoveAllocation(
                                    ipo.playerId,
                                    ipo.symbol,
                                    ipo.round,
                                  )
                                }
                                className="p-1 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/10 rounded"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "dividends" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <DollarSign size={18} className="text-[var(--accent-green)]" />
                Dividend Declaration
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                Declare dividends for the current round. Dividends will be paid
                out when the round ends.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                    Stock Symbol
                  </label>
                  <select
                    value={dividendSymbol}
                    onChange={(e) => setDividendSymbol(e.target.value)}
                    className="w-full px-4 py-2 bg-[var(--bg-base)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)]"
                  >
                    {players
                      .flatMap((p) => p.stocks)
                      .filter(
                        (s, i, arr) =>
                          arr.findIndex((x) => x.symbol === s.symbol) === i,
                      )
                      .map((s) => (
                        <option key={s.symbol} value={s.symbol}>
                          {s.symbol}
                        </option>
                      )) || <option value="SCRT">SCRT</option>}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[var(--text-secondary)] mb-2 block">
                    Dividend per Share (Rs.)
                  </label>
                  <input
                    type="number"
                    value={dividendAmount}
                    onChange={(e) => setDividendAmount(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-[var(--bg-base)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-blue)] font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-[var(--bg-elevated)] rounded-xl mb-6">
                <div className="text-sm text-[var(--text-dim)]">Preview</div>
                <div className="text-lg font-medium">
                  {dividendSymbol} will pay Rs.{dividendAmount.toFixed(2)} per
                  share to all holders at round end.
                </div>
              </div>

              <button
                onClick={handleDeclareDividend}
                disabled={actionLoading === "declare-dividend"}
                className="w-full py-3 bg-[var(--accent-green)] text-white rounded-xl font-medium hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === "declare-dividend" ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <DollarSign size={18} />
                )}
                Declare Dividend
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === "news" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Newspaper size={18} className="text-[var(--accent-purple)]" />
                News Management
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-[var(--bg-elevated)] rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={16} className="text-[var(--accent-gold)]" />
                    <span className="font-medium">Auto-Generated News</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Generate 5 absurd/funny news items using the news generator.
                    These will be sent to all players.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        executeAction("news/generate", {
                          round: currentRound || 1,
                          count: 5,
                        })
                      }
                      disabled={actionLoading === "news/generate"}
                      className="flex-1 py-2 bg-[var(--accent-purple)] text-white rounded-lg font-medium hover:bg-purple-600 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {actionLoading === "news/generate" ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Zap size={16} />
                      )}
                      Generate
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-[var(--bg-elevated)] rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus size={16} className="text-[var(--accent-green)]" />
                    <span className="font-medium">Custom News</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Send a custom news announcement to all players.
                  </p>
                  <button
                    onClick={() => {
                      setActiveTab("overview");
                    }}
                    className="w-full py-2 bg-[var(--accent-green)] text-white rounded-lg font-medium hover:bg-green-600 flex items-center justify-center gap-2"
                  >
                    <Plus size={16} />
                    Go to Announcement Box
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--accent-green)]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp
                      size={16}
                      className="text-[var(--accent-green)]"
                    />
                    <span className="font-medium text-[var(--accent-green)]">
                      Bullish Event
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-4">
                    Triggers positive market sentiment. Will increase select
                    stock prices by 1-5% over 1-2 mins.
                  </p>
                  <button
                    onClick={() => {
                      if (!isRoundActive) {
                        alert("Cannot trigger market event: No active round");
                        return;
                      }
                      executeAction("news/market-event", {
                        sentiment: "BULLISH",
                      });
                    }}
                    disabled={
                      actionLoading === "news/market-event" || !isRoundActive
                    }
                    className="w-full py-2 bg-[var(--accent-green)] text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === "news/market-event" ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <TrendingUp size={16} />
                    )}
                    Trigger Bullish
                  </button>
                </div>

                <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--accent-red)]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp
                      size={16}
                      className="text-[var(--accent-red)] rotate-180"
                    />
                    <span className="font-medium text-[var(--accent-red)]">
                      Bearish Event
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-4">
                    Triggers negative market sentiment. Will decrease select
                    stock prices by 1-5% over 1-2 mins.
                  </p>
                  <button
                    onClick={() => {
                      if (!isRoundActive) {
                        alert("Cannot trigger market event: No active round");
                        return;
                      }
                      executeAction("news/market-event", {
                        sentiment: "BEARISH",
                      });
                    }}
                    disabled={
                      actionLoading === "news/market-event" || !isRoundActive
                    }
                    className="w-full py-2 bg-[var(--accent-red)] text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === "news/market-event" ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <TrendingUp size={16} className="rotate-180" />
                    )}
                    Trigger Bearish
                  </button>
                </div>

                <div className="p-4 bg-[var(--bg-elevated)] rounded-xl border border-[var(--text-dim)]/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Minus size={16} className="text-[var(--text-dim)]" />
                    <span className="font-medium text-[var(--text-dim)]">
                      Neutral Event
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-4">
                    Triggers ambiguous market sentiment. News displayed but no
                    direct price impact.
                  </p>
                  <button
                    onClick={() => {
                      if (!isRoundActive) {
                        alert("Cannot trigger market event: No active round");
                        return;
                      }
                      executeAction("news/market-event", {
                        sentiment: "NEUTRAL",
                      });
                    }}
                    disabled={
                      actionLoading === "news/market-event" || !isRoundActive
                    }
                    className="w-full py-2 bg-[var(--bg-base)] border border-[var(--border-color)] text-[var(--text-secondary)] rounded-lg font-medium hover:bg-[var(--bg-elevated)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading === "news/market-event" ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Minus size={16} />
                    )}
                    Trigger Neutral
                  </button>
                </div>
              </div>

              <div className="p-4 bg-[var(--accent-gold)]/10 border border-[var(--accent-gold)]/20 rounded-xl mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle
                    size={16}
                    className="text-[var(--accent-gold)]"
                  />
                  <span className="font-medium text-[var(--accent-gold)]">
                    Market Impact Info
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">
                  Real market news events will affect specific sector stocks.
                  The news content shown to players will NOT reveal which
                  sectors are affected - only the market sentiment
                  (Bullish/Bearish/Neutral) will be visible. Price changes occur
                  gradually over 1-2 minutes.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                  News Templates Preview
                </h3>
                <div className="space-y-2">
                  {[
                    "Elon Musk and Mars secretly built an AI-powered toaster",
                    "Virat Kohli acquired Google in surprise move, baffling scientists",
                    "Antarctica buzz: Taylor Swift rumored to join NASA",
                  ].map((preview, index) => (
                    <div
                      key={index}
                      className="p-3 bg-[var(--bg-elevated)] rounded-lg"
                    >
                      <p className="text-sm">{preview}</p>
                    </div>
                  ))}
                  <p className="text-xs text-[var(--text-dim)] mt-2">
                    News will be generated with random combinations of
                    celebrities, places, companies, and absurd objects.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </PageWrapper>
  );
}
