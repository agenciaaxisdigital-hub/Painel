import { motion } from "framer-motion";
import { BarChart3, Users, MousePointerClick, Image } from "lucide-react";

const icons = { chart: BarChart3, users: Users, clicks: MousePointerClick, gallery: Image };

interface EmptyStateProps {
  icon?: keyof typeof icons;
  title?: string;
  description?: string;
}

export function EmptyState({ icon = "chart", title = "Sem dados ainda", description = "Os dados aparecerão aqui conforme os visitantes acessam o site principal." }: EmptyStateProps) {
  const Icon = icons[icon];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="mb-4 rounded-2xl bg-primary/5 p-6">
        <Icon className="h-12 w-12 text-primary/30" />
      </div>
      <h3 className="text-lg font-medium text-foreground/70">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
}
