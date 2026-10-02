class ReceivedSignalModel:
    """
    Abstractions for the received signal.
    Model: r_k(t) = s_k(t) + i_k(t) + n_k(t)
    """
    def __init__(self, desired_signal, interference, noise):
        self.desired_signal = desired_signal
        self.interference = interference
        self.noise = noise

    def get_composite_signal(self):
        """Returns the summed signal components."""
        # TODO: Implement mathematical addition of signal, interference, and noise
        raise NotImplementedError("TODO: Requires formulation of signal components.")
