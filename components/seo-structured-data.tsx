interface Movie {
  id: string
  slug?: string | null
  title: string
  description?: string | null
  posterUrl?: string | null
  year?: number | null
  genre?: string | null
  rating?: string | null
  duration?: string | null
}

interface MovieStructuredDataProps {
  movie: Movie
}

export function MovieStructuredData({ movie }: MovieStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app"
  const movieUrl = `${baseUrl}/movie/${movie.slug || movie.id}`

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    description: movie.description || `Watch ${movie.title} on moBix`,
    image: movie.posterUrl || "/generic-movie-poster.png",
    datePublished: movie.year ? `${movie.year}-01-01` : undefined,
    genre: movie.genre?.split(",").map((g) => g.trim()) || [],
    contentRating: movie.rating || "NR",
    duration: movie.duration ? `PT${movie.duration.replace(/\s/g, "").toUpperCase()}` : undefined,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      bestRating: "5",
      worstRating: "1",
      ratingCount: "100",
    },
    potentialAction: {
      "@type": "WatchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: movieUrl,
        actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"],
      },
    },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
}

export function WebsiteStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app"

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "moBix",
    alternateName: "moBix Streaming",
    url: baseUrl,
    description:
      "Watch unlimited movies and TV shows online free. Stream HD movies - Action, Drama, Comedy, Nollywood & more.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "moBix",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/favicon.svg`,
      },
    },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
}

export function OrganizationStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app"

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "moBix",
    url: baseUrl,
    logo: `${baseUrl}/favicon.svg`,
    description: "moBix is a free movie streaming platform offering unlimited access to movies and TV shows.",
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "mobixmy@gmail.com",
      availableLanguage: ["English"],
    },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
}

export function BreadcrumbStructuredData({ items }: { items: { name: string; url: string }[] }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
}

export function VideoStructuredData({ movie }: MovieStructuredDataProps) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app"
  const movieUrl = `${baseUrl}/movie/${movie.slug || movie.id}`

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: movie.title,
    description: movie.description || `Watch ${movie.title} on moBix`,
    thumbnailUrl: movie.posterUrl || "/generic-movie-poster.png",
    uploadDate: movie.year ? `${movie.year}-01-01` : new Date().toISOString(),
    contentUrl: movieUrl,
    embedUrl: movieUrl,
    potentialAction: {
      "@type": "WatchAction",
      target: movieUrl,
    },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
}

export function FAQStructuredData({ faqs }: { faqs: { question: string; answer: string }[] }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
}
