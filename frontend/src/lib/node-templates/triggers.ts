import { NodeTemplate } from "@/types/workflow";

export const triggerTemplates: NodeTemplate[] = [
  {
    id: "webhook",
    label: "Webhook",
    icon: "webhook",
    category: "triggers",
    color: "#f97316",
    description: "Trigger workflow via HTTP webhook",
    configFields: [
      { name: "method", label: "HTTP Method", type: "select", options: [
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "DELETE", value: "DELETE" },
      ]},
      { name: "path", label: "Path", type: "text", placeholder: "/api/webhook" },
    ],
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: "clock",
    category: "triggers",
    color: "#f97316",
    description: "Run workflow on a schedule",
    configFields: [
      { name: "cron", label: "Cron Expression", type: "text", placeholder: "0 * * * *" },
      { name: "timezone", label: "Timezone", type: "text", placeholder: "UTC" },
    ],
  },
  {
    id: "email-trigger",
    label: "Email Received",
    icon: "mail",
    category: "triggers",
    color: "#f97316",
    description: "Trigger when email is received",
    configFields: [
      { name: "email", label: "Email Address", type: "text", placeholder: "trigger@example.com" },
      { name: "filter", label: "Subject Filter", type: "text", placeholder: "Contains..." },
    ],
  },
];
