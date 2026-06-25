import chalk from "chalk";
import {select, isCancel} from "@clack/prompts";
import { extractMessage } from "@pinecone-database/pinecone/dist/errors";
import { runAgentMode } from "./agent/orchestrator";



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
            console.log("ask");
        }

        if(mode === "plan"){
            console.log("plan");
        }

        if(mode !== "agent" && mode !== "ask" && mode !== "plan"){
            console.log(chalk.yellow("\nthat mode is not implemented yet.\n"));
        }
     }
}