import torch
import torch.nn as nn
from .lif import LIFNeuron

class SNNRFIDetector(nn.Module):
    """
    Minimal research skeleton for an SNN-based RFI Detector.
    """
    def __init__(self, input_dim: int, hidden_dim: int, beta: float, threshold: float):
        super(SNNRFIDetector, self).__init__()
        
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.lif1 = LIFNeuron(beta, threshold)
        
        self.fc2 = nn.Linear(hidden_dim, 1)
        self.lif2 = LIFNeuron(beta, threshold)

    def reset_states(self, batch_size: int, device: torch.device):
        self.lif1.reset_state(batch_size, device)
        self.lif2.reset_state(batch_size, device)

    def forward(self, spike_trains: torch.Tensor) -> torch.Tensor:
        """
        spike_trains shape: (batch_size, num_timesteps, input_dim)
        Returns: output spike count or firing rate shape: (batch_size, 1)
        """
        batch_size, num_timesteps, _ = spike_trains.shape
        self.reset_states(batch_size, spike_trains.device)
        
        out_spikes = []
        for t in range(num_timesteps):
            x_t = spike_trains[:, t, :]
            
            # Layer 1
            cur1 = self.fc1(x_t)
            spk1 = self.lif1(cur1)
            
            # Layer 2
            cur2 = self.fc2(spk1)
            spk2 = self.lif2(cur2)
            
            out_spikes.append(spk2)
            
        out_spikes = torch.stack(out_spikes, dim=1)  # (batch_size, num_timesteps, 1)
        
        # Output is the sum of spikes (or could be rate)
        spike_count = out_spikes.sum(dim=1)
        
        return spike_count
