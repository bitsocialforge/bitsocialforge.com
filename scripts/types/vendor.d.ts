/** Narrow contract for the bundled third-party helper used by workflow tests. */
declare module "*live-copy-edit-agent.mjs" {
  export function runCopyEditBatchAgent(
    batch: { entries: never[] },
    options: {
      provider: string;
      cwd: string;
      outDir: string;
      env: NodeJS.ProcessEnv;
      timeoutMs: number;
    },
  ): Promise<unknown>;
}
