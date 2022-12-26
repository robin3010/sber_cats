const USER = 'robin3010';
const BASE_URL = `https://cats.petiteweb.dev/api/single/${USER}`;
const ANIMATION_NAME = 'fadeOutDown';
const ANIMATION_DURATION = '.4s';

const D_ATTR = {
  CONTAINER: 'data-container',
  ACTION: 'data-action',
  CARD: 'data-cat-card',
  MODAL: 'data-modal',
  ID: 'data-id',
  BUTTONS: 'data-card-buttons',
};

// копия D_ATTR без 'data-' у ключей, для обращения через dataset
const DATASET = structuredClone(D_ATTR);
Object.keys(DATASET).forEach((key) => {
  DATASET[key] = DATASET[key].substring(5);
});

const ACTIONS = {
  ADD: 'add',
  DETAIL: 'detail',
  EDIT: 'edit',
  DELETE: 'delete',
  CLOSE: 'close',
};
const MODAL = {
  FORM: 'form',
  DETAIL: 'detail-info',
};

const LS_NEW_CAT = 'LS_NEW_CAT';

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
        <header>
          <h2>${cat.name.toUpperCase()}</h2>
        </header>
        <button class="card-favorite"><i class="fa-${fav} fa-heart"></i></button>
      </div>
      <div class="card__description">
        <p>${cat.description}</p>
      </div>
      <div data-card-buttons class="card__buttons">
        <button class="card__button-detail">
          <i ${D_ATTR.ACTION}="${ACTIONS.DETAIL}" class="fa-solid fa-eye"></i>
        </button>
        <button class="card__button-edit">
          <i ${D_ATTR.ACTION}="${ACTIONS.EDIT}" class="fa-solid fa-pen"></i>
        </button>
        <button class="card__button-delete">
          <i ${D_ATTR.ACTION}="${ACTIONS.DELETE}" class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>
  </div>
    `;
};

const catModalCardHTML = (cat) => {
  const point = '<i class="fa-solid fa-paw"></i>';
  let rate = '';
  if (cat.rate > 0) {
    rate += point.repeat(cat.rate);
  }

  return `
    <div class="card__age">
      Возраст: ${cat.age}
    </div>
    <div class="card__rate">
      Рейтинг: ${rate}
    </div>
    <button class="card__button-close">
      <i data-action="close" class="fa-solid fa-xmark"></i>
    </button>
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

// вкл/выкл отображения контейнера модального окна
const toggleModal = (modal) => {
  modal.classList.toggle('hidden');
  document.body.classList.toggle('scrollOff');
};

// получение и отображение карточек всех котов
(async function showCats() {
  const getCats = await fetch(`${BASE_URL}/show/`);
  const catData = await getCats.json();
  return $container.insertAdjacentHTML('afterbegin', catData.map((el) => catCardHTML(el)).join(''));
}());

// удаление кота
async function deleteHandler(card, id) {
  const removeCat = await fetch(`${BASE_URL}/delete/${id}`, { method: 'DELETE' });
  try {
    if (removeCat.status === 200) {
      if (card.closest(`[${D_ATTR.MODAL}]`)) {
        $container.querySelector(`[${D_ATTR.ID}="${card.dataset[DATASET.ID]}"]`).remove();
        return toggleModal($modalDetail);
      }
      return card.remove();
    }
    throw Error(`Не удалось удалить кота с id = ${id}`);
  } catch (err) {
    alert(err);
  }
}

const setAnimation = (elem, animation, duration) => new Promise((resolve) => {
  const $animModal = elem;
  $animModal.style.animationName = animation;
  if (duration) {
    $animModal.style.animationDuration = duration;
  }

  function handleAnimEnd(e) {
    e.stopPropagation();
    resolve();
  }

  elem.addEventListener('animationend', handleAnimEnd, { once: true });
});

