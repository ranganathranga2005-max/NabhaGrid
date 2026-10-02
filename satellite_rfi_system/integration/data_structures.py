from dataclasses import dataclass
from typing import List, Optional, Dict, Any, Tuple
from enum import Enum

class DetectorType(Enum):
    SNN = "SNN"
    CNN = "CNN"

@dataclass
class RFData:
    """
    Placeholder for raw IQ data and metadata.
    """
    iq_samples: Any  # TODO: Replace with numpy array or tensor of shape (N, )
    sampling_rate_hz: float
    carrier_freq_hz: float
    timestamp: float

@dataclass
class DetectionResult:
    """
    Output from either the SNN or CNN detector.
    """
    is_rfi: bool
    confidence: float
    detector_type: DetectorType

@dataclass
class ReceiverObservation:
    """
    Data collected by a single receiver/satellite for localization.
    """
    timestamp: float
    receiver_position: Tuple[float, float, float]  # (x, y, z)
    rf_data: RFData
    # TODO: Add timing error, frequency error, measurement noise parameters if needed

@dataclass
class LocalizationResult:
    """
    Output from the TDOA/FDOA localization module.
    """
    estimated_position: Tuple[float, float, float]
    error_covariance: Optional[Any] = None

@dataclass
class CandidateLink:
    """
    A possible link between two nodes in the constellation.
    """
    link_id: str
    source_node: str
    target_node: str
    estimated_latency_ms: float
    estimated_sinr_db: float
    rfi_level: float
    is_available: bool

@dataclass
class CandidatePath:
    """
    A sequence of links forming a path through the constellation.
    """
    path_id: str
    links: List[CandidateLink]
    total_latency_ms: float
    bottleneck_sinr_db: float
    aggregated_rfi_level: float

@dataclass
class QUBOModel:
    """
    Mathematical formulation of the QUBO problem.
    minimize x^T Q x + c^T x
    """
    Q_matrix: Any  # TODO: Replace with numpy array or sparse matrix
    c_vector: Any  # TODO: Replace with numpy array

@dataclass
class OptimizationResult:
    """
    The selected links or path from the solver.
    """
    selected_variable_ids: List[str]
    objective_value: float
    is_feasible: bool
