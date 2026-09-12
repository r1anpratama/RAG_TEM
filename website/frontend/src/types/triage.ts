export interface FaultTrace {
  fault_id: number;
  name: string;
  fault_type: string;
  slip_rate_mm_yr: number;
  mw_max: number;
  dip_deg: number;
  rake_deg?: number;
  depth_max_km?: number;
  coordinates: [number, number][]; // [lat, lon]
}

export interface Scenario {
  id: string;
  title: string;
  description?: string;
  magnitude: number;
  depth_km: number;
  epicenter: { lat: number; lon: number };
  predicted_pgv_cm_s: number;
  target_facility: string;
  countdown_seconds?: number;
  fault_name?: string;
  distance_to_target_km?: number;
  estimated_cwa_intensity?: string;
  s_wave_countdown_sec?: number;
  track_a_actuators?: SCADAActuator[];
  model_confidence?: string;
  gmpe_validation?: {
    status?: string;
    theoretical_median_pgv?: number;
    z_score?: number;
    within_confidence_bounds?: boolean;
  };
}

export interface FacilityTriage {
  facility_id: string;
  facility_name: string;
  building_era: string;
  triage_tag: "RED_CRITICAL" | "YELLOW_INSPECT" | "GREEN_SAFE" | string;
  drift_ratio_pct: number;
  collapse_probability: string;
  cwa_intensity: string;
  action_recommendation: string;
  connected_lifelines: string[];
  priority_rank: number;
}

export interface SCADAActuator {
  target: string;
  action: string;
  urgency: string;
}

export interface TriageDispatchResponse {
  event_id: string;
  alert_reference: string;
  execution_summary: {
    track_a_latency_ms: number;
    track_b_latency_ms: number;
    total_latency_ms: number;
    reflex_status: string;
  };
  track_a_reflex: {
    trigger_level: string;
    elapsed_ms: number;
    actuators: SCADAActuator[];
    action_commands: string[];
  };
  track_b_deliberative: {
    facility_triage: FacilityTriage[];
    seismic_source: {
      source_regime: string;
      urgency_level: string;
      directivity_threat: string;
      magnitude: number;
      hypocenter_depth_km: number;
    };
    geotech: {
      primary_fault_id: number;
      primary_fault_name: string;
      distance_km: number;
      cascading_ruptures: Array<{
        target_fault_id?: number;
        target_fault_name?: string;
        joint_magnitude_mw?: number;
        rupture_interaction_type?: string;
        combined_mw?: number;
        recurrence_interval_yr?: number;
        pairing_label?: string;
      }>;
      physics_validation: {
        is_physically_consistent: boolean;
        anomaly_flag: string;
        expected_median_pgv: number;
        sigma_deviation: number;
        lower_bound_pgv: number;
        upper_bound_pgv: number;
      };
    };
    safety_critic: {
      is_safe: boolean;
      hallucination_detected: boolean;
      verified_entities: string[];
      hallucinated_entities: string[];
      notes: string;
    };
    executive_summary: string;
  };
}

export interface GMPEPoint {
  distance_km: number;
  median_pgv: number;
  upper_2sigma: number;
  lower_2sigma: number;
}

export interface GMPEResponse {
  model: string;
  magnitude: number;
  vs30_m_s: number;
  curve: GMPEPoint[];
}
