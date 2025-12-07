# CommunityProjectPlanner

An AI assistant that helps plan community projects (trail renovations, park cleanups, coding camps, etc.) using Cloudflare Workers, Workers AI, and KV.

### Live demo

- UI (Cloudflare Pages): https://communityprojectplanner.pages.dev/
- Backend API (Workers): https://backend.perakalapudianurag.workers.dev/api/chat
- Please allow 5-10 seconds after a message to wait for a response.

### How it works

- Frontend: simple chat UI in `frontend/index.html` that sends JSON to `/api/chat`.
- Backend: `backend/src/index.js` (Cloudflare Worker)
  - Reads/writes project history from Workers KV (`PROJECTS`)
  - Calls Workers AI (`@cf/meta/llama-3-8b-instruct`) via `env.AI.run`
  - Returns a structured reply + updated state.

### Run locally

```bash
git clone https://github.com/anuragperakalapudi/CommunityProjectPlanner.git
cd CommunityProjectPlanner/frontend
python -m http.server 8000
# then open http://localhost:8000
