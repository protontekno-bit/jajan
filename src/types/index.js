/**
 * @fileoverview Data Type Definitions & Contracts
 * Documented with JSDoc for IDE intellisense and AI reasoning context.
 */

/**
 * @typedef {Object} Category
 * @property {string} id - Unique identifier for category (e.g. 'all', 'burger')
 * @property {string} name - Display name for category
 * @property {string} icon - Emoji or icon representation
 */

/**
 * @typedef {Object} Product
 * @property {number} id - Unique product ID
 * @property {string} name - Product title
 * @property {number} price - Price in IDR
 * @property {string} category - Category ID reference
 * @property {string} img - Image URL
 * @property {number} rating - Average customer rating (1-5)
 * @property {string} [description] - Optional short description
 */

/**
 * @typedef {Object} CartItem
 * @property {number} id - Product ID
 * @property {string} name - Product name
 * @property {number} price - Unit price
 * @property {string} category - Category ID
 * @property {string} img - Image URL
 * @property {number} rating - Rating
 * @property {number} quantity - Item quantity in cart
 */

export {};
