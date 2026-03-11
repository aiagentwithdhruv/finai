"""
Unified LLM client — routes ALL models through OpenRouter.

OpenRouter provides a single OpenAI-compatible API for 300+ models:
  - Claude Sonnet 4.6      → anthropic/claude-sonnet-4.6
  - Grok 4.1 Fast           → x-ai/grok-4-1-fast-reasoning
  - Kimi K2.5               → moonshotai/kimi-k2.5
  - GPT-4o                  → openai/gpt-4o
  - DeepSeek V3             → deepseek/deepseek-chat
  - And 300+ more...

One API key. One base_url. All models.
https://openrouter.ai/docs
"""

from __future__ import annotations

import logging
from typing import Any

import openai

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Map short model names → OpenRouter model IDs
_MODEL_ALIASES: dict[str, str] = {
    # Short names for convenience
    "grok-4-1-fast-reasoning": "x-ai/grok-4-1-fast-reasoning",
    "grok-4-1-fast-non-reasoning": "x-ai/grok-4-1-fast-non-reasoning",
    "claude-sonnet-4-6": "anthropic/claude-sonnet-4.6",
    "claude-haiku-4-5-20251001": "anthropic/claude-haiku-4.5",
    "kimi-k2.5": "moonshotai/kimi-k2.5",
    "gpt-4o": "openai/gpt-4o",
    "deepseek-chat": "deepseek/deepseek-chat",
}


def _resolve_model(model: str) -> str:
    """Resolve short model name to OpenRouter model ID."""
    return _MODEL_ALIASES.get(model, model)


async def llm_complete(
    *,
    model: str | None = None,
    system: str,
    messages: list[dict[str, str]],
    max_tokens: int = 2048,
    temperature: float = 0.2,
) -> dict[str, Any]:
    """
    Send a chat completion request via OpenRouter.

    All models go through the same OpenAI-compatible endpoint.
    Set OPENROUTER_API_KEY in .env — one key for everything.

    Returns:
        {
            "text": str,
            "model_used": str,
            "prompt_tokens": int,
            "completion_tokens": int,
        }
    """
    settings = get_settings()
    model = model or settings.llm_model
    resolved_model = _resolve_model(model)

    api_key = settings.openrouter_api_key
    if not api_key:
        raise ValueError(
            "OPENROUTER_API_KEY is not set. "
            "Get your key at https://openrouter.ai/keys"
        )

    client = openai.AsyncOpenAI(
        api_key=api_key,
        base_url=_OPENROUTER_BASE_URL,
        default_headers={
            "HTTP-Referer": "https://finai.aiwithdhruv.com",
            "X-Title": "FinAI",
        },
    )

    all_messages: list[dict[str, str]] = [{"role": "system", "content": system}]
    all_messages.extend(messages)

    logger.debug(
        "LLM request",
        extra={"model": resolved_model, "messages": len(all_messages)},
    )

    response = await client.chat.completions.create(
        model=resolved_model,
        messages=all_messages,
        max_tokens=max_tokens,
        temperature=temperature,
    )

    choice = response.choices[0]
    usage = response.usage

    return {
        "text": choice.message.content.strip() if choice.message.content else "",
        "model_used": resolved_model,
        "prompt_tokens": usage.prompt_tokens if usage else 0,
        "completion_tokens": usage.completion_tokens if usage else 0,
    }
