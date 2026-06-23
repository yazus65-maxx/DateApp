const CONFIG = {
  // ─── Playful Intro ───
  intro: {
    greeting: "Hey there, you ✨",
    question: "Would you like to go out on a date?",
    subtitle: "I've been thinking about it for a while… 🌸",
    extraLines: [
      "Just the two of us, a little adventure 🗺️",
      "I promise it'll be worth it 💫",
      "No pressure… but also, yes pressure 😄",
    ],
    yesLabel: "Yes, absolutely! 💕",
    noLabel: "No",
    noCaughtMessage: "Gotcha! You can't escape 🥺",
    noCaughtSubtext: "Come on, say yes… it'll be so fun!",
    noDodgeMessages: [
      "Ha! Too slow 😄",
      "Nope, not today! 🏃‍♀️",
      "Almost… but not quite! 😜",
      "Hehe, keep trying 💨",
      "You'll never catch it 😏",
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

  // ─── Location Options (Nepal-relevant, 1-2 hr casual outings) ───
  locations: [
    {
      id: "cozy-cafe",
      emoji: "☕",
      title: "Cozy Café",
      description: "Warm drinks, soft music and sweet conversations at a cute café in the city",
    },
    {
      id: "garden-stroll",
      emoji: "🌿",
      title: "Garden Walk",
      description: "A relaxed stroll through a peaceful park or garden — fresh air & good vibes",
    },
    {
      id: "viewpoint",
      emoji: "🏔️",
      title: "Hilltop Viewpoint",
      description: "A short hike to a scenic viewpoint with stunning valley & mountain views",
    },
    {
      id: "food-street",
      emoji: "🍜",
      title: "Food Street Outing",
      description: "Exploring local street food together — trying snacks, chatting and laughing",
    },
  ],

  // ─── Food Options ───
  dishes: [
    {
      id: "pizza",
      emoji: "🍕",
      title: "Pizza",
      description: "Cheesy, saucy and absolutely irresistible — perfect for sharing a slice together",
    },
    {
      id: "sushi",
      emoji: "🍣",
      title: "Sushi",
      description: "Fresh, elegant and a little fancy — a delightful experience for two",
    },
    {
      id: "burger",
      emoji: "🍔",
      title: "Burger",
      description: "Juicy, hearty and so satisfying — a classic comfort food date",
    },
    {
      id: "ramen",
      emoji: "🍜",
      title: "Ramen",
      description: "Warm, cozy broth with rich toppings — perfect for a relaxed, intimate meal",
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
