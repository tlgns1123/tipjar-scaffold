"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const fmt = (wei: bigint | undefined) => {
  if (!wei) return "0";
  return parseFloat(formatEther(wei)).toFixed(6).replace(/\.?0+$/, "") || "0";
};

const shortAddr = (addr: string) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;

const timeAgo = (ts: bigint) => {
  const diff = Math.floor(Date.now() / 1000) - Number(ts);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const MEDAL = ["🥇", "🥈", "🥉"];
const PAGE = 6;

type TipRecord = { tipper: string; amount: bigint; message: string; timestamp: bigint };
type Tab = "send" | "history" | "leaderboard";

const Home: NextPage = () => {
  const { address, isConnected } = useAccount();
  const [tab, setTab] = useState<Tab>("send");
  const [tipAmount, setTipAmount] = useState("");
  const [tipMessage, setTipMessage] = useState("");
  const [histPage, setHistPage] = useState(0);

  const { data: stats } = useScaffoldReadContract({ contractName: "TipJarExtended", functionName: "getStats", watch: true });
  const { data: owner } = useScaffoldReadContract({ contractName: "TipJarExtended", functionName: "owner" });
  const { data: history } = useScaffoldReadContract({ contractName: "TipJarExtended", functionName: "getTipHistory", watch: true });
  const { data: topData } = useScaffoldReadContract({ contractName: "TipJarExtended", functionName: "getTopTippers", args: [BigInt(10)] });
  const { data: myTotalAmount } = useScaffoldReadContract({ contractName: "TipJarExtended", functionName: "tipperTotalAmount", args: [address], query: { enabled: !!address } });
  const { data: myTipCount } = useScaffoldReadContract({ contractName: "TipJarExtended", functionName: "tipperCount", args: [address], query: { enabled: !!address } });

  const { writeContractAsync: doTip, isMining: tipMining } = useScaffoldWriteContract("TipJarExtended");
  const { writeContractAsync: doWithdraw, isMining: wdMining } = useScaffoldWriteContract("TipJarExtended");

  const handleTip = async () => {
    if (!tipAmount || parseFloat(tipAmount) <= 0) return;
    try {
      await doTip({ functionName: "tip", args: [tipMessage], value: parseEther(tipAmount) });
      setTipAmount(""); setTipMessage("");
    } catch { /* ignore */ }
  };

  const handleWithdraw = async () => {
    try { await doWithdraw({ functionName: "withdrawTips" }); } catch { /* ignore */ }
  };

  const isOwner = address && owner && address.toLowerCase() === (owner as string).toLowerCase();
  const [balance, count] = (stats as [bigint, bigint, bigint] | undefined) ?? [0n, 0n, 0n];
  const totalVolume = stats ? (stats as [bigint, bigint, bigint])[2] : 0n;

  const reversed = history ? [...(history as TipRecord[])].reverse() : [];
  const totalPages = Math.ceil(reversed.length / PAGE);
  const pageSlice = reversed.slice(histPage * PAGE, histPage * PAGE + PAGE);

  const topAddrs = topData ? (topData as [string[], bigint[]])[0] : [];
  const topAmounts = topData ? (topData as [string[], bigint[]])[1] : [];

  const maxAmount = topAmounts.length > 0 ? topAmounts[0] : 1n;

  return (
    <div className="min-h-screen bg-base-200">

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* stat pills */}
        <div className="flex flex-wrap gap-3 justify-center">
          {[
            { icon: "💰", label: "Balance", value: `${fmt(balance)} ETH` },
            { icon: "📨", label: "Total Tips", value: count?.toString() ?? "0" },
            { icon: "📊", label: "Volume", value: `${fmt(totalVolume)} ETH` },
          ].map(s => (
            <div key={s.label} className="bg-base-100 rounded-2xl shadow px-5 py-3 flex items-center gap-3 flex-1 min-w-[140px]">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-xs text-base-content/50">{s.label}</p>
                <p className="font-bold text-base-content">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* tabs */}
        <div role="tablist" className="tabs tabs-boxed bg-base-100 shadow">
          {(["send", "history", "leaderboard"] as Tab[]).map(t => (
            <button
              key={t}
              role="tab"
              className={`tab flex-1 capitalize font-medium transition ${tab === t ? "tab-active !bg-emerald-500 !text-white" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "send" ? "✦ Send" : t === "history" ? "📋 History" : "🏆 Leaderboard"}
            </button>
          ))}
        </div>

        {/* tab: send */}
        {tab === "send" && (
          <div className="space-y-4">
            <div className="card bg-base-100 shadow">
              <div className="card-body gap-4">
                {!isConnected ? (
                  <div className="alert alert-info text-sm">
                    <span>👛 Connect your wallet from the top-right to send a tip.</span>
                  </div>
                ) : (
                  <>
                    <div className="text-center">
                      <p className="text-base-content/50 text-sm">Connected as</p>
                      <p className="font-mono font-semibold text-emerald-600">{shortAddr(address!)}</p>
                    </div>
                    <div className="divider my-0" />
                  </>
                )}

                <fieldset disabled={!isConnected} className="space-y-4">
                  {/* amount buttons */}
                  <div>
                    <p className="text-sm font-medium text-base-content/60 mb-2">Quick Amount</p>
                    <div className="grid grid-cols-4 gap-2">
                      {["0.001", "0.005", "0.01", "0.05"].map(v => (
                        <button
                          key={v}
                          className={`btn btn-sm ${tipAmount === v ? "btn-success" : "btn-outline btn-success"}`}
                          onClick={() => setTipAmount(v)}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="form-control w-full">
                    <div className="label"><span className="label-text">Custom Amount (ETH)</span></div>
                    <input
                      type="number" min="0" step="0.001" placeholder="0.01"
                      className="input input-bordered input-success w-full"
                      value={tipAmount}
                      onChange={e => setTipAmount(e.target.value)}
                    />
                  </label>

                  <label className="form-control w-full">
                    <div className="label"><span className="label-text">Message (optional)</span></div>
                    <textarea
                      className="textarea textarea-bordered textarea-success w-full resize-none"
                      rows={3}
                      placeholder="You're awesome! Keep it up 🎉"
                      value={tipMessage}
                      onChange={e => setTipMessage(e.target.value)}
                    />
                  </label>

                  <button
                    className="btn btn-success w-full text-white text-base"
                    onClick={handleTip}
                    disabled={!tipAmount || tipMining}
                  >
                    {tipMining
                      ? <><span className="loading loading-dots" /></>
                      : <>Send {tipAmount || "0"} ETH 💸</>}
                  </button>
                </fieldset>
              </div>
            </div>

            {/* my stats */}
            {isConnected && (
              <div className="card bg-base-100 shadow">
                <div className="card-body py-4">
                  <h3 className="font-semibold text-base-content/70 text-sm uppercase tracking-wide">My Contribution</h3>
                  <div className="flex gap-4 mt-1">
                    <div className="flex-1 bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-emerald-600/70">Times Tipped</p>
                      <p className="text-3xl font-black text-emerald-600">{myTipCount?.toString() ?? "0"}</p>
                    </div>
                    <div className="flex-1 bg-teal-50 rounded-xl p-3 text-center">
                      <p className="text-xs text-teal-600/70">Total Sent</p>
                      <p className="text-3xl font-black text-teal-600">{fmt(myTotalAmount as bigint)}</p>
                      <p className="text-xs text-teal-500">ETH</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* owner */}
            {isOwner && (
              <div className="card bg-warning/10 border border-warning shadow">
                <div className="card-body py-4 gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-warning">⚡ Owner Panel</span>
                    <span className="badge badge-warning">{fmt(balance)} ETH</span>
                  </div>
                  <button
                    className="btn btn-warning btn-sm w-full"
                    onClick={handleWithdraw}
                    disabled={wdMining || balance === 0n}
                  >
                    {wdMining ? <span className="loading loading-dots" /> : "Withdraw All Tips"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* tab: history */}
        {tab === "history" && (
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-bold text-base-content">Recent Tips</h2>
                <span className="badge badge-neutral">{history?.length ?? 0} total</span>
              </div>

              {pageSlice.length === 0 ? (
                <div className="text-center py-12 text-base-content/30">
                  <p className="text-4xl mb-2">📭</p>
                  <p className="text-sm">No tips yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pageSlice.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 bg-base-200 rounded-xl px-4 py-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm shrink-0">
                        💸
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-sm text-base-content/70">{shortAddr(tip.tipper)}</p>
                        {tip.message && (
                          <p className="text-xs text-base-content/50 truncate mt-0.5">&ldquo;{tip.message}&rdquo;</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-emerald-600 text-sm">{fmt(tip.amount)} ETH</p>
                        <p className="text-xs text-base-content/40">{timeAgo(tip.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 pt-3">
                  <button className="btn btn-sm btn-ghost" disabled={histPage === 0} onClick={() => setHistPage(p => p - 1)}>←</button>
                  <span className="text-xs text-base-content/50">{histPage + 1} / {totalPages}</span>
                  <button className="btn btn-sm btn-ghost" disabled={histPage >= totalPages - 1} onClick={() => setHistPage(p => p + 1)}>→</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* tab: leaderboard */}
        {tab === "leaderboard" && (
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="font-bold text-base-content mb-4">Top Tippers</h2>
              {topAddrs.length === 0 ? (
                <div className="text-center py-12 text-base-content/30">
                  <p className="text-4xl mb-2">🏆</p>
                  <p className="text-sm">No tippers yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topAddrs.map((addr, i) => {
                    const pct = maxAmount > 0n ? Number((topAmounts[i] * 100n) / maxAmount) : 0;
                    return (
                      <div key={addr}>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-lg w-8">{MEDAL[i] ?? `#${i + 1}`}</span>
                          <span className="font-mono text-sm flex-1 text-base-content/70">{shortAddr(addr)}</span>
                          <span className="font-bold text-emerald-600 text-sm">{fmt(topAmounts[i])} ETH</span>
                        </div>
                        <div className="ml-11">
                          <progress
                            className="progress progress-success w-full h-2"
                            value={pct}
                            max={100}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Home;
