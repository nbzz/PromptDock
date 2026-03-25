import { ParsedTemplate } from './types';

/**
 * PromptDock Plugin Interface
 *
 * Plugins can hook into template rendering and prompt copy events.
 */
export interface PromptDockPlugin {
  /** Unique plugin identifier */
  name: string;

  /** Called when plugin is registered */
  init: () => void;

  /** Called after a template is rendered with variable values */
  onTemplateRender?: (template: ParsedTemplate) => void;

  /** Called when a prompt is copied to clipboard */
  onPromptCopy?: (prompt: string) => void;
}

/**
 * Plugin manifest stored in localStorage
 */
export interface StoredPlugin {
  name: string;
  enabled: boolean;
  code: string;
}
