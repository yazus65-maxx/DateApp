import { useState, useCallback, useRef } from "react";
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

  // ─── UI State ───
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noCaught, setNoCaught] = useState(false);
  const [noAttempts, setNoAttempts] = useState(0);
  const [direction, setDirection] = useState(1);

  const noRef = useRef(null);
  const noContainerRef = useRef(null);

  // ─── Dodging No Button ───
  const handleNoMouseEnter = useCallback(() => {
    setNoAttempts((p) => p + 1);
    const container = noContainerRef.current;
    if (!container) return;
    const { width, height } = container.getBoundingClientRect();
    const pad = 20;
    const btnW = 100;
    const btnH = 48;
    const maxX = width - btnW - pad;
    const maxY = height - btnH - pad;
    const rx = Math.max(pad, Math.min(maxX, Math.random() * maxX));
    const ry = Math.max(pad, Math.min(maxY, Math.random() * maxY));
    if (noRef.current) {
      noRef.current.style.position = "absolute";
      noRef.current.style.left = `${rx}px`;
      noRef.current.style.top = `${ry}px`;
      noRef.current.style.transition = "left 0.15s ease, top 0.15s ease";
    }
  }, []);

  const handleNoClick = useCallback(() => {
    setNoCaught(true);
  }, []);

  const handleYesIntro = useCallback(() => {
    // Clear any stale session data from a previous session
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("dateSelections");
    }
    setAgreed(true);
    setNoCaught(false);
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
    const dateTimeStr = date && time ? `${formatDate(date)} at ${formatTime(time)}` : "";

    try {
      const res = await fetch(CONFIG.api.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: locationTitle,
          datetime: dateTimeStr,
          dishes: dishes?.title,
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
            dishes: { title: dishes?.title },
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
  const dishesReady = dishes !== null;
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
              <motion.div className="mb-6 text-5xl" variants={fadeUp} custom={0}>
                💕
              </motion.div>
              <motion.p
                className="mb-2 text-sm font-medium tracking-widest uppercase text-rose-400"
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

              {/* floating decorations */}
              <motion.div
                className="mt-6 flex justify-center gap-3 text-2xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.6 }}
              >
                {["🌹", "✨", "💖", "⭐"].map((emoji, i) => (
                  <motion.span
                    key={emoji}
                    animate={{ y: [0, -6, 0] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.4,
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
                custom={4}
              >
                {noCaught ? (
                  <motion.div
                    className="rounded-2xl bg-rose-50/80 p-6"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <p className="mb-1 text-2xl">🥺</p>
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
                    {/* Yes button — big and prominent */}
                    <motion.button
                      onClick={handleYesIntro}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-rose-400 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-rose-300/50 transition-all hover:shadow-xl hover:shadow-rose-300/60"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      {CONFIG.intro.yesLabel}
                    </motion.button>

                    {/* No button — dodges cursor */}
                    <div
                      ref={noContainerRef}
                      className="relative h-12 w-full"
                    >
                      <button
                        ref={noRef}
                        onClick={handleNoClick}
                        onMouseEnter={handleNoMouseEnter}
                        onTouchStart={(e) => {
                          e.preventDefault();
                          setNoAttempts((p) => p + 1);
                          const container = noContainerRef.current;
                          if (!container) return;
                          const { width, height } = container.getBoundingClientRect();
                          const pad = 20;
                          const btnW = 100;
                          const btnH = 48;
                          const maxX = width - btnW - pad;
                          const maxY = height - btnH - pad;
                          const rx = Math.max(pad, Math.min(maxX, Math.random() * maxX));
                          const ry = Math.max(pad, Math.min(maxY, Math.random() * maxY));
                          if (noRef.current) {
                            noRef.current.style.position = "absolute";
                            noRef.current.style.left = `${rx}px`;
                            noRef.current.style.top = `${ry}px`;
                            noRef.current.style.transition = "left 0.2s ease, top 0.2s ease";
                          }
                        }}
                        className="absolute left-1/2 top-0 -translate-x-1/2 cursor-pointer rounded-xl border-2 border-rose-200 bg-white/70 px-6 py-2 text-sm font-medium text-rose-400 transition-colors hover:border-rose-300 hover:bg-rose-50/50"
                      >
                        {CONFIG.intro.noLabel}
                      </button>
                    </div>

                    {noAttempts > 0 && noAttempts <= 2 && (
                      <motion.p
                        className="text-sm text-rose-400"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={noAttempts}
                      >
                        {CONFIG.intro.noDodgeMessages[noAttempts - 1]}
                      </motion.p>
                    )}
                    {noAttempts > 2 && (
                      <motion.p
                        className="text-sm font-medium text-rose-500"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key="persistent"
                      >
                        You know you want to say yes… 😄
                      </motion.p>
                    )}
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
                <motion.span className="mb-2 inline-block text-3xl" variants={fadeUp} custom={0}>
                  🕐
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
                  Pick any date and time that works for you
                </motion.p>
              </div>

              <motion.div
                className="space-y-5 rounded-2xl bg-white/70 p-6 shadow-sm"
                variants={fadeUp}
                custom={0}
              >
                {/* Date Picker */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-rose-700">
                    📅 Select a Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-xl border border-rose-200 bg-white/80 px-4 py-3 text-sm text-rose-800 outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
                  />
                  {date && (
                    <motion.p
                      className="mt-1.5 text-xs font-medium text-rose-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {formatDate(date)}
                    </motion.p>
                  )}
                </div>

                {/* Time Picker */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-rose-700">
                    ⏰ Pick a Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-xl border border-rose-200 bg-white/80 px-4 py-3 text-sm text-rose-800 outline-none transition-all focus:border-rose-400 focus:ring-2 focus:ring-rose-200"
                  />
                  {time && (
                    <motion.p
                      className="mt-1.5 text-xs font-medium text-rose-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {formatTime(time)}
                    </motion.p>
                  )}
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
                <motion.span className="mb-2 inline-block text-3xl" variants={fadeUp} custom={0}>
                  🍽️
                </motion.span>
                <motion.h2
                  className="text-2xl font-bold text-rose-800"
                  variants={fadeUp}
                  custom={1}
                >
                  What to Eat
                </motion.h2>
                <motion.p
                  className="mt-1 text-sm text-rose-500"
                  variants={fadeUp}
                  custom={2}
                >
                  Pick something delicious 🥰
                </motion.p>
              </div>

              <div className="mb-4 grid gap-3">
                {CONFIG.dishes.map((dish, i) => (
                  <motion.button
                    key={dish.id}
                    onClick={() => setDishes(dish)}
                    className={`group relative w-full rounded-2xl border-2 p-4 text-left shadow-sm transition-all duration-200 sm:p-5 ${
                      dishes?.id === dish.id
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
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-2xl transition-transform duration-200 group-hover:scale-110">
                        {dish.emoji}
                      </span>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-rose-800 sm:text-lg">
                          {dish.title}
                        </h3>
                        <p className="mt-0.5 text-sm leading-relaxed text-rose-600/70">
                          {dish.description}
                        </p>
                      </div>
                      {dishes?.id === dish.id && (
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
                      {dishes?.title}
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
