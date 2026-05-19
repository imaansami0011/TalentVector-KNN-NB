import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from transformers import get_linear_schedule_with_warmup
from torch.optim import AdamW
from seqeval.metrics import classification_report, f1_score
import json
import pandas as pd
from .models.ner import BertCRFNER
from scripts.process_dataset import load_jsonl, prepare_ner_data
import os

# Hyperparameters
MAX_GRAD_NORM = 1.0
LEARNING_RATE = 3e-5
EPOCHS = 5
BATCH_SIZE = 8
MAX_LEN = 512

class ResumeNERDataset(Dataset):
    def __init__(self, data, tag2idx):
        self.data = data
        self.tag2idx = tag2idx

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        item = self.data[idx]
        input_ids = torch.tensor(item['input_ids'], dtype=torch.long)
        attention_mask = torch.tensor(item['attention_mask'], dtype=torch.long)
        # Convert tags to indices
        labels = torch.tensor([self.tag2idx.get(t, self.tag2idx['O']) for t in item['tags']], dtype=torch.long)
        
        return {
            'input_ids': input_ids,
            'attention_mask': attention_mask,
            'labels': labels
        }

def train():
    dataset_path = r'C:\Users\hashi\HR -HELPER\Entity Recognition in Resumes.json'
    if not os.path.exists(dataset_path):
        print("Dataset not found!")
        return

    # Load and process data
    print("Loading and processing dataset...")
    df = load_jsonl(dataset_path)
    processed_data = prepare_ner_data(df)
    
    # Create tag mapping
    unique_tags = set()
    for item in processed_data:
        unique_tags.update(item['tags'])
    
    # Ensure 'O' is in tags and handle indexing
    tags_list = sorted(list(unique_tags))
    if 'O' not in tags_list:
        tags_list.insert(0, 'O')
    
    tag2idx = {t: i for i, t in enumerate(tags_list)}
    idx2tag = {i: t for t, i in tag2idx.items()}
    num_tags = len(tags_list)
    
    # Save mapping for inference
    with open('app/models/tag_mapping.json', 'w') as f:
        json.dump({'tag2idx': tag2idx, 'idx2tag': idx2tag}, f)

    # Split data (80/20)
    train_size = int(0.8 * len(processed_data))
    train_data = processed_data[:train_size]
    val_data = processed_data[train_size:]

    train_dataset = ResumeNERDataset(train_data, tag2idx)
    val_dataset = ResumeNERDataset(val_data, tag2idx)

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)

    # Initialize model
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = BertCRFNER(num_tags=num_tags)
    model.to(device)

    # Optimizer setup (grouped parameters)
    optimizer_grouped_parameters = [
        {'params': [p for n, p in model.bert.named_parameters()], 'weight_decay': 0.01},
        {'params': [p for n, p in model.classifier.named_parameters()], 'weight_decay': 0.01},
        {'params': model.crf.parameters(), 'lr': 1e-3}
    ]

    optimizer = AdamW(optimizer_grouped_parameters, lr=LEARNING_RATE)
    total_steps = len(train_loader) * EPOCHS
    scheduler = get_linear_schedule_with_warmup(optimizer, num_warmup_steps=0, num_training_steps=total_steps)

    # Training loop
    print(f"Starting training on {device}...")
    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0
        for batch in train_loader:
            optimizer.zero_grad()
            
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['labels'].to(device)
            
            loss = model(input_ids, attention_mask, tags=labels)
            loss.backward()
            
            torch.nn.utils.clip_grad_norm_(model.parameters(), MAX_GRAD_NORM)
            optimizer.step()
            scheduler.step()
            
            total_loss += loss.item()
            
        avg_train_loss = total_loss / len(train_loader)
        print(f"Epoch {epoch+1}/{EPOCHS} | Train Loss: {avg_train_loss:.4f}")

        # Evaluation
        model.eval()
        predictions, true_labels = [], []
        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch['input_ids'].to(device)
                attention_mask = batch['attention_mask'].to(device)
                labels = batch['labels'].to(device)
                
                # Decode with CRF
                preds = model(input_ids, attention_mask)
                
                # Convert back to labels
                for i in range(len(preds)):
                    # preds is a list of lists (one list per batch item)
                    # each list contains the tag indices for that sequence
                    p = [idx2tag[t] for t in preds[i]]
                    l = [idx2tag[t.item()] for t in labels[i][:len(preds[i])]] # Trim to match pred length if needed
                    
                    predictions.append(p)
                    true_labels.append(l)

        print(classification_report(true_labels, predictions))
        print(f"F1 Score: {f1_score(true_labels, predictions):.4f}")

    # Save model
    torch.save(model.state_dict(), 'app/models/bert_crf_ner.bin')
    print("Model saved to app/models/bert_crf_ner.bin")

if __name__ == "__main__":
    train()
