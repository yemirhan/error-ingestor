import defaultComponents from "fumadocs-ui/mdx";

type MDXComponents = typeof defaultComponents;

export function useMDXComponents(components?: Partial<MDXComponents>): MDXComponents {
  return {
    ...defaultComponents,
    ...components,
  };
}
