import torch

def evaluate_cnn(model, dataloader) -> dict:
    """
    Evaluation loop for the CNN baseline.
    """
    # TODO: Implement evaluation loop
    metrics = {
        "accuracy": 0.0,
        "precision": 0.0,
        "recall": 0.0,
        "f1_score": 0.0
    }
    raise NotImplementedError("TODO: Requires actual dataset/scenario to compute metrics.")
    return metrics
