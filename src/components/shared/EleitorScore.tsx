import { Flame } from "lucide-react";

interface EleitorScoreProps {
  flames: number;
  size?: "sm" | "md";
}

export function EleitorScore({ flames, size = "sm" }: EleitorScoreProps) {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="flex gap-0.5" title={`Score: ${flames} chama${flames > 1 ? "s" : ""}`}>
      {Array.from({ length: 4 }, (_, i) => (
        <Flame
          key={i}
          className={`${iconSize} ${
            i < flames
              ? i < 2 ? "text-primary fill-primary" : "text-secondary fill-secondary"
              : "text-muted-foreground/20"
          }`}
        />
      ))}
    </div>
  );
}
