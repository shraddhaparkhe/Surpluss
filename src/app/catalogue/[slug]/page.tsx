import CatalogueBrowser from "@/components/CatalogueBrowser";

export default async function CataloguePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <CatalogueBrowser slug={slug} />;
}