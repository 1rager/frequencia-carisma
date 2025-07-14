export const API_BASE_URL =
  "https://frequencia-carisma-production.up.railway.app";
// "http://localhost:3000"; // Descomente esta linha para usar o backend local

export const API_ROUTES = {
  registrar: `${API_BASE_URL}/registrar`,
  alunos: `${API_BASE_URL}/alunos`,
  exportar: `${API_BASE_URL}/exportar`,
};

export const EXPORT_FILENAME = "frequencia.xlsx";

export const EXPORT_SHEET_NAME = "Frequência";

export const EXPORT_HEADERS = [
  { label: "Matrícula", key: "matricula" },
  { label: "Data", key: "data" },
];