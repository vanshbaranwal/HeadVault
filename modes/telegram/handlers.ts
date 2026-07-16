import type { Telegraf } from "telegraf";
import { isOwner } from "./auth.ts";
import { welcome } from "./constants.ts";
import { commandArg } from "./text.ts";
import { runAgent, runAsk } from "./agent-run.ts";
import { generatePlan } from "../plan/planner.ts";
import { select } from "@clack/prompts";
import { planKeyboard, planMessage, planSessions, refreshPlanUi, type PlanSession } from "./plan-session.ts";


export function registerHandlers(bot: Telegraf){
    bot.command("start", async(ctx) => {
        if(!isOwner(ctx.chat.id)) return;
        await ctx.reply(welcome, { parse_mode: "Markdown" });
    });

    bot.command("ask", async(ctx) => {
        if(!isOwner(ctx.chat.id)) return;
        const q = commandArg(ctx.message.text, "ask");

        if(!q)
            return ctx.reply("usage: `/ask <your question>`", {
                parse_mode: "Markdown",
            });

            await ctx.reply("🔍 researching yourquestion....");
            void runAsk(ctx, q).catch(console.error);
    });

    bot.command("agent", async(ctx) => {
        if(!isOwner(ctx.chat.id)) return;
        const goal = commandArg(ctx.message.text, "agent");
        if(!goal) return ctx.reply("usage : `/agent <task description>`", { parse_mode: "Markdown" });
        await ctx.reply("🤖 agent is working on your task.......");
        void runAgent(ctx, ctx.chat.id, goal).catch(console.error);
    });

    bot.command("plan", async(ctx) => {
        if(!isOwner(ctx.chat.id)) return;
        const goal = commandArg(ctx.message.text, "plan");

        if(!goal)
            return ctx.reply("usage: `/plan <your goal>`", {
                parse_mode: "Markdown",
            });
        
        await ctx.reply("🧭 generating a plan...");

        void(async () => {
            const plan = await generatePlan(goal);
            const session: PlanSession = { plan, selected: new Set(plan.steps.map((s) => s.id)) }
            await ctx.reply(planMessage(session), { parse_mode: "Markdown", ...planKeyboard(session) });
            planSessions.set(ctx.chat.id, session);
        })().catch(console.error)
    });

    bot.action(/^plan_toggle:(.+)$/, async(ctx) => {
        if(!isOwner(ctx.chat!.id)) return ctx.answerCbQuery();
        const s = planSessions.get(ctx.chat!.id);
        if(!s) return ctx.answerCbQuery();

        const id = ctx.match[1]!;
        if(s.selected.has(id)) s.selected.delete(id);
        else(s.selected.add(id));

        await refreshPlanUi(ctx, s);
        await ctx.answerCbQuery();
    });

    bot.action('plan_all', async(ctx) => {
        if(!isOwner(ctx.chat!.id)) return ctx.answerCbQuery();
        const s = planSessions.get(ctx.chat!.id);
        if(!s) return ctx.answerCbQuery();
        for(const step of s.plan.steps) s.selected.add(step.id);
        await refreshPlanUi(ctx, s);
        await ctx.answerCbQuery();
    });

    bot.action('plan_none', async(ctx) => {
        
    })
}