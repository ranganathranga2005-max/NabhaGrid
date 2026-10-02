class ReceiverModel:
    """
    Abstractions for an RF receiver (on ground or satellite).
    """
    def __init__(self, rx_id: str, params: dict):
        self.rx_id = rx_id
        self.params = params
        # TODO: Set sampling rate, bandwidth, noise figure, timing/freq error parameters

    def observe(self, rf_environment, timestamp: float, duration: float):
        """
        Records an observation of the RF environment.
        """
        # TODO: Return a ReceiverObservation instance with generated/loaded IQ data
        raise NotImplementedError("TODO: Requires RF environment simulation or real data injection.")
