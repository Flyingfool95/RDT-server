import { assertEquals, assertStringIncludes, assert } from "jsr:@std/assert";
import { logMessage } from "../../features/utils/logger.ts";

// Utility to get today's log file name based on the current date.
function getTodayLogFilename(): string {
    const dateStr = new Date().toISOString().slice(0, 10);
    return `logs/log_${dateStr}.json`;
}

Deno.test("logMessage writes a log entry with default id", async () => {
    const tempDir = await Deno.makeTempDir();
    const originalCwd = Deno.cwd();
    Deno.chdir(tempDir);

    try {
        await logMessage("info", "Test message");
        const logFile = getTodayLogFilename();

        const content = await Deno.readTextFile(logFile);
        const logEntry = JSON.parse(content);

        assertEquals(logEntry.level, "INFO");
        assertEquals(logEntry.message, "Test message");
        assertEquals(logEntry.id, "anonymous");

        assert(logEntry.timestamp);
        assert(String(new Date(logEntry.timestamp)) !== "Invalid Date");
    } finally {
        Deno.chdir(originalCwd);
        await Deno.remove(tempDir, { recursive: true });
    }
});

Deno.test("logMessage writes a log entry with provided id", async () => {
    const tempDir = await Deno.makeTempDir();
    const originalCwd = Deno.cwd();
    Deno.chdir(tempDir);

    try {
        await logMessage("warn", "Warning message", "user123");
        const logFile = getTodayLogFilename();
        const content = await Deno.readTextFile(logFile);
        const logEntry = JSON.parse(content);

        assertEquals(logEntry.level, "WARN");
        assertEquals(logEntry.message, "Warning message");
        assertEquals(logEntry.id, "user123");
    } finally {
        Deno.chdir(originalCwd);
        await Deno.remove(tempDir, { recursive: true });
    }
});

Deno.test("logMessage appends multiple log entries", async () => {
    const tempDir = await Deno.makeTempDir();
    const originalCwd = Deno.cwd();
    Deno.chdir(tempDir);

    try {
        await logMessage("debug", "First message");
        await logMessage("debug", "Second message");

        const logFile = getTodayLogFilename();
        const content = await Deno.readTextFile(logFile);

        assertStringIncludes(content, "First message");
        assertStringIncludes(content, "Second message");
    } finally {
        Deno.chdir(originalCwd);
        await Deno.remove(tempDir, { recursive: true });
    }
});
