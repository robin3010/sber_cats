const USER = 'robin3010';
const BASE_URL = `https://cats.petiteweb.dev/api/single/${USER}`;

const D_ATTR = {
  BOX: 'box',
  ACTION: 'action',
  CAT_CARD: 'cat-card',
};
const ACTIONS = {
  MORE: 'more',
  EDIT: 'edit',
  DELETE: 'delete',
};

const $box = document.querySelector(`[data-${D_ATTR.BOX}]`);

const makeCatCard = (cat) => {
  let fav = 'regular';
  if (cat.favorite) {
    fav = 'solid';
  }

  let imgPHClass = ' card__img-placeholder';
  let img = './img/img-placeholder.png';
  if (cat.image) {
    img = cat.image;
    imgPHClass = '';
  }

  return `<div data-${D_ATTR.CAT_CARD} data-id="${cat.id}" class="card">
    <div class="card__img${imgPHClass}">
      <img src="${img}" alt="${cat.name}">
    </div>
    <div class="card__title">
      <h2>${cat.name.toUpperCase()}</h2>
      <button class="card-favorite"><i class="fa-${fav} fa-heart"></i></button>
    </div>
    <div class="card__description">
      <p>${cat.description}</p>
    </div>
    <div class="card__buttons">
      <button data-${D_ATTR.ACTION}="${ACTIONS.MORE}">More...</button>
      <button data-${D_ATTR.ACTION}="${ACTIONS.EDIT}">Edit</button>
      <button data-${D_ATTR.ACTION}="${ACTIONS.DELETE}">Delete</button>
    </div>
  </div>
    `;
};

fetch(`${BASE_URL}/show/`)
  .then((response) => response.json())
  .then((allCats) => {
    $box.insertAdjacentHTML('afterbegin', allCats.map((el) => makeCatCard(el)).join(''));
  });

$box.addEventListener('click', (e) => {
  if (e.target.dataset[D_ATTR.ACTION] === ACTIONS.DELETE) {
    const $catCard = e.target.closest(`[data-${D_ATTR.CAT_CARD}]`);
    fetch(`${BASE_URL}/delete/${$catCard.dataset.id}`, { method: 'DELETE' })
      .then((response) => {
        if (response.status === 200) {
          $catCard.remove();
        }
      });
  }
});
