# 💕 Date Proposal App

A romantic, single-page date proposal app built with **Next.js** and **Tailwind CSS**. Share the link with your partner so she can pick the location, time, and dishes for your special date — and her choices get saved to a Google Sheet.

---

## ✨ Features

- 🌹 Warm, romantic UI with rose/pink palette and smooth animations
- 📍 Pick from 4 curated date locations
- 🕐 Choose from preset date & time slots
- 🍽️ Select a dish/meal option
- 🎉 Sweet confirmation screen
- 📊 Responses automatically saved to Google Sheets

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd date-proposal
npm install
```

### 2. Set Up Google Sheets (Required for response capture)

You'll need a Google Apps Script Web App to receive and store responses.

#### Step 1: Create a Google Sheet

1. Go to [sheets.new](https://sheets.new)
2. Name it (e.g., "Date Responses")
3. In the first row, add these headers:
   - **Timestamp** (column A)
   - **Location** (column B)
   - **Date & Time** (column C)
   - **Dishes** (column D)

#### Step 2: Open Apps Script

1. In your sheet, go to **Extensions → Apps Script**
2. Delete any placeholder code and paste the following:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.location,
    data.datetime,
    data.dishes
  ]);
  return ContentService.createTextOutput("OK");
}
```

3. Click **Save** (💾 icon) and name your project (e.g., "Date Proposal Logger")

#### Step 3: Deploy as Web App

1. Click **Deploy → New deployment**
2. Set **Type** to **Web app**
3. Configure:
   - **Description**: "Date proposal response logger"
   - **Execute as**: **Me**
   - **Who has access**: **Anyone**
4. Click **Deploy**
5. **Copy the Web App URL** (it looks like `https://script.google.com/macros/s/.../exec`)

### 3. Configure Environment

Create a `.env.local` file in the project root:

```bash
GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

Replace the URL with the one you copied from the Apps Script deployment.

### 4. Customize the Options

Edit `config.js` to change:

- **Hero message** — the romantic greeting
- **Locations** — emoji, title, and description for each spot
- **Date & time presets** — available slots
- **Dishes** — meal options with descriptions
- **Confirmation text** — celebratory message

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — send this link to your partner!

### 6. Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push your code to a GitHub/GitLab/Bitbucket repo
2. Import it into Vercel
3. Add the `GOOGLE_SCRIPT_URL` environment variable in Vercel's dashboard (Settings → Environment Variables)
4. Deploy!

---

## 📁 Project Structure

```
├── config.js               # All hardcoded date options (easy to customize)
├── pages/
│   ├── index.js            # Main proposal page
│   ├── confirmation.js     # Success screen after confirming
│   ├── _app.js             # Next.js app wrapper
│   └── api/
│       └── save-response.js # API route → Google Sheets
├── styles/
│   └── globals.css         # Tailwind CSS v4 with custom romantic theme
├── postcss.config.mjs      # PostCSS configuration
├── .env.local              # Environment variables (GOOGLE_SCRIPT_URL)
├── package.json
└── README.md
```

---

## 💝 Customization Tips

- **Colors**: Edit the `@theme` block in `styles/globals.css` to tweak the palette
- **Animations**: Framer Motion variants are defined at the top of each page
- **Fonts**: The app uses system fonts by default; swap in `globals.css` for Google Fonts

---

Made with love 💕
