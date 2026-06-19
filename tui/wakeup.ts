// tui means terminal ui 

import {select, isCancel} from "@clack/prompts";
import chalk from "chalk"; // chalk is used to add colors in our commands
import figlet from "figlet"; 
// import { textSync } from "node:stream/iter";

const BANNER_FONT = 'ANSI Shadow';  
const SHADOW = chalk.hex('#5b4d9e');
const FACE = chalk.hex('#e8dcf8').bold;

function printBannerwithShadow(ascii : string){
    const bannerLines = ascii.replace(/\s+$/, '').split('\n');
    const maxLen = Math.max(...bannerLines.map((line) => line.length), 0);
    const rowWidth = maxLen + 2;

    for (const line of bannerLines){
        console.log(SHADOW((' ' + line).padEnd(rowWidth)));
    }

    process.stdout.write(`\x1b[${bannerLines.length}A]`);

    for (const line of bannerLines){
        console.log(FACE(line.padEnd(rowWidth)));
    }
    console.log(); 
}




export async function runWakeup() {
    let ascii: string;
    try {
        ascii = figlet.textSync("HeadVault", {font: BANNER_FONT});
    } catch (error) {
        ascii = figlet.textSync("HeadVault", {font : "Standard"});
    }

    printBannerwithShadow(ascii);

    const mode = await select({
        message : "which mode do you want to proceed with?",
        options : [
            {value : "cli", label : "CLI"},
            {value : "telegram", label : "Telegram"}
        ]
    });

    if(isCancel(mode)){
        process.exit(0);
    }

    if(mode === "cli"){
        console.log(chalk.dim("starting cli mode...."));

    } else{
        console.log(chalk.dim("starting telegram mode..."));
        
    }
}