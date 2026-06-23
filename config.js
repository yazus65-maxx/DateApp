const CONFIG = {
  // ─── Playful Intro ───
  intro: {
    greeting: "My Love 💕",
    question: "Would you like to go out on a date?",
    subtitle: "I've got something special planned… 💫",
    yesLabel: "Yes! 💕",
    noLabel: "No",
    noCaughtMessage: "Please say yes 🥺",
    noCaughtSubtext: "You know you want to…",
    noDodgeMessages: [
      "Oops, missed me!",
      "Nice try! 😄",
      "Not today! 🏃",
      "So close! 😜",
      "Catch me if you can!",
    ],
  },

  // ─── Steps ───
  steps: [
    { id: "intro", number: 0, label: "The Question" },
    { id: "location", number: 1, label: "Location" },
    { id: "datetime", number: 2, label: "Date & Time" },
    { id: "dishes", number: 3, label: "What to Eat" },
    { id: "review", number: 4, label: "Review" },
  ],

  // ─── Location Options ───
  locations: [
    {
      id: "candlelight",
      emoji: "🕯️",
      title: "Candlelight Dinner",
      description: "A cozy rooftop dinner under the stars with fairy lights and soft music",
    },
    {
      id: "beach",
      emoji: "🌊",
      title: "Beach Sunset",
      description: "A quiet evening walk on the beach, watching the sunset together",
    },
    {
      id: "stargazing",
      emoji: "⭐",
      title: "Stargazing Picnic",
      description: "Blanket under the open sky with hot chocolate and a telescope",
    },
    {
      id: "cozy-cafe",
      emoji: "☕",
      title: "Cozy Café Date",
      description: "Warm drinks, board games, and deep conversations in a cute café",
    },
  ],

  // ─── Nepali Dishes ───
  dishes: [
    {
      id: "momo",
      emoji: "🥟",
      title: "Mo:Mo",
      description: "Steamed or fried dumplings stuffed with spiced meat, served with achar 🫕",
    },
    {
      id: "dal-bhat",
      emoji: "🍛",
      title: "Dal Bhat",
      description: "A classic Nepali meal — lentil soup, rice, pickles, and seasonal vegetables",
    },
    {
      id: "chowmein",
      emoji: "🍜",
      title: "Nepali Chowmein",
      description: "Wok-tossed noodles with vegetables, egg, and a hint of Sichuan pepper",
    },
    {
      id: "sel-roti",
      emoji: "🫓",
      title: "Sel Roti & Curry",
      description: "Traditional homemade rice donuts paired with spicy potato curry — a festival favorite!",
    },
  ],

  // ─── Confirmation Screen ───
  confirmation: {
    title: "It's a Date! 🎉",
    message: "Can't wait to spend this time with you ❤️",
    subtitle: "Here's what we're doing:",
  },

  // ─── API ───
  api: {
    endpoint: "/api/save-response",
  },

  // ─── Error message ───
  errorMessage: "Something went wrong, try again 💔",
};

export default CONFIG;
