import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    # Provider selection: "nvidia" | "anthropic" | "groq" | "openai" | "openrouter"
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "nvidia").lower()

    # API keys
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")

    # Tooling keys (optional)
    META_ACCESS_TOKEN: str = os.getenv("META_ACCESS_TOKEN", "")
    FIRECRAWL_API_KEY: str = os.getenv("FIRECRAWL_API_KEY", "")

    # Default models per provider (override via env if desired)
    STRATEGY_MODEL: str = os.getenv("STRATEGY_MODEL", "")
    RESEARCH_MODEL: str = os.getenv("RESEARCH_MODEL", "")
    CREATIVE_MODEL: str = os.getenv("CREATIVE_MODEL", "")

    _PROVIDER_DEFAULTS = {
        "anthropic": {
            "base_url": None,
            "models": {
                "strategy": "claude-opus-4-7",
                "research": "claude-sonnet-4-6",
                "creative": "claude-sonnet-4-6",
            },
        },
        "nvidia": {
            "base_url": "https://integrate.api.nvidia.com/v1",
            "models": {
                "strategy": "meta/llama-3.3-70b-instruct",
                "research": "meta/llama-3.3-70b-instruct",
                "creative": "meta/llama-3.3-70b-instruct",
            },
        },
        "groq": {
            "base_url": "https://api.groq.com/openai/v1",
            "models": {
                "strategy": "llama-3.3-70b-versatile",
                "research": "llama-3.3-70b-versatile",
                "creative": "llama-3.3-70b-versatile",
            },
        },
        "openai": {
            "base_url": None,
            "models": {
                "strategy": "gpt-4o",
                "research": "gpt-4o",
                "creative": "gpt-4o-mini",
            },
        },
        "openrouter": {
            "base_url": "https://openrouter.ai/api/v1",
            "models": {
                "strategy": "meta-llama/llama-3.3-70b-instruct",
                "research": "meta-llama/llama-3.3-70b-instruct",
                "creative": "meta-llama/llama-3.3-70b-instruct",
            },
        },
    }

    @classmethod
    def provider_base_url(cls) -> str | None:
        return cls._PROVIDER_DEFAULTS[cls.LLM_PROVIDER]["base_url"]

    @classmethod
    def provider_api_key(cls) -> str:
        mapping = {
            "anthropic": cls.ANTHROPIC_API_KEY,
            "nvidia": cls.NVIDIA_API_KEY,
            "groq": cls.GROQ_API_KEY,
            "openai": cls.OPENAI_API_KEY,
            "openrouter": cls.OPENROUTER_API_KEY,
        }
        return mapping[cls.LLM_PROVIDER]

    @classmethod
    def model_for(cls, role: str) -> str:
        env_override = {
            "strategy": cls.STRATEGY_MODEL,
            "research": cls.RESEARCH_MODEL,
            "creative": cls.CREATIVE_MODEL,
        }[role]
        if env_override:
            return env_override
        return cls._PROVIDER_DEFAULTS[cls.LLM_PROVIDER]["models"][role]

    @classmethod
    def is_openai_compatible(cls) -> bool:
        return cls.LLM_PROVIDER in {"nvidia", "groq", "openai", "openrouter"}

    @classmethod
    def validate(cls) -> None:
        if cls.LLM_PROVIDER not in cls._PROVIDER_DEFAULTS:
            raise RuntimeError(
                f"Unknown LLM_PROVIDER '{cls.LLM_PROVIDER}'. "
                f"Use one of: {', '.join(cls._PROVIDER_DEFAULTS)}"
            )
        if not cls.provider_api_key():
            env_name = {
                "anthropic": "ANTHROPIC_API_KEY",
                "nvidia": "NVIDIA_API_KEY",
                "groq": "GROQ_API_KEY",
                "openai": "OPENAI_API_KEY",
                "openrouter": "OPENROUTER_API_KEY",
            }[cls.LLM_PROVIDER]
            raise RuntimeError(
                f"{env_name} not set but LLM_PROVIDER={cls.LLM_PROVIDER}. "
                f"Set it in .env or switch providers."
            )


config = Config()
