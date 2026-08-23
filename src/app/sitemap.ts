import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://qwikbite.vercel.app';

  // In the future, you can fetch dynamic routes from your database here
  // const restaurants = await getRestaurants();
  // const dynamicRoutes = restaurants.map((restaurant) => ({
  //   url: `${baseUrl}/restaurant/${restaurant.id}`,
  //   lastModified: new Date(restaurant.updatedAt),
  // }));

  // For now, we return our static, public-facing pages
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // ...dynamicRoutes
  ];
}
