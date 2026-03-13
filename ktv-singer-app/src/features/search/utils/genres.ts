export interface Genre {
  name: string;
  emoji: string;
  artists: string[];
}

export const genres: Genre[] = [
  {
    name: "Pop",
    emoji: "🎤",
    artists: ["Taylor Swift", "Adele", "Ed Sheeran", "Billie Eilish", "Dua Lipa", "Bruno Mars"],
  },
  {
    name: "Rock",
    emoji: "🎸",
    artists: ["Queen", "Nirvana", "Foo Fighters", "Bon Jovi", "AC/DC", "Guns N' Roses"],
  },
  {
    name: "R&B",
    emoji: "🎵",
    artists: ["Beyonce", "Usher", "Alicia Keys", "The Weeknd", "SZA", "Frank Ocean"],
  },
  {
    name: "K-Pop",
    emoji: "🇰🇷",
    artists: ["BTS", "BLACKPINK", "Twice", "Stray Kids", "aespa", "NewJeans"],
  },
  {
    name: "Hip-Hop",
    emoji: "🎧",
    artists: ["Eminem", "Drake", "Kendrick Lamar", "Jay-Z", "Kanye West"],
  },
  {
    name: "Country",
    emoji: "🤠",
    artists: ["Johnny Cash", "Dolly Parton", "Luke Combs", "Carrie Underwood", "Morgan Wallen"],
  },
  {
    name: "Classic",
    emoji: "🎹",
    artists: ["Frank Sinatra", "Elvis Presley", "Beatles", "Michael Jackson", "Whitney Houston"],
  },
  {
    name: "Duets",
    emoji: "👫",
    artists: ["Shallow Lady Gaga", "Somebody That I Used To Know", "Don't Go Breaking My Heart", "Endless Love"],
  },
];

/** Pick a random artist from a genre */
export function randomArtistQuery(genre: Genre): string {
  const idx = Math.floor(Math.random() * genre.artists.length);
  return genre.artists[idx];
}
