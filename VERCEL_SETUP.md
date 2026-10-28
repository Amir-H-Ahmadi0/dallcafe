# Deployment

The site serves its menu and cafe information from the project's source code. No database, Blob store, or environment variables are required.

## Update the menu

1. Edit the categories, menu items, or cafe details in `lib/default-data.ts`.
2. For an image, add a permitted image file under `public/` and set its local path in the menu item's `imageUrl` (for example, `/images/espresso.jpg`).
3. Run `npm run build` to verify the change.
4. Commit and push to `main`; Vercel deploys the updated site from GitHub.

The online admin dashboard and image upload are disabled. Changes made in the code become visible after deployment.

## Default image credits

The default photos are stored locally under `public/images/menu`, so visitors do not need to load them from an external image host. The selected Wikimedia Commons files are available under CC0 1.0 or public-domain terms:

| Local file | Wikimedia Commons file | Creator | License |
| --- | --- | --- | --- |
| `public/images/menu/espresso.jpg` | [Espresso Coffee 01.jpg](https://commons.wikimedia.org/wiki/File:Espresso_Coffee_01.jpg) | Jubair1985 | CC0 1.0 |
| `public/images/menu/latte.jpg` | [Latte - Baker Street Coffee, Brighton 2024-01-22.jpg](https://commons.wikimedia.org/wiki/File:Latte_-_Baker_Street_Coffee,_Brighton_2024-01-22.jpg) | Andy Li | CC0 1.0 |
| `public/images/menu/persian-tea.jpg` | [Persian tea glass.JPG](https://commons.wikimedia.org/wiki/File:Persian_tea_glass.JPG) | me. | Public domain |
| `public/images/menu/iced-coffee.jpg` | [Iced Coffee 20240730-135859.jpg](https://commons.wikimedia.org/wiki/File:Iced_Coffee_20240730-135859.jpg) | RegionVisitor90 | CC0 1.0 |
| `public/images/menu/chocolate-cake.jpg` | [Piece of chocolate cake on a white plate decorated with chocolate sauce.jpg](https://commons.wikimedia.org/wiki/File:Piece_of_chocolate_cake_on_a_white_plate_decorated_with_chocolate_sauce.jpg) | Daria Yakovleva | CC0 1.0 |
| `public/images/menu/breakfast.jpg` | [English Breakfast on Toast - Potatoast 2026-05-02.jpg](https://commons.wikimedia.org/wiki/File:English_Breakfast_on_Toast_-_Potatoast_2026-05-02.jpg) | Andy Li | CC0 1.0 |
