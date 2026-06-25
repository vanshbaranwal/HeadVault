import type { ActionTracker } from "./action-tracker";
import type { ActionLog } from "./types";
import { select, isCancel } from "@clack/prompts";
import chalk from "chalk";


interface ReviewGroup{
    label: string;
    actionIds: string[],
    patch: string | null
}

function  groupPending(pending: ActionLog[]): ReviewGroup[]{
    const byPath = new Map<string, ActionLog[]>();
    const shells: ActionLog[] = [];

    for(const a of pending){
        if(a.type === "tool_execute"){
            shells.push(a);
            continue;
        }
        const key = a.path;
        if(!byPath.has(key)) byPath.set(key, []);
        byPath.get(key)!.push(a);
    }

    const groups: ReviewGroup[] = [];

    const pathEntries = [...byPath.entries()].sort(([a], [b]) => 
        a.localeCompare(b),
    );
    
}


export async function runApprovalFlow(tracker: ActionTracker): Promise< boolean >{
    const pending = tracker.getPendingMutations();

    if(pending.length === 0){
        console.log(
            chalk.dim("\nno staged file, folder, or shell changes to review\n"),
        );
        return false;
    }

    const choice = await select({
        message: "apply staged changes??",
        options: [
            { value: "all", label: "approve and apply all" },
            { value: "select", label: "review one by one" },
            { value: "cancel", label: "cancel" },
        ],
    });

    if(isCancel(choice) || choice === "cancel"){
        for(const a of pending) tracker.updateStatus(a.id, "rejected", false);
        return false;
    }

    if(choice === "all"){
        for(const a of pending) tracker.updateStatus(a.id, "approved", true);
        return true;
    }
}
