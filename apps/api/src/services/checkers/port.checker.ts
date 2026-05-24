import net from "node:net";

export interface PortCheckInput {
  url: string; // hostname:port or URL
  timeoutMs: number;
}

export interface PortCheckOutput {
  status: "up" | "down";
  responseTimeMs: number;
  errorMessage: string | null;
}

export async function performPortCheck(
  input: PortCheckInput
): Promise<PortCheckOutput> {
  const start = performance.now();

  // Parse host and port
  let hostname: string;
  let port: number;

  try {
    if (input.url.includes("://")) {
      const url = new URL(input.url);
      hostname = url.hostname;
      port = parseInt(url.port, 10) || (url.protocol === "https:" ? 443 : 80);
    } else if (input.url.includes(":")) {
      const parts = input.url.split(":");
      hostname = parts[0]!;
      port = parseInt(parts[1]!, 10);
    } else {
      hostname = input.url;
      port = 80;
    }
  } catch {
    return {
      status: "down",
      responseTimeMs: Math.round(performance.now() - start),
      errorMessage: "Invalid URL or host:port format",
    };
  }

  return new Promise((resolve) => {
    const socket = new net.Socket();

    const timer = setTimeout(() => {
      socket.destroy();
      resolve({
        status: "down",
        responseTimeMs: Math.round(performance.now() - start),
        errorMessage: `Connection timeout after ${input.timeoutMs}ms`,
      });
    }, input.timeoutMs);

    socket.connect(port, hostname, () => {
      clearTimeout(timer);
      socket.destroy();
      resolve({
        status: "up",
        responseTimeMs: Math.round(performance.now() - start),
        errorMessage: null,
      });
    });

    socket.on("error", (err) => {
      clearTimeout(timer);
      socket.destroy();
      resolve({
        status: "down",
        responseTimeMs: Math.round(performance.now() - start),
        errorMessage: `Port ${port} on ${hostname}: ${err.message}`,
      });
    });
  });
}
