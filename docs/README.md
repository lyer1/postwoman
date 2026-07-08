# Postwoman Documentation

Postwoman is an open-source, full-stack API client designed for rapid API testing and collaboration. It features a modern dark-themed UI built with Next.js, and a high-performance Python FastAPI backend.

## Tech Stack
- **Frontend**: Next.js, React, Tailwind CSS, Zustand, Prisma/Lucide Icons
- **Backend**: Python, FastAPI, SQLModel, SQLite
- **Proxy**: httpx (for CORS bypass and request proxying)

## Core Features

### 🚀 Request Execution & Configuration
- **HTTP Methods**: Full support for `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.
- **URL Handling**: Dynamic URL variable interpolation using Environment scoping (`{{variable_name}}`).
- **Headers & Query Params**: Key-Value table editors with togglable activation states.
- **Request Bodies**: 
  - `Raw`: Code editor with syntax highlighting for JSON, Text, XML, etc.
  - `Form Data`: Key-Value pair editor for standard form submissions.
- **Authentication**: Native support for `No Auth`, `Basic Auth`, and `Bearer Token`.

### 📂 Workspace & Collections
- **Multi-Tab Interface**: Open and manage multiple requests simultaneously. Click tab headers to switch contexts or double-click to rename tabs temporarily.
- **Collections & Folders**: Organize requests logically with nested folders.
- **State Persistence**: All collections and their embedded requests are saved to the backend database.
- **Options Menus**: Custom-built dropdown menus on collections and requests for operations (Rename, Delete).

### ⚙️ Environment Management
- **Environment Variables**: Create, edit, and toggle specific environment variables.
- **Active Context**: Switch between different active environments to automatically inject variables into the request URL, Headers, and Body.

### 📜 Pre-request & Post-response Scripts
- **Script Runner**: Built-in Javascript sandboxed runner.
- **Pre-request**: Modify active environment variables (`pw.env.set`) dynamically before the request leaves the client.
- **Post-response (Tests)**: Write assertions and unit-tests using Chai BDD-like syntax (`pw.expect(x).to.eql(y)`).
- **Test Results UI**: View test passes/fails directly in the Response pane alongside the JSON payload.

### 🌐 Proxy Backend & History
- **CORS Bypass**: All requests are routed through a Python `/api/proxy` backend which acts as an intermediary, avoiding browser CORS restrictions.
- **History Tracking**: The backend logs all sent requests, which appear in the Activity Bar's History tab.

### 🛠 Tools & Utilities
- **Code Generation**: Export the current request natively to `cURL`, `Fetch API`, and `Python requests`.
- **cURL Import**: Paste raw cURL strings into the URL bar or use the "Import cURL" modal in the sidebar to instantly parse headers, methods, and bodies into a new request.
- **Import/Export**: Load or export standard Postman v2.1 collection JSON files.

## Directories
- `architecture/`: Architecture diagrams and system design notes.
- `api/`: API specifications.
- `docs/FLOWS.md`: UI and Functional state machines mapping the user journey.
