const USER = 'robin3010';
const BASE_URL = `https://cats.petiteweb.dev/api/single/${USER}`;

const D_ATTR = {
  BOX: 'box',
  ACTION: 'action',
  CARD: 'cat-card',
  MODAL: 'modal',
};
const ACTIONS = {
  MORE: 'more',
  EDIT: 'edit',
  DELETE: 'delete',
};
const MODAL = {
  ADD: 'add-form',
  MORE: 'more-info',
  EDIT: 'edit-form',
};

const $box = document.querySelector(`[data-${D_ATTR.BOX}]`);

const catCardHTML = (cat) => {
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

  return `<div data-${D_ATTR.CARD} data-id="${cat.id}" class="card">
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
    $box.insertAdjacentHTML('afterbegin', allCats.map((el) => catCardHTML(el)).join(''));
  });

$box.addEventListener('click', (e) => {
  if (e.target.dataset[D_ATTR.ACTION] === ACTIONS.DELETE) {
    const $catCard = e.target.closest(`[data-${D_ATTR.CARD}]`);
    fetch(`${BASE_URL}/delete/${$catCard.dataset.id}`, { method: 'DELETE' })
      .then((response) => {
        if (response.status === 200) {
          $catCard.remove();
        }
      });
  }
});

const cutCatCardBts = (catCard) => {
  const re = /\s*<div class=.card__buttons.*$/gs;
  return catCard.outerHTML.replace(re, '');
};

const catModalCardHTML = (cat) => {
  const point = '<i class="fa-solid fa-paw"></i>';
  let rate = '';
  if (cat.rate > 0) {
    rate += point.repeat(cat.rate);
  }

  return `
  <div class="card__age">
    Age: ${cat.age}
  </div>
  <div class="card__rate">
    Rating: ${rate}
  </div>
</div>`;
};

const $modal = document.querySelector(`[data-${D_ATTR.MODAL}="${MODAL.MORE}"]`);

$box.addEventListener('click', (e) => {
  if (e.target.dataset[D_ATTR.ACTION] === ACTIONS.MORE) {
    const $catCard = e.target.closest(`[data-${D_ATTR.CARD}]`);
    const cutCatCardHTML = cutCatCardBts($catCard);

    (async function catInfo() {
      const getCatCardByID = await fetch(`${BASE_URL}/show/${$catCard.dataset.id}`);
      const catJSON = await getCatCardByID.json();
      return $modal.insertAdjacentHTML('afterbegin', await cutCatCardHTML + catModalCardHTML(catJSON));
    }());
  }
});
