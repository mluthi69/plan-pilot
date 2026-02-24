import { Construction } from "lucide-react";

export default function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="rounded-full bg-muted p-4">
        <Construction className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="mt-4 text-xl font-semibold">{title}</h1>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
