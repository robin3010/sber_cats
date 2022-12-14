const USER = 'robin3010';
const BASE_URL = `https://cats.petiteweb.dev/api/single/${USER}`;

const $box = document.querySelector('[data-box]');

const makeCatCard = (cat) => {
  let fav = 'regular';
  if (cat.favorite) {
    fav = 'solid';
  }
  return `<div class="card">
    <div class="card__img">
      <img src="${cat.image}" alt="${cat.name}" width="250px">
    </div>
    <div class="card__title">
      <h2>${cat.name.toUpperCase()}</h2>
      <button class="card-favorite"><i class="fa-${fav} fa-heart"></i></button>
    </div>
    <div class="card__description">
      <p>${cat.description}</p>
    </div>
    <div class="card__buttons">
      <button class="more">More...</button>
      <button class="edit">Edit</button>
      <button class="delete">Delete</button>
    </div>
  </div>
    `;
};

fetch(`${BASE_URL}/show/`)
  .then((response) => response.json())
  .then((allCats) => {
    $box.insertAdjacentHTML('afterbegin', allCats.map((el) => makeCatCard(el)).join(''));
  });
