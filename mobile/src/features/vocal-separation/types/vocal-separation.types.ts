export type SeparationStatus = "idle" | "processing" | "completed";

export interface SeparationState {
  status: SeparationStatus;
  instrumentalUrl: string | null;
}
