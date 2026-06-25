import { tool } from "ai";
import { z } from "zod";
import type { ToolExecutor } from "./tool-executor.ts";
import { path } from "@clack/prompts";
import { context } from "@pinecone-database/pinecone/dist/assistant/data/context";
import { Command } from "commander";

export function createAgentTools(executor: ToolExecutor){
    return {
        read_file: tool({
            description: 
                "read a text file from the workspace. use a path relative to the project root.",
            inputSchema: z.object({
                path: z.string().describe("relative file path")
            }),
            execute: async({ path: p }) => executor.readFile(p),
        }),

        create_file: tool({
            description: 
                "stage creation of a new file (not written until the user approves)",
            inputSchema: z.object({
                path: z.string(),
                content: z.string()
            }),
            execute: async({ path: p, content }) => executor.createFile(p, content),
        }),

        modify_file: tool({
            description: 
                "stage a full file replacement for an existing file (pending approval)",
            inputSchema: z.object({
                path: z.string(),
                content: z.string().describe("create new file contents"),
            }),
            execute: async({ path: p, content }) => executor.modifyFile(p, content),
        }),

        delete_file: tool({
            description: 
                "stage deletion of a file (pending approval)",
            inputSchema: z.object({
                path: z.string(),
            }),
            execute: async({ path: p }) => executor.deleteFile(p),
        }),

        create_folder: tool({
            description: 
                "stage folder of a directory tree (pending approval). uses mkdir -p on apply",
            inputSchema: z.object({
                path: z.string().describe("relative directory path"),
            }),
            execute: async({ path: p }) => executor.createFolder(p),
        }),

        list_files: tool({
            description: 
                "list files and directories under the path",
            inputSchema: z.object({
                path: z.string(),
                recursive: z.boolean().optional().default(false),
            }),
            execute: async({ path: p, recursive }) => executor.listFiles(p, recursive),
        }),

        search_files: tool({
            description: 
                "find files matching a glob pattern (e.g. '*.ts', '**/*.md'). optional content substring filter",
            inputSchema: z.object({
                root: z.string().describe("directory to search, relative to root"),
                pattern: z.string().describe("glob like pattern using * and ** (forward slashes)"),
                content_contains: z.string().optional(),
            }),
            execute: async({ root, pattern, content_contains }) => executor.searchFiles(root, pattern, content_contains),
        }),

        analyze_codebase: tool({
            description: 
                "summarize structure: file count, size, extensions, read-only",
            inputSchema: z.object({
                path: z.string().default("."),
            }),
            execute: async({ path: p }) => executor.analyzeeCodeBase(p),
        }),

        execute_shell: tool({
            description: 
                "queue a shell command to run in the workspace after user approval. use with care",
            inputSchema: z.object({
                command: z.string().describe("single command; runs with shell: true"),
            }),
            execute: async({ command }) => executor.queueShell(command),
        }),

        list_skills: tool({
            description:
                "list absolute paths to SKILL.md files under configured skill directories (cursor / claude)",
            inputSchema: z.object({}),
            execute: async() => executor.listSkills(),
        }),

        read_skill: tool({
            description: 
                "read a SKILL.md file. path must be absolute and under skill roots, or use a path returned by list_skills",
            inputSchema: z.object({
                path: z.string(),
            }),
            execute: async({ path: p }) => executor.readSkill(p),
        }),
    };
}