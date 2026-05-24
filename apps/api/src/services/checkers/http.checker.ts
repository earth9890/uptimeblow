export interface CheckInput {
  url: string;
  method: string;
  timeoutMs: number;
  expectedStatus: number;
  keyword?: string | null;
  keywordType?: "present" | "absent" | null;
}

export interface CheckOutput {
  status: "up" | "down";
  responseTimeMs: number;
  statusCode: number | null;
  errorMessage: string | null;
}

export async function performHttpCheck(input: CheckInput): Promise<CheckOutput> {
  const start = performance.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), input.timeoutMs);

    const response = await fetch(input.url, {
      method: input.method,
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Uptimeblow/1.0 (https://uptimeblow.com)",
      },
    });

    clearTimeout(timeout);
    const responseTimeMs = Math.round(performance.now() - start);
    const statusCode = response.status;

    // Check status code
    if (statusCode !== input.expectedStatus) {
      return {
        status: "down",
        responseTimeMs,
        statusCode,
        errorMessage: `Expected status ${input.expectedStatus}, got ${statusCode}`,
      };
    }

    // Check keyword if configured
    if (input.keyword && input.keywordType) {
      const body = await response.text();
      const contains = body.includes(input.keyword);

      if (input.keywordType === "present" && !contains) {
        return {
          status: "down",
          responseTimeMs,
          statusCode,
          errorMessage: `Keyword "${input.keyword}" not found in response`,
        };
      }

      if (input.keywordType === "absent" && contains) {
        return {
          status: "down",
          responseTimeMs,
          statusCode,
          errorMessage: `Keyword "${input.keyword}" found in response (expected absent)`,
        };
      }
    }

    return {
      status: "up",
      responseTimeMs,
      statusCode,
      errorMessage: null,
    };
  } catch (err: any) {
    const responseTimeMs = Math.round(performance.now() - start);

    let errorMessage = err.message || "Unknown error";
    if (err.name === "AbortError") {
      errorMessage = `Timeout after ${input.timeoutMs}ms`;
    }

    return {
      status: "down",
      responseTimeMs,
      statusCode: null,
      errorMessage,
    };
  }
}
