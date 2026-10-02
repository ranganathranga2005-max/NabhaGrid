import torch

def train_cnn(model, dataloader, optimizer, criterion, epochs: int):
    """
    Training loop skeleton for the CNN baseline.
    """
    model.train()
    for epoch in range(epochs):
        for batch_idx, (data, labels) in enumerate(dataloader):
            # TODO: Add spectrogram preprocessing here if not done offline
            # optimizer.zero_grad()
            # output = model(data)
            # loss = criterion(output, labels)
            # loss.backward()
            # optimizer.step()
            pass
    raise NotImplementedError("TODO: Requires actual dataset/scenario.")
