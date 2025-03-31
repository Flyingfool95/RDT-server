import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const mailClient = new SMTPClient({
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

export async function sendMail(
    from: string = Deno.env.get("SMTP_USERNAME") ?? "PLEASE ADD FROM EMAIL",
    to: string,
    subject: string,
    content: string,
    html: string
) {
    await mailClient.send({
        from,
        to,
        subject,
        content,
        html,
    });
}
