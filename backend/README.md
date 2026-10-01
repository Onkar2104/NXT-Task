# FastAPI Backend

## Run

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

Install dependencies:
```bash
pip install -r requirements.txt
```

Start API:
```bash
uvicorn main:app --reload
```

API:
- `GET /api/health`
- `POST /api/register`
- `GET /api/referral/{referral_code}`
- `GET /api/dashboard`

Swagger UI:
`http://127.0.0.1:8000/docs`

The SQLite database file `growth.db` is created automatically on first start.
