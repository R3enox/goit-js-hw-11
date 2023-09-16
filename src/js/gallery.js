import { Notify } from 'notiflix/build/notiflix-notify-aio';
import { refs } from './refs';
import { PixabayAPI } from './pixabay-api';
import galerryCard from '../templates/gallery-cards.hbs';
import { lightbox } from './simpleLightbox';
import { slowScroll } from './slowScroll';

const pixabayApi = new PixabayAPI(40);

let totalPages = 0;

refs.form.addEventListener('submit', onSubmit);

const observer = new IntersectionObserver(
  (entries, observer) => {
    if (entries[0].isIntersecting) {
      loadMoreData();
    }
  },
  {
    root: null,
    rootMargin: '300px',
    threshold: 1,
  }
);

async function onSubmit(evt) {
  evt.preventDefault();

  const searchQ = evt.currentTarget.elements['searchQuery'].value.trim();

  if (!searchQ) {
    return Notify.failure(
      'Sorry, there are no images matching your search query. Please try again.'
    );
  }

  pixabayApi.q = searchQ;
  pixabayApi.page = 1;
  try {
    const { totalHits, hits } = await pixabayApi.getPhotos();

    totalPages = Math.ceil(totalHits / 40);

    if (totalHits === 0) {
      return Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
    } else {
      Notify.success(`Hooray! We found ${totalHits} images.`);
      refs.list.innerHTML = galerryCard(hits);
      lightbox.refresh();
    }

    if (totalPages === 1) {
      return;
    }
    observer.observe(refs.guard);
  } catch (error) {
    Notify.failure(`${error}`);
  } finally {
    refs.form.reset();
  }
}

async function loadMoreData() {
  pixabayApi.page += 1;

  const { hits } = await pixabayApi.getPhotos();

  try {
    refs.list.insertAdjacentHTML('beforeend', galerryCard(hits));
    slowScroll();
    lightbox.refresh();
    if (pixabayApi.page === totalPages) {
      Notify.info("We're sorry, but you've reached the end of search results.");
      observer.unobserve(refs.guard);
      return;
    }
  } catch {
    Notify.failure(`${error}`);
  }
}
