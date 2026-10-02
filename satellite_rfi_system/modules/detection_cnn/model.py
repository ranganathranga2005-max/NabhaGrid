import torch
import torch.nn as nn

class CNNRFIDetector(nn.Module):
    """
    Conventional CNN Baseline for RFI Detection.
    Y(i,j) = sum X(i+m, j+n)K(m,n) + b
    """
    def __init__(self):
        super(CNNRFIDetector, self).__init__()
        
        # Simple placeholder architecture
        self.conv1 = nn.Conv2d(in_channels=1, out_channels=16, kernel_size=3, padding=1)
        self.relu1 = nn.ReLU()
        self.pool1 = nn.MaxPool2d(kernel_size=2)
        
        self.conv2 = nn.Conv2d(in_channels=16, out_channels=32, kernel_size=3, padding=1)
        self.relu2 = nn.ReLU()
        self.pool2 = nn.MaxPool2d(kernel_size=2)
        
        # TODO: Adjust input dimension of fc1 based on spectrogram size
        self.fc1 = nn.Linear(32 * 16 * 16, 64)
        self.relu3 = nn.ReLU()
        
        # Binary classification output
        self.fc2 = nn.Linear(64, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        x: Input spectrogram image (batch, 1, H, W)
        Returns: Probability of RFI
        """
        x = self.pool1(self.relu1(self.conv1(x)))
        x = self.pool2(self.relu2(self.conv2(x)))
        x = torch.flatten(x, 1)
        
        # TODO: Handle size mismatch if input dimensions change
        # x = self.relu3(self.fc1(x))
        # out = self.sigmoid(self.fc2(x))
        
        raise NotImplementedError("TODO: Requires actual dataset/scenario to determine layer dimensions.")
        return out
