import numpy as np

class LocalizationObjective:
    """
    Abstract mathematical objective for estimating RFI source position.
    x_hat = argmin_x E_TDOA(x) + E_FDOA(x)
    """
    def __init__(self, receiver_positions: list, tdoa_measurements: dict, fdoa_measurements: dict):
        self.rx_positions = receiver_positions
        self.tdoa_measurements = tdoa_measurements
        self.fdoa_measurements = fdoa_measurements

    def compute_error(self, x: np.ndarray) -> float:
        """
        Computes the localization error given a candidate source position x.
        """
        # TODO: E_TDOA = sum_ij (delta_t_ij - ||x - rx_i||/c + ||x - rx_j||/c)^2
        # TODO: E_FDOA = sum_ij (delta_f_ij - predicted_doppler_diff)^2
        raise NotImplementedError("TODO: Requires full objective function formulation.")

class LocalizationSolver:
    """
    Interface for future solvers (Grid Search, Gauss-Newton, etc.).
    """
    def __init__(self, objective: LocalizationObjective):
        self.objective = objective

    def solve(self) -> np.ndarray:
        """
        Finds x_hat minimizing the objective error.
        """
        # TODO: Implement solver strategy
        raise NotImplementedError("TODO: Requires solver implementation (e.g., Gauss-Newton, NLLS).")
