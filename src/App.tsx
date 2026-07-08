import { useEffect, useMemo, useState } from "react";
import Budgets from "./components/Budgets";
import Coach from "./components/Coach";
import Importer from "./components/Importer";
import NetWorth from "./components/NetWorth";
import Overview from "./components/Overview";
import Plan from "./components/Plan";
import Sidebar from "./components/Sidebar";
import Subscriptions from "./components/Subscriptions";
import { computeAnalytics } from "./lib/analytics";
import { DEFAULT_BUDGETS, DEFAULT_GOALS, generateDemoData } from "./lib/demoData";
import { loadLS, saveLS } from "./lib/storage";
import { detectSubscriptions } from "./lib/subscriptions";
import type { Budgets as BudgetsMap, Goal, Transaction } from "./lib/types";

export default function App() {
  const [nav, setNav] = useState("overview");
  const [demo] = useState(() => generateDemoData());
  const [imported, setImported] = useState<Transaction[] | null>(() => loadLS<Transaction[] | null>("zenkei.imported", null));
  const [budgets, setBudgets] = useState<BudgetsMap>(() => loadLS("zenkei.budgets", DEFAULT_BUDGETS));
  const [goals, setGoals] = useState<Goal[]>(() => loadLS("zenkei.goals", DEFAULT_GOALS));
  const usingImported = !!(imported && imported.length > 0);
  const txns = usingImported ? imported! : demo;
  const analytics = useMemo(() => computeAnalytics(txns), [txns]);
  const subs = useMemo(() => detectSubscriptions(txns), [txns]);
  useEffect(() => {
    saveLS("zenkei.imported", imported);
  }, [imported]);
  useEffect(() => {
    saveLS("zenkei.budgets", budgets);
  }, [budgets]);
  useEffect(() => {
    saveLS("zenkei.goals", goals);
  }, [goals]);
  const resetAll = () => {
    saveLS("zenkei.imported", null);
    saveLS("zenkei.budgets", null);
    saveLS("zenkei.goals", null);
    setImported(null);
    setBudgets(DEFAULT_BUDGETS);
    setGoals(DEFAULT_GOALS);
  };
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar
        nav={nav}
        setNav={setNav}
        usingImported={usingImported}
        importedCount={imported ? imported.length : 0}
        onBackToDemo={() => setImported(null)}
        onReset={resetAll}
      />
      <main style={{ flex: 1, minWidth: 0, padding: "28px 34px 60px", maxWidth: 1180, margin: "0 auto", width: "100%" }}>
        {nav === "overview" && <Overview analytics={analytics} txns={txns} subs={subs} />}
        {nav === "subscriptions" && <Subscriptions subs={subs} />}
        {nav === "budgets" && <Budgets analytics={analytics} budgets={budgets} setBudgets={setBudgets} />}
        {nav === "networth" && <NetWorth />}
        {nav === "plan" && <Plan analytics={analytics} subs={subs} goals={goals} setGoals={setGoals} />}
        {nav === "coach" && <Coach analytics={analytics} subs={subs} budgets={budgets} txns={txns} />}
        {nav === "import" && (
          <Importer onImport={setImported} usingImported={usingImported} count={imported ? imported.length : 0} />
        )}
        <footer
          style={{
            marginTop: 44,
            paddingTop: 18,
            borderTop: "1px solid var(--line)",
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div className="eyebrow" style={{ fontSize: 10 }}>
            Zenkei — private personal finance
          </div>
          <div style={{ fontSize: 11.5, color: "var(--muted2)" }}>No accounts linked · No login · Nothing leaves this browser</div>
        </footer>
      </main>
    </div>
  );
}
