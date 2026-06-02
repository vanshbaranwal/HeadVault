#!/usr/bin/env bun  
/*
the above line is called 'shebang' - this tells our computer run this file using bun
with out shebang your OS doesn't know:
is this a text file?
js file?
py file?
bun file?
so it cannot execute it directy

with shebang now your system understands use bun to execute "this" script
so this works : headvault wakeup
instead of : bun index.ts wakeup (but this also works)

but to make this : headvault wakeup 
work we need to add a "bin" in package.json
"bin": {
    "headvault" : "./index.ts"
}
this means create a terminal command named : headvault
and when someone runs it,
execute ./index.ts

example -

when we install tools like 
npm, vite, tsx they all use "bin" internally

bun link??
bun link
this tells bun:-
register my project globally as a CLI tool

before link your CLI only works inside project:
bun index.ts wakeup

after link bun creates a global command now from any folder:
headvault wakeup
works.
*/

import { Command } from "commander";
import { runWakeup } from "./tui/wakeup";

const program = new Command();


program
    .name("HeadVault")
    .description("A terminal and telegram AI Agent")
    .version('0.0.1');

program
    .command("wakeup")
    .description("show the banner and pick cli or telegram mode")
    .action(async () => {
        await runWakeup()
    });

await program.parseAsync(process.argv)


