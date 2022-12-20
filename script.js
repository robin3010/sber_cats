const USER = 'robin3010';
const BASE_URL = `https://cats.petiteweb.dev/api/single/${USER}`;

const D_ATTR = {
  CONTAINER: 'data-container',
  ACTION: 'data-action',
  CARD: 'data-cat-card',
  MODAL: 'data-modal',
  // MODAL_CONTAINER: 'data-modalcontainer',
};

// копия D_ATTR без 'data-' у ключей, для обращения через dataset
const DATASET = structuredClone(D_ATTR);
for (const k in DATASET) {
  if (DATASET) {
    DATASET[k] = DATASET[k].substring(5);
  }
}

const LS_NEW_CAT_FORM = 'LS_NEW_CAT_FORM';

const ACTIONS = {
  ADD: 'add',
  DETAIL: 'detail',
  EDIT: 'edit',
  DELETE: 'delete',
};
const MODAL = {
  ADD: 'form-add',
  EDIT: 'form-edit',
  DETAIL: 'detail-info',
};

const $container = document.querySelector(`[${D_ATTR.CONTAINER}]`);
// const $modalContainer = document.querySelector(`[${D_ATTR.MODAL_CONTAINER}]`);
const $modalDetail = document.querySelector(`[${D_ATTR.MODAL}="${MODAL.DETAIL}"]`);
const $modalAdd = document.querySelector(`[${D_ATTR.MODAL}="${MODAL.ADD}"]`);
const $formTemplate = document.querySelector('[data-form-template]');

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

const formatFormData = (data) => ({
  ...data,
  id: +data.id,
  age: +data.age,
  rate: +data.rate,
  favorite: !!data.favorite,
});

// получение и отображение карточек всех котов
(async function showCats() {
  const getCats = await fetch(`${BASE_URL}/show/`);
  const catData = await getCats.json();
  return $container.insertAdjacentHTML('afterbegin', await catData.map((el) => catCardHTML(el)).join(''));
}());

// удаление кота
async function deleteHandler(card, id) {
  const catRm = await fetch(`${BASE_URL}/delete/${id}`, { method: 'DELETE' });
  try {
    if (catRm.status === 200) {
      return card.remove();
    }
    throw Error(`Не удалось удалить кота с id = ${id}`);
  } catch (err) {
    alert(err);
  }
}

// добавление кота (отправка формы на сервер)
async function SubmitNewCatHandler(submitEvent) {
  const getFormData = Object.fromEntries(new FormData(submitEvent.target).entries());
  const formattedFormData = formatFormData(getFormData);

  const addNewCat = await fetch(`${BASE_URL}/add/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formattedFormData),
  });
  try {
    if (addNewCat.status === 200) {
      localStorage.removeItem(LS_NEW_CAT_FORM);
      return $container.insertAdjacentHTML('afterbegin', catCardHTML(formattedFormData));
    }
    throw Error('Ошибка при добавлении кота');
  } catch (err) {
    alert(err);
  }
}

// вкл/выкл отображения контейнера модального окна
const toggleModal = (modal) => modal.classList.toggle('hidden');

// показать подробную карточку кота в модальном окне
async function detailHandler(card, id) {
  const cutCatCardHTML = cutCatCardBts(card);

  const getCatDataByID = await fetch(`${BASE_URL}/show/${id}`);
  try {
    if (getCatDataByID.status === 200) {
      const catData = await getCatDataByID.json();
      $modalDetail.insertAdjacentHTML('afterbegin', await cutCatCardHTML + catModalCardHTML(catData));
      toggleModal($modalDetail);

      // eslint-disable-next-line no-use-before-define
      flushModal($modalDetail);
      return;
    }
    throw Error(`Ошибка при отображении подробной карточки кота с id = ${id}`);
  } catch (err) {
    alert(err);
  }
}

// показать форму добавления кота
const addHandler = () => {
  const addNewCatForm = $formTemplate.content.cloneNode(true);
  $modalAdd.appendChild(addNewCatForm);
  toggleModal($modalAdd);

  // eslint-disable-next-line no-use-before-define
  flushModal($modalAdd);

  // работа с localStorage
  const $addForm = document.forms.add;
  const getStoredData = localStorage.getItem(LS_NEW_CAT_FORM);
  const objFromStoredData = getStoredData && JSON.parse(getStoredData);

  if (objFromStoredData) {
    Object.keys(objFromStoredData).forEach((key) => {
      if (objFromStoredData.favorite) {
        $addForm.favorite.checked = true;
      }
      $addForm[key].value = objFromStoredData[key];
    });
  }

  $addForm.addEventListener('change', () => {
    const getFormData = Object.fromEntries(new FormData($addForm).entries());
    localStorage.setItem(LS_NEW_CAT_FORM, JSON.stringify(getFormData));
  });
};

// обработка кликов на кнопки
function buttonsHandler(e) {
  if (e.target.dataset[DATASET.ACTION]) {
    const $catCard = !e.target.dataset.action.endsWith('add') ? e.target.closest(`[${D_ATTR.CARD}]`) : '';
    const catId = $catCard ? $catCard.dataset.id : '';

    switch (e.target.dataset[DATASET.ACTION]) {
      case ACTIONS.DELETE:
        deleteHandler($catCard, catId);
        break;

      case ACTIONS.DETAIL:
        document.removeEventListener('click', buttonsHandler);
        detailHandler($catCard, catId);
        break;

      case ACTIONS.ADD:
        document.removeEventListener('click', buttonsHandler);
        addHandler();
        break;

      default:
        break;
    }
  }
}

document.addEventListener('click', buttonsHandler);

// сценарии закрытия модальных окон
function flushModal(modal) {
  // по нажатию Escape
  function closeByEsc(e) {
    if (e.key === 'Escape') {
      modal.replaceChildren();
      toggleModal(modal);
      // eslint-disable-next-line no-use-before-define
      removeListeners();
    }
  }

  // по клику на затемненную область
  function closeByClick(e) {
    if (e.target.dataset.modal) {
      e.target.replaceChildren();
      toggleModal(e.target);
      // eslint-disable-next-line no-use-before-define
      removeListeners();
    }
  }

  // при отправке формы
  function closeBySubmit(e) {
    if (e.target === document.forms['add' || 'edit']) {
      e.preventDefault();
      SubmitNewCatHandler(e);
      modal.replaceChildren();
      toggleModal(modal);
      // eslint-disable-next-line no-use-before-define
      removeListeners();
    }
  }

  function removeListeners() {
    document.addEventListener('click', buttonsHandler);
    document.removeEventListener('keydown', closeByEsc);
    modal.removeEventListener('mousedown', closeByClick);
    modal.removeEventListener('submit', closeBySubmit);
  }

  document.removeEventListener('click', buttonsHandler);
  document.addEventListener('keydown', closeByEsc);
  modal.addEventListener('mousedown', closeByClick);
  modal.addEventListener('submit', closeBySubmit);
}
