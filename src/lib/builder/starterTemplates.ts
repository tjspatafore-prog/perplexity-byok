export interface StarterTemplate {
  id: string;
  name: string;
  icon: string;
  title: string;
  prompt: string;
  explanation: string;
  code: string;
}

export const SAAS_DASHBOARD_CODE = `function App() {
  const [revenue, setRevenue] = useState(148250);
  const [growthRate, setGrowthRate] = useState(18);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [transactions, setTransactions] = useState([
    { id: "TX-901", customer: "Acme Cloud Corp", plan: "Enterprise Annual", amount: 24000, status: "Completed", date: "Just now" },
    { id: "TX-902", customer: "Cyberdyne Labs", plan: "Scale Monthly", amount: 4800, status: "Completed", date: "12m ago" },
    { id: "TX-903", customer: "Stark Autonomous", plan: "Enterprise Pro", amount: 18500, status: "Completed", date: "1h ago" },
    { id: "TX-904", customer: "Wayne Systems", plan: "Developer Seat", amount: 850, status: "Pending", date: "3h ago" },
    { id: "TX-905", customer: "Tyrell BioTech", plan: "Scale Monthly", amount: 4800, status: "Completed", date: "5h ago" },
  ]);
  const [newCustomer, setNewCustomer] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const projectedAnnual = Math.round(revenue * 12 * (1 + growthRate / 100));

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!newCustomer.trim() || !newAmount) return;
    const item = {
      id: "TX-" + Math.floor(100 + Math.random() * 900),
      customer: newCustomer.trim(),
      plan: "Custom Tier",
      amount: Number(newAmount),
      status: "Completed",
      date: "Just now",
    };
    setTransactions([item, ...transactions]);
    setRevenue(revenue + Number(newAmount));
    setNewCustomer("");
    setNewAmount("");
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.customer.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === "completed") return matchesSearch && t.status === "Completed";
    if (filter === "pending") return matchesSearch && t.status === "Pending";
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0b0f17] text-gray-100 p-4 sm:p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-cyan-500/20 text-white">
              📈
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Pulse Operations & Analytics</h1>
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live React Sandbox
                </span>
              </div>
              <p className="text-xs text-gray-400">Interactive SaaS Dashboard • Prompt the AI on the left to transform this app!</p>
            </div>
          </div>
          <div className="text-xs text-right text-gray-400 font-mono">
            ARR Run Rate: <span className="text-emerald-400 font-bold text-sm">{"$" + projectedAnnual.toLocaleString()}</span>
          </div>
        </div>

        {/* 4 Stat Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-[#131b2e] border border-gray-800 space-y-1">
            <div className="text-[11px] text-gray-400 font-medium">Monthly Revenue</div>
            <div className="text-xl font-bold text-white">{"$" + revenue.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">+18.4% MoM</div>
          </div>
          <div className="p-4 rounded-xl bg-[#131b2e] border border-gray-800 space-y-1">
            <div className="text-[11px] text-gray-400 font-medium">Active Subscriptions</div>
            <div className="text-xl font-bold text-white">3,842</div>
            <div className="text-[10px] text-cyan-400 font-semibold">+9.2% growth</div>
          </div>
          <div className="p-4 rounded-xl bg-[#131b2e] border border-gray-800 space-y-1">
            <div className="text-[11px] text-gray-400 font-medium">Conversion Rate</div>
            <div className="text-xl font-bold text-white">4.85%</div>
            <div className="text-[10px] text-purple-400 font-semibold">+1.1% vs avg</div>
          </div>
          <div className="p-4 rounded-xl bg-[#131b2e] border border-gray-800 space-y-1">
            <div className="text-[11px] text-gray-400 font-medium">System Uptime</div>
            <div className="text-xl font-bold text-white">99.98%</div>
            <div className="text-[10px] text-emerald-400 font-semibold">Nominal</div>
          </div>
        </div>

        {/* Growth Simulation Slider */}
        <div className="p-4 rounded-xl bg-[#131b2e] border border-gray-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white">Interactive Annual Growth Simulator</span>
            <span className="text-cyan-400 font-mono font-bold">Target Growth: {growthRate}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={growthRate}
            onChange={(e) => setGrowthRate(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-gray-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>0% (Conservative)</span>
            <span>50% (High Growth)</span>
            <span>100% (Hyper Growth)</span>
          </div>
        </div>

        {/* Record Transaction Form */}
        <div className="p-4 rounded-xl bg-[#131b2e] border border-gray-800">
          <h2 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
            <span>⚡</span> Record New Enterprise Sale (Updates Live State)
          </h2>
          <form onSubmit={handleAddTransaction} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Customer / Company Name"
              value={newCustomer}
              onChange={(e) => setNewCustomer(e.target.value)}
              className="flex-1 bg-[#0b0f17] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="number"
              placeholder="Amount ($)"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="w-full sm:w-32 bg-[#0b0f17] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-cyan-500/20 whitespace-nowrap"
            >
              + Record Sale
            </button>
          </form>
        </div>

        {/* Search & Transactions Table */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-white">Recent Transactions ({filteredTransactions.length})</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search orders or clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#131b2e] border border-gray-800 rounded-lg px-3 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex bg-[#131b2e] border border-gray-800 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setFilter("all")}
                  className={"px-2 py-0.5 rounded " + (filter === "all" ? "bg-cyan-500/20 text-cyan-300 font-semibold" : "text-gray-400")}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("completed")}
                  className={"px-2 py-0.5 rounded " + (filter === "completed" ? "bg-cyan-500/20 text-cyan-300 font-semibold" : "text-gray-400")}
                >
                  Paid
                </button>
                <button
                  onClick={() => setFilter("pending")}
                  className={"px-2 py-0.5 rounded " + (filter === "pending" ? "bg-cyan-500/20 text-cyan-300 font-semibold" : "text-gray-400")}
                >
                  Pending
                </button>
              </div>
            </div>
          </div>

          <div className="border border-gray-800 rounded-xl overflow-hidden bg-[#131b2e]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0e1422] border-b border-gray-800 text-gray-400">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Tier</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors text-gray-300">
                    <td className="p-3 font-mono text-[11px] text-gray-400">{t.id}</td>
                    <td className="p-3 font-medium text-white">{t.customer}</td>
                    <td className="p-3 text-gray-400">{t.plan}</td>
                    <td className="p-3 font-bold text-emerald-400">{"$" + t.amount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={"px-2 py-0.5 rounded-full text-[10px] font-semibold " + (t.status === "Completed" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300")}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);`;

