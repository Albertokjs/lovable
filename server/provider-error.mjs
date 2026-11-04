// Use fixed messages: provider responses can contain credentials or request data.
export function providerError(status, body) {
  const code = body?.error?.code;
  const billingMessages = {
    credit_balance_exhausted: "OpenAI API credits have run out. Add credits in your OpenAI Platform billing settings, then send your message again.",
    organization_spend_limit_exceeded: "Your OpenAI organization has reached its spending limit. Review the organization's limits in OpenAI Platform before trying again.",
    project_spend_limit_exceeded: "Your OpenAI project has reached its spending limit. Review the project's limits in OpenAI Platform before trying again.",
    organization_usage_limit_exceeded: "Your OpenAI organization has reached its usage limit. Request a higher limit through OpenAI Platform before trying again.",
    insufficient_quota: "Your OpenAI account has no available API quota. Check your credits and limits in OpenAI Platform, then send your message again.",
  };
  if (Object.hasOwn(billingMessages, code))
    return { status: 503, error: billingMessages[code] };
  if (body?.error?.type === "insufficient_quota")
    return { status: 503, error: billingMessages.insufficient_quota };
  if (status === 401)
    return { status: 503, error: "OpenAI rejected the API key. Replace OPENAI_API_KEY in the server's .env file with an active key, then restart Orbital." };
  if (status === 403)
    return { status: 503, error: "OpenAI denied this request. Check the API key's project permissions and account access in OpenAI Platform." };
  if (code === "model_not_found")
    return { status: 503, error: "The configured AI model is unavailable to this API key. Check OPENAI_MODEL and your project's model access, then restart Orbital." };
  if (status === 429)
    return { status: 429, error: "OpenAI is receiving requests too quickly. Wait a moment before sending another message." };
  if (status >= 500)
    return { status: 502, error: "OpenAI is temporarily unavailable. Please try again shortly." };
  return { status: 502, error: "OpenAI could not process this request. Check the server's model configuration before trying again." };
}
