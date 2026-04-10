# GritCMS AI Service Documentation

## Overview

GritCMS supports AI-powered content generation via multiple providers:
- **Ollama** (local/hosted models)
- **Anthropic Claude**
- **OpenAI GPT**
- **Groq**
- **Google Gemini**

---

## 1. Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AI_PROVIDER` | `ollama` | Provider: `ollama`, `claude`, `openai`, `groq`, `gemini` |
| `AI_API_KEY` | (empty) | API key for cloud providers |
| `AI_MODEL` | `llama3.2` | Model name |
| `AI_ENDPOINT` | `http://localhost:11434` | Ollama host URL |
| `AI_ENABLED` | `true` | Enable/disable AI service |

### Default Models by Provider

| Provider | Default Model |
|----------|-----------|
| ollama | llama3.2 |
| claude | claude-sonnet-4-5-20250929 |
| openai | gpt-4o |
| groq | llama-3.3-70b-versatile |
| gemini | gemini-2.0-flash |

---

## 2. API Endpoints

All endpoints require authentication (Bearer token).

### POST /api/ai/complete
Single prompt completion.

```bash
curl -X POST http://localhost:8080/api/ai/complete \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a hello world program", "temperature": 0.7}'
```

### POST /api/ai/chat
Multi-turn conversation.

```bash
curl -X POST http://localhost:8080/api/ai/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Hi"}]}'
```

### POST /api/ai/stream
Streaming response (SSE).

```bash
curl -X POST http://localhost:8080/api/ai/stream \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Count to 5"}]'
```

### GET /api/ai/config
Get current AI configuration.

```bash
curl http://localhost:8080/api/ai/config \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "data": {
    "provider": "ollama",
    "model": "llama3.2",
    "endpoint": "http://localhost:11434",
    "enabled": true
  }
}
```

### PUT /api/ai/config
Update AI configuration at runtime.

```bash
curl -X PUT http://localhost:8080/api/ai/config \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"provider": "ollama", "model": "qwen3.5:0.8b", "endpoint": "http://localhost:11434", "enabled": true}'
```

### GET /api/ai/models
List available models.

```bash
# Get models from current config
curl http://localhost:8080/api/ai/models \
  -H "Authorization: Bearer <token>"

# Test a specific endpoint
curl "http://localhost:8080/api/ai/models?endpoint=http://localhost:11434" \
  -H "Authorization: Bearer <token>"

# Force provider + endpoint (recommended for Settings UI testing)
curl "http://localhost:8080/api/ai/models?provider=ollama&endpoint=http://host.docker.internal:11434" \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "data": ["gemma4:e2b", "qwen3.5:0.8b", "llama3.2", ...]
}
```

---

## 3. File Locations

### Backend

| File | Purpose |
|------|---------|
| `apps/api/internal/ai/ai.go` | AI service - providers, completions |
| `apps/api/internal/config/config.go` | Environment config (lines 52-56, 120-124) |
| `apps/api/internal/handlers/ai.go` | HTTP handlers |
| `apps/api/internal/routes/routes.go` | Route registration (lines 336-341) |
| `apps/api/cmd/server/main.go` | Server startup (lines 83-99) |

### Frontend

| File | Purpose |
|------|---------|
| `apps/admin/app/(dashboard)/settings/page.tsx` | AI Settings tab |
| `apps/admin/hooks/use-ai.ts` | AI hook (if exists) |
| `apps/admin/components/page-builder/ai-panel.tsx` | Builder AI panel |

---

## 4. Provider Implementation Details

### Ollama (Local)

**Endpoint Format:** `http://<host>:<port>`

**Available Endpoints:**
| Address | Use Case |
|---------|---------|
| http://localhost:11434 | Same machine (native) |
| http://127.0.0.1:11434 | Same machine (alternative) |
| http://host.docker.internal:11434 | Docker container to host |
| http://10.0.2.2:11434 | Docker VM (Mac/Windows) |
| http://172.17.0.1:11434 | Docker bridge network |

**List Models:** `GET /api/tags`

**Generate:** `POST /api/generate`

```json
{
  "model": "llama3.2",
  "prompt": "Hello",
  "stream": false,
  "options": {
    "temperature": 0.7,
    "num_predict": 512
  }
}
```

### Claude (Anthropic)

**Endpoint:** `https://api.anthropic.com/v1/messages`

**Required headers:**
- `x-api-key`: API key (sk-ant-...)
- `anthropic-version`: 2023-06-01

### OpenAI

**Endpoint:** `https://api.openai.com/v1/chat/completions`

**Required header:** `Authorization: Bearer <key>`

