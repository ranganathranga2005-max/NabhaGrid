import torch
import torch.nn as nn

class LIFNeuron(nn.Module):
    """
    Leaky Integrate-and-Fire (LIF) Neuron Model.
    
    Mathematical model:
    u[t] = beta * u[t-1] + I[t] - threshold * S[t-1]
    S[t] = H(u[t] - threshold)
    """
    def __init__(self, beta: float, threshold: float):
        super(LIFNeuron, self).__init__()
        self.beta = beta
        self.threshold = threshold
        self.u = None  # Membrane potential

    def reset_state(self, batch_size: int, device: torch.device):
        """Resets the membrane potential."""
        self.u = torch.zeros(batch_size, device=device)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Forward pass for a single time step.
        x: Input current I[t]
        Returns: Output spike S[t]
        """
        if self.u is None or self.u.shape[0] != x.shape[0]:
            self.reset_state(x.shape[0], x.device)

        # Spike generation from previous step (implicit in reset, but we do explicit reset here)
        # Using a simple Heaviside step function approximation for the forward pass
        # Note: In a real SNN training scenario, a surrogate gradient would be used here.
        
        # Integration
        self.u = self.beta * self.u + x
        
        # Spike generation: S[t] = 1 if u[t] >= threshold else 0
        spike = (self.u >= self.threshold).float()
        
        # Explicit reset (soft reset subtracts threshold)
        self.u = self.u - (spike * self.threshold)
        
        return spike
