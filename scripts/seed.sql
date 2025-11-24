-- Seed Movies
INSERT INTO "Movie" (title, description, year, genre, "posterUrl", "videoUrl", views, "isTrending", "isFeatured") 
VALUES 
('Inception', 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 2010, 'Sci-Fi', '/inception-movie-poster.png', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 1523, true, true),
('The Dark Knight', 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', 2008, 'Action', '/dark-knight-poster.png', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 2341, true, false),
('Interstellar', 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity survival.', 2014, 'Sci-Fi', '/interstellar-movie-poster.jpg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 1876, true, false),
('The Shawshank Redemption', 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', 1994, 'Drama', '/shawshank-redemption-poster.png', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 3124, false, false),
('Pulp Fiction', 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.', 1994, 'Drama', '/generic-movie-poster.png', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 2654, false, false),
('The Matrix', 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.', 1999, 'Sci-Fi', '/matrix-movie-poster.png', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 2987, true, false),
('Mad Max: Fury Road', 'In a post-apocalyptic wasteland, a woman rebels against a tyrannical ruler in search for her homeland with the aid of a group of female prisoners.', 2015, 'Action', '/mad-max-fury-road-poster.jpg', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 1789, false, false),
('The Grand Budapest Hotel', 'A writer encounters the owner of an aging high-class hotel, who tells him of his early years serving as a lobby boy.', 2014, 'Comedy', '/grand-budapest-hotel-inspired-poster.png', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 1234, false, false)
ON CONFLICT (title) DO NOTHING;

-- Removed Seed Admin Invite

-- Seed Ad Settings
INSERT INTO "AdSettings" ("horizontalAdCode", "verticalAdCode", "homepageEnabled", "movieDetailEnabled", "dashboardEnabled", "adTimeoutSeconds") 
SELECT '', '', false, false, false, 20
WHERE NOT EXISTS (SELECT 1 FROM "AdSettings");
