export function useToast() {
  return {
    show: (msg: string) => alert("Toast: " + msg),
  };
}