export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 bg-muted/40 p-6">
      <p className="text-xl font-semibold tracking-tight">Hallway</p>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
