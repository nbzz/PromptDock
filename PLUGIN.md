# PromptDock Plugin System

PromptDock supports a plugin system for extending functionality.

## Plugin Interface

```typescript
import { PromptDockPlugin } from '@/lib/plugin';

const myPlugin: PromptDockPlugin = {
  name: 'my-plugin',
  init: () => {
    console.log('Plugin initialized');
  },
  onTemplateRender: (template) => {
    console.log('Template rendered:', template.title);
  },
  onPromptCopy: (prompt) => {
    console.log('Prompt copied:', prompt.substring(0, 50) + '...');
  },
};
```

### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Unique plugin identifier |
| `init` | `() => void` | Yes | Called when plugin is registered |
| `onTemplateRender` | `(template: ParsedTemplate) => void` | No | Called after template render |
| `onPromptCopy` | `(prompt: string) => void` | No | Called when prompt is copied |

### ParsedTemplate

```typescript
interface ParsedTemplate {
  id: string;
  title: string;
  description?: string;
  content: string;
  rawMarkdown: string;
  frontmatter: FrontmatterShape;
  variables: ParsedVariable[];
}
```

## Registering Plugins

### Via JavaScript (Browser Console)

```javascript
window.__promptdock_plugins__.register({
  name: 'analytics',
  init: () => console.log('Analytics plugin ready'),
  onPromptCopy: (prompt) => {
    // Track copy events
    console.log('Copy:', prompt.length, 'chars');
  },
});
```

### Via localStorage

Plugins are automatically persisted to localStorage and restored on page load.

## API Reference

### `pluginManager.register(plugin: PromptDockPlugin)`

Register a new plugin.

### `pluginManager.unregister(name: string)`

Remove a plugin by name.

### `pluginManager.enable(name: string)`

Enable a disabled plugin.

### `pluginManager.disable(name: string)`

Disable a plugin without removing it.

### `pluginManager.getPluginNames(): string[]`

Get list of all registered plugin names.

### `pluginManager.isEnabled(name: string): boolean`

Check if a plugin is enabled.

### `pluginManager.onTemplateRender(template: ParsedTemplate)`

Manually trigger the template render hook (for integration).

### `pluginManager.onPromptCopy(prompt: string)`

Manually trigger the prompt copy hook.

## Examples

### Analytics Plugin

```typescript
const analyticsPlugin: PromptDockPlugin = {
  name: 'copy-analytics',
  init: () => {
    console.log('[Analytics] Tracking enabled');
  },
  onPromptCopy: (prompt) => {
    // Send to analytics endpoint
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({
        event: 'prompt_copy',
        length: prompt.length,
        timestamp: Date.now(),
      }),
    });
  },
};
```

### Variable Logger

```typescript
const loggerPlugin: PromptDockPlugin = {
  name: 'variable-logger',
  init: () => {},
  onTemplateRender: (template) => {
    console.table(template.variables.map(v => ({
      name: v.name,
      value: v.value,
      type: v.type,
    })));
  },
};
```

## Security Notes

- Plugins run with the same permissions as the page
- Only install plugins from trusted sources
- Plugin code is stored in localStorage - ensure browser security
