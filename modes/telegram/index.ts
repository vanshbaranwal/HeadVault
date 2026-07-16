import { Telegraf } from "telegraf";
import chalk from "chalk";
import { welcome } from "./constants.ts";
import { promises, resolve } from "dns";
import { registerHandlers } from "./handlers.ts";

export async function runTelegramMode(){
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const ownerId = process.env.TELEGRAM_OWNER_ID;


    const bot = new  Telegraf(token!);
    registerHandlers(bot); 

    await bot.telegram.sendMessage(ownerId!, welcome, {parse_mode: "Markdown"});
    console.log(chalk.green("sent welcome message to telegram.\n"));

    bot.launch();
    console.log(chalk.green("telegram bot is running. press ctrl+c to stop.\n"));

    await new Promise<void>((resolve) => {
        const stop = () => {
            bot.stop("SIGINT");
            resolve();
        };
        process.once("SIGINT", stop);
        process.once("SIGTERM", stop);
    });
}