export interface OpenGraphData {
  title: string
  description: string
  image: string
  url: string
  type?: string
}

export function generateOpenGraph(data: OpenGraphData) {
  return {
    title: data.title,
    description: data.description,
    openGraph: {
      title: data.title,
      description: data.description,
      url: data.url,
      siteName: "moBix",
      images: [
        {
          url: data.image,
          width: 1200,
          height: 630,
          alt: data.title,
        },
      ],
      locale: "en_US",
      type: data.type || "website",
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.description,
      images: [data.image],
    },
  }
}

export function generateMovieSchema(movie: {
  title: string
  description: string
  posterUrl: string
  year: number
  genre: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    description: movie.description,
    image: movie.posterUrl,
    dateCreated: movie.year.toString(),
    genre: movie.genre,
  }
}
