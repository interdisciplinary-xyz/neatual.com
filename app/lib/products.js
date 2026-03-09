const createProduct = (index) => ({
  name: `Wzór nr ${index}`,
  price: "XX PLN",
  description: "50% bawełna / 50% len<br>Uszyto w Polsce.",
  thumbnailUrl: `/gallery/produkt-${index}/produkt-${index}-1.jpg`,
  alt: `Uniform wzór nr ${index} - 50% bawełna, 50% len, uszyto w Polsce`,
  photos: [
    { url: `/gallery/produkt-${index}/produkt-${index}-1.jpg` },
    { url: `/gallery/produkt-${index}/produkt-${index}-2.jpg` },
    { url: `/gallery/produkt-${index}/produkt-${index}-3.jpg` },
    { url: `/gallery/produkt-${index}/produkt-${index}-4.jpg` },
  ],
});

export const products = [
  createProduct(1),
  createProduct(2),
  createProduct(3),
  createProduct(4),
];
