export interface CapEstimatorConfig {
  team: {
    name: string;
    sprint: SprintConfig;
    members: TeamMemberConfig[];
    defaults: DefaultsConfig;
  };
}

export interface TeamMemberConfig {
  name: string;
  email: string;
  capacity?: number;
}

export interface DefaultsConfig {
  capacity: number;
}

export interface SprintConfig {
  start: string;
}

export interface TeamMember {
  name: string;
  email: string;
  capacity: number;
}
