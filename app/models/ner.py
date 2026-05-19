import torch
import torch.nn as nn
from transformers import BertModel
from torchcrf import CRF

class BertCRFNER(nn.Module):
    def __init__(self, num_tags):
        super().__init__()
        self.bert = BertModel.from_pretrained('bert-base-uncased')
        self.dropout = nn.Dropout(0.1)
        # Linear layer to map BERT hidden states to tag space
        self.classifier = nn.Linear(self.bert.config.hidden_size, num_tags)
        # CRF layer for sequence labeling
        self.crf = CRF(num_tags, batch_first=True)

    def forward(self, input_ids, attention_mask, tags=None):
        outputs = self.bert(input_ids, attention_mask=attention_mask)
        sequence_output = self.dropout(outputs[0])
        emissions = self.classifier(sequence_output)
        
        if tags is not None:
            # Return negative log-likelihood for the training loss curve
            loss = -self.crf(emissions, tags, mask=attention_mask.byte(), reduction='mean')
            return loss
        else:
            # Viterbi decoding for inference phase
            prediction = self.crf.decode(emissions, mask=attention_mask.byte())
            return prediction
