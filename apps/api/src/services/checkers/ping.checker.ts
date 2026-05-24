import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface PingCheckInput {
  url: string; // hostname or IP
  timeoutMs: number;
}

export interface PingCheckOutput {
  status: "up" | "down";
  responseTimeMs: number;
  errorMessage: string | null;
}

export async function performPingCheck(
  input: PingCheckInput
): Promise<PingCheckOutput> {
  const start = performance.now();

  // Extract hostname from URL
  let hostname: string;
  try {
    const url = new URL(
      input.url.startsWith("http") ? input.url : `http://${input.url}`
    );
    hostname = url.hostname;
  } catch {
    hostname = input.url;
  }

  const timeoutSec = Math.ceil(input.timeoutMs / 1000);

  try {
    const { stdout } = await execAsync(
      `ping -c 1 -W ${timeoutSec} ${hostname}`,
      { timeout: input.timeoutMs + 1000 }
    );

    const responseTimeMs = Math.round(performance.now() - start);

    // Extract time from ping output
    const timeMatch = stdout.match(/time[=<]([\d.]+)\s*ms/);
    const pingTime = timeMatch ? parseFloat(timeMatch[1]!) : responseTimeMs;

    return {
      status: "up",
      responseTimeMs: Math.round(pingTime),
      errorMessage: null,
    };
  } catch (err: any) {
    const responseTimeMs = Math.round(performance.now() - start);
    return {
      status: "down",
      responseTimeMs,
      errorMessage: err.message?.includes("timeout")
        ? `Ping timeout after ${timeoutSec}s`
        : `Host unreachable: ${hostname}`,
    };
  }
}
