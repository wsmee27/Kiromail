import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-3xl font-semibold">Settings</h1>
      <div className="mt-8 grid gap-4">
        <Card>
          <h2 className="text-lg font-semibold">Provider status</h2>
          <p className="mt-2 text-sm text-slate-400">Cloudflare, Mailtrap, and DNS providers are not connected yet. This foundation uses mock provider boundaries only.</p>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">AI privacy</h2>
          <p className="mt-2 text-sm text-slate-400">Email body access remains off by default. Metadata-only AI preferences are seeded for owner.</p>
        </Card>
      </div>
    </div>
  );
}
