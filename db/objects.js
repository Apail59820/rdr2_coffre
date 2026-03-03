const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const defaultObjects = require("../data/defaultObjects");

const dataDirectory = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDirectory)) {
  fs.mkdirSync(dataDirectory, { recursive: true });
}

const databasePath = path.join(dataDirectory, "coffre.db");
const db = new DatabaseSync(databasePath);

const createTableSql = `
  CREATE TABLE IF NOT EXISTS objects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    value TEXT NOT NULL UNIQUE,
    quantity INTEGER NOT NULL DEFAULT 0,
    threshold INTEGER NOT NULL DEFAULT 0
  );
`;

db.exec(createTableSql);

const upsertObjectStatement = db.prepare(`
  INSERT INTO objects (category, name, value, quantity, threshold)
  VALUES (@category, @name, @value, @quantity, @threshold)
  ON CONFLICT(value) DO UPDATE SET
    category = excluded.category,
    name = excluded.name,
    threshold = excluded.threshold
`);

const searchObjectsStatement = db.prepare(`
  SELECT name, value
  FROM objects
  WHERE lower(name) LIKE @query OR lower(value) LIKE @query
  ORDER BY name ASC
  LIMIT @limit
`);

const getObjectByValueStatement = db.prepare(`
  SELECT category, name, value, quantity, threshold
  FROM objects
  WHERE value = @value
`);

const addObjectQuantityStatement = db.prepare(`
  UPDATE objects
  SET quantity = quantity + @quantity
  WHERE value = @value
  RETURNING category, name, value, quantity, threshold
`);

const removeObjectQuantityStatement = db.prepare(`
  UPDATE objects
  SET quantity = MAX(quantity - @quantity, 0)
  WHERE value = @value
  RETURNING category, name, value, quantity, threshold
`);

function initializeObjectsTable() {
  for (const object of defaultObjects) {
    upsertObjectStatement.run({
      category: object.category,
      name: object.name,
      value: object.value,
      quantity: object.quantity ?? 0,
      threshold: object.threshold ?? 0,
    });
  }
}

function searchObjects(query, limit = 25) {
  const normalizedQuery = `%${query.toLowerCase()}%`;
  const normalizedLimit = Math.max(1, Math.min(limit, 25));

  return searchObjectsStatement.all({
    query: normalizedQuery,
    limit: normalizedLimit,
  });
}

function addObjectQuantity(value, quantity) {
  return (
    addObjectQuantityStatement.get({
      value,
      quantity,
    }) ?? null
  );
}

function removeObjectQuantity(value, quantity) {
  const existingObject = getObjectByValueStatement.get({ value });
  if (!existingObject) {
    return null;
  }

  if (existingObject.quantity === 0) {
    return {
      ...existingObject,
      removedQuantity: 0,
    };
  }

  if (quantity > existingObject.quantity) {
    return {
      ...existingObject,
      removedQuantity: 0,
      requestedQuantity: quantity,
      hasInsufficientQuantity: true,
    };
  }

  const updatedObject = removeObjectQuantityStatement.get({
    value,
    quantity,
  });

  return {
    ...updatedObject,
    removedQuantity: Math.min(quantity, existingObject.quantity),
  };
}

module.exports = {
  initializeObjectsTable,
  searchObjects,
  addObjectQuantity,
  removeObjectQuantity,
};
