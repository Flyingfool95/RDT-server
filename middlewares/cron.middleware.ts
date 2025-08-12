import { Cron } from "jsr:@hexagon/croner@8.1.2";
import db from "../db/db.ts";

export function CRONStarter() {
    const cleanUpBlackListedTokens = new Cron("* * * * *", () => {
        db.query(`DELETE FROM token_blacklist WHERE created_at < datetime('now', '-7 days', 'localtime')`);
    });
}
