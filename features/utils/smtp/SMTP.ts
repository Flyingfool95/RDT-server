import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
import { HttpError } from "../classes/classes.ts";

function createClient() {
    return new SMTPClient({
        connection: {
            hostname: Deno.env.get("SMTP_HOSTNAME") ?? "PLEASE ADD A SMTP HOSTNAME IN .ENV",
            port: parseInt(Deno.env.get("SMTP_PORT") ?? "465"),
            tls: Deno.env.get("SMTP_TLS") ? true : false,
            auth: {
                username: Deno.env.get("SMTP_USERNAME") ?? "example",
                password: Deno.env.get("SMTP_PASSWORD") ?? "password",
            },
        },
    });
}

export async function sendMail(
    fromMail: string = Deno.env.get("SMTP_USERNAME") ?? "PLEASE ADD FROM EMAIL",
    toMail: string,
    subject: string,
    content: string,
    html: string
) {
    const client = createClient();
    try {
        await client.send({
            from: fromMail,
            to: toMail,
            subject,
            content,
            html,
        });
    } catch (error) {
        console.error("Error sending email:", error);
        throw new HttpError(500, "Something went wrong", ["Sending email failed"]);
    } finally {
        try {
            await client.close();
        } catch (closeError) {
            console.error("Error closing SMTP client:", closeError);
        }
    }
}
