export default function robots() {
  const baseUrl = "https://emagg.kptmangaluru.in";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",

        disallow: [
          "/admin/",
          "/dashboard/",
          "/hod/",
          "/faculty/",
          "/student/",
          "/api/",
          "/auth/",
        ],
      },
    ],

    sitemap: `${baseUrl}/sitemap.xml`,
  };
}