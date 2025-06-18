import { OBR } from "@owlbear-rodeo/sdk";

const LABEL_PREFIX = "GRID_LABEL_";

function getLabel(row, col) {
  if (col >= 26) {
    // Use AA, AB, AC format for columns beyond Z
    const firstLetter = String.fromCharCode("A".charCodeAt(0) + Math.floor(col / 26) - 1);
    const secondLetter = String.fromCharCode("A".charCodeAt(0) + (col % 26));
    return `${firstLetter}${secondLetter}${row + 1}`;
  }
  const letter = String.fromCharCode("A".charCodeAt(0) + col);
  return `${letter}${row + 1}`;
}

function createLabelItem(x, y, text) {
  return {
    id: LABEL_PREFIX + text,
    type: "TEXT",
    text: {
      value: text,
      size: 16,
      font: "Roboto",
      align: "CENTER",
      color: "#888888",
      bold: true
    },
    position: { x, y },
    layer: "MAP",
    locked: true
  };
}

async function getSceneBounds() {
  const items = await OBR.scene.items.getItems();
  if (items.length === 0) {
    // Return default bounds or handle empty scene
    return { x: 0, y: 0, width: 1000, height: 1000 };
  }
  const bounds = await OBR.scene.items.getItemBounds(items.map(item => item.id));
  return bounds;
}

async function addGridLabels() {
  const grid = await OBR.scene.grid.getGrid();
  if (grid.cellWidth <= 0 || grid.cellHeight <= 0) {
    console.error("Invalid grid cell dimensions");
    return;
  }
  const bounds = await getSceneBounds();

  const startX = bounds.x;
  const startY = bounds.y;
  const endX = bounds.x + bounds.width;
  const endY = bounds.y + bounds.height;

  const cols = Math.ceil((endX - startX) / grid.cellWidth);
  const rows = Math.ceil((endY - startY) / grid.cellHeight);

  const MAX_LABELS = 1000; // Prevent excessive label creation
  if (rows * cols > MAX_LABELS) {
    console.warn(`Scene too large for automatic labeling (${rows * cols} cells)`);
    return;
  }

  const items = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = startX + col * grid.cellWidth + grid.cellWidth / 2;
      const y = startY + row * grid.cellHeight + grid.cellHeight / 2;
      const label = getLabel(row, col);
      items.push(createLabelItem(x, y, label));
    }
  }

  await OBR.scene.items.addItems(items);
}

async function removeGridLabels() {
  const items = await OBR.scene.items.getItems();
  const labelsToRemove = items.filter((item) => item.id.startsWith(LABEL_PREFIX));
  if (labelsToRemove.length > 0) {
    await OBR.scene.items.deleteItems(labelsToRemove.map((item) => item.id));
  }
}

async function toggleLabels() {
  const items = await OBR.scene.items.getItems();
  const labelExists = items.some((item) => item.id.startsWith(LABEL_PREFIX));

  if (labelExists) {
    await removeGridLabels();
  } else {
    await addGridLabels();
  }
}

OBR.onReady(() => {
  OBR.action.onClick("toggle-labels", toggleLabels);
});