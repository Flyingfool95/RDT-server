import { assert, assertEquals, assertRejects } from "jsr:@std/assert";
import { sendMail } from "../../features/utils/SMTP.ts";
import { HttpError } from "../../features/utils/classes.ts";

import { mailClient } from "../../features/utils/SMTP.ts";

Deno.test("sendMail successfully sends an email", async () => {
    const originalSend = mailClient.send;
    try {
        let sendCalled = false;
        let capturedParams = null;

        mailClient.send = async (params) => {
            sendCalled = true;
            capturedParams = await params;
            return;
        };

        const fromMail = "test@example.com";
        const toMail = "recipient@example.com";
        const subject = "Test Subject";
        const content = "Test Content";
        const html = "<p>Test HTML</p>";

        await sendMail(fromMail, toMail, subject, content, html);

        assert(sendCalled, "mailClient.send should have been called");

        assertEquals(capturedParams, {
            from: fromMail,
            to: toMail,
            subject,
            content,
            html,
        });
    } finally {
        mailClient.send = originalSend;
    }
});

Deno.test("sendMail throws HttpError when sending fails", async () => {
    const originalSend = mailClient.send;
    try {
        mailClient.send = (_params) => {
            throw new Error("SMTP error simulation");
        };

        await assertRejects(
            async () => {
                await sendMail(
                    "test@example.com",
                    "recipient@example.com",
                    "Test Subject",
                    "Test Content",
                    "<p>Test HTML</p>"
                );
            },
            HttpError,
            "Something went wrong"
        );
    } finally {
        mailClient.send = originalSend;
    }
});
