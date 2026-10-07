import { generateStaticParamsFor, importPage } from "nextra/pages";

// Aliased so the react-hooks ESLint rule doesn't treat it as a hook call
import { useMDXComponents as getMDXComponents } from "../../mdx-components";

// Single catch-all route that renders every .mdx file from src/content
export const generateStaticParams = generateStaticParamsFor("mdxPath");

export async function generateMetadata(props: PageProps<"/[[...mdxPath]]">) {
  const params = await props.params;
  const { metadata } = await importPage(params.mdxPath);
  return metadata;
}

const Wrapper = getMDXComponents().wrapper;

export default async function Page(props: PageProps<"/[[...mdxPath]]">) {
  const params = await props.params;
  const {
    default: MDXContent,
    toc,
    metadata,
    sourceCode,
  } = await importPage(params.mdxPath);
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
