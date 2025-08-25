# RDT – Server (Deno)

This template provides a starting point for a modern Deno server, designed to work seamlessly with [RDT – Client](https://github.com/Flyingfool95/RDT-client). It comes pre-configured with secure authentication, database support, email sending, image processing, and runtime validation.

---

## Features

* **[Oak 17.1.6](https://deno.land/x/oak)** – Middleware framework for routing and server utilities
* **[SQLite 3.9.1](https://deno.land/x/sqlite)** – Lightweight database support
* **[Deno Mailer 1.6.0](https://deno.land/x/denomailer)** – Email sending with attachments and encoding
* **[Argon2](https://deno.land/x/argon2)** – Secure password hashing
* **[DJWT 3.0.2](https://deno.land/x/djwt)** – JSON Web Token creation and verification
* **[Zod 3.24.2](https://deno.land/x/zod)** – Runtime validation and type-safe schemas
* **Image processing** with [Deno Image 0.0.4](https://deno.land/x/deno_image) and [JPEGTS 1.1](https://deno.land/x/jpegts)
* **Cron jobs** using [Croner 8.1.2](https://deno.land/x/croner)
* **Plug system** for modular server extensions
* **XSS sanitization** using `xss` and `cssfilter`
* **Environment configuration** via `.env`

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```env
# JWT secret for signing tokens
JWT_SECRET=

# SMTP / email credentials
SMTP_HOSTNAME=
SMTP_USERNAME=
SMTP_PASSWORD=

# Frontend URL (for links in emails)
FRONTEND_URL=

# Token expiration (seconds)
ACCESS_TOKEN_EXP=900
REFRESH_TOKEN_EXP=432000
```

---

## Tasks

All tasks are defined in `deno.json`:

1. **Development server**

   ```bash
   deno task dev
   ```

   Starts the server with hot reload and full permissions: network, file system, environment, and FFI.


---

## Getting Started

1. Clone the repo and navigate to the server folder:

   ```bash
   git clone https://github.com/Flyingfool95/RDT-server
   cd RDT-server
   ```

2. Copy the example environment and fill it out:

   ```bash
   cp .env.example .env.local
   ```

3. Start the server:

   ```bash
   deno task dev
   ```

4. Open the server at:

   ```
   http://localhost:8000
   ```

---

## Dependencies

All dependencies are pinned using `jsr` in `deno.json` and `lock.json`:

* `@oak/oak@17.1.6` – Server framework
* `@std/assert@1` – Assertion utilities
* `sqlite@3.9.1` – Database
* `denomailer@1.6.0` – Mail client
* `argon2@2.0.2` – Password hashing
* `djwt@3.0.2` – JWT
* `zod@3.24.2` – Schema validation
* `deno_image@0.0.4` / `jpegts@1.1` – Image processing
* `croner@8.1.2` – Cron jobs
* `xss` / `cssfilter` – Sanitization
