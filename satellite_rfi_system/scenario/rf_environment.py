class RFEnvironment:
    """
    Models the overall RF environment containing desired signals, RFI, and noise.
    """
    def __init__(self):
        self.sources = []
        # TODO: Add RFI sources and legitimate signal sources

    def get_signal_at(self, position: tuple[float, float, float], timestamp: float):
        """
        Calculates the received composite signal at a specific location and time.
        """
        # TODO: Implement path loss, Doppler shift, and delay models
        raise NotImplementedError("TODO: Requires literature-based parameter selection and propagation model.")
