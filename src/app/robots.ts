import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://qwikbite.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/', 
        '/api/',
        '/orders/', // users should not have their private orders indexed
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
