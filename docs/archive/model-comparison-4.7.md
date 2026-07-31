# Task 4.7 Model Comparison

Status: pending live model credits.

The comparison script is ready, but the first live OpenRouter request failed with:

```text
402 Insufficient credits
```

## Models

- Current model: `anthropic/claude-sonnet-4`
- Chinese model candidate: `deepseek/deepseek-chat-v3.1`

## How To Run

```bash
npm run compare:model
```

Optional custom sample:

```bash
COMPARE_SAMPLE_DOMAINS=puzzle.ch,vshn.ch,copebit.ch npm run compare:model
```

## Quality Signals

The script compares both models against the same saved `source-bundle.json` inputs and reports:

- JSON validity through successful profile parsing.
- Field coverage for core profile fields.
- Technology overlap versus the saved baseline profile.
- Vendor partnership overlap versus the saved baseline profile.
- Recent activity coverage with date and source.
- Latency per provider.
- Estimated model cost per provider and total sample cost.

## Cost Baseline

OpenRouter pricing used by the script:

| Model | Input / 1M tokens | Output / 1M tokens |
|---|---:|---:|
| `anthropic/claude-sonnet-4` | $3.00 | $15.00 |
| `deepseek/deepseek-chat-v3.1` | $0.21 | $0.79 |

DeepSeek should be much cheaper, but it still needs a live quality check before recommending it as a replacement.
