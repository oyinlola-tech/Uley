export interface ApiLivenessResponse {
  status: 'ok';
  timestamp: string;
}

export interface ApiReadinessResponse {
  status: 'ready';
  timestamp: string;
  dependencies: {
    postgresDatabase: 'available';
  };
}

export interface ApiUnavailableResponse {
  status: 'unavailable';
  timestamp: string;
  dependencies: {
    postgresDatabase: 'unavailable';
  };
}
