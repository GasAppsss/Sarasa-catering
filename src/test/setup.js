import '@testing-library/jest-dom';

if (typeof window !== 'undefined' && !window.IntersectionObserver) {
  window.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {
      this.callback([{ isIntersecting: true }]);
    }
    disconnect() {}
    unobserve() {}
  };
}

if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
}
