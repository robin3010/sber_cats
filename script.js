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
  MORE: 'more',
  EDIT: 'edit',
  DELETE: 'delete',
};
const MODAL = {
  ADD: 'add-form',
  MORE: 'more-info',
  EDIT: 'edit-form',
};

const $container = document.querySelector(`[${D_ATTR.CONTAINER}]`);
const $modalContainer = document.querySelector(`[${D_ATTR.MODAL_CONTAINER}]`);
const $modalMore = document.querySelector(`[${D_ATTR.MODAL}="${MODAL.MORE}"]`);

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
        <button ${D_ATTR.ACTION}="${ACTIONS.MORE}">More...</button>
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

fetch(`${BASE_URL}/show/`)
  .then((response) => response.json())
  .then((allCats) => {
    $container.insertAdjacentHTML('afterbegin', allCats.map((el) => catCardHTML(el)).join(''));
  });

const toggleModalContainer = () => $modalContainer.classList.toggle('hidden');

const closeModal = (e) => {
  if (e.target === $modalContainer) {
    $modalMore.replaceChildren();
    toggleModalContainer();
    $modalContainer.removeEventListener('click', closeModal);
  }
};

$container.addEventListener('click', (e) => {
  if (e.target !== $container) {
    const $catCard = e.target.closest(`[${D_ATTR.CARD}]`);
    const catId = $catCard.dataset.id;

    switch (e.target.dataset[DATASET.ACTION]) {
      case ACTIONS.DELETE:
        fetch(`${BASE_URL}/delete/${catId}`, { method: 'DELETE' })
          .then((response) => {
            if (response.status === 200) {
              return $catCard.remove();
            }
            throw new Error(`Не удалось удалить кота с id = ${catId}`);
          });
        break;

      case ACTIONS.MORE:
        const cutCatCardHTML = cutCatCardBts($catCard);

        (async function catInfo() {
          const getCatCardByID = await fetch(`${BASE_URL}/show/${catId}`);
          const catJSON = await getCatCardByID.json();
          return $modalMore.insertAdjacentHTML('afterbegin', await cutCatCardHTML + catModalCardHTML(catJSON));
        }());
        toggleModalContainer();

        $modalContainer.addEventListener('click', closeModal);
        break;

      default:
        break;
    }
  }
});
