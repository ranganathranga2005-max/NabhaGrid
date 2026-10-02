class QUBOSolverInterface:
    """
    Abstract interface for QUBO solvers.
    Must eventually support Classical, Simulated Annealing, QAOA, etc.
    """
    def solve_qubo(self, qubo_model) -> list[int]:
        """
        Takes a QUBOModel and returns the binary variable assignment x.
        """
        raise NotImplementedError("TODO: Implement specific solver interface.")

class ClassicalBaselineSolver(QUBOSolverInterface):
    def solve_qubo(self, qubo_model) -> list[int]:
        """
        Simple exact solver or classical heuristic for comparison (baseline).
        """
        # TODO: Implement classical solver (e.g., brute force for tiny toy models)
        raise NotImplementedError("TODO: Implement classical baseline.")

class QAOASimulatorSolver(QUBOSolverInterface):
    def solve_qubo(self, qubo_model) -> list[int]:
        """
        Quantum Approximate Optimization Algorithm simulator interface.
        """
        # TODO: Connect to Qiskit or Pennylane
        raise NotImplementedError("TODO: Requires QAOA implementation.")
