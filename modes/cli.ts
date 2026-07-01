import chalk from "chalk";
import {select, isCancel} from "@clack/prompts";
import { extractMessage } from "@pinecone-database/pinecone/dist/errors";
import { runAgentMode } from "./agent/orchestrator.ts";
import { runAskMode } from "./ask/orchestrator.ts";
import { runPlanMode } from "./plan/orchestrator.ts";



export async function runCliMode(){
     while(true){
        const mode = await select({
            message : "choose CLI sub-mode",
            options : [
                {value : "agent", label : "Agent Mode"},
                {value : "plan", label : "Plan Mode"},
                {value : "ask", label : "Ask Mode"},
                {value : "back", label : "Back Mode"}
            ],
        });

        if(isCancel(mode) || mode === "back"){
            return;
        }

        if(mode === "agent"){
            await runAgentMode();
        }

        if(mode === "ask"){
            await runAskMode(); 
        }

        if(mode === "plan"){
            await runPlanMode();
        }

        if(mode !== "agent" && mode !== "ask" && mode !== "plan"){
            console.log(chalk.yellow("\nthat mode is not implemented yet.\n"));
        }
     }
}