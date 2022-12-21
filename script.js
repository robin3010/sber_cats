const USER = 'robin3010';
const BASE_URL = `https://cats.petiteweb.dev/api/single/${USER}`;

const D_ATTR = {
  CONTAINER: 'data-container',
  ACTION: 'data-action',
  CARD: 'data-cat-card',
  MODAL: 'data-modal',
  ID: 'data-id',
};

// копия D_ATTR без 'data-' у ключей, для обращения через dataset
const DATASET = structuredClone(D_ATTR);
Object.keys(DATASET).forEach((key) => {
  DATASET[key] = DATASET[key].substring(5);
});

const LS_NEW_CAT = 'LS_NEW_CAT';

const ACTIONS = {
  ADD: 'add',
  DETAIL: 'detail',
  EDIT: 'edit',
  DELETE: 'delete',
};
const MODAL = {
  FORM: 'form',
  DETAIL: 'detail-info',
};

const $container = document.querySelector(`[${D_ATTR.CONTAINER}]`);
const $modalDetail = document.querySelector(`[${D_ATTR.MODAL}="${MODAL.DETAIL}"]`);
const $modalForm = document.querySelector(`[${D_ATTR.MODAL}="${MODAL.FORM}"]`);
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
  <div ${D_ATTR.CARD} ${D_ATTR.ID}="${cat.id}" class="card">
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

// приведение данных формы к принимаемому бэкэндом формату
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
  const removeCat = await fetch(`${BASE_URL}/delete/${id}`, { method: 'DELETE' });
  try {
    if (removeCat.status === 200) {
      return card.remove();
    }
    throw Error(`Не удалось удалить кота с id = ${id}`);
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
    throw Error(`Не удалось отобразить подробную информацию о коте с id = ${id}`);
  } catch (err) {
    alert(err);
  }
}

// показать форму добавления / редактирования кота
const addEditHandler = (e, id) => {
  const addEditCatForm = $formTemplate.content.cloneNode(true);
  if (e.target.dataset[DATASET.ACTION] === ACTIONS.ADD) {
    addEditCatForm.querySelectorAll('label').forEach((tag) => {
      if (tag.htmlFor !== 'favorite' && tag.htmlFor !== 'rate') {
        tag.remove();
      }
    });
  }
  $modalForm.appendChild(addEditCatForm);

  const $addEditForm = document.forms.addEdit;

  // получение данных для предзаполнения в форму добавления
  const fillForm = (data) => {
    Object.keys(data).forEach((key) => {
      if (data.favorite) {
        $addEditForm.favorite.checked = true;
      }
      $addEditForm[key].value = data[key];
    });
  };

  // получение данных для предзаполнения в форму редактирования
  async function getCatData() {
    $modalForm.querySelector('h2').innerHTML = 'Edit Cat';
    $addEditForm.id.disabled = true;
    $addEditForm.name.disabled = true;
    $addEditForm.submit.id = ACTIONS.EDIT;
    const getCatDataByID = await fetch(`${BASE_URL}/show/${id}`);
    try {
      if (getCatDataByID.status === 200) {
        const catData = await getCatDataByID.json();
        return fillForm(catData);
      }
      throw Error(`Не удалось получить данные о коте с id = ${id}`);
    } catch (err) {
      alert(err);
    }
  }

  // условие какими данными предзаполнять (для добавления - из LS или редактирования - с бэкэнда)
  if (e.target.dataset[DATASET.ACTION] === ACTIONS.EDIT) {
    getCatData();
  } else {
  // логика работы с localStorage
    const getStoredData = localStorage.getItem(LS_NEW_CAT);
    const objFromStoredData = getStoredData && JSON.parse(getStoredData);

    if (objFromStoredData) {
      fillForm(objFromStoredData);
    }

    $addEditForm.addEventListener('change', () => {
      const getFormData = Object.fromEntries(new FormData($addEditForm).entries());
      localStorage.setItem(LS_NEW_CAT, JSON.stringify(getFormData));
    });
  }

  toggleModal($modalForm);

  // eslint-disable-next-line no-use-before-define
  flushModal($modalForm, id);
};

// добавление / редактирование кота (передача формы на бэкэнд)
function SubmitHandler(submitEvent, id) {
  // const $addEditForm = document.forms.addEdit;
  const idInput = submitEvent.target.id;
  const nameInput = submitEvent.target.name;
  idInput.disabled = false;
  nameInput.disabled = false;
  const getFormData = Object.fromEntries(new FormData(submitEvent.target).entries());
  const formattedFormData = formatFormData(getFormData);
  console.log('1', formattedFormData);

  async function addCat() {
    const addRequest = await fetch(`${BASE_URL}/add/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedFormData),
    });
    try {
      if (addRequest.status === 200) {
        localStorage.removeItem(LS_NEW_CAT);
        return $container.insertAdjacentHTML('afterbegin', catCardHTML(formattedFormData));
      }
      throw Error('Не удалось добавить кота');
    } catch (err) {
      alert(err);
    }
  }

  async function editCat(catId) {
    // копия новых данных кота для отображения карточки
    const copyFormData = { ...formattedFormData };
    Object.freeze(copyFormData);
    // удаление данных, которые не должны отправляться на бэкэнд
    delete formattedFormData.id;
    delete formattedFormData.name;
    Object.freeze(formattedFormData);
    const editRequest = await fetch(`${BASE_URL}/update/${catId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formattedFormData),
    });
    try {
      if (editRequest.status === 200) {
        const $catCard = document.querySelector(`[data-id='${id}']`);
        const $place = $catCard.nextElementSibling;
        $place.insertAdjacentHTML('beforebegin', catCardHTML(copyFormData));
        return $catCard.remove();
      }
      throw Error('Не удалось добавить кота');
    } catch (err) {
      alert(err);
    }
  }

  if (submitEvent.target.submit.id === ACTIONS.ADD) {
    addCat();
  } else if (submitEvent.target.submit.id === ACTIONS.EDIT) {
    editCat(id);
  }
}

// обработка кликов на кнопки
function buttonsHandler(e) {
  if (e.target.dataset[DATASET.ACTION]) {
    const $catCard = !e.target.dataset.action.endsWith('add') ? e.target.closest(`[${D_ATTR.CARD}]`) : '';
    const catId = $catCard ? $catCard.dataset[DATASET.ID] : '';

    switch (e.target.dataset[DATASET.ACTION]) {
      case ACTIONS.DELETE:
        deleteHandler($catCard, catId);
        break;

      case ACTIONS.DETAIL:
        detailHandler($catCard, catId);
        break;

      case ACTIONS.ADD:
        addEditHandler(e);
        break;

      case ACTIONS.EDIT:
        addEditHandler(e, catId);
        break;
    }
  }
}

document.addEventListener('click', buttonsHandler);

// сценарии закрытия модальных окон
function flushModal(modal, id) {
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
    if (e.target === document.forms.addEdit) {
      e.preventDefault();
      SubmitHandler(e, id);
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
