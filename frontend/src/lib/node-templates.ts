import { triggerTemplates } from "./triggers";
import { actionTemplates } from "./actions";
import { aiTemplates } from "./ai";
import { logicTemplates } from "./logic";

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
