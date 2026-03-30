"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface RubricDimension {
  name: string;
  weight: number;
  description: string;
}

export const DEFAULT_DIMENSIONS: RubricDimension[] = [
  { name: "Code Quality", weight: 8, description: "Clean, readable, well-structured code" },
  { name: "AI Collaboration", weight: 7, description: "Effective use of AI tools and prompts" },
  { name: "Problem Solving", weight: 8, description: "Logical approach and correct solution" },
  { name: "Time Management", weight: 5, description: "Efficient use of allotted time" },
  { name: "Communication", weight: 5, description: "Clear explanations and documentation" },
];

interface RubricBuilderProps {
  value: RubricDimension[];
  onChange: (dimensions: RubricDimension[]) => void;
}

export function RubricBuilder({ value, onChange }: RubricBuilderProps) {
  function updateDimension(index: number, field: keyof RubricDimension, val: string | number) {
    const updated = value.map((d, i) =>
      i === index ? { ...d, [field]: val } : d
    );
    onChange(updated);
  }

  function removeDimension(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addDimension() {
    onChange([...value, { name: "", weight: 5, description: "" }]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="block font-mono text-xs uppercase tracking-widest text-muted">
          Rubric Dimensions
        </label>
        <span className="font-mono text-xs text-muted">
          {value.length} dimension{value.length !== 1 ? "s" : ""}
        </span>
      </div>

      {value.map((dim, i) => (
        <div key={i} className="border border-border p-4 space-y-4 relative group">
          <button
            type="button"
            onClick={() => removeDimension(i)}
            className="absolute top-2 right-2 font-mono text-xs text-muted hover:text-rust transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Remove dimension"
          >
            ✕
          </button>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_100px] gap-4">
            <Input
              label="Name"
              value={dim.name}
              onChange={(e) => updateDimension(i, "name", e.target.value)}
              placeholder="e.g. Code Quality"
            />
            <Input
              label="Weight"
              type="number"
              min={1}
              max={10}
              value={dim.weight}
              onChange={(e) => updateDimension(i, "weight", parseInt(e.target.value) || 1)}
            />
          </div>

          <Input
            label="Description"
            value={dim.description}
            onChange={(e) => updateDimension(i, "description", e.target.value)}
            placeholder="What this dimension evaluates"
          />
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={addDimension}>
        Add Dimension
      </Button>
    </div>
  );
}
