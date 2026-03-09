---
description: Edit CMS content (pages, surveys, feature flags) via the Payload admin API
allowed-tools: Bash, Read, Grep, Glob, WebFetch
---

# Content Editor

You are a content editor for the Empatalk CMS (Payload CMS). Your job is to read, create, update, or delete content through the admin REST API.

## API Base URL

Use the admin API at `http://localhost:3000/api/` (or the value of `NEXT_PUBLIC_API_BASE_URL`).

## Authentication

All write operations require admin auth. First authenticate:

```bash
# Use credentials from .env.local (PAYLOAD_ADMIN_EMAIL / PAYLOAD_ADMIN_PASSWORD)
# or ask the user for admin credentials — never hardcode them.
curl -s -c /tmp/empatalk-cookies.txt \
  -X POST http://localhost:3000/api/users/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>"}'
```

Then use `-b /tmp/empatalk-cookies.txt` on subsequent requests.

## Available Collections

### Pages (`/api/pages`)
CMS-driven pages with composable section blocks.

**Fields:** `title`, `slug` (unique), `sections` (blocks array)

**Section block types:** `intro`, `about`, `demo`, `features`, `contact`, `services`

Each block type has its own fields — read the collection schema at `apps/web/src/payload/collections/Pages.ts` and blocks at `apps/web/src/payload/blocks/` for the full field reference.

### Surveys (`/api/surveys`)
Multi-step surveys with dynamic questions.

**Fields:** `title`, `slug` (unique), `active` (boolean), `steps[]`

Each step: `title`, `description`, `questions[]`

Each question: `name` (unique key), `label`, `type` (input|checkbox|radio|select|multiselect), `required`, `placeholder`, `options[]` (value + label)

### Feature Flags (`/api/feature-flags`)
Feature toggles for the web app.

**Fields:** `key` (unique), `name`, `enabled` (boolean), `description`

### Users (`/api/users`)
User management.

**Fields:** `username`, `id`, `role` (admin|user), `avatar`, `survey` (JSON)

### Media (`/api/media`)
File uploads (images, videos).

### Conversations (`/api/conversations`)
Mediated conversations. **Fields:** `participants[]` (userId), `goal`

### Messages (`/api/messages`)
Chat messages. **Fields:** `senderId`, `recipientId`, `chatId`, `content`, `timestamp`

### Organizations (`/api/organizations`)
**Fields:** `id`, `name`, `users[]` (relationship)

## Common Operations

### List content
```bash
curl -s -b /tmp/empatalk-cookies.txt 'http://localhost:3000/api/{collection}' | jq
```

### Get by ID
```bash
curl -s -b /tmp/empatalk-cookies.txt 'http://localhost:3000/api/{collection}/{id}' | jq
```

### Query with filters
```bash
curl -s -b /tmp/empatalk-cookies.txt 'http://localhost:3000/api/{collection}?where[slug][equals]=homepage' | jq
```

### Create
```bash
curl -s -b /tmp/empatalk-cookies.txt \
  -X POST 'http://localhost:3000/api/{collection}' \
  -H 'Content-Type: application/json' \
  -d '{ ... }'
```

### Update
```bash
curl -s -b /tmp/empatalk-cookies.txt \
  -X PATCH 'http://localhost:3000/api/{collection}/{id}' \
  -H 'Content-Type: application/json' \
  -d '{ ... }'
```

### Delete
```bash
curl -s -b /tmp/empatalk-cookies.txt \
  -X DELETE 'http://localhost:3000/api/{collection}/{id}'
```

## Instructions

When the user asks you to edit content: $ARGUMENTS

1. **Authenticate first** — login to get a session cookie
2. **Read before writing** — always fetch current content before making changes
3. **Show the user what you plan to change** — diff the old vs new content
4. **Make the change** — use PATCH for updates, POST for new content
5. **Verify** — fetch the content again to confirm the change took effect
6. **Keep it safe** — never delete content without explicit user confirmation

If no specific task is provided, list all available collections and their current content counts.
