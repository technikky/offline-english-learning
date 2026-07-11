export interface HealthResponse {
  status: "ok";
  dbConnected: boolean;
  timestamp: string;
}
