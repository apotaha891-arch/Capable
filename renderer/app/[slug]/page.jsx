import { notFound } from 'next/navigation';
import { fetchBlueprintBySlug } from '@/lib/api';
import { BlockRenderer } from '@/components/BlockRenderer';

export const revalidate = 60; // ISR — spec §7
export const dynamicParams = true;

export async function generateMetadata({ params }) {
  const data = await fetchBlueprintBySlug(params.slug);
  if (!data) return { title: 'Not found' };
  const bp = data.blueprint;
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'capable.app';
  const url = `https://${params.slug}.${appDomain}`;
  const hero = bp?.blocks?.find(b => b.type === 'HeroSection')?.content;
  const description = hero?.subtitle || bp?.project_name;
  const ogImage = data.og_image_url || `https://${appDomain}/api/og/${params.slug}`;

  return {
    title: bp?.project_name,
    description,
    openGraph: {
      title: bp?.project_name,
      description,
      url,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title: bp?.project_name, description, images: [ogImage] },
  };
}

export default async function SlugPage({ params }) {
  const data = await fetchBlueprintBySlug(params.slug);
  if (!data) notFound();
  return <BlockRenderer blueprint={data.blueprint} />;
}
