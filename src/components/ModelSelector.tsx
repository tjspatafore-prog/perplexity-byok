"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Sparkles, Key, Zap, ShieldAlert } from "lucide-react";
import { AVAILABLE_MODELS, ModelOption, ProviderType, ApiKeys } from "@/lib/types";

interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  keys: ApiKeys;
  onOpenSettings: () => void;
}

const PROVIDER_NAMES: Record<ProviderType, string> = {
  google: "Google Gemini",
  anthropic: "Anthropic Claude",
  openai: "OpenAI",
  grok: "xAI (Grok)",
  kimi: "Moonshot (Kimi)",
  qwen: "Alibaba (Qwen)",
  deepgram: "Deepgram",
};

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  onSelectModel,
  keys,
  onOpenSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModelId) || AVAILABLE_MODELS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasKeyForProvider = (provider: ProviderType): boolean => {
    return Boolean(keys[provider as keyof ApiKeys]);
  };

  const providers: ProviderType[] = ["google", "anthropic", "openai", "grok", "kimi", "qwen"];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-[#202222] hover:bg-[#2a2d2d] text-gray-200 border border-[#2e3030] transition-colors"
      >
        <Sparkles className="w-3.5 h-3.5 text-perplexity-teal" />
        <span className="truncate max-w-[120px]">{currentModel.name}</span>
        <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline px-1.5 py-0.5 rounded bg-[#161717] border border-[#2d2f2f]">
          {currentModel.pricing}
        </span>
        {!hasKeyForProvider(currentModel.provider) && (
          <span className="w-2 h-2 rounded-full bg-amber-400" title="Key not configured" />
        )}
        <ChevronDown className="w-3 h-3 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-96 max-h-[480px] overflow-y-auto bg-[#1a1b1b] border border-[#2f3232] rounded-xl shadow-2xl z-50 p-2 divide-y divide-[#262828]">
          <div className="px-2 py-1.5 flex items-center justify-between text-xs text-gray-400">
            <span>Choose Model & Pricing</span>
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="text-perplexity-teal hover:underline flex items-center gap-1"
            >
              <Key className="w-3 h-3" /> Manage Keys
            </button>
          </div>

          {providers.map((provider) => {
            const providerModels = AVAILABLE_MODELS.filter((m) => m.provider === provider);
            if (providerModels.length === 0) return null;
            const hasKey = hasKeyForProvider(provider);

            return (
              <div key={provider} className="py-2">
                <div className="px-2 py-1 flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    {PROVIDER_NAMES[provider]}
                  </span>
                  {hasKey ? (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Key active
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onOpenSettings();
                      }}
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <ShieldAlert className="w-3 h-3" /> Needs key
                    </button>
                  )}
                </div>

                <div className="space-y-0.5 mt-1">
                  {providerModels.map((model) => {
                    const isSelected = model.id === currentModel.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model.id);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-[#252828] text-white"
                            : "text-gray-300 hover:bg-[#212323] hover:text-white"
                        }`}
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-gray-100">{model.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-medium">
                              {model.pricing}
                            </span>
                            {model.badge && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-perplexity-teal/20 text-perplexity-teal border border-perplexity-teal/30 font-semibold">
                                {model.badge}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-500 truncate mt-0.5">{model.description}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-perplexity-teal shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
