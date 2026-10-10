export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-muted/40 p-6">
      <p className="text-3xl font-semibold tracking-tight 2xl:text-4xl">
        Hallway
      </p>
      <div className="w-full max-w-md 2xl:max-w-xl">{children}</div>
    </main>
  );
}
