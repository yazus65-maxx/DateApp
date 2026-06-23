import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import CONFIG from "@/config";

/* ─── Animation Variants ─── */
const stepVariants = {
  enter: (dir = 1) => ({ opacity: 0, x: dir * 60 }),
  center: { opacity: 1, x: 0 },
  exit: (dir = 1) => ({ opacity: 0, x: dir * -60 }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.3, ease: "easeOut" },
  }),
};

/* ─── Helpers ─── */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

/* ─── Main Component ─── */
export default function Home() {
  const router = useRouter();

  // ─── Step State ───
  const [step, setStep] = useState(0); // 0=intro, 1=location, 2=datetime, 3=dishes, 4=review
  const [agreed, setAgreed] = useState(false);

  // ─── Selection State ───
  const [location, setLocation] = useState(null); // preset object or { id: "custom", title: user input }
  const [locationType, setLocationType] = useState("preset"); // "preset" | "custom"
  const [customLocation, setCustomLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [dishes, setDishes] = useState(null);
  const [dishType, setDishType] = useState("preset"); // "preset" | "custom"
  const [customDish, setCustomDish] = useState("");

  // ─── UI State ───
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noCaught, setNoCaught] = useState(false);
  const [noAttempts, setNoAttempts] = useState(0);
  const [direction, setDirection] = useState(1);
  const [noPos, setNoPos] = useState({ x: 0, y: 0 });
  const [noMounted, setNoMounted] = useState(false);

  const noRef = useRef(null);
  const noContainerRef = useRef(null);

  // Generate a truly random position across the full viewport
  // Biases toward edges and avoids the center to make the button feel evasive
  const getRandomPosition = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const btnW = 120;
    const btnH = 48;
    const margin = 16;

    // Zone weighting: 70% chance of edge zones, 30% chance of anywhere
    const strategy = Math.random();

    let x, y;

    if (strategy < 0.18) {
      // Far left strip
      x = margin + Math.random() * (vw * 0.15);
      y = margin + Math.random() * (vh - btnH - margin * 2);
    } else if (strategy < 0.36) {
      // Far right strip
      x = vw - btnW - margin - Math.random() * (vw * 0.15);
      y = margin + Math.random() * (vh - btnH - margin * 2);
    } else if (strategy < 0.50) {
      // Top strip
      x = margin + Math.random() * (vw - btnW - margin * 2);
      y = margin + Math.random() * (vh * 0.15);
    } else if (strategy < 0.64) {
      // Bottom strip
      x = margin + Math.random() * (vw - btnW - margin * 2);
      y = vh - btnH - margin - Math.random() * (vh * 0.15);
    } else if (strategy < 0.72) {
      // Top-left corner
      x = margin + Math.random() * (vw * 0.2);
      y = margin + Math.random() * (vh * 0.2);
    } else if (strategy < 0.80) {
      // Top-right corner
      x = vw - btnW - margin - Math.random() * (vw * 0.2);
      y = margin + Math.random() * (vh * 0.2);
    } else if (strategy < 0.88) {
      // Bottom-left corner
      x = margin + Math.random() * (vw * 0.2);
      y = vh - btnH - margin - Math.random() * (vh * 0.2);
    } else if (strategy < 0.96) {
      // Bottom-right corner
      x = vw - btnW - margin - Math.random() * (vw * 0.2);
      y = vh - btnH - margin - Math.random() * (vh * 0.2);
    } else {
      // Wild card: anywhere on screen (excluding center)
      x = margin + Math.random() * (vw - btnW - margin * 2);
      y = margin + Math.random() * (vh - btnH - margin * 2);
    }

    // Clamp within screen
    x = Math.max(margin, Math.min(x, vw - btnW - margin));
    y = Math.max(margin, Math.min(y, vh - btnH - margin));

    return { x: Math.round(x), y: Math.round(y) };
  }, []);

  // ─── Dodging No Button ───
  const handleNoHover = useCallback(() => {
    setNoAttempts((p) => p + 1);
    const pos = getRandomPosition();
    setNoPos(pos);
    setNoMounted(true);
  }, [getRandomPosition]);

  // Keep legacy ref logic for container-relative fallback
  const handleNoMouseEnter = handleNoHover;

  const handleNoClick = useCallback(() => {
    setNoCaught(true);
    setNoMounted(false);
  }, []);

  const handleYesIntro = useCallback(() => {
    // Clear any stale session data from a previous session
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("dateSelections");
    }
    setAgreed(true);
    setNoCaught(false);
    setNoMounted(false);
    setDirection(1);
    setStep(1);
  }, []);

  // ─── Navigation ───
  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 4));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
    setError(null);
  }, []);

  // ─── Confirm Handler ───
  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    const locationTitle =
      locationType === "custom" ? customLocation : location?.title;
    const dishTitle =
      dishType === "custom" ? customDish : dishes?.title;
    const dateTimeStr = date && time ? `${formatDate(date)} at ${formatTime(time)}` : "";

    try {
      const res = await fetch(CONFIG.api.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: locationTitle,
          datetime: dateTimeStr,
          dishes: dishTitle,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "dateSelections",
          JSON.stringify({
            location: { title: locationTitle },
            date: formatDate(date),
            time: formatTime(time),
            dateRaw: date,
            timeRaw: time,
            dishes: { title: dishTitle },
          })
        );
      }

      router.push("/confirmation");
    } catch {
      setError(CONFIG.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ─── Derived ───
  const locationReady = locationType === "custom" ? customLocation.trim() !== "" : location !== null;
  const datetimeReady = date !== "" && time !== "";
  const dishesReady = dishType === "custom" ? customDish.trim() !== "" : dishes !== null;
  const allReady = locationReady && datetimeReady && dishesReady;

  const totalSteps = CONFIG.steps.length; // 5

  return (
    <div className="min-h-screen px-4 py-6 pb-20 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-lg">
        {/* ─── Progress Indicator ─── */}
        {agreed && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              {CONFIG.steps.map((s, i) => {
                if (s.id === "intro") return null; // skip intro in progress
                const isActive = step === i;
                const isDone = step > i;
                return (
                  <div key={s.id} className="flex flex-1 items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                          isDone
                            ? "bg-rose-400 text-white"
                            : isActive
                            ? "border-2 border-rose-400 bg-rose-50 text-rose-500"
                            : "border-2 border-rose-200 bg-white text-rose-300"
                        }`}
                      >
                        {isDone ? "✓" : s.number}
                      </div>
                      <span
                        className={`mt-1 text-[10px] font-medium whitespace-nowrap ${
                          isActive ? "text-rose-500" : "text-rose-300"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {i < totalSteps - 1 && (
                      <div
                        className={`mx-1 mt-[-1.25rem] h-[2px] flex-1 rounded transition-all duration-300 ${
                          isDone ? "bg-rose-400" : "bg-rose-100"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ─── Step Content ─── */}
        <AnimatePresence mode="wait" custom={direction}>
          {/* ═══════ STEP 0: INTRO ═══════ */}
          {step === 0 && !agreed && (
            <motion.div
              key="intro"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
              className="flex min-h-[60vh] flex-col items-center justify-center text-center"
            >
              {/* Big floating heart */}
              <motion.div
                className="mb-4 text-6xl"
                animate={{ scale: [1, 1.12, 1], rotate: [0, -4, 4, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                💕
              </motion.div>

              <motion.p
                className="mb-2 text-sm font-semibold tracking-widest uppercase text-rose-400"
                variants={fadeUp}
                custom={1}
              >
                {CONFIG.intro.greeting}
              </motion.p>

              <motion.h1
                className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 bg-clip-text text-3xl font-bold leading-tight text-transparent sm:text-4xl"
                variants={fadeUp}
                custom={2}
              >
                {CONFIG.intro.question}
              </motion.h1>

              <motion.p
                className="mt-3 text-base text-rose-700/70"
                variants={fadeUp}
                custom={3}
              >
                {CONFIG.intro.subtitle}
              </motion.p>

              {/* Extra anticipation lines */}
              <motion.div
                className="mt-4 space-y-1.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              >
                {CONFIG.intro.extraLines.map((line, i) => (
                  <motion.p
                    key={i}
                    className="text-sm text-rose-500/80 italic"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 + i * 0.2, duration: 0.4 }}
                  >
                    {line}
                  </motion.p>
                ))}
              </motion.div>

              {/* Floating decorative emojis */}
              <motion.div
                className="mt-5 flex justify-center gap-3 text-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.6 }}
              >
                {["🌸", "✨", "💖", "🌙", "⭐", "🌹"].map((emoji, i) => (
                  <motion.span
                    key={emoji}
                    animate={{ y: [0, -8, 0], rotate: [0, i % 2 === 0 ? 8 : -8, 0] }}
                    transition={{
                      duration: 2 + i * 0.3,
                      repeat: Infinity,
                      delay: i * 0.35,
                      ease: "easeInOut",
                    }}
                  >
                    {emoji}
                  </motion.span>
                ))}
              </motion.div>

              {/* ─── Yes / No Buttons ─── */}
              <motion.div
                className="relative mt-10 w-full max-w-xs"
                variants={fadeUp}
                custom={5}
              >
                {noCaught ? (
                  <motion.div
                    className="rounded-2xl bg-rose-50/80 p-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <p className="mb-1 text-3xl">🥺✨</p>
                    <p className="text-lg font-semibold text-rose-600">
                      {CONFIG.intro.noCaughtMessage}
                    </p>
                    <p className="mt-1 text-sm text-rose-400">
                      {CONFIG.intro.noCaughtSubtext}
                    </p>
                    <motion.button
                      onClick={handleYesIntro}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-base font-semibold text-white shadow-md shadow-rose-300/50 transition-all hover:shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {CONFIG.intro.yesLabel}
                    </motion.button>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    {/* Yes button */}
                    <motion.button
                      onClick={handleYesIntro}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-rose-300/50 transition-all hover:shadow-xl hover:shadow-rose-300/60"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      {CONFIG.intro.yesLabel}
                    </motion.button>

                    {/* No button — floats to screen corners */}
                    <AnimatePresence mode="popLayout">
                      {!noMounted ? (
                        <motion.button
                          key="no-initial"
                          onClick={handleNoClick}
                          onMouseEnter={handleNoHover}
                          onTouchStart={(e) => { e.preventDefault(); handleNoHover(); }}
                          className="cursor-pointer rounded-xl border-2 border-rose-200 bg-white/70 px-7 py-2.5 text-sm font-medium text-rose-400 transition-colors hover:border-rose-300 hover:bg-rose-50/50"
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {CONFIG.intro.noLabel} 🙅
                        </motion.button>
                      ) : (
                        <motion.button
                          key="no-floating"
                          onClick={handleNoClick}
                          onMouseEnter={handleNoHover}
                          onTouchStart={(e) => { e.preventDefault(); handleNoHover(); }}
                          className="fixed z-50 cursor-pointer rounded-xl border-2 border-rose-300 bg-white/90 px-7 py-2.5 text-sm font-medium text-rose-400 shadow-lg backdrop-blur-sm hover:border-rose-400"
                          style={{ pointerEvents: "auto" }}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ x: noPos.x, y: noPos.y, opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 220, damping: 18 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {CONFIG.intro.noLabel} 🙅
                        </motion.button>
                      )}
                    </AnimatePresence>

                    {/* Dodge messages */}
                    <AnimatePresence mode="wait">
                      {noAttempts > 0 && noAttempts <= CONFIG.intro.noDodgeMessages.length && (
                        <motion.p
                          className="text-sm text-rose-400 font-medium"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          key={noAttempts}
                        >
                          {CONFIG.intro.noDodgeMessages[noAttempts - 1]}
                        </motion.p>
                      )}
                      {noAttempts > CONFIG.intro.noDodgeMessages.length && (
                        <motion.p
                          className="text-sm font-semibold text-rose-500"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          key="persistent"
                        >
                          You know you want to say yes… 😄✨ Keep trying!
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}

          {/* ═══════ STEP 1: LOCATION ═══════ */}
          {step === 1 && agreed && (
            <motion.div
              key="location"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
            >
              <div className="mb-6 text-center">
                <motion.span className="mb-2 inline-block text-3xl" variants={fadeUp} custom={0}>
                  📍
                </motion.span>
                <motion.h2
                  className="text-2xl font-bold text-rose-800"
                  variants={fadeUp}
                  custom={1}
                >
                  Pick the Location
                </motion.h2>
                <motion.p
                  className="mt-1 text-sm text-rose-500"
                  variants={fadeUp}
                  custom={2}
                >
                  Choose a spot or type your own
                </motion.p>
              </div>

              {/* Preset location cards */}
              <div className="mb-4 grid gap-3">
                {CONFIG.locations.map((loc, i) => (
                  <motion.button
                    key={loc.id}
                    onClick={() => {
                      setLocation(loc);
                      setLocationType("preset");
                    }}
                    className={`group relative w-full rounded-2xl border-2 p-4 text-left shadow-sm transition-all duration-200 sm:p-5 ${
                      locationType === "preset" && location?.id === loc.id
                        ? "border-rose-400 bg-rose-50 shadow-md shadow-rose-200/50"
                        : "border-rose-100/60 bg-white/70 hover:border-rose-200 hover:bg-rose-50/50 hover:shadow-md"
                    }`}
                    variants={scaleIn}
                    initial="hidden"
                    animate="visible"
                    custom={i}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-2xl transition-transform duration-200 group-hover:scale-110">
                        {loc.emoji}
                      </span>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-rose-800 sm:text-lg">
                          {loc.title}
                        </h3>
                        <p className="mt-0.5 text-sm leading-relaxed text-rose-600/70">
                          {loc.description}
                        </p>
                      </div>
                      {locationType === "preset" && location?.id === loc.id && (
                        <motion.span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-400 text-sm text-white"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        >
                          ✓
                        </motion.span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Custom location input */}
              <motion.div
                className={`rounded-2xl border-2 p-4 shadow-sm transition-all sm:p-5 ${
                  locationType === "custom"
                    ? "border-rose-400 bg-rose-50 shadow-md shadow-rose-200/50"
                    : "border-rose-100/60 bg-white/70"
                }`}
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                custom={4}
              >
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="locationType"
                    checked={locationType === "custom"}
                    onChange={() => {
                      setLocationType("custom");
                      setLocation(null);
                    }}
                    className="h-4 w-4 accent-rose-400"
                  />
                  <span className="text-sm font-medium text-rose-700">Somewhere else…</span>
                </label>
                {locationType === "custom" && (
                  <motion.input
                    type="text"
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    placeholder="Type your dream spot… 💭"
                    className="mt-3 w-full rounded-xl border border-rose-200 bg-white/80 px-4 py-3 text-sm text-rose-800 placeholder-rose-300 outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    autoFocus
                  />
                )}
              </motion.div>

              {/* Navigation */}
              <StepNav
                onBack={goBack}
                onNext={goNext}
                nextDisabled={!locationReady}
                nextLabel="Next →"
              />
            </motion.div>
          )}

          {/* ═══════ STEP 2: DATE & TIME ═══════ */}
          {step === 2 && agreed && (
            <motion.div
              key="datetime"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
            >
              <div className="mb-6 text-center">
                <motion.span
                  className="mb-2 inline-block text-4xl"
                  animate={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  🗓️
                </motion.span>
                <motion.h2
                  className="text-2xl font-bold text-rose-800"
                  variants={fadeUp}
                  custom={1}
                >
                  Choose When
                </motion.h2>
                <motion.p
                  className="mt-1 text-sm text-rose-500"
                  variants={fadeUp}
                  custom={2}
                >
                  Pick a date & time that works for us 💫
                </motion.p>
              </div>

              {/* ─── Romantic Date Picker ─── */}
              <motion.div
                className="space-y-4"
                variants={fadeUp}
                custom={0}
              >
                {/* Date Selection */}
                <div
                  className="overflow-hidden rounded-2xl shadow-md"
                  style={{
                    background: "linear-gradient(135deg, #fff5f7 0%, #fff0f5 100%)",
                    border: "1.5px solid #fbc8d4",
                  }}
                >
                  <div
                    className="flex items-center gap-2 px-5 py-3"
                    style={{
                      background: "linear-gradient(90deg, #fb7185 0%, #f43f5e 100%)",
                    }}
                  >
                    <span className="text-lg">📅</span>
                    <span className="text-sm font-semibold text-white tracking-wide">Select a Date</span>
                  </div>
                  <div className="px-5 py-4">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full rounded-xl px-4 py-3 text-sm font-medium text-rose-800 outline-none transition-all focus:ring-2 focus:ring-rose-300"
                      style={{
                        background: "rgba(255,255,255,0.85)",
                        border: "1.5px solid #fda4af",
                        colorScheme: "light",
                      }}
                    />
                    <AnimatePresence>
                      {date && (
                        <motion.div
                          className="mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5"
                          style={{ background: "linear-gradient(90deg, #ffe4e6, #fdf2f8)" }}
                          initial={{ opacity: 0, y: 6, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -6, height: 0 }}
                        >
                          <span className="text-base">🌸</span>
                          <p className="text-xs font-semibold text-rose-600">
                            {formatDate(date)}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Time Selection */}
                <div
                  className="overflow-hidden rounded-2xl shadow-md"
                  style={{
                    background: "linear-gradient(135deg, #fff5f7 0%, #fff0f5 100%)",
                    border: "1.5px solid #fbc8d4",
                  }}
                >
                  <div
                    className="flex items-center gap-2 px-5 py-3"
                    style={{
                      background: "linear-gradient(90deg, #ec4899 0%, #db2777 100%)",
                    }}
                  >
                    <span className="text-lg">⏰</span>
                    <span className="text-sm font-semibold text-white tracking-wide">Pick a Time</span>
                  </div>
                  <div className="px-5 py-4">
                    {/* Custom time picker with hour buttons */}
                    <RomanticTimePicker value={time} onChange={setTime} />
                    <AnimatePresence>
                      {time && (
                        <motion.div
                          className="mt-3 flex items-center gap-2 rounded-xl px-4 py-2.5"
                          style={{ background: "linear-gradient(90deg, #fce7f3, #fdf2f8)" }}
                          initial={{ opacity: 0, y: 6, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -6, height: 0 }}
                        >
                          <span className="text-base">✨</span>
                          <p className="text-xs font-semibold text-rose-600">
                            Meeting at {formatTime(time)}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

              <StepNav
                onBack={goBack}
                onNext={goNext}
                nextDisabled={!datetimeReady}
                nextLabel="Next →"
              />
            </motion.div>
          )}

          {/* ═══════ STEP 3: DISHES ═══════ */}
          {step === 3 && agreed && (
            <motion.div
              key="dishes"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
            >
              <div className="mb-6 text-center">
                <motion.span
                  className="mb-2 inline-block text-4xl"
                  animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  🍽️
                </motion.span>
                <motion.h2
                  className="text-2xl font-bold text-rose-800"
                  variants={fadeUp}
                  custom={1}
                >
                  What to Eat?
                </motion.h2>
                <motion.p
                  className="mt-1 text-sm text-rose-500"
                  variants={fadeUp}
                  custom={2}
                >
                  Pick something delicious for our date 🥰
                </motion.p>
              </div>

              {/* Food card grid */}
              <div className="mb-4 grid grid-cols-2 gap-3">
                {CONFIG.dishes.map((dish, i) => (
                  <motion.button
                    key={dish.id}
                    onClick={() => { setDishes(dish); setDishType("preset"); }}
                    className="group relative flex flex-col items-center rounded-2xl p-4 text-center shadow-sm transition-all duration-200"
                    style={{
                      background: dishType === "preset" && dishes?.id === dish.id
                        ? "linear-gradient(135deg, #ffe4e6 0%, #fce7f3 100%)"
                        : "rgba(255,255,255,0.75)",
                      border: dishType === "preset" && dishes?.id === dish.id
                        ? "2px solid #fb7185"
                        : "2px solid rgba(251,207,232,0.5)",
                      boxShadow: dishType === "preset" && dishes?.id === dish.id
                        ? "0 4px 20px rgba(244,63,94,0.18)"
                        : "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                    variants={scaleIn}
                    initial="hidden"
                    animate="visible"
                    custom={i}
                    whileHover={{ scale: 1.04, y: -3 }}
                    whileTap={{ scale: 0.96 }}
                  >
                    {/* Selected glow */}
                    {dishType === "preset" && dishes?.id === dish.id && (
                      <motion.div
                        className="absolute inset-0 rounded-2xl"
                        style={{
                          background: "radial-gradient(circle at 50% 0%, rgba(244,63,94,0.13) 0%, transparent 70%)",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      />
                    )}

                    {/* Emoji */}
                    <motion.span
                      className="mb-2 text-4xl"
                      animate={dishType === "preset" && dishes?.id === dish.id ? { scale: [1, 1.15, 1] } : {}}
                      transition={{ duration: 0.4 }}
                    >
                      {dish.emoji}
                    </motion.span>

                    <h3
                      className="text-sm font-bold"
                      style={{ color: dishType === "preset" && dishes?.id === dish.id ? "#e11d48" : "#9f1239" }}
                    >
                      {dish.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed" style={{ color: "#fb7185" }}>
                      {dish.description}
                    </p>

                    {/* Checkmark badge */}
                    {dishType === "preset" && dishes?.id === dish.id && (
                      <motion.div
                        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-xs text-white"
                        style={{ background: "linear-gradient(135deg, #f43f5e, #ec4899)" }}
                        initial={{ scale: 0, rotate: -30 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Custom food input */}
              <motion.div
                className={`rounded-2xl border-2 p-4 shadow-sm transition-all sm:p-5 ${
                  dishType === "custom"
                    ? "border-rose-400 bg-rose-50 shadow-md shadow-rose-200/50"
                    : "border-rose-100/60 bg-white/70"
                }`}
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                custom={CONFIG.dishes.length}
              >
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="radio"
                    name="dishType"
                    checked={dishType === "custom"}
                    onChange={() => {
                      setDishType("custom");
                      setDishes(null);
                    }}
                    className="h-4 w-4 accent-rose-400"
                  />
                  <span className="text-sm font-medium text-rose-700">Something else… 🍴</span>
                </label>
                {dishType === "custom" && (
                  <motion.input
                    type="text"
                    value={customDish}
                    onChange={(e) => setCustomDish(e.target.value)}
                    placeholder="Type your dream food… 🤤"
                    className="mt-3 w-full rounded-xl border border-rose-200 bg-white/80 px-4 py-3 text-sm text-rose-800 placeholder-rose-300 outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    autoFocus
                  />
                )}
              </motion.div>

              <StepNav
                onBack={goBack}
                onNext={goNext}
                nextDisabled={!dishesReady}
                nextLabel="Review →"
              />
            </motion.div>
          )}

          {/* ═══════ STEP 4: REVIEW & CONFIRM ═══════ */}
          {step === 4 && agreed && (
            <motion.div
              key="review"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35 }}
            >
              <div className="mb-6 text-center">
                <motion.span className="mb-2 inline-block text-4xl" variants={fadeUp} custom={0}>
                  💝
                </motion.span>
                <motion.h2
                  className="text-2xl font-bold text-rose-800"
                  variants={fadeUp}
                  custom={1}
                >
                  Your Date Plan
                </motion.h2>
                <motion.p
                  className="mt-1 text-sm text-rose-500"
                  variants={fadeUp}
                  custom={2}
                >
                  Does everything look perfect?
                </motion.p>
              </div>

              {/* Summary Cards */}
              <motion.div className="mb-6 space-y-3" variants={fadeUp} custom={0}>
                {/* Location */}
                <div className="flex items-center gap-3 rounded-xl border border-rose-100/60 bg-white/70 p-4 shadow-sm">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-xl">
                    📍
                  </span>
                  <div>
                    <p className="text-xs font-medium text-rose-400">Location</p>
                    <p className="text-sm font-semibold text-rose-800">
                      {locationType === "custom" ? customLocation : location?.title}
                    </p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-center gap-3 rounded-xl border border-rose-100/60 bg-white/70 p-4 shadow-sm">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-100 text-xl">
                    🕐
                  </span>
                  <div>
                    <p className="text-xs font-medium text-rose-400">Date & Time</p>
                    <p className="text-sm font-semibold text-rose-800">
                      {formatDate(date)} at {formatTime(time)}
                    </p>
                  </div>
                </div>

                {/* Dishes */}
                <div className="flex items-center gap-3 rounded-xl border border-rose-100/60 bg-white/70 p-4 shadow-sm">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-xl">
                    🍽️
                  </span>
                  <div>
                    <p className="text-xs font-medium text-rose-400">Dishes</p>
                    <p className="text-sm font-semibold text-rose-800">
                      {dishType === "custom" ? customDish : dishes?.title}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    className="mb-4 text-center text-sm font-medium text-rose-500"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Confirm Button */}
              <motion.div className="text-center" variants={fadeUp} custom={1}>
                <motion.button
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-lg font-semibold shadow-lg transition-all duration-200 sm:px-10 sm:py-4 sm:text-xl ${
                    !loading
                      ? "bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 text-white shadow-rose-300/50 hover:shadow-xl hover:shadow-rose-300/60 active:scale-95"
                      : "cursor-not-allowed bg-rose-200/60 text-rose-400"
                  }`}
                  whileHover={!loading ? { scale: 1.03 } : {}}
                  whileTap={!loading ? { scale: 0.96 } : {}}
                >
                  {loading ? (
                    <>
                      <svg
                        className="h-5 w-5 animate-spin text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Saving…
                    </>
                  ) : (
                    "Confirm the Date 🎉"
                  )}
                </motion.button>

                <motion.button
                  onClick={goBack}
                  className="mt-4 block w-full text-center text-sm font-medium text-rose-400 transition-colors hover:text-rose-500"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  ← Go back
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Footer ─── */}
        {agreed && step < 4 && (
          <motion.p
            className="mt-12 text-center text-xs text-rose-300/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            made with <span className="text-rose-400">♥</span> just for you
          </motion.p>
        )}
      </div>
    </div>
  );
}

/* ─── Step Navigation Sub-component ─── */
function StepNav({ onBack, onNext, nextDisabled, nextLabel }) {
  return (
    <motion.div
      className="mt-8 flex items-center justify-between gap-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.3 }}
    >
      <motion.button
        onClick={onBack}
        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-white/70 px-5 py-3 text-sm font-medium text-rose-500 shadow-sm transition-all hover:border-rose-300 hover:bg-rose-50/50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        ← Back
      </motion.button>

      <motion.button
        onClick={onNext}
        disabled={nextDisabled}
        className={`inline-flex items-center gap-1 rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition-all ${
          !nextDisabled
            ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-rose-300/50 hover:shadow-md active:scale-95"
            : "cursor-not-allowed bg-rose-200/60 text-rose-400"
        }`}
        whileHover={!nextDisabled ? { scale: 1.03 } : {}}
        whileTap={!nextDisabled ? { scale: 0.96 } : {}}
      >
        {nextLabel}
      </motion.button>
    </motion.div>
  );
}

/* ─── Romantic Time Picker Sub-component ─── */
function RomanticTimePicker({ value, onChange }) {
  const parseHour = (v) => {
    if (!v) return "";
    const h = parseInt(v.split(":")[0], 10);
    const mod = h % 12;
    return mod === 0 ? 12 : mod;
  };
  const parseMinute = (v) => {
    if (!v) return "00";
    return v.split(":")[1] || "00";
  };
  const parseAmpm = (v) => {
    if (!v) return "AM";
    const h = parseInt(v.split(":")[0], 10);
    return h >= 12 ? "PM" : "AM";
  };

  const [hour, setHour] = useState(() => parseHour(value));
  const [minute, setMinute] = useState(() => parseMinute(value));
  const [ampm, setAmpm] = useState(() => parseAmpm(value));

  useEffect(() => {
    if (hour === "") return;
    const h = parseInt(hour, 10);
    let h24 = h;
    if (ampm === "PM" && h !== 12) h24 = h + 12;
    if (ampm === "AM" && h === 12) h24 = 0;
    const timeStr = `${String(h24).padStart(2, "0")}:${minute}`;
    onChange(timeStr);
  }, [hour, minute, ampm, onChange]);

  const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutes = ["00", "15", "30", "45"];

  const activeStyle = {
    background: "linear-gradient(135deg, #f43f5e, #ec4899)",
    color: "#fff",
    border: "none",
    boxShadow: "0 2px 12px rgba(244,63,94,0.35)",
  };
  const inactiveStyle = {
    background: "rgba(255,255,255,0.85)",
    color: "#be185d",
    border: "1.5px solid #fda4af",
  };

  return (
    <div className="space-y-4">
      {/* Hour row */}
      <div>
        <p className="mb-2 text-xs font-semibold text-rose-500 tracking-wide uppercase">Hour</p>
        <div className="flex flex-wrap gap-2">
          {hours.map((h) => (
            <motion.button
              key={h}
              type="button"
              onClick={() => setHour(h)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition-all"
              style={hour === h ? activeStyle : inactiveStyle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {h}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Minute row */}
      <div>
        <p className="mb-2 text-xs font-semibold text-rose-500 tracking-wide uppercase">Minute</p>
        <div className="flex gap-2">
          {minutes.map((m) => (
            <motion.button
              key={m}
              type="button"
              onClick={() => setMinute(m)}
              className="flex h-9 w-14 items-center justify-center rounded-xl text-sm font-semibold transition-all"
              style={minute === m ? activeStyle : inactiveStyle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              :{m}
            </motion.button>
          ))}
        </div>
      </div>

      {/* AM / PM toggle */}
      <div>
        <p className="mb-2 text-xs font-semibold text-rose-500 tracking-wide uppercase">AM / PM</p>
        <div
          className="inline-flex rounded-xl p-1"
          style={{ background: "rgba(255,255,255,0.85)", border: "1.5px solid #fda4af" }}
        >
          {["AM", "PM"].map((period) => (
            <motion.button
              key={period}
              type="button"
              onClick={() => setAmpm(period)}
              className="rounded-lg px-5 py-1.5 text-sm font-bold transition-all"
              style={ampm === period ? activeStyle : { background: "transparent", color: "#be185d" }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {period}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
