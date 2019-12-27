# Quick Open Rails

Quickly opening Rails project files.

## Commands

`quickOpenRails.open`

![open](https://i.gyazo.com/d9284e8c399976e8e86f27e3d6257cb4.gif)

## Extension Settings

- `quickOpenRails.autoDetectAppDirectories`: Automatically detect directories under `app`.(default: `true`)
- `quickOpenRails.excludeAppDirectories`: (default: `["views"]`)
- `quickOpenRails.customCategories`: (default: See below)

```json
[
  {
    "label": "Layout",
    "pattern": "app/views/layouts/**/*"
  },
  {
    "label": "View",
    "pattern": "app/views/**/*",
    "exclude": "app/views/layouts/**/*"
  },
  {
    "label": "Config",
    "pattern": "config/**/*"
  },
  {
    "label": "Migration",
    "pattern": "db/migrate/**/*",
    "reverse": true
  },
  {
    "label": "Task",
    "pattern": "lib/tasks/**/*"
  },
  {
    "label": "Spec",
    "pattern": "spec/**/*"
  }
]
```

## Keymaps

No keymap by default.
