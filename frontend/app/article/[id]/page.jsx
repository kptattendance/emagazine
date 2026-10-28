import ArticleRedirect from "./ArticleRedirect";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const SITE_URL = "https://emag.kptmangaluru.in";

// College logo, used when an article has no photo
const FALLBACK_IMAGE =
  "https://res.cloudinary.com/dnreqxbdw/image/upload/v1757932916/logo3_vptob4.jpg";

/*
============================================================
SHARED ARTICLE LINK  /article/<id>

WhatsApp and other apps read this page's title, description
and image to show a preview. People who open the link are
taken to the article on the magazine page.
============================================================
*/

const loadArticle = async (id) => {
  try {
    const response = await fetch(
      `${API_URL}/api/magazine-content/published/${encodeURIComponent(id)}`,
      // Previews may be a few minutes old; articles rarely change
      { next: { revalidate: 300 } }
    );

    if (!response.ok) return null;

    const body = await response.json();

    return body?.data || null;
  } catch (error) {
    return null;
  }
};

const summarize = (text, length = 160) => {
  const clean = String(text || "").replace(/\s+/g, " ").trim();

  return clean.length > length
    ? `${clean.slice(0, length - 1).replace(/\s+\S*$/, "")}...`
    : clean;
};

export async function generateMetadata({ params }) {
  const { id } = await params;
  const article = await loadArticle(id);

  if (!article) {
    return {
      title: "KPT E-Magazine",
      description: "KPT Mangaluru eMagazine",
    };
  }

  const author = article.student?.name || article.faculty?.name;

  const description = summarize(
    `${author ? `By ${author}. ` : ""}${article.description}`
  );

  const image = article.eventPhoto || FALLBACK_IMAGE;

  return {
    title: article.title,
    description,
    alternates: {
      canonical: `${SITE_URL}/article/${id}`,
    },
    openGraph: {
      type: "article",
      siteName: "KPT Mangaluru eMagazine",
      title: article.title,
      description,
      url: `${SITE_URL}/article/${id}`,
      images: [{ url: image, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
      images: [image],
    },
  };
}

export default async function SharedArticlePage({ params }) {
  const { id } = await params;
  const article = await loadArticle(id);

  return <ArticleRedirect id={id} title={article?.title || ""} />;
}
