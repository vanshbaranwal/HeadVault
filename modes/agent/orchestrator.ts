import chalk from "chalk";
import { isCancel, text } from "@clack/prompts";
import { defaultAgentConfig } from "./types.ts";
import { ActionTracker } from "./action-tracker.ts";
import { ToolExecutor } from "./tool-executor.ts";
import { createAgentTools } from "./agent-tools";
import { stepCountIs, ToolLoopAgent } from "ai";
import { getAgentModal } from "../../ai/ai.config.ts";
import { json } from "node:stream/consumers";
import { renderTerminalMarkdown } from "../../tui/terminal-md.ts";
import { runApprovalFlow } from "./approval.ts";


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
    const tools = createAgentTools(executor);

    const agent = new ToolLoopAgent({
        model: getAgentModal(),
        stopWhen: stepCountIs(40),
        instructions: [
            `workspace root: ${config.codebasePath}`,
            `all mutations are staged until approval`,
        ].join("\n"),
        tools,
    });

    const result = await agent.generate({
        prompt: goal.trim(),
        onStepFinish: ({ toolCalls }) => {
            for(const tc of toolCalls){
                const preview = JSON.stringify(tc.input).slice(1, 160);
                console.log(
                    chalk.green("  ✓"),
                    chalk.bold(String(tc.toolName)),
                    chalk.dim(preview + (preview.length >= 160 ? "..." : "")),
                );
            }
        },
    });

    if(result.text?.trim()) console.log(renderTerminalMarkdown(result.text));

    const ok = await runApprovalFlow(tracker);
    if(!ok) return executor.clearStaging();


    const { errors } = executor.applyApprovedFromTracker();

    if(errors.length){
        console.log(chalk.red("\nsome operations reported errors:\n"));
        for(const e of errors) console.log(chalk.yellowBright(chalk.red(`  • ${e}`)));
    } else{
        console.log(chalk.green('\n✓ Applied.\n'));
    }

    executor.clearStaging();

}

