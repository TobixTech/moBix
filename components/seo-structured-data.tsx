interface Movie {
  id: string
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
        urlTemplate: `${process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app"}/movie/${movie.id}`,
        actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"],
      },
    },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
}

export function WebsiteStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "moBix",
    alternateName: "moBix Streaming",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app",
    description: "Premium streaming platform for movies and shows",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app"}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "moBix",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app"}/icons/icon-512x512.jpg`,
      },
    },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
}

export function OrganizationStructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "moBix",
    url: process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app",
    logo: `${process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app"}/icons/icon-512x512.jpg`,
    sameAs: [],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
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
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: movie.title,
    description: movie.description || `Watch ${movie.title} on moBix`,
    thumbnailUrl: movie.posterUrl || "/generic-movie-poster.png",
    uploadDate: movie.year ? `${movie.year}-01-01` : new Date().toISOString(),
    contentUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app"}/movie/${movie.id}`,
    embedUrl: `${process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app"}/movie/${movie.id}`,
    potentialAction: {
      "@type": "WatchAction",
      target: `${process.env.NEXT_PUBLIC_BASE_URL || "https://mobix.vercel.app"}/movie/${movie.id}`,
    },
  }

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
}
