let id = 0;

function generateId() {
  return ++id;
}

export function useId() {
  // return Math.random().toString(36).slice(2, 10);
  return generateId();
}