// показать подробную карточку кота в модальном окне
async function detailHandler(card, id) {
  const getCatDataByID = await fetch(`${BASE_URL}/show/${id}`);
  try {
    if (getCatDataByID.status === 200) {
      const catData = await getCatDataByID.json();
      $modalDetail.insertAdjacentHTML('beforeend', catCardHTML(catData));
      const $catModalCard = $modalDetail.firstElementChild;

      // удаление лишней кнопки
      $catModalCard.querySelector(`[${D_ATTR.ACTION}="${ACTIONS.DETAIL}"]`).parentElement.remove();
      $catModalCard.querySelector(`[${D_ATTR.BUTTONS}]`).insertAdjacentHTML('beforebegin', catModalCardHTML(catData));

      // перемещение кнопки закрытия в начало модального окна
      const closeButton = $catModalCard.querySelector('.card__button-close');
      $catModalCard.prepend(closeButton);

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
    // удалить ненужные теги label, если добавляем кота
    addEditCatForm.querySelectorAll('label').forEach((tag) => {
      if (tag.htmlFor !== 'favorite' && tag.htmlFor !== 'rate') {
        tag.remove();
      }
    });
  }
  $modalForm.appendChild(addEditCatForm);

  const $addEditForm = document.forms.addEdit;

  // отображение текущего значения слайдера рейтинга
  const $rateSlider = $addEditForm.rate;
  const $rateValue = $modalForm.querySelector('#rateValue');

  $rateSlider.oninput = function changeRateValue() {
    $rateValue.innerHTML = this.value;
  };

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
    $modalForm.querySelector('h2').innerHTML = 'Редактировать кота';
    $addEditForm.id.disabled = true;
    $addEditForm.name.disabled = true;
    $addEditForm.submit.id = ACTIONS.EDIT;
    const getCatDataByID = await fetch(`${BASE_URL}/show/${id}`);
    try {
      if (getCatDataByID.status === 200) {
        const catData = await getCatDataByID.json();
        fillForm(catData);
        $rateValue.innerHTML = $addEditForm.rate.value;
        return;
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
    $rateValue.innerHTML = $rateSlider.value;

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
  const idInput = submitEvent.target.id;
  const nameInput = submitEvent.target.name;
  idInput.disabled = false;
  nameInput.disabled = false;
  const getFormData = Object.fromEntries(new FormData(submitEvent.target).entries());
  const formattedFormData = formatFormData(getFormData);

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
        if ($place) {
          $place.insertAdjacentHTML('beforebegin', catCardHTML(copyFormData));
          return $catCard.remove();
        }
        $container.insertAdjacentHTML('beforeend', catCardHTML(copyFormData));
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
  // симуляция клика для модального окна
  function simulateClick(target) {
    const cb = target;

    const evt = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window,
    });

    cb.dispatchEvent(evt);
  }

  if (e.target.dataset[DATASET.ACTION]) {
    const $catCard = !e.target.dataset.action.endsWith('add') ? e.target.closest(`[${D_ATTR.CARD}]`) : '';
    const catId = $catCard ? $catCard.dataset[DATASET.ID] : '';

    switch (e.target.dataset[DATASET.ACTION]) {
      case ACTIONS.DELETE:
        if (e.target.closest(`[${D_ATTR.MODAL}]`)) {
          simulateClick($modalDetail);
          setTimeout(() => {
            deleteHandler($catCard, catId);
          }, 300);
        } else {
          deleteHandler($catCard, catId);
        }
        break;

      case ACTIONS.DETAIL:
        detailHandler($catCard, catId);
        break;

      case ACTIONS.ADD:
        addEditHandler(e);
        break;

      case ACTIONS.EDIT:
        if (e.target.closest(`[${D_ATTR.MODAL}]`)) {
          simulateClick($modalDetail);
          setTimeout(() => {
            addEditHandler(e, catId);
          }, 300);
        } else {
          addEditHandler(e, catId);
        }
        break;
    }
  }
}

document.addEventListener('click', buttonsHandler);

// сценарии закрытия модальных окон
function flushModal(modal, id) {
  const $modalWindow = modal.firstElementChild;

  // по нажатию Escape
  async function closeByEsc(e) {
    if (e.key === 'Escape') {
      // eslint-disable-next-line no-use-before-define
      removeListeners();
      await setAnimation($modalWindow, ANIMATION_NAME, ANIMATION_DURATION);
      modal.replaceChildren();
      toggleModal(modal);
    }
  }

  // по клику на затемненную область
  async function closeByClick(e) {
    if (e.target.dataset.modal) {
      // eslint-disable-next-line no-use-before-define
      removeListeners();
      await setAnimation($modalWindow, ANIMATION_NAME, ANIMATION_DURATION);
      modal.replaceChildren();
      toggleModal(modal);
    }
  }

  // по клику на крестик область
  async function closeByXmark(e) {
    if (e.target.dataset[DATASET.ACTION] === ACTIONS.CLOSE) {
      // eslint-disable-next-line no-use-before-define
      removeListeners();
      await setAnimation($modalWindow, ANIMATION_NAME, ANIMATION_DURATION);
      modal.replaceChildren();
      toggleModal(modal);
    }
  }

  // при отправке формы
  async function closeBySubmit(e) {
    if (e.target === document.forms.addEdit) {
      e.preventDefault();
      SubmitHandler(e, id);
      // eslint-disable-next-line no-use-before-define
      removeListeners();
      await setAnimation($modalWindow, ANIMATION_NAME, ANIMATION_DURATION);
      modal.replaceChildren();
      toggleModal(modal);
    }
  }

  function removeListeners() {
    document.addEventListener('click', buttonsHandler);
    document.removeEventListener('keydown', closeByEsc);
    modal.removeEventListener('mousedown', closeByClick);
    modal.removeEventListener('click', closeByXmark);
    modal.removeEventListener('submit', closeBySubmit);
  }

  // document.removeEventListener('click', buttonsHandler);
  document.addEventListener('keydown', closeByEsc);
  modal.addEventListener('mousedown', closeByClick);
  modal.addEventListener('click', closeByXmark);
  modal.addEventListener('submit', closeBySubmit);
}
