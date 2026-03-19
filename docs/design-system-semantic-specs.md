# Design System Semantic Specs

This project now keeps a lightweight YAML spec for each supported design system under [`data/design-system-specs/`](/Users/mike.gifford/design-system-scan/data/design-system-specs).

These specs are intentionally narrower than the full inventory JSON files:

- The inventory JSON files answer: "What components exist upstream?"
- The YAML specs answer: "How are the most important components structured semantically, especially for demos and forms?"

The current YAML specs focus on:

- demo-friendly form patterns
- visible component structure
- canonical selectors or custom-element tags
- accessibility expectations that should hold across implementations

They are meant to support:

- one-page demo sites for each design system
- AI-assisted demo generation
- human review of how a component should be implemented
- future scanner improvements where shared semantic expectations matter more than exact class names

Each YAML file currently includes:

- `system`
- `demo_focus`
- `components`

Each component entry may include:

- `id`
- `name`
- `purpose`
- `canonical_patterns`
- `required_elements`
- `required_attributes`
- `accessibility`

These are not intended to replace the live scanner rules in [`src/systems/`](/Users/mike.gifford/design-system-scan/src/systems). They are a semantic companion layer that is easier to reuse for demos, reviews, and future cross-system comparisons.
