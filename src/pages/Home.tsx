import { useRef } from "react";
import { Link } from "react-router";
import Navigation from "@/components/Navigation";
import CommissionModal from "@/components/CommissionModal";
import ChatWidget from "@/components/ChatWidget";
import { Button } from "@/components/ui/button";
import { ArrowRight, PenTool, Layers, Clock, Eye, FileText, Palette, Send, LayoutDashboard } from "lucide-react";

const portfolioItems = [
  { img: "/portfolio-1.jpg", title: "Geometric Portraiture", client: "Visionary Quarterly", category: "Editorial Illustration" },
  { img: "/portfolio-2.jpg", title: "Verve & Line", client: "Modern Fashion", category: "Magazine Layout" },
  { img: "/portfolio-3.jpg", title: "Institute of Contemporary Arts", client: "ICA Berlin", category: "Cultural Poster" },
  { img: "/portfolio-4.jpg", title: "Novus Identity System", client: "Novus Studio", category: "Brand Identity" },
  { img: "/portfolio-5.jpg", title: "The Whispering Root", client: "Penguin Books", category: "Book Cover" },
  { img: "/portfolio-6.jpg", title: "Global Market Trends", client: "The Economist", category: "Data Visualization" },
];

const services = [
  { icon: PenTool, title: "Editorial Illustration", desc: "Custom illustrations for magazines, newspapers, and digital publications. Bold concepts with print-ready execution." },
  { icon: Layers, title: "Art Direction", desc: "Visual storytelling from concept to completion. We guide the aesthetic journey of your publication or campaign." },
  { icon: FileText, title: "Layout & Typography", desc: "Swiss-grid-informed spreads, book design, and typographic systems that command attention." },
  { icon: Palette, title: "Brand Identity", desc: "Logos, color systems, and comprehensive brand guidelines for cultural institutions and creative businesses." },
];

const timeline = [
  { step: "01", title: "Inquiry", desc: "Submit your brief through our commission portal. Include references, budget, and timeline." },
  { step: "02", title: "Review", desc: "We assess feasibility, clarify deliverables, and respond within 48 hours with a proposal." },
  { step: "03", title: "Development", desc: "Sketch rounds, color studies, and collaborative refinement until the work is approved." },
  { step: "04", title: "Delivery", desc: "Final files delivered in all requested formats with rights documentation included." },
];

