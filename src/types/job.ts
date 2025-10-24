/**
 * Canonical Job type matching actual database schema
 * 
 * Schema columns:
 * - id: UUID (primary key)
 * - service_name: TEXT NOT NULL
 * - service_type: TEXT
 * - service_address: TEXT
 * - price: NUMERIC
 * - preferred_date: TIMESTAMPTZ
 * - status: TEXT NOT NULL (default 'pending')
 * - customer_name: TEXT NOT NULL
 * - created_at: TIMESTAMPTZ
 * - updated_at: TIMESTAMPTZ
 * 
 * DO NOT modify without updating database schema
 */
export interface Job {
  id: string;
  service_name: string;        // NOT NULL
  service_type: string | null;
  service_address: string | null;
  price: number | null;
  preferred_date: string | null; // ISO timestamp
  status: string;              // NOT NULL (default 'pending')
  customer_name: string;       // NOT NULL
  created_at: string;          // ISO timestamp
  updated_at: string;          // ISO timestamp
}

/**
 * Type for inserting new jobs (omits auto-generated fields)
 */
export type JobInsert = Omit<Job, 'id' | 'created_at' | 'updated_at'> & {
  id?: string; // Optional for manual ID assignment
};

/**
 * Type for updating jobs (all fields optional except id)
 */
export type JobUpdate = Partial<Omit<Job, 'id' | 'created_at' | 'updated_at'>>;

/**
 * Valid job status values
 */
export type JobStatus = 
  | 'pending' 
  | 'quoted' 
  | 'accepted' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled'
  | 'rescheduled';
