import { NodeTemplate } from "@/types/workflow";

export const aiTemplates: NodeTemplate[] = [
  {
    id: "openai",
    label: "OpenAI",
    icon: "openai",
    category: "ai",
    color: "#a855f7",
    description: "Generate text with OpenAI",
    configFields: [
      { name: "model", label: "Model", type: "select", options: [
        { label: "GPT-4", value: "gpt-4" },
        { label: "GPT-4 Turbo", value: "gpt-4-turbo" },
        { label: "GPT-3.5 Turbo", value: "gpt-3.5-turbo" },
      ]},
      { name: "prompt", label: "Prompt", type: "textarea", placeholder: "Enter your prompt..." },
      { name: "temperature", label: "Temperature", type: "number", defaultValue: 0.7 },
    ],
  },
  {
    id: "anthropic",
    label: "Claude AI",
    icon: "anthropic",
    category: "ai",
    color: "#a855f7",
    description: "Generate text with Anthropic Claude",
    configFields: [
      { name: "model", label: "Model", type: "select", options: [
        { label: "Claude 3 Opus", value: "claude-3-opus" },
        { label: "Claude 3 Sonnet", value: "claude-3-sonnet" },
        { label: "Claude 3 Haiku", value: "claude-3-haiku" },
      ]},
      { name: "prompt", label: "Prompt", type: "textarea", placeholder: "Enter your prompt..." },
    ],
  },
  {
    id: "text-classifier",
    label: "Text Classifier",
    icon: "brain",
    category: "ai",
    color: "#a855f7",
    description: "Classify text into categories",
    configFields: [
      { name: "categories", label: "Categories", type: "textarea", placeholder: "spam, not_spam" },
      { name: "input", label: "Input Field", type: "text", placeholder: "{{message}}" },
    ],
  },
];
