# 🦕 RDT Server – React Deno Template (Backend)

This is the backend REST API for the **React Deno Template** (RDT), built using [Deno](https://deno.com/) and [Oak](https://oakserver.github.io/oak/). It provides a solid project starter including features like authentication, session management, SQLite database integration, and common backend tooling.

---

## 🚀 Features

-   🔐 User Authentication (register, login, logout, reset password)
-   🧾 Session support
-   ⚙️ RESTful routing via Oak
-   🧠 Built-in error handling
-   🧱 SQLite by default, but DB-agnostic setup
-   📩 SMTP utility for email (e.g., password resets)
-   🛡️ CORS and rate limiting ready
-   🔁 Easy to extend for any project

---

## 📁 Project Structure

```
main.ts                        # App entrypoint
deno.json                      # Deno config
.env.example                   # Env variable template

/db
  db.ts                        # DB config (SQLite by default)

/features
  /auth                        # Routes + controllers for auth
  /utils                       # SMTP, JWT, helpers, etc.
```

---

## 🛠️ Getting Started

### Prerequisites

-   [Deno](https://deno.land/#installation) (v1.37+ recommended)

### Installation

```bash
# Clone the repo
git clone https://github.com/flyingfool95/RDT-server.git
cd RDT-server

# Copy and edit environment variables
cp .env.example .env

# Run the development server
deno run dev
```
---

## 🗄️ Database

-   Uses **SQLite** by default via Deno's standard libraries.
-   Easily swappable to other databases by modifying `db.ts`.

---

## 🧪 Testing

- ✅ Unit tests are implemented for core helper functions in the `utils` directory.
- 🔜 REST API endpoint testing is planned and currently under development.

---

## 📄 License

MIT

---

## 💡 About

This template was created to streamline the setup process for full-stack projects using Deno + React. It includes the backend essentials — so you can jump straight into building your app.
