import { triggerTemplates } from "./node-templates/triggers";
import { actionTemplates } from "./node-templates/actions";
import { aiTemplates } from "./node-templates/ai";
import { logicTemplates } from "./node-templates/logic";

export const nodeTemplates = [
  ...triggerTemplates,
  ...actionTemplates,
  ...aiTemplates,
  ...logicTemplates,
];

export const getNodesByCategory = (category: string) =>
  nodeTemplates.filter((node) => node.category === category);

export const getNodeTemplate = (id: string) =>
  nodeTemplates.find((node) => node.id === id);
