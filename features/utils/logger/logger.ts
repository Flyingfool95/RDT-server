export async function logMessage(level: string, message: string, id?: string): Promise<void> {
    const now = new Date();
    const timestamp = now.toISOString();

    const logEntry = {
        timestamp,
        level: level.toUpperCase(),
        id: id ?? "anonymous",
        message,
    };

    const logLine = JSON.stringify(logEntry);

    const dateStr = timestamp.slice(0, 10);
    const filename = `logs/log_${dateStr}.json`;

    try {
        await Deno.mkdir("logs", { recursive: true });
    } catch (error) {
        if (!Deno.env.get("TESTING")) {
            console.log(error);
        }
    }

    await Deno.writeTextFile(filename, logLine, { append: true });
}
