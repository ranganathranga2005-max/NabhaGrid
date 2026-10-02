class SatelliteModel:
    """
    Abstractions for a satellite in the constellation.
    """
    def __init__(self, sat_id: str, orbital_parameters: dict):
        self.sat_id = sat_id
        # TODO: Store actual ephemeris or orbital parameters
        self.orbital_parameters = orbital_parameters

    def get_position(self, timestamp: float) -> tuple[float, float, float]:
        """
        Returns (x, y, z) position at a given time.
        """
        # TODO: Implement orbit propagation or load from TLE data
        raise NotImplementedError("TODO: Requires experimental determination / orbit model.")