export const KANBAN_CODE = `function App() {
  const [tasks, setTasks] = useState([
    { id: "T1", title: "Design Neo-Dark UI Kit", column: "in_progress", priority: "High", tag: "Design" },
    { id: "T2", title: "Setup WebAssembly SQLite DB", column: "done", priority: "Medium", tag: "Backend" },
    { id: "T3", title: "Implement Multi-Model Router", column: "done", priority: "High", tag: "Core" },
    { id: "T4", title: "Deploy Live Sandbox Hot-Reload", column: "in_progress", priority: "Urgent", tag: "DevOps" },
    { id: "T5", title: "Add Autonomous CRON Monitors", column: "backlog", priority: "Low", tag: "Feature" },
    { id: "T6", title: "Desktop Shell Bridge Script", column: "backlog", priority: "Medium", tag: "Bridge" },
  ]);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState("Medium");
  const [targetColumn, setTargetColumn] = useState("backlog");

  const columns = [
    { id: "backlog", label: "Backlog", color: "border-gray-700 bg-gray-900/40 text-gray-300" },
    { id: "in_progress", label: "In Progress", color: "border-cyan-500/40 bg-cyan-950/20 text-cyan-300" },
    { id: "done", label: "Completed", color: "border-emerald-500/40 bg-emerald-950/20 text-emerald-300" },
  ];

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newTask = {
      id: "T" + (tasks.length + 1),
      title: newTitle.trim(),
      column: targetColumn,
      priority: newPriority,
      tag: "Feature",
    };
    setTasks([...tasks, newTask]);
    setNewTitle("");
  };

  const moveTask = (taskId, direction) => {
    const order = ["backlog", "in_progress", "done"];
    setTasks(tasks.map(t => {
      if (t.id !== taskId) return t;
      const curIdx = order.indexOf(t.column);
      const nextIdx = direction === "next" ? Math.min(order.length - 1, curIdx + 1) : Math.max(0, curIdx - 1);
      return { ...t, column: order[nextIdx] };
    }));
  };

  const deleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Urgent": return "bg-red-500/20 text-red-300 border-red-500/30";
      case "High": return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Medium": return "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 p-4 sm:p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-xl font-bold shadow-lg shadow-purple-500/20 text-white">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Kanban Flow Studio</h1>
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-semibold">
                  {tasks.length} Total Tasks
                </span>
              </div>
              <p className="text-xs text-gray-400">Interactive Task Board • Click arrows to transition tasks between stages</p>
            </div>
          </div>
        </div>

        {/* Quick Add Form */}
        <form onSubmit={handleAddTask} className="p-3 rounded-xl bg-[#161b22] border border-gray-800 flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Add new task title..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 min-w-[200px] bg-[#0d1117] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value)}
            className="bg-[#0d1117] border border-gray-700 rounded-lg px-2.5 py-2 text-xs text-gray-300 focus:outline-none"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>
          <select
            value={targetColumn}
            onChange={(e) => setTargetColumn(e.target.value)}
            className="bg-[#0d1117] border border-gray-700 rounded-lg px-2.5 py-2 text-xs text-gray-300 focus:outline-none"
          >
            <option value="backlog">Backlog</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Completed</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-purple-500/20"
          >
            + Add Card
          </button>
        </form>

        {/* Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map(col => {
            const colTasks = tasks.filter(t => t.column === col.id);
            return (
              <div key={col.id} className="flex flex-col bg-[#161b22] border border-gray-800 rounded-xl p-3 min-h-[400px]">
                <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
                  <span className="text-xs font-bold text-gray-200 uppercase tracking-wider">{col.label}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-800 text-gray-300 font-mono">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2.5">
                  {colTasks.map(t => (
                    <div key={t.id} className="p-3 rounded-lg bg-[#0d1117] border border-gray-800 hover:border-gray-700 transition-all space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-gray-100">{t.title}</span>
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="text-gray-500 hover:text-red-400 text-xs transition-colors"
                          title="Delete card"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className={"text-[9px] px-2 py-0.5 rounded-full border font-semibold " + getPriorityBadge(t.priority)}>
                            {t.priority}
                          </span>
                          <span className="text-[9px] text-gray-500 font-mono">#{t.id}</span>
                        </div>

                        {/* Move Controls */}
                        <div className="flex items-center gap-1">
                          {col.id !== "backlog" && (
                            <button
                              onClick={() => moveTask(t.id, "prev")}
                              className="px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-[10px] text-gray-300"
                              title="Move backward"
                            >
                              ◀
                            </button>
                          )}
                          {col.id !== "done" && (
                            <button
                              onClick={() => moveTask(t.id, "next")}
                              className="px-1.5 py-0.5 rounded bg-purple-900/50 hover:bg-purple-800/70 text-purple-300 text-[10px] font-bold"
                              title="Move forward"
                            >
                              ▶
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-10 text-xs text-gray-600 border border-dashed border-gray-800 rounded-lg">
                      Empty column
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);`;

