import chalk from "chalk";
import { isCancel, text } from "@clack/prompts";
import { defaultAgentConfig } from "./types.ts";
import { ActionTracker } from "./action-tracker.ts";
import { ToolExecutor } from "./tool-executor.ts";


export async function runAgentMode(){
    console.log(chalk.bold("\n🤖 agent mode\n"));

    const goal = await text({
        message: "what would you like the agent to do??",
        placeholder: "concrete task for this codebase",
    });

    if(isCancel(goal) || !goal.trim()){
        return;
    }

    const config = defaultAgentConfig();
    const tracker = new ActionTracker();
    const executor = new ToolExecutor(tracker, config);

}

