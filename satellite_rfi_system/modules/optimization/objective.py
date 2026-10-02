class OptimizationObjective:
    """
    Generic configurable objective function for path/channel optimization.
    Cost = w1*RFI + w2*latency + w3*switching_cost - w4*SINR + w5*path_cost
    """
    def __init__(self, weights: dict):
        self.w1 = weights.get('w1', 1.0)
        self.w2 = weights.get('w2', 1.0)
        self.w3 = weights.get('w3', 1.0)
        self.w4 = weights.get('w4', 1.0)
        self.w5 = weights.get('w5', 1.0)

    def compute_cost(self, candidate) -> float:
        """
        Computes the unconstrained cost of a candidate path or link.
        """
        # TODO: Access candidate properties and compute weighted sum
        # return (self.w1 * candidate.rfi_level + 
        #         self.w2 * candidate.latency - 
        #         self.w4 * candidate.sinr + ...)
        raise NotImplementedError("TODO: Requires experimental parameter tuning for weights.")