export const ECOMMERCE_CODE = `function App() {
  const [products] = useState([
    { id: 1, name: "Neural Spatial Headset Pro", category: "Audio", price: 349, rating: 4.9, icon: "🎧", badge: "Best Seller" },
    { id: 2, name: "CyberDeck 65% Mechanical", category: "Desk", price: 189, rating: 4.8, icon: "⌨️", badge: "Popular" },
    { id: 3, name: "ChronoSync Titanium Watch", category: "Wearables", price: 429, rating: 5.0, icon: "⌚", badge: "New" },
    { id: 4, name: "Holographic Ambient Lamp", category: "Desk", price: 119, rating: 4.7, icon: "💡", badge: "" },
    { id: 5, name: "BioTrack Smart Ring Gen3", category: "Wearables", price: 299, rating: 4.9, icon: "💍", badge: "Trending" },
    { id: 6, name: "Acoustic Shield Earbuds", category: "Audio", price: 199, rating: 4.6, icon: "🎵", badge: "" },
  ]);

  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const categories = ["All", "Audio", "Wearables", "Desk"];

  const filteredProducts = activeCategory === "All"
    ? products
    : products.filter(p => p.category === activeCategory);

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id !== id) return item;
      const newQty = item.qty + delta;
      return newQty > 0 ? { ...item, qty: newQty } : null;
    }).filter(Boolean));
  };

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.qty * item.price, 0);

  return (
    <div className="min-h-screen bg-[#0a0d14] text-gray-100 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-gray-800 bg-[#0e131f]/90 sticky top-0 z-20 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <span className="font-bold tracking-tight text-white text-base">AURA LUXE</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 text-xs font-semibold transition-all"
            >
              <span>🛒 Cart</span>
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-black font-bold text-[10px] flex items-center justify-center">
                {totalItems}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Hero Section */}
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-950/60 to-cyan-950/40 border border-cyan-500/20 text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Next-Gen Cyber Accessories</h1>
          <p className="text-xs text-gray-400 max-w-md mx-auto">Hardware engineered for autonomous creators and futuristic thinkers.</p>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={"px-3.5 py-1.5 rounded-full text-xs font-medium transition-all " + (activeCategory === cat ? "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30" : "bg-gray-800/80 text-gray-400 hover:text-white")}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="p-4 rounded-xl bg-[#121826] border border-gray-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 group">
              <div className="space-y-3">
                <div className="h-32 rounded-lg bg-[#182032] flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">
                  {product.icon}
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                    <span>{product.category}</span>
                    <span className="text-amber-400 font-semibold">★ {product.rating}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{product.name}</h3>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <span className="text-base font-extrabold text-emerald-400">{"$" + product.price}</span>
                <button
                  onClick={() => addToCart(product)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  + Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex justify-end">
          <div className="w-full max-w-sm bg-[#0e131f] border-l border-gray-800 h-full p-4 sm:p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                <h2 className="text-base font-bold text-white">Your Shopping Cart ({totalItems})</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white text-sm">✕</button>
              </div>

              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-xs text-gray-500 py-10 text-center">Your cart is currently empty.</p>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#161c2d] border border-gray-800 text-xs">
                      <div>
                        <div className="font-semibold text-white">{item.name}</div>
                        <div className="text-emerald-400 font-mono">{"$" + item.price} each</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-xs">-</button>
                        <span className="font-bold font-mono">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-xs">+</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total:</span>
                <span className="text-lg font-bold text-emerald-400">{"$" + totalPrice}</span>
              </div>
              <button
                disabled={cart.length === 0}
                onClick={() => alert("Simulated checkout completed! Total: $" + totalPrice)}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20"
              >
                Checkout Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);`;

