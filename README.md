# University IT Support Portal — Traditional Integration Demo

A student-facing React + Node.js application for demonstrating the **current/traditional way of integrating university systems**, before introducing MCP or AI.

## What the user sees

- A signed-in student IT support portal
- A form to create a support ticket
- The student's university-owned devices automatically available in the form
- A **My Tickets** page with open/resolved requests
- A confirmation after a ticket is submitted

The UI intentionally does **not** expose API orchestration to the student. The application code performs the integrations behind the scenes, as a conventional application would.

## Existing REST systems represented

- `GET /students/:id` — Student Database
- `GET /devices/:studentId` — IT Asset API
- `GET /tickets?studentId=:id` — Ticket System overview
- `POST /tickets` — Create a support ticket
- `GET /tickets/:id` — Retrieve one ticket

The demo signs in as student `12345` (Alex Johnson) and includes two assigned devices plus example ticket history.

## Run

From the project root:

```bash
npm install
npm run install:all
npm run dev
```

Open the Vite URL shown in the terminal (normally `http://localhost:5173`). The API server runs on `http://localhost:4000`.

## Teaching point

This is the **before MCP** application. The experience is straightforward for the student, but developers have explicitly implemented the workflow and integration logic in application code. A later MCP version can leave these REST APIs intact and expose their capabilities as tools.

## MCP server for Claude

This project now also contains `mcp-server/`. It deliberately does **not** access the demo data directly. Each MCP tool calls the existing REST server at `http://localhost:4000`:

```text
Claude
  ↓ MCP (stdio)
University IT MCP server
  ↓ HTTP/REST
Existing Node.js university APIs
  ↓
Student / Device / Ticket systems
```

### MCP tools

- `get_student(student_id)` → `GET /students/{id}`
- `get_student_devices(student_id)` → `GET /devices/{studentId}`
- `create_support_ticket(student_id, device_id, issue, priority, category?)` → `POST /tickets`

### Install and run

From the project root:

```bash
npm install
npm run install:all
```

Start the existing university API (the MCP server needs it):

```bash
npm start --prefix server
```

The API should be available at `http://localhost:4000`.

### Connect Claude Desktop

Add a local MCP server named `university-it-support` to your Claude Desktop MCP configuration. Use the absolute path to this project's MCP entry file:

```json
{
  "mcpServers": {
    "university-it-support": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/university-it-demo/mcp-server/src/index.js"],
      "env": {
        "UNIVERSITY_API_URL": "http://localhost:4000"
      }
    }
  }
}
```

Restart Claude Desktop after changing its MCP configuration. Keep the Node REST server running while using these tools.

### Suggested classroom test

Ask Claude:

> My university laptop keeps crashing. I'm student 12345. Please report it to IT.

Claude can discover the tools and decide to retrieve student `12345`, retrieve that student's assigned devices, select the laptop from the returned data, and then call `create_support_ticket` with that device ID.

Afterward, refresh the React portal's **My Tickets** page. Because Claude's MCP tool used the same `POST /tickets` REST endpoint as the React application, the newly created ticket appears in the same ticket list.

### Important demo detail

The REST server stores tickets in memory. Restarting `server/` resets tickets to the seeded demo data. This is intentional for a simple classroom demo.
