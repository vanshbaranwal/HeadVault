import fs from "node:fs";
import path from "node:path";
import { homedir } from "node:os";
import { spawn } from "node:child_process";
import type { AgentConfig, ActionLog } from "./types.ts";
import { ActionTracker } from "./action-tracker.ts";
import { config } from "dotenv";

const TEXT_EXT = new Set([
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '.mjs',
    '.cjs',
    '.json',
    '.md',
    '.mdx',
    '.css',
    '.html',
    '.yml',
    '.yaml',
    '.toml',
    '.txt',
    '.py',
]);


function isProbablyTextFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return TEXT_EXT.has(ext) || ext === '';
};

export class ToolExecutor{

    private overlay = new Map<string, string>();
    private deleted = new Set<string>();
    private readonly norm = (rel: string) => path.posix.normalize(rel.split(path.sep).join("/")).replace(/^\.\//, "");

    constructor (
        private readonly tracker: ActionTracker,
        private readonly config: AgentConfig,
    ){}

    private resolveSafe(rel: string): string{
        const abs = path.resolve(this.config.codebasePath, rel);
        const root = path.resolve(this.config.codebasePath);
        const relCheck = path.relative(root, abs);

        if(relCheck.startsWith('..') || path.isAbsolute(relCheck)){
            throw new Error(`path escapes workspace:  ${rel}`);
        }
        return abs;
    }

    private excluded(relPath: string): boolean {
        const norm = this.norm(relPath);
        const segments = norm.split('/');
        const base = segments[segments.length - 1] ?? '';

        for(const pat of this.config.excludePatterns) {
            if(pat === '*.log' && base.endsWith('.log')) return true;
            if(pat === '.env*' && base.startsWith('.env')) return true;
            if(pat.includes('*')) continue;
            if(segments.includes(pat) || norm === pat || norm.startsWith(`${pat}/`))
                return true;
        }
        return false;
    }

    private assertNotExcluded(rel: string, op: string): void {
        if(this.excluded(rel)) {
            throw new Error(`${op}: path is excluded by policy: ${rel}`);
        }
    }

    getEffectiveText(rel: string): string | undefined {
        const key = this.norm(rel);
        if(this.deleted.has(key)) return undefined;
        if(this.overlay.has(key)) return this.overlay.get(key);
        const abs = this.resolveSafe(rel);
        if(!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return undefined;
        return fs.readFileSync(abs, 'utf8');
    }

    readFile(rel: string): string {
        this.assertNotExcluded(rel, "read_file");
        const abs = this.resolveSafe(rel);
        if(!fs.existsSync(abs) || !fs.statSync(abs).isFile()){
            throw new Error(`file not found: ${rel}`);
        }
        const text = fs.readFileSync(abs, "utf8");
        this.tracker.log({
            type: "code_analysis",
            path: this.norm(rel),
            details: {after : text, toolName : "read_file"},
            status: "executed",
        });
        return text;
    }

    createFile(rel: string, content: string): string {
        if(!this.config.tools.allowFileCreation)
            throw new Error("file creation disabled");
        this.assertNotExcluded(rel, "create_file");
        const key = this.norm(rel);
        const abs = this.resolveSafe(rel);
        if(fs.existsSync(abs) && !this.deleted.has(key)) {
            throw new Error(`create_file: already exists: ${rel}`);
        }
        this.deleted.delete(key);
        this.overlay.set(key, content);
        this.tracker.log({
            type: "file_create",
            path: key,
            details: { after: content },
            status: "pending",
        });
        return `staged new file: ${key}`;
    }

    modifyFile(rel: string, content: string): string {
        if(!this.config.tools.allowFileModification)
            throw new Error("file modification disabled");
        this.assertNotExcluded(rel, "modify_file");
        const before = this.getEffectiveText(rel);
        if(before ===  undefined)
            throw new Error(`modify_file: file not founD: ${rel}`);
        const key = this.norm(rel);
        this.overlay.set(key, content);
        this.tracker.log({
            type: "file_modify",
            path: key,
            details: { before, after: content },
            status: "pending",
        });
        return `staged update: ${key}`;
    }

    deleteFile(rel: string): string {
        if(!this.config.tools.allowFileModification)
            throw new Error("file deletion disabled");
        this.assertNotExcluded(rel, "delete_file");
        const before = this.getEffectiveText(rel);
        if(before === undefined)
            throw new Error(`delete_file: file not found: ${rel}`);
        const key = this.norm(rel);
        this.overlay.delete(key);
        this.deleted.add(key);
        this.tracker.log({
            type: "file_delete",
            path: key,
            details: { before },
            status: "pending",
        });
        return  `staged delete: ${key}`;
    }

    createFolder(rel: string): string {
        if(!this.config.tools.allowFileCreation)
            throw new Error("folder creation disabled");
        this.assertNotExcluded(rel, "create_folder");
        const key = this.norm(rel);
        this.tracker.log({
            type: "folder_create",
            path: key,
            details: { after: key },
            status: "pending",
        });
        return `staged folder: ${key}`;
    }

    listFiles(rel: string, recursive: boolean): string {
        this.assertNotExcluded(rel, "list_files");
        const abs = this.resolveSafe(rel);
        if(!fs.existsSync(abs))
            throw new Error(`list_files: nmot found: ${rel}`);

        const lines: string[] = [];
        const walk = (dir: string, prefix: string) => {
            const entries = fs.readdirSync(dir, {  withFileTypes: true });
            for(const ent of entries) {
                const full = path.join(dir, ent.name);
                const relP = path.relative(this.config.codebasePath, full);
                if(this.excluded(relP)) continue;
                if(ent.isDirectory()) {
                    lines.push(`${prefix}${ent.name}/`);
                    if(recursive) walk(full, `${prefix}${ent.name}/`);
                } else{
                    lines.push(`${prefix}${ent.name}`);
                }
            }
        };

        if(fs.statSync(abs).isDirectory()) walk(abs, "");
        else lines.push(path.relative(this.config.codebasePath, abs));

        const out = lines.sort().join("\n");
        this.tracker.log({
            type: "code_analysis",
            path: this.norm(rel),
            details: { after: out, toolname: "list_files" },
            status: "executed",
        });
        return out || "(empty)";
    }

    
}
