import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Seed sample movies
  console.log('📽️  Seeding movies...')
  
  const movies = [
    {
      title: 'Inception',
      description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      year: 2010,
      genre: 'Sci-Fi',
      posterUrl: '/inception-movie-poster.png',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      views: 1523,
      isTrending: true,
      isFeatured: true,
    },
    {
      title: 'The Dark Knight',
      description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
      year: 2008,
      genre: 'Action',
      posterUrl: '/dark-knight-poster.png',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      views: 2341,
      isTrending: true,
      isFeatured: false,
    },
    {
      title: 'Interstellar',
      description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
      year: 2014,
      genre: 'Sci-Fi',
      posterUrl: '/interstellar-movie-poster.jpg',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      views: 1876,
      isTrending: true,
      isFeatured: false,
    },
    {
      title: 'The Shawshank Redemption',
      description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
      year: 1994,
      genre: 'Drama',
      posterUrl: '/shawshank-redemption-poster.png',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      views: 3124,
      isTrending: false,
      isFeatured: false,
    },
    {
      title: 'Pulp Fiction',
      description: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.',
      year: 1994,
      genre: 'Drama',
      posterUrl: '/generic-movie-poster.png',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      views: 2654,
      isTrending: false,
      isFeatured: false,
    },
    {
      title: 'The Matrix',
      description: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.',
      year: 1999,
      genre: 'Sci-Fi',
      posterUrl: '/matrix-movie-poster.png',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      views: 2987,
      isTrending: true,
      isFeatured: false,
    },
    {
      title: 'Mad Max: Fury Road',
      description: 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners.',
      year: 2015,
      genre: 'Action',
      posterUrl: '/mad-max-fury-road-poster.jpg',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      views: 1789,
      isTrending: false,
      isFeatured: false,
    },
    {
      title: 'The Grand Budapest Hotel',
      description: 'A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy.',
      year: 2014,
      genre: 'Comedy',
      posterUrl: '/grand-budapest-hotel-inspired-poster.png',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      views: 1234,
      isTrending: false,
      isFeatured: false,
    },
  ]

  for (const movie of movies) {
    await prisma.movie.upsert({
      where: { title: movie.title },
      update: {},
      create: movie,
    })
  }

  console.log(`✅ Created ${movies.length} movies`)

  // Create admin invitation code
  console.log('🔑 Creating admin invitation code...')
  
  const adminCode = process.env.ADMIN_INVITATION_CODE || 'MOBIX_ADMIN_2024'
  
  await prisma.adminInvite.upsert({
    where: { code: adminCode },
    update: { isActive: true },
    create: {
      code: adminCode,
      isActive: true,
      maxUses: 2,
      usedCount: 0,
    },
  })

  console.log(`✅ Admin invitation code created: ${adminCode}`)

  // Create default ad settings
  console.log('📢 Creating default ad settings...')
  
  const existingAdSettings = await prisma.adSettings.findFirst()
  
  if (!existingAdSettings) {
    await prisma.adSettings.create({
      data: {
        horizontalAdCode: '',
        verticalAdCode: '',
        homepageEnabled: false,
        movieDetailEnabled: false,
        dashboardEnabled: false,
      },
    })
    console.log('✅ Default ad settings created')
  } else {
    console.log('⏭️  Ad settings already exist, skipping')
  }

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
