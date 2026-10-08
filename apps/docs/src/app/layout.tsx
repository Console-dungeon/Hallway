import type { Metadata } from "next";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import { Footer, Layout, Navbar } from "nextra-theme-docs";
import "nextra-theme-docs/style.css";

export const metadata: Metadata = {
  title: {
    default: "Hallway – dokumentacja",
    template: "%s – Hallway",
  },
  description: "Dokumentacja projektu Hallway",
};

const navbar = (
  <Navbar
    logo={<b>Hallway</b>}
    projectLink="https://github.com/Console-dungeon/Hallway"
  />
);
const footer = <Footer>{new Date().getFullYear()} © Hallway</Footer>;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/Console-dungeon/Hallway/tree/main/apps/docs"
        >
          {children}
        </Layout>
      </body>
    </html>
  );
}
