/**
 * @fileoverview Catalog Filtering Utilities
 * Pure functions for searching and category filtering.
 */

/**
 * Filters a list of products based on selected category and search query.
 * @param {import('../types/index.js').Product[]} products - List of products to filter.
 * @param {string} categoryId - The active category ID ('all' for no category filter).
 * @param {string} searchQuery - The user input search string.
 * @returns {import('../types/index.js').Product[]} Filtered products array.
 */
export const filterCatalog = (products, categoryId = 'all', searchQuery = '') => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return products.filter((product) => {
    // Only display active products in customer catalog
    if (product.isActive === false) return false;

    const matchesCategory =
      categoryId === 'all' || product.category.toLowerCase() === categoryId.toLowerCase();

    const matchesQuery =
      !normalizedQuery ||
      product.name.toLowerCase().includes(normalizedQuery) ||
      (product.description && product.description.toLowerCase().includes(normalizedQuery));

    return matchesCategory && matchesQuery;
  });
};
