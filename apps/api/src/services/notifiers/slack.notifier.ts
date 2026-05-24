export async function sendSlackAlert(
  config: { webhookUrl: string },
  message: string
) {
  await fetch(config.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });
}
