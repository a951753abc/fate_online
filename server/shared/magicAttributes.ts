// === 魔術屬性標籤（shared between components）===

export type MagicAttribute = "earth" | "water" | "fire" | "wind" | "void";

export const MAGIC_ATTRIBUTES: readonly { readonly key: MagicAttribute; readonly label: string }[] =
  Object.freeze([
    { key: "earth", label: "地" },
    { key: "water", label: "水" },
    { key: "fire", label: "火" },
    { key: "wind", label: "風" },
    { key: "void", label: "空" },
  ]);

export const MAGIC_ATTRIBUTE_LABELS: Readonly<Record<MagicAttribute, string>> = Object.freeze({
  earth: "地",
  water: "水",
  fire: "火",
  wind: "風",
  void: "空",
});
