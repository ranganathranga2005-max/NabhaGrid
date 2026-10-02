import numpy as np

class QUBOBuilder:
    """
    Constructs the QUBO formulation.
    minimize Q(x) = x^T Q x + c^T x + C
    """
    def __init__(self, num_variables: int):
        self.num_variables = num_variables
        self.Q = np.zeros((num_variables, num_variables))
        self.c = np.zeros(num_variables)
        self.constant = 0.0

    def add_objective(self, costs: list[float]):
        """
        Adds linear objective terms to the c vector.
        """
        # TODO: map costs to self.c
        pass

    def add_penalty(self, penalty_matrix, penalty_vector, constant_term):
        """
        Adds constraint penalties to Q, c, and constant.
        """
        # TODO: Add penalty terms
        pass

    def get_model(self):
        # TODO: Return QUBOModel data structure
        raise NotImplementedError("TODO: Requires full QUBO matrix construction.")