export const BLANK_CANVAS_CODE = `function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-gray-100 flex flex-col items-center justify-center p-6 text-center font-sans">
      <div className="max-w-md w-full p-8 rounded-2xl bg-[#12141c] border border-gray-800 space-y-6 shadow-2xl">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-2xl shadow-lg shadow-cyan-500/20">
          🚀
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            Interactive Blank Canvas
          </span>
          <h1 className="text-2xl font-bold text-white tracking-tight">Your Next App Starts Here</h1>
          <p className="text-xs text-gray-400">
            Prompt the AI in the left panel to synthesize whatever you imagine: dashboards, calculators, games, or landing pages.
          </p>
        </div>

        {/* Interactive Element */}
        <div className="p-4 rounded-xl bg-[#0d0f17] border border-gray-800 space-y-3">
          <div className="text-xs text-gray-400">Live Sandbox State Verification:</div>
          <div className="text-3xl font-bold font-mono text-cyan-400">{count}</div>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setCount(count - 1)}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-xs"
            >
              - Decrement
            </button>
            <button
              onClick={() => setCount(count + 1)}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
            >
              + Increment
            </button>
            <button
              onClick={() => setCount(0)}
              className="px-2 py-1 text-gray-500 hover:text-gray-300 text-xs"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="text-[11px] text-gray-500">
          💡 Tip: Click "Inspect Element" above to select and edit any piece of this UI.
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);`;

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: "saas",
    name: "SaaS Analytics Dashboard",
    icon: "📈",
    title: "Pulse Operations & Analytics",
    prompt: "Executive SaaS KPI & Operations Dashboard",
    explanation: "Interactive SaaS metrics dashboard with ARR simulation, financial cards, and live transaction ledger.",
    code: SAAS_DASHBOARD_CODE,
  },
  {
    id: "kanban",
    name: "Kanban Flow Board",
    icon: "📋",
    title: "Kanban Flow Studio",
    prompt: "Interactive Agile Project Board",
    explanation: "Interactive 3-column project board with task creation, priority tags, and column shifting.",
    code: KANBAN_CODE,
  },
  {
    id: "ecommerce",
    name: "Storefront & Cart",
    icon: "🛒",
    title: "Aura Luxe Storefront",
    prompt: "Modern E-Commerce Store & Cart",
    explanation: "Interactive storefront with category filtering, product catalog, slide-out cart drawer, and live total calculation.",
    code: ECOMMERCE_CODE,
  },
  {
    id: "blank",
    name: "Blank Canvas",
    icon: "⬜",
    title: "Modern Blank Canvas",
    prompt: "Blank Starter Canvas",
    explanation: "Clean, distraction-free starter template ready for any custom prompt.",
    code: BLANK_CANVAS_CODE,
  },
];
