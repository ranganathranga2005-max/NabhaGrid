class ConstraintFormulation:
    """
    Abstraction for optimization constraints.
    Examples:
    - Route continuity
    - Exactly one path selected
    - Max hops
    """
    def __init__(self, penalties: dict):
        self.penalties = penalties

    def apply_exactly_one_constraint(self, qubo_matrix, candidate_indices: list):
        """
        Applies penalty lambda * (sum(x_i) - 1)^2 to the QUBO matrix.
        """
        # TODO: Modify Q matrix and c vector mathematically
        raise NotImplementedError("TODO: Requires QUBO mathematical implementation.")
