# cf_ai_community_project_copilot

Community Project Copilot is an AI assistant that helps plan real-world community projects:
trail renovations, park cleanups, coding camps for kids, accessibility upgrades, and more.

It’s built entirely on Cloudflare:

- **LLM:** Cloudflare Workers AI (`@cf/meta/llama-3-8b-instruct`)
- **Workflow / coordination:** Cloudflare Worker handling `/api/chat`
- **Memory / state:** Workers KV (`PROJECTS`), per `projectId`
- **User input:** Chat UI hosted on Cloudflare Pages

---

## Live demo

- **Frontend UI (Cloudflare Pages)**  
  https://communityprojectplanner.pages.dev/

- **Backend API (Cloudflare Workers)**  
  `POST https://backend.perakalapudianurag.workers.dev/api/chat`

Example request body:

```json
{
  "projectId": "trail-1",
  "projectTitle": "Trail Renovation",
  "message": "I want to renovate a 300ft trail in a local park with 20 volunteers."
}