export default function Home() {
  const modalRef = useRef<{ open: () => void }>(null);

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <ChatWidget />

      {/* Hero Section — Mondrian-inspired asymmetric grid */}
      <section className="relative min-h-screen pt-16">
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 bg-black p-1">
            {/* Main headline block */}
            <div className="lg:col-span-7 bg-white p-8 lg:p-12 flex flex-col justify-between min-h-[420px]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">
                  Illustration & Design Practice
                </p>
                <h1 className="text-5xl lg:text-7xl font-black leading-[0.9] tracking-tight uppercase">
                  Editorial<br />
                  <span className="text-[#e63946]">Commission</span><br />
                  Desk
                </h1>
              </div>
              <p className="text-sm leading-relaxed text-gray-600 max-w-md mt-6">
                We partner with magazines, brands, and publishers to create
                visual work that is bold, considered, and culturally relevant.
                From concept to press-ready file.
              </p>
            </div>

            {/* Right column */}
            <div className="lg:col-span-5 flex flex-col gap-1">
              <div className="bg-[#1d3557] p-6 lg:p-8 text-white flex-1 flex flex-col justify-between min-h-[200px]">
                <Eye className="w-6 h-6 opacity-60" />
                <p className="text-sm leading-relaxed">
                  A commission experience designed by people with real taste.
                  Transparent timelines. Clear rights. No surprises.
                </p>
              </div>
              <div className="relative overflow-hidden min-h-[200px]">
                <img
                  src="/hero-studio.jpg"
                  alt="Studio workspace"
                  className="w-full h-full object-cover absolute inset-0"
                />
              </div>
            </div>

            {/* Bottom row */}
            <div className="lg:col-span-4 bg-[#f4a261] p-6 lg:p-8 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest">
                Start a Project
              </span>
              <Button
                onClick={() => modalRef.current?.open()}
                className="bg-black text-white hover:bg-black/80 rounded-none text-xs uppercase tracking-widest"
              >
                <Send className="w-3 h-3 mr-2" />
                Commission
              </Button>
            </div>
            <div className="lg:col-span-4 bg-white p-6 lg:p-8 flex items-center">
              <p className="text-xs uppercase tracking-widest font-medium text-gray-500">
                Current availability: <span className="text-black">Q3 2026</span>
              </p>
            </div>
            <div className="lg:col-span-4 bg-black p-6 lg:p-8 text-white flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest opacity-60">
                View Work
              </span>
              <a href="#portfolio" className="hover:text-[#f4a261] transition-colors">
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">
                Selected Work
              </p>
              <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight">
                Portfolio
              </h2>
            </div>
            <div className="hidden lg:block w-24 h-[2px] bg-black" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 bg-black p-1">
            {portfolioItems.map((item, i) => (
              <div key={i} className="group relative bg-white overflow-hidden">
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="p-4 border-t border-black/10">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    {item.category}
                  </p>
                  <h3 className="text-sm font-bold uppercase tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{item.client}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">
                What We Do
              </p>
              <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight mb-4">
                Services
              </h2>
              <p className="text-sm leading-relaxed text-gray-600">
                Every project begins with a conversation. We tailor our process
                to your timeline, budget, and creative needs.
              </p>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-1 bg-black p-1">
              {services.map((service, i) => (
                <div key={i} className="bg-white p-8 group hover:bg-neutral-50 transition-colors">
                  <service.icon className="w-5 h-5 mb-4 text-[#e63946]" />
                  <h3 className="text-sm font-bold uppercase tracking-tight mb-2">
                    {service.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-gray-600">
                    {service.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline / Process Section */}
      <section id="process" className="py-24 bg-[#1d3557] text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-2">
              How It Works
            </p>
            <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight">
              The Commission Timeline
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/20">
            {timeline.map((item, i) => (
              <div key={i} className="bg-[#1d3557] p-8 group hover:bg-[#162d4a] transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-4xl font-black text-white/20">{item.step}</span>
                  <Clock className="w-4 h-4 text-[#f4a261]" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight mb-3">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-white/60">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 bg-black p-1">
            <div className="lg:col-span-8 bg-white p-12 lg:p-16 flex flex-col justify-center">
              <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tight mb-6">
                Ready to <span className="text-[#e63946]">start</span>?
              </h2>
              <p className="text-sm text-gray-600 max-w-md mb-8 leading-relaxed">
                Create an account to save drafts, track your commissions, and
                download project summaries. Or jump straight into a new inquiry.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => modalRef.current?.open()}
                  className="bg-black text-white hover:bg-black/80 rounded-none text-xs uppercase tracking-widest px-6 py-5"
                >
                  <Send className="w-3 h-3 mr-2" />
                  New Commission
                </Button>
                <Link to="/dashboard">
                  <Button
                    variant="outline"
                    className="rounded-none text-xs uppercase tracking-widest px-6 py-5 border-black"
                  >
                    <LayoutDashboard className="w-3 h-3 mr-2" />
                    Client Dashboard
                  </Button>
                </Link>
              </div>
            </div>
            <div className="lg:col-span-4 bg-[#e63946] p-8 flex flex-col justify-between text-white">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-60 mb-2">
                  Response Time
                </p>
                <p className="text-3xl font-black">48h</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest opacity-60 mb-2">
                  Projects Delivered
                </p>
                <p className="text-3xl font-black">340+</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest opacity-60 mb-2">
                  Client Retention
                </p>
                <p className="text-3xl font-black">92%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-tight mb-2">
                Editorial Commission Desk
              </p>
              <p className="text-xs text-white/40">
                Illustration & design practice for magazines, brands, and publishers.
              </p>
            </div>
            <div className="flex gap-8">
              <a href="#portfolio" className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors">
                Portfolio
              </a>
              <a href="#services" className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors">
                Services
              </a>
              <a href="#process" className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors">
                Process
              </a>
              <Link to="/dashboard" className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors">
                Dashboard
              </Link>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-white/30 uppercase tracking-widest">
              &copy; 2026 Editorial Commission Desk. All rights reserved.
            </p>
            <div className="flex gap-4">
              <span className="w-3 h-3 bg-[#e63946]" />
              <span className="w-3 h-3 bg-[#1d3557]" />
              <span className="w-3 h-3 bg-[#f4a261]" />
            </div>
          </div>
        </div>
      </footer>

      <CommissionModal ref={modalRef} />
    </div>
  );
}
