#!/usr/bin/env bun
// this is called shebang it tells your computer run this fiole using bun
// without shebang our os doesn't know if it is text file js file python file or a bun file
// so it cannot directly execute it
// what is "bin" in package.json 
// that means create a terminal command named: headvault and when someone runs it, execute ./index.ts

import { Command } from 'commander';
// import process from 'node:process';
import { runWakeup } from './tui/wakeup';

const program = new Command();


program
    .name("HeadVault")
    .description("A terminal and telegram AI agent")
    .version("0.0.1");

program
    .command("wakeup")
    .description("show the banner and pick cli or telegram mode")
    .action(
        async () => {
            await runWakeup()
        }
    );

await program.parseAsync(process.argv);

