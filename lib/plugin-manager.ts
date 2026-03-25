import { ParsedTemplate } from './types';
import { PromptDockPlugin, StoredPlugin } from './plugin';

const PLUGIN_STORAGE_KEY = 'promptdock.plugins.v1';

class PluginManager {
  private plugins: Map<string, PromptDockPlugin> = new Map();
  private enabledPlugins: Set<string> = new Set();

  constructor() {
    this.loadPlugins();
  }

  /**
   * Load plugins from localStorage
   */
  private loadPlugins(): void {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(PLUGIN_STORAGE_KEY);
      if (!raw) return;

      const stored: StoredPlugin[] = JSON.parse(raw);
      for (const plugin of stored) {
        if (plugin.enabled && plugin.code) {
          this.registerPluginFromCode(plugin.name, plugin.code);
        }
      }
    } catch {
      console.warn('[PluginManager] Failed to load plugins from localStorage');
    }
  }

  /**
   * Save plugin state to localStorage
   */
  private savePlugins(): void {
    if (typeof window === 'undefined') return;

    const stored: StoredPlugin[] = [];
    this.plugins.forEach((plugin, name) => {
      stored.push({
        name,
        enabled: this.enabledPlugins.has(name),
        code: this.getPluginCode(plugin),
      });
    });

    window.localStorage.setItem(PLUGIN_STORAGE_KEY, JSON.stringify(stored));
  }

  /**
   * Extract plugin code for storage (simple serialization)
   */
  private getPluginCode(plugin: PromptDockPlugin): string {
    // Return a simple representation - in production, might use Function.toString()
    return `/* ${plugin.name} */`;
  }

  /**
   * Register a plugin from code string
   */
  private registerPluginFromCode(name: string, code: string): void {
    try {
      // Simple eval for demo - in production use sandboxed execution
      // eslint-disable-next-line no-eval
      const factory = new Function('return ' + code)();
      const plugin = factory();
      if (plugin && typeof plugin.init === 'function') {
        this.register(plugin);
      }
    } catch (e) {
      console.warn(`[PluginManager] Failed to register plugin: ${name}`, e);
    }
  }

  /**
   * Register a new plugin
   */
  register(plugin: PromptDockPlugin): void {
    if (!plugin.name || typeof plugin.init !== 'function') {
      throw new Error('[PluginManager] Invalid plugin: must have name and init()');
    }

    if (this.plugins.has(plugin.name)) {
      console.warn(`[PluginManager] Plugin "${plugin.name}" already registered, skipping`);
      return;
    }

    this.plugins.set(plugin.name, plugin);
    this.enabledPlugins.add(plugin.name);
    plugin.init();
    this.savePlugins();
  }

  /**
   * Unregister a plugin
   */
  unregister(name: string): void {
    this.plugins.delete(name);
    this.enabledPlugins.delete(name);
    this.savePlugins();
  }

  /**
   * Enable a plugin
   */
  enable(name: string): void {
    if (this.plugins.has(name)) {
      this.enabledPlugins.add(name);
      this.savePlugins();
    }
  }

  /**
   * Disable a plugin
   */
  disable(name: string): void {
    this.enabledPlugins.delete(name);
    this.savePlugins();
  }

  /**
   * Get all registered plugin names
   */
  getPluginNames(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Check if a plugin is enabled
   */
  isEnabled(name: string): boolean {
    return this.enabledPlugins.has(name);
  }

  /**
   * Hook: Called after template render
   */
  onTemplateRender(template: ParsedTemplate): void {
    if (typeof window === 'undefined') return;

    this.plugins.forEach((plugin, name) => {
      if (this.enabledPlugins.has(name) && plugin.onTemplateRender) {
        try {
          plugin.onTemplateRender(template);
        } catch (e) {
          console.error(`[PluginManager] Error in onTemplateRender for "${name}"`, e);
        }
      }
    });
  }

  /**
   * Hook: Called when prompt is copied
   */
  onPromptCopy(prompt: string): void {
    if (typeof window === 'undefined') return;

    this.plugins.forEach((plugin, name) => {
      if (this.enabledPlugins.has(name) && plugin.onPromptCopy) {
        try {
          plugin.onPromptCopy(prompt);
        } catch (e) {
          console.error(`[PluginManager] Error in onPromptCopy for "${name}"`, e);
        }
      }
    });
  }
}

// Singleton instance
export const pluginManager = new PluginManager();

// Global API for registering plugins
declare global {
  interface Window {
    __promptdock_plugins__: typeof pluginManager;
  }
}

if (typeof window !== 'undefined') {
  window.__promptdock_plugins__ = pluginManager;
}
