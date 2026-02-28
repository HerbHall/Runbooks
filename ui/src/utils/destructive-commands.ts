export interface DestructiveWarning {
  command: string;
  description: string;
}

interface DestructivePattern {
  pattern: RegExp;
  description: string;
}

const DESTRUCTIVE_PATTERNS: DestructivePattern[] = [
  {
    pattern: /^docker\s+system\s+prune\b/i,
    description: "Removes all unused data (containers, networks, images, build cache)",
  },
  {
    pattern: /^docker\s+container\s+prune\b/i,
    description: "Removes all stopped containers",
  },
  {
    pattern: /^docker\s+image\s+prune\b/i,
    description: "Removes unused images",
  },
  {
    pattern: /^docker\s+volume\s+prune\b/i,
    description: "Removes all unused volumes (data loss risk)",
  },
  {
    pattern: /^docker\s+network\s+prune\b/i,
    description: "Removes all unused networks",
  },
  {
    pattern: /^docker\s+builder\s+prune\b/i,
    description: "Removes build cache",
  },
  {
    pattern: /^docker\s+(?:container\s+)?(?:rm|remove)\b/i,
    description: "Removes containers",
  },
  {
    pattern: /^docker\s+(?:rmi|image\s+(?:rm|remove))\b/i,
    description: "Removes images",
  },
  {
    pattern: /^docker\s+volume\s+(?:rm|remove)\b/i,
    description: "Removes volumes (data loss risk)",
  },
  {
    pattern: /^docker\s+network\s+(?:rm|remove)\b/i,
    description: "Removes networks",
  },
];

export function getDestructiveWarnings(commands: string[]): DestructiveWarning[] {
  const seen = new Set<string>();
  const warnings: DestructiveWarning[] = [];

  for (const command of commands) {
    const trimmed = command.trim();
    for (const { pattern, description } of DESTRUCTIVE_PATTERNS) {
      if (pattern.test(trimmed)) {
        const key = `${trimmed}::${description}`;
        if (!seen.has(key)) {
          seen.add(key);
          warnings.push({ command: trimmed, description });
        }
        break;
      }
    }
  }

  return warnings;
}
