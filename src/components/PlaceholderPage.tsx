import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  tabs?: string[];
  description: string;
  version?: string;
  features?: string[];
  children?: React.ReactNode;
}

export function PlaceholderPage({ title, tabs, description, version = "后续版本", features, children }: PlaceholderPageProps) {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">{title}</h1>

      {tabs && tabs.length > 0 && (
        <div className="flex gap-1 mb-6 border-b">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              className={`px-3 py-2 text-sm border-b-2 transition-colors ${
                i === 0
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {children}

      <div className="rounded-lg shadow-notion bg-card p-12 text-center">
        <Construction className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-base font-semibold mb-2">🚧 功能开发中</h2>
        <p className="text-sm text-muted-foreground mb-4">
          该模块将在{version}中上线
        </p>
        {features && (
          <p className="text-xs text-muted-foreground">
            预计包含：{features.join("、")}
          </p>
        )}
      </div>
    </div>
  );
}
