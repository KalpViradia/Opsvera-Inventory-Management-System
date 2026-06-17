"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle2,
  Box,
  Zap,
  PackageSearch,
  ShoppingCart,
  Truck,
  LineChart,
  WalletCards,
  Star,
  Quote,
  Activity,
  Boxes,
  DatabaseZap,
  Globe2
} from "lucide-react";


const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function LandingPage() {
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="h-screen bg-[#030B24] text-slate-100 selection:bg-indigo-500/30 overflow-x-hidden overflow-y-auto font-sans">
      
      {/* --- Ambient Background Effects --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-cyan-500/10 blur-[150px]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.015] mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]"></div>
      </div>

      {/* --- Header --- */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#030B24]/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto h-20 flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/branding/logos/logo-dark.svg" alt="Opsvera Logo" width={140} height={32} className="h-8 w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" onClick={(e) => handleScroll(e, 'features')} className="hover:text-white transition-colors cursor-pointer">Features</a>
            <a href="#integrations" onClick={(e) => handleScroll(e, 'integrations')} className="hover:text-white transition-colors cursor-pointer">Integrations</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block">
              Log in
            </Link>
            <Link href="/register" className="h-10 px-5 rounded-full bg-white text-[#030B24] text-sm font-bold inline-flex items-center gap-2 hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        
        {/* --- Hero Section --- */}
        <section className="relative pt-32 pb-24 px-6 max-w-7xl mx-auto">
          <motion.div 
            initial="hidden" animate="visible" variants={staggerContainer}
            className="flex flex-col items-center text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUpVariants} className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300 mb-8 backdrop-blur-md">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>The Next-Generation ERP Platform</span>
            </motion.div>
            
            <motion.h1 variants={fadeUpVariants} className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-6">
              Operations made <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">simple</span>,
              <br />
              insights made <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">clear</span>.
            </motion.h1>
            
            <motion.p variants={fadeUpVariants} className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Manage inventory, procurement, sales, purchasing, warehousing, and accounting in one unified real-time platform. Built for modern businesses that need complete operational visibility.
            </motion.p>
            
            <motion.div variants={fadeUpVariants} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto h-14 px-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-base font-bold inline-flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all hover:-translate-y-1">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* --- Statistics Section --- */}
        <section className="py-16 border-y border-white/5 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
            {[
              { label: "System Uptime", value: "99.9%" },
              { label: "Orders Processed Daily", value: "50,000+" },
              { label: "Businesses Trust Opsvera", value: "500+" },
              { label: "Reduction in Costs", value: "40%" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center justify-center text-center px-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 mb-2"
                >
                  {stat.value}
                </motion.div>
                <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* --- Features Section --- */}
        <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
              Everything you need to run operations efficiently
            </h2>
            <p className="text-lg text-slate-400">
              Replace your fragmented toolchain with a single, highly integrated platform designed for speed and clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: PackageSearch, color: "from-blue-500 to-cyan-400", title: "Smart Inventory Management", desc: "Track stock levels across multiple warehouses in real time. Never oversell again." },
              { icon: Truck, color: "from-purple-500 to-indigo-500", title: "Procurement Automation", desc: "Manage suppliers, purchase orders, and approvals effortlessly with intelligent routing." },
              { icon: ShoppingCart, color: "from-emerald-400 to-teal-500", title: "Sales & Order Management", desc: "Streamline quotations, orders, invoicing, and fulfillment in one seamless workflow." },
              { icon: Boxes, color: "from-amber-400 to-orange-500", title: "Warehouse Operations", desc: "Optimize picking, packing, transfers, and stock audits with barcode scanner support." },
              { icon: LineChart, color: "from-rose-400 to-red-500", title: "Real-Time Analytics", desc: "Monitor KPIs, inventory turnover, and profitability instantly with custom dashboards." },
              { icon: WalletCards, color: "from-indigo-400 to-blue-500", title: "Financial Integration", desc: "Sync accounting, expenses, taxes, and cash flow seamlessly into your general ledger." }
            ].map((feat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feat.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                <div className={`w-14 h-14 rounded-xl mb-6 flex items-center justify-center bg-gradient-to-br ${feat.color} bg-opacity-10 border border-white/10 shadow-lg relative overflow-hidden`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${feat.color} opacity-20`} />
                  <feat.icon className="w-7 h-7 text-white relative z-10 drop-shadow-md" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* --- Product Showcase Section --- */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A1332] to-[#030B24] pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="absolute -inset-4 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 blur-2xl opacity-50"></div>
              <div className="relative rounded-2xl border border-white/10 bg-[#0A1332] p-2 shadow-2xl">
                <div className="rounded-xl overflow-hidden border border-white/5 bg-[#030B24]">
                  {/* Abstract representation of UI */}
                  <div className="p-6 space-y-6">
                    <div className="flex gap-4">
                      <div className="flex-1 h-24 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-center px-4 relative overflow-hidden">
                        <div className="w-8 h-8 rounded bg-emerald-500/20 mb-2"></div>
                        <div className="w-16 h-3 rounded bg-white/20 mb-2"></div>
                        <div className="w-24 h-5 rounded bg-white/80"></div>
                        <Activity className="absolute right-4 bottom-4 w-12 h-12 text-emerald-500/20" />
                      </div>
                      <div className="flex-1 h-24 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-center px-4 relative overflow-hidden">
                        <div className="w-8 h-8 rounded bg-indigo-500/20 mb-2"></div>
                        <div className="w-16 h-3 rounded bg-white/20 mb-2"></div>
                        <div className="w-24 h-5 rounded bg-white/80"></div>
                        <DatabaseZap className="absolute right-4 bottom-4 w-12 h-12 text-indigo-500/20" />
                      </div>
                    </div>
                    <div className="h-48 rounded-lg bg-white/5 border border-white/10 p-4">
                      <div className="w-32 h-4 rounded bg-white/20 mb-6"></div>
                      <div className="flex items-end gap-2 h-24 mt-8">
                        {[40, 70, 45, 90, 65, 85, 100, 55, 75, 40, 60, 80].map((h, i) => (
                          <motion.div key={i} initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.5 }} className="flex-1 bg-gradient-to-t from-indigo-500/50 to-cyan-400 rounded-t-sm"></motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white tracking-tight">
                Gain complete visibility across your business
              </h2>
              <p className="text-lg text-slate-400 mb-8">
                Unify your entire supply chain. From the moment a purchase order is created to the final sales invoice, Opsvera tracks every movement with forensic precision.
              </p>
              
              <ul className="space-y-4">
                {[
                  "Multi-warehouse management",
                  "Barcode scanning support",
                  "Automated reorder points",
                  "Supplier management",
                  "Sales forecasting",
                  "Real-time reporting"
                ].map((item, i) => (
                  <motion.li key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-center gap-3 text-slate-300 font-medium">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </section>

        {/* --- Integrations Section --- */}
        <section id="integrations" className="py-24 px-6 border-y border-white/5 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-white">Works with your existing tools</h2>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {[
                { name: "Shopify", color: "text-[#95BF47]" },
                { name: "WooCommerce", color: "text-[#96588A]" },
                { name: "QuickBooks", color: "text-[#2CA01C]" },
                { name: "Xero", color: "text-[#13B5EA]" },
                { name: "Stripe", color: "text-[#635BFF]" },
                { name: "Slack", color: "text-[#E01E5A]" },
                { name: "Microsoft Teams", color: "text-[#6264A7]" },
                { name: "Google Workspace", color: "text-[#4285F4]" },
              ].map((brand, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -3, scale: 1.05 }}
                  className="px-6 py-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center justify-center gap-2 shadow-lg"
                >
                  <Globe2 className={`w-5 h-5 ${brand.color}`} />
                  <span className="font-bold text-slate-200">{brand.name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* --- Testimonials Section --- */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">Trusted by modern teams</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "Opsvera transformed our inventory accuracy and reduced stockouts by 70%. It's the central nervous system of our operations.", role: "Operations Manager", initial: "S" },
              { quote: "The visibility and automation have saved hundreds of hours every month. Closing the books at month-end is finally painless.", role: "Supply Chain Director", initial: "D" },
              { quote: "Finally an ERP platform our entire team actually enjoys using. The interface is blazing fast and incredibly intuitive.", role: "CEO", initial: "M" }
            ].map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent relative">
                <Quote className="absolute top-6 right-6 w-8 h-8 text-white/5" />
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-lg text-slate-300 leading-relaxed mb-8">&quot;{t.quote}&quot;</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">{t.initial}</div>
                  <div>
                    <div className="font-bold text-white text-sm">Verified Customer</div>
                    <div className="text-xs text-slate-400">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>


        {/* --- Final CTA --- */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-cyan-500/20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-64 bg-indigo-500/30 blur-[100px] rounded-full"></div>
          
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-6xl font-extrabold mb-6 text-white tracking-tight">Ready to modernize your operations?</h2>
            <p className="text-xl text-indigo-100/80 mb-10 max-w-2xl mx-auto">
              Join hundreds of businesses managing inventory, procurement, sales, and finance from one platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="h-14 px-8 rounded-full bg-white text-[#030B24] text-base font-bold inline-flex items-center justify-center gap-2 hover:bg-slate-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:-translate-y-1">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* --- Footer --- */}
      <footer className="border-t border-white/10 bg-[#030B24] pt-20 pb-10 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <Image src="/branding/logos/logo-dark.svg" alt="Opsvera Logo" width={140} height={32} className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity" />
              </Link>
              <p className="text-slate-400 text-sm max-w-xs mb-6">
                The modern ERP platform for high-performance operations teams.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href="#features" onClick={(e) => handleScroll(e, 'features')} className="hover:text-white transition-colors cursor-pointer">Features</a></li>
                <li><a href="#integrations" onClick={(e) => handleScroll(e, 'integrations')} className="hover:text-white transition-colors cursor-pointer">Integrations</a></li>
                <li><Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-white transition-colors">API Reference</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/community" className="hover:text-white transition-colors">Community</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Opsvera Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
