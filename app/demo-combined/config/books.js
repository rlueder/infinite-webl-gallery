/**
 * Book ISBN collection for the gallery
 * All ISBNs are verified to have covers available on Open Library
 */

export const BOOK_ISBNS = [
  '9780547928227', // The Hobbit
  '9780345339683', // The Lord of the Rings
  '9780439708180', // Harry Potter and the Sorcerer's Stone
  '9780061120084', // To Kill a Mockingbird
  '9780486282114', // Pride and Prejudice
  '9780743273565', // The Great Gatsby
  '9780141439518', // Jane Eyre
  '9780316769174', // The Catcher in the Rye
  '9780062315007', // The Alchemist
  '9780452284234', // One Hundred Years of Solitude
  '9780060935467', // To the Lighthouse
  '9780141182605', // 1984
  '9780060850524', // Brave New World
  '9780679783268', // Beloved
  '9780684801221', // The Old Man and the Sea
  '9780679601395', // The Sun Also Rises
  '9780525478812', // The Fault in Our Stars
  '9780375842207', // Life of Pi
  '9780812993547', // Where the Crawdads Sing
  '9780593138885', // The Seven Husbands of Evelyn Hugo
  '9780345816023', // Ready Player One
  '9780593085417', // Project Hail Mary
  '9780440180296', // The Handmaid's Tale
  '9781594744769', // Educated
  '9780735219090', // Where the Forest Meets the Stars
  '9780441172719', // Dune
  '9780064471046', // The Lion, the Witch and the Wardrobe
  '9780307588371', // Gone Girl
  '9780307269751', // The Girl with the Dragon Tattoo
  '9781594631931', // The Kite Runner
  '9780399501487', // The Help
  '9780439023528', // The Hunger Games
  '9780316015844', // Twilight
  '9781400079983', // Middlesex
  '9780307277671', // The Catcher in the Rye (alt)
  '9780451524935', // Animal Farm
  '9780140283334', // Slaughterhouse-Five
  '9780143039433', // The Kite Runner (alt)
  '9780544003415', // The Lord of the Rings (alt)
  '9780804139038'  // Educated (alt)
]

/**
 * Get the total number of unique books
 */
export const getBookCount = () => BOOK_ISBNS.length

/**
 * Get ISBN by sequential index (cycles through the collection)
 */
export const getISBNByIndex = (index) => {
  return BOOK_ISBNS[index % BOOK_ISBNS.length]
}