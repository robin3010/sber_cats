const USER = 'robin3010';
const BASE_URL = `https://cats.petiteweb.dev/api/single/${USER}`;

const D_ATTR = {
  CONTAINER: 'data-container',
  ACTION: 'data-action',
  CARD: 'data-cat-card',
  MODAL: 'data-modal',
  MODAL_CONTAINER: 'data-modalcontainer',
};

// копия D_ATTR без 'data-' у ключей, для обращения через dataset
const DATASET = structuredClone(D_ATTR);
for (const k in DATASET) {
  if (DATASET) {
    DATASET[k] = DATASET[k].substring(5);
  }
}

const ACTIONS = {
  DETAIL: 'detail',
  EDIT: 'edit',
  DELETE: 'delete',
};
const MODAL = {
  ADD: 'add-form',
  DETAIL: 'detail-info',
  EDIT: 'edit-form',
};

const $container = document.querySelector(`[${D_ATTR.CONTAINER}]`);
const $modalContainer = document.querySelector(`[${D_ATTR.MODAL_CONTAINER}]`);
const $modalDetail = document.querySelector(`[${D_ATTR.MODAL}="${MODAL.DETAIL}"]`);

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

  return `
  <div ${D_ATTR.CARD} data-id="${cat.id}" class="card">
    <div class="card__img${imgPHClass}">
      <img src="${img}" alt="${cat.name}">
    </div>
    <div class="card__content">
      <div class="card__title">
        <h2>${cat.name.toUpperCase()}</h2>
        <button class="card-favorite"><i class="fa-${fav} fa-heart"></i></button>
      </div>
      <div class="card__description">
        <p>${cat.description}</p>
      </div>
      <div class="card__buttons">
        <button ${D_ATTR.ACTION}="${ACTIONS.DETAIL}">Detail...</button>
        <button ${D_ATTR.ACTION}="${ACTIONS.EDIT}">Edit</button>
        <button ${D_ATTR.ACTION}="${ACTIONS.DELETE}">Delete</button>
      </div>
    </div>
  </div>
    `;
};

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
  </div>
</div>
  `;
};

// get all cats
fetch(`${BASE_URL}/show/`)
  .then((response) => response.json())
  .then((allCats) => {
    $container.insertAdjacentHTML('afterbegin', allCats.map((el) => catCardHTML(el)).join(''));
  });

const toggleModalContainer = () => $modalContainer.classList.toggle('hidden');

const closeModal = (e) => {
  if (e.target === $modalContainer) {
    $modalDetail.replaceChildren();
    toggleModalContainer();
    $modalContainer.removeEventListener('click', closeModal);
  }
};

function deleteHandler(card, id) {
  fetch(`${BASE_URL}/delete/${id}`, { method: 'DELETE' })
    .then((response) => {
      if (response.status === 200) {
        return card.remove();
      }
      throw new Error(`Не удалось удалить кота с id = ${id}`);
    });
}

function detailHandler(card, id) {
  const cutCatCardHTML = cutCatCardBts(card);

  (async function catInfo() {
    const getCatCardByID = await fetch(`${BASE_URL}/show/${id}`);
    const catJSON = await getCatCardByID.json();
    return $modalDetail.insertAdjacentHTML('afterbegin', await cutCatCardHTML + catModalCardHTML(catJSON));
  }());
  toggleModalContainer();

  $modalContainer.addEventListener('click', closeModal);
}

function buttonsHandler(e) {
  if (e.target !== $container) {
    const $catCard = e.target.closest(`[${D_ATTR.CARD}]`);
    const catId = $catCard.dataset.id;

    switch (e.target.dataset[DATASET.ACTION]) {
      case ACTIONS.DELETE:
        deleteHandler($catCard, catId);
        break;

      case ACTIONS.DETAIL:
        detailHandler($catCard, catId);
        break;

      default:
        break;
    }
  }
}

$container.addEventListener('click', buttonsHandler);
