# NxtWave Growth Challenge — Functional Growth Asset

A functional prototype for the NxtWave Growth Intern challenge:

**Build Your First AI Project in 60 Minutes**

## Stack

- Frontend: React + Vite
- Backend: FastAPI
- Database: SQLite + SQLAlchemy

## Features

- Student registration form
- Automatic unique referral code per student
- Referral links using `?ref=NW-XXXXXX`
- Referral attribution at registration time
- WhatsApp sharing button
- Live acquisition-source dashboard
- Referral leaderboard
- Automatic SQLite database creation

## Project structure

```text
nxtwave-growth-challenge/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 1. Start FastAPI

```bash
cd backend
python -m venv .venv
```

Windows:
```bash
.venv\Scripts\activate
```

macOS/Linux:
```bash
source .venv/bin/activate
```

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`.

## 2. Start React

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally:

`http://localhost:5173`

## 3. Test the referral loop

Register once.

After successful registration, the prototype generates a URL like:

```text
http://localhost:5173/?ref=NW-ABC123
```

Open that URL in another browser/incognito window and register another student. The second registration is automatically attributed to the referrer.

## 4. View dashboard

Click **Growth Dashboard**.

You can see:

- Total registrations / 500
- Remaining registrations
- WhatsApp / club / referral counts
- Top student referrers

## 5. Troubleshooting

If the Growth Dashboard does not open, make sure FastAPI is running at `http://127.0.0.1:8000`. The React app now opens the dashboard view immediately and displays the API error in the dashboard if the backend is unavailable.

## 6. API docs

FastAPI automatically provides:

`http://127.0.0.1:8000/docs`

## Notes for the challenge

This is a simulation/prototype. It does not include authentication, production email delivery, or payment functionality because those are outside the challenge requirement. The focus is demonstrating a measurable peer-to-peer registration loop and the ability to ship a working asset.
