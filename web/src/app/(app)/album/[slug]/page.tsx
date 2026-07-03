import { AlbumDetailView } from "@/components/catalog/album-detail";

export default async function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AlbumDetailView slug={slug} />;
}
