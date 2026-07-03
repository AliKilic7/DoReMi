import { ArtistDetailView } from "@/components/catalog/artist-detail";

export default async function ArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ArtistDetailView slug={slug} />;
}
