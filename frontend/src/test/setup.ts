import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);

// jsdom no implementa el scroll de elementos ni de la ventana.
Element.prototype.scrollTo = () => {};
window.scrollTo = () => {};
