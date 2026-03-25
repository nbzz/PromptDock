import { MetadataRoute } from 'next';

const BASE_URL = 'https://promptdock.top';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1
    }
  ];

  return routes;
}
