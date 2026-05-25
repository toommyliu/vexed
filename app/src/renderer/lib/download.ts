const downloadBlob = (
  filename: string,
  content: string,
  type: string,
): void => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export function downloadText(filename: string, content: string): void {
  downloadBlob(filename, content, "text/plain");
}

export function downloadJson(filename: string, data: unknown): void {
  downloadBlob(filename, JSON.stringify(data, null, 2), "application/json");
}
