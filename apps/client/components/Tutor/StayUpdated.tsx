import { useState } from "react";

const StayUpdated = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Subscribing email:", email);
    setEmail("")
  };

  return (
    <section className="stay-updated-section md:hidden relative w-full py-20 px-6 bg-[#0a0a0a]/90">
      <div className="relative z-10 flex flex-col items-center">
        <h2 className="text-white font-black text-2xl mb-3 text-center">
          Stay Updated
        </h2>
        <p className="text-white/40 text-lg text-center mb-12 max-w-xs leading-relaxed">
          Get weekly crypto insights and exclusive offers
        </p>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
          <div className="w-full">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-3 px-10 bg-[#080808] border border-white/5 rounded-full text-white placeholder:text-white/20 focus:outline-none focus:border-primary/40 transition-all text-lg shadow-inner"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#ff9900] hover:bg-[#ffaa22] text-black text-center font-black text-xl rounded-full transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            Subscribe
          </button>
        </form>

        <p className="mt-10 text-white/30 text-[13px] font-medium text-center">
          Join 25,000+ subscribers. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
};

export default StayUpdated;
