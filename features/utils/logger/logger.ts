type LogContext = {
    userId?: string; // User identifier if available
    clientIp?: string; // IP address or client identifier
    method?: string; // HTTP method if applicable
    path?: string; // Request path if applicable
    category?: string; // e.g. "auth", "rateLimiter"
    [key: string]: unknown; // Allow any extra info
};

export async function logMessage(level: string, message: string, context: LogContext = {}): Promise<void> {
    const timestamp = new Date().toISOString();

    const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...context,
    };

    const logLine = JSON.stringify(logEntry) + "\n";

    const dateStr = timestamp.slice(0, 10);
    const filename = `logs/log_${dateStr}.jsonl`;

    try {
        await Deno.mkdir("logs", { recursive: true });
    } catch (error) {
        if (!Deno.env.get("TESTING")) {
            console.error("Failed to create logs directory:", error);
        }
        // continue even if mkdir fails, file writing may still work
    }

    try {
        await Deno.writeTextFile(filename, logLine, { append: true });
    } catch (error) {
        console.error("Failed to write log file:", error);
    }
}
