/** "Budynek Lipowa 12 · Klatka A · Lokal 5": where a unit is, in one line. */
export function unitPlace(unit: {
  buildingName: string;
  staircaseName: string;
  number: string;
}) {
  return `Budynek ${unit.buildingName} · Klatka ${unit.staircaseName} · Lokal ${unit.number}`;
}