### Groq

**Endpoint:** `https://api.groq.com/openai/v1/chat/completions`

**Required header:** `Authorization: Bearer <key>` (`gsk_...`)

### Google Gemini

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/<model>:generateContent`

**Required header:** `Authorization: Bearer <key>`

---

## 5. Settings Storage

Settings are stored in the database:

- **Group:** `ai`
- **Keys:** `ai_provider`, `ai_api_key`, `ai_model`, `ai_endpoint`, `ai_enabled`

The Settings UI at `/admin/settings` → AI tab saves to this group.

---

## 6. Troubleshooting

### Issue: "AI service is not configured"

**Cause:** Provider is `claude` but no API key set.

**Fix:** 
1. Set `AI_PROVIDER=ollama` in environment, OR
2. Provide valid `AI_API_KEY`

### Issue: Fetch Models returns cloud model instead of Ollama models

**Cause:** Runtime AI config is using a cloud provider, while Settings DB values show `ollama`.
`GET /api/ai/models` uses runtime config unless overridden.

**Fix:** Restart server with `AI_PROVIDER=ollama` or ensure config defaults to ollama.

**Safer fix (without restart):**
- Call `GET /api/ai/models?provider=ollama&endpoint=<ollama-url>` so backend fetches `/api/tags`.
- Save AI settings from the UI (this updates runtime via `PUT /api/ai/config`).

### Issue: Ollama not reachable from API

**Cause:** Network address mismatch.

**Fix:** 
1. From API server machine, test: `curl http://localhost:11434/api/tags`
2. Try different endpoint addresses (see table in section 4)
3. Restart both services after config change

**Docker note:** If API runs in Docker and Ollama runs on host, `localhost` from API container will fail.
Use `http://host.docker.internal:11434` (or your Docker bridge IP).

### Issue: Builder AI Assist shows only generic "Failed to generate content"

**Cause:** Provider errors were previously returned as generic `AI_ERROR`.

**Fix:** API now includes upstream provider details in error messages, and frontend AI Assist displays that message so endpoint/model/key issues are visible.

### Cross-module note: `unexpected EOF` on JSON endpoints

**Symptom:** `422 VALIDATION_ERROR` with message `unexpected EOF` on create/update routes.

**Common cause:** Request body was consumed by middleware before handler bind (`ShouldBindJSON`), often due to stale/mismatched route prefixes in WAF body buffering.

**Fix checklist:**
1. Ensure `WAFBypassBuffer` prefixes match actual API paths.
2. Ensure `WAFBypassRestore` is applied on route groups that bind JSON.
3. If routes were renamed, update middleware prefixes at the same time.

### Debug: Check what endpoint is being used

```bash
# Check server logs for "AI service configured"
grep "AI service" /path/to/logs

# Test Ollama directly
curl http://localhost:11434/api/tags
curl http://127.0.0.1:11434/api/tags
```

---

## 7. Code Flow

### Startup (main.go)
```
Config.Load() → AIProvider=ollama (default)
  ↓
ai.NewWithConfig(Config{Provider: "ollama", Endpoint: "http://localhost:11434"})
  ↓
IsEnabled() → true (no API key needed for ollama)
```

### Fetch Models (Settings UI)
```
1. User clicks "Fetch Models"
2. Frontend calls GET /api/ai/models?provider=<selected>&endpoint=<selected>
3. Handler resolves provider/endpoint (query params override runtime config)
4. If provider is ollama: calls ListModels() -> Ollama /api/tags
5. Returns model list from Ollama API (live list, not static fallback)
```

### Save Settings
```
1. User changes provider/model/endpoint
2. Clicks "Save"
3. Frontend calls PUT /api/ai/config
4. Handler calls AI.UpdateConfig()
5. Runtime config updated in memory
6. Also saves to database via useUpdateSettings()
```

---

## 8. Frontend AI Tab (Settings)

Location: `apps/admin/app/(dashboard)/settings/page.tsx`

Features:
- Provider selector (Local/Cloud)
- Endpoint dropdown for Ollama
- Fetch Models button
- Model dropdown
- Enable/disable checkbox

---

## 9. Builder AI Panel

Location: `apps/admin/components/page-builder/ai-panel.tsx`

Used in `/builder/new` for AI-assisted page creation.

---

## 10. Dependencies

- Go: `apps/api/go.mod`
- Admin: `apps/admin/package.json`

Key packages:
- `github.com/anthropicsdk/go` (Claude)
- `github.com/sashabaranov/go-openai` (OpenAI)
- Native HTTP for Ollama
- `axios` (frontend API calls)