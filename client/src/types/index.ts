export type StatusFilter = "all" | "active" | "paused" | "archived";
export type CheckInFilter = "all" | "completed" | "not-completed";
export type ToastType = "success" | "milestone";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}
