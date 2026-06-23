import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import CONFIG from "@/config";

export default function Confirmation() {
  const router = useRouter();
  const [selections, setSelections] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = sessionStorage.getItem("dateSelections");
    if (stored) {
      try {
        setSelections(JSON.parse(stored));
      } catch {
        // fallback
      }
    }
  }, []);

  const location = selections?.location;
  const date = selections?.date;
  const time = selections?.time;
  const dishes = selections?.dishes;

  // Build a datetime string for display
  const dateTimeDisplay = date && time ? `${date} at ${time}` : null;

  // Fallback for old single-page format
  const oldDatetime = selections?.datetime;

  // ─── Copy to Clipboard ───
  const handleCopyPlan = () => {
    const planText = [
      "💝 Date Plan 💝",
      "",
      location ? `📍 Location: ${location.title}` : "",
      dateTimeDisplay ? `🕐 Date & Time: ${dateTimeDisplay}` : oldDatetime ? `🕐 Date & Time: ${oldDatetime}` : "",
      dishes ? `🍽️ Dishes: ${dishes.title}` : "",
      "",
      "made with ♥ just for you",
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(planText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      const textarea = document.createElement("textarea");
      textarea.value = planText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="w-full max-w-md rounded-3xl border border-rose-100/60 bg-white/80 p-8 shadow-xl shadow-rose-200/30 backdrop-blur-sm sm:p-10"
        variants={containerVariants}
        initial="hidden"
        animate={mounted ? "visible" : "hidden"}
      >
        {/* ─── Celebration ─── */}
        <motion.div className="mb-6 text-center" variants={itemVariants}>
          <motion.div
            className="mb-4 text-6xl"
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
          >
            🎉
          </motion.div>

          <motion.h1
            className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl"
            variants={itemVariants}
          >
            {CONFIG.confirmation.title}
          </motion.h1>

          <motion.p
            className="mt-2 text-lg font-medium text-rose-600"
            variants={itemVariants}
          >
            {CONFIG.confirmation.message}
          </motion.p>
        </motion.div>

        {/* ─── Floating Hearts ─── */}
        <motion.div
          className="mb-8 flex justify-center gap-2 text-xl"
          variants={itemVariants}
        >
          {["❤️", "💕", "🌹", "💖", "🥰"].map((emoji, i) => (
            <motion.span
              key={emoji}
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </motion.div>

        {/* ─── Summary ─── */}
        <motion.div
          className="mb-8 space-y-3 rounded-2xl bg-rose-50/80 p-5 sm:p-6"
          variants={itemVariants}
        >
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-rose-400">
            {CONFIG.confirmation.subtitle}
          </p>

          {location && (
            <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-xl">
                📍
              </span>
              <div>
                <p className="text-xs text-rose-400">Location</p>
                <p className="text-sm font-semibold text-rose-800">
                  {location.title}
                </p>
              </div>
            </div>
          )}

          {(dateTimeDisplay || oldDatetime) && (
            <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-xl">
                🕐
              </span>
              <div>
                <p className="text-xs text-rose-400">Date & Time</p>
                <p className="text-sm font-semibold text-rose-800">
                  {dateTimeDisplay || oldDatetime}
                </p>
              </div>
            </div>
          )}

          {dishes && (
            <div className="flex items-center gap-3 rounded-xl bg-white/70 p-3 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xl">
                🍽️
              </span>
              <div>
                <p className="text-xs text-rose-400">Dishes</p>
                <p className="text-sm font-semibold text-rose-800">
                  {dishes.title}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* ─── Copy to Clipboard ─── */}
        <motion.div className="mb-6 text-center" variants={itemVariants}>
          <motion.button
            onClick={handleCopyPlan}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-rose-200 bg-white/80 px-6 py-3 text-sm font-semibold text-rose-500 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50 active:scale-95"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {copied ? (
              <>
                <span className="text-base">✅</span>
                Copied to clipboard!
              </>
            ) : (
              <>
                <span className="text-base">📋</span>
                Copy Plan
              </>
            )}
          </motion.button>
        </motion.div>

        {/* ─── Final Message ─── */}
        <motion.div className="text-center" variants={itemVariants}>
          <p className="text-sm leading-relaxed text-rose-600/80">
            I can&apos;t wait for our special night together.
            <br />
            It&apos;s going to be unforgettable 💫
          </p>

          <motion.button
            onClick={() => router.push("/")}
            className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-rose-400 transition-colors hover:text-rose-500"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            ← Plan a new date
          </motion.button>

          {/* Made just for you */}
          <motion.p
            className="mt-8 text-center text-xs text-rose-300/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            made with <span className="text-rose-400">♥</span> just for you
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
